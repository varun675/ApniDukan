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
const BRANCH = 'main';

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
  const ext = path.extname(filePath).toLowerCase();
  return binaryExtensions.includes(ext);
}

async function main() {
  console.log('Connecting to GitHub...');
  const octokit = await getUncachableGitHubClient();

  const user = await octokit.rest.users.getAuthenticated();
  console.log(`Authenticated as: ${user.data.login}`);

  const repo = await octokit.rest.repos.get({ owner: REPO_OWNER, repo: REPO_NAME });
  console.log(`Repository ${REPO_OWNER}/${REPO_NAME} found (default branch: ${repo.data.default_branch}).`);

  const actualBranch = repo.data.default_branch || BRANCH;

  let parentSha: string | undefined;
  try {
    const ref = await octokit.rest.git.getRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: `heads/${actualBranch}`,
    });
    parentSha = ref.data.object.sha;
    console.log(`Branch '${actualBranch}' found. Latest commit: ${parentSha.substring(0, 7)}`);
  } catch (e) {
    console.log(`Branch '${actualBranch}' not found.`);
  }

  const projectDir = process.cwd();
  const files = getAllFiles(projectDir);
  console.log(`Found ${files.length} files to upload.`);

  const treeItems: { path: string; mode: '100644'; type: 'blob'; content?: string; sha?: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fullPath = path.join(projectDir, file);
    const binary = isBinaryFile(file);

    if (binary) {
      const content = fs.readFileSync(fullPath).toString('base64');
      const blob = await octokit.rest.git.createBlob({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        content,
        encoding: 'base64',
      });
      treeItems.push({
        path: file,
        mode: '100644',
        type: 'blob',
        sha: blob.data.sha,
      });
    } else {
      const content = fs.readFileSync(fullPath, 'utf-8');
      treeItems.push({
        path: file,
        mode: '100644',
        type: 'blob',
        content,
      });
    }

    if ((i + 1) % 20 === 0 || i === files.length - 1) {
      process.stdout.write(`[${i + 1}/${files.length}]`);
    }
  }
  console.log('\nAll files prepared.');

  console.log('Creating tree...');
  const tree = await octokit.rest.git.createTree({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    tree: treeItems as any,
  });
  console.log(`Tree created: ${tree.data.sha.substring(0, 7)}`);

  const commitParams: any = {
    owner: REPO_OWNER,
    repo: REPO_NAME,
    message: 'Update Apni Dukan - GitHub Pages deployment, payment page, flash sale time range, kg/grams input',
    tree: tree.data.sha,
  };
  if (parentSha) {
    commitParams.parents = [parentSha];
  }

  const commit = await octokit.rest.git.createCommit(commitParams);
  console.log(`Commit created: ${commit.data.sha.substring(0, 7)}`);

  try {
    await octokit.rest.git.updateRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: `heads/${actualBranch}`,
      sha: commit.data.sha,
      force: true,
    });
    console.log(`Updated branch '${actualBranch}'.`);
  } catch (e) {
    await octokit.rest.git.createRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: `refs/heads/${actualBranch}`,
      sha: commit.data.sha,
    });
    console.log(`Created branch '${actualBranch}'.`);
  }

  console.log(`\nSuccess! Code pushed to https://github.com/${REPO_OWNER}/${REPO_NAME}`);
  console.log(`GitHub Actions will auto-deploy to https://${REPO_OWNER}.github.io/${REPO_NAME}/`);
}

main().catch(err => {
  console.error('Push failed:', err.message || err);
  if (err.response) {
    console.error('Response status:', err.response.status);
    console.error('Response data:', JSON.stringify(err.response.data, null, 2));
  }
  process.exit(1);
});
