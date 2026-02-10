import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

const REPO_OWNER = 'varun675';
const REPO_NAME = 'ApniDukan';

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'server_dist',
  '.expo',
  '.cache',
  'scripts/push-to-github.ts',
  '__pycache__',
  '.DS_Store',
  'Thumbs.db',
  '.replit',
  '.config',
  'generated-icon.png',
  'replit.nix',
  '.upm',
  'tmp',
];

function shouldIgnore(relativePath: string): boolean {
  return IGNORE_PATTERNS.some(pattern => {
    if (relativePath === pattern) return true;
    if (relativePath.startsWith(pattern + '/')) return true;
    if (relativePath.endsWith('/' + pattern)) return true;
    if (relativePath.includes('/' + pattern + '/')) return true;
    return false;
  });
}

function getAllFiles(dirPath: string, basePath: string = dirPath): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(basePath, fullPath);
    if (shouldIgnore(relativePath)) continue;
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, basePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }
  return files;
}

function isBinaryFile(filePath: string): boolean {
  const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.ttf', '.otf', '.woff', '.woff2', '.eot', '.mp3', '.mp4', '.wav', '.pdf', '.zip', '.tar', '.gz', '.jar'];
  return binaryExtensions.includes(path.extname(filePath).toLowerCase());
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Connecting to GitHub...');
  const octokit = await getUncachableGitHubClient();

  const user = await octokit.rest.users.getAuthenticated();
  console.log(`Authenticated as: ${user.data.login}`);

  const repo = await octokit.rest.repos.get({ owner: REPO_OWNER, repo: REPO_NAME });
  const defaultBranch = repo.data.default_branch || 'main';
  console.log(`Repository found. Default branch: ${defaultBranch}`);

  let latestSha: string | undefined;
  try {
    const ref = await octokit.rest.git.getRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: `heads/${defaultBranch}`,
    });
    latestSha = ref.data.object.sha;
    console.log(`Latest commit: ${latestSha.substring(0, 7)}`);
  } catch {
    console.log('No commits found on branch.');
  }

  const projectDir = process.cwd();
  const files = getAllFiles(projectDir);
  console.log(`Found ${files.length} files to push.\n`);

  let uploaded = 0;
  let failed = 0;

  for (const file of files) {
    const fullPath = path.join(projectDir, file);
    const binary = isBinaryFile(file);
    const content = binary
      ? fs.readFileSync(fullPath).toString('base64')
      : Buffer.from(fs.readFileSync(fullPath, 'utf-8')).toString('base64');

    let existingSha: string | undefined;
    try {
      const existing = await octokit.rest.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: file,
        ref: defaultBranch,
      });
      if (!Array.isArray(existing.data) && existing.data.type === 'file') {
        existingSha = existing.data.sha;
        if (existing.data.content && existing.data.content.replace(/\n/g, '') === content.replace(/\n/g, '')) {
          uploaded++;
          continue;
        }
      }
    } catch {
    }

    try {
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: file,
        message: `Update ${file}`,
        content,
        sha: existingSha,
        branch: defaultBranch,
      });
      uploaded++;
      console.log(`[${uploaded}/${files.length}] Updated: ${file}`);
    } catch (err: any) {
      if (err.status === 409) {
        await sleep(1000);
        try {
          const fresh = await octokit.rest.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: file,
            ref: defaultBranch,
          });
          const freshSha = !Array.isArray(fresh.data) && fresh.data.type === 'file' ? fresh.data.sha : undefined;
          await octokit.rest.repos.createOrUpdateFileContents({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: file,
            message: `Update ${file}`,
            content,
            sha: freshSha,
            branch: defaultBranch,
          });
          uploaded++;
          console.log(`[${uploaded}/${files.length}] Updated (retry): ${file}`);
        } catch (retryErr: any) {
          failed++;
          console.error(`Failed: ${file} - ${retryErr.message}`);
        }
      } else {
        failed++;
        console.error(`Failed: ${file} - ${err.message}`);
      }
    }

    await sleep(200);
  }

  console.log(`\nDone! ${uploaded} files uploaded, ${failed} failed.`);
  console.log(`View at: https://github.com/${REPO_OWNER}/${REPO_NAME}`);
  if (failed === 0) {
    console.log(`GitHub Actions will auto-deploy to https://${REPO_OWNER}.github.io/${REPO_NAME}/`);
  }
}

main().catch(err => {
  console.error('Push failed:', err.message || err);
  if (err.response) {
    console.error('Status:', err.response.status);
    console.error('Data:', JSON.stringify(err.response.data, null, 2));
  }
  process.exit(1);
});
