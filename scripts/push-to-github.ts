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
  const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.svg', '.ttf', '.otf', '.woff', '.woff2', '.eot', '.mp3', '.mp4', '.wav', '.pdf', '.zip', '.tar', '.gz', '.jar'];
  const ext = path.extname(filePath).toLowerCase();
  return binaryExtensions.includes(ext);
}

async function main() {
  console.log('Connecting to GitHub...');
  const octokit = await getUncachableGitHubClient();

  const user = await octokit.rest.users.getAuthenticated();
  console.log(`Authenticated as: ${user.data.login}`);

  let repoExists = false;
  try {
    await octokit.rest.repos.get({ owner: REPO_OWNER, repo: REPO_NAME });
    repoExists = true;
    console.log(`Repository ${REPO_OWNER}/${REPO_NAME} exists.`);
  } catch (e: any) {
    if (e.status === 404) {
      console.log(`Repository not found. Creating ${REPO_OWNER}/${REPO_NAME}...`);
      await octokit.rest.repos.createForAuthenticatedUser({
        name: REPO_NAME,
        description: 'Apni Dukan - Mobile grocery shop management app by Codesmotech Consulting Pvt Ltd',
        private: false,
        auto_init: false,
      });
      console.log('Repository created.');
    } else {
      throw e;
    }
  }

  const projectDir = process.cwd();
  const files = getAllFiles(projectDir);
  console.log(`Found ${files.length} files to push.`);

  const treeItems: any[] = [];

  for (const file of files) {
    const fullPath = path.join(projectDir, file);
    const binary = isBinaryFile(file);

    if (binary) {
      const content = fs.readFileSync(fullPath);
      const blob = await octokit.rest.git.createBlob({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        content: content.toString('base64'),
        encoding: 'base64',
      });
      treeItems.push({
        path: file,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blob.data.sha,
      });
    } else {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const blob = await octokit.rest.git.createBlob({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        content: content,
        encoding: 'utf-8',
      });
      treeItems.push({
        path: file,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blob.data.sha,
      });
    }
    process.stdout.write('.');
  }
  console.log('\nAll blobs created.');

  const tree = await octokit.rest.git.createTree({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    tree: treeItems,
  });
  console.log('Tree created.');

  let parentSha: string | undefined;
  try {
    const ref = await octokit.rest.git.getRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: `heads/${BRANCH}`,
    });
    parentSha = ref.data.object.sha;
  } catch (e) {
    // No existing branch
  }

  const commitParams: any = {
    owner: REPO_OWNER,
    repo: REPO_NAME,
    message: 'Update Apni Dukan - static GitHub Pages deployment with payment page, flash sale time range, and kg/grams input',
    tree: tree.data.sha,
  };
  if (parentSha) {
    commitParams.parents = [parentSha];
  }

  const commit = await octokit.rest.git.createCommit(commitParams);
  console.log(`Commit created: ${commit.data.sha}`);

  try {
    await octokit.rest.git.updateRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: `heads/${BRANCH}`,
      sha: commit.data.sha,
      force: true,
    });
    console.log(`Updated branch ${BRANCH}.`);
  } catch (e) {
    await octokit.rest.git.createRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: `refs/heads/${BRANCH}`,
      sha: commit.data.sha,
    });
    console.log(`Created branch ${BRANCH}.`);
  }

  console.log(`\nDone! Code pushed to https://github.com/${REPO_OWNER}/${REPO_NAME}`);
  console.log(`GitHub Actions will auto-deploy to https://${REPO_OWNER}.github.io/${REPO_NAME}/`);
}

main().catch(err => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
