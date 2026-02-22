import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

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
  if (!xReplitToken) throw new Error('X_REPLIT_TOKEN not found');
  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    { headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken } }
  ).then(res => res.json()).then(data => data.items?.[0]);
  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
  if (!connectionSettings || !accessToken) throw new Error('GitHub not connected');
  return accessToken;
}

const OWNER = 'contact219';
const REPO = '444EVER';
const BRANCH = 'main';
const WORKSPACE = '/home/runner/workspace';

const IGNORE = new Set(['.git', 'node_modules', '.cache', '.config', '.local', 'dist', '.replit', 'replit.nix', '.upm', 'generated-icon.png', '.gitignore']);

function getAllFiles(dir: string, baseDir: string): { filePath: string; relativePath: string }[] {
  const results: { filePath: string; relativePath: string }[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.has(entry.name)) continue;
    if (entry.name.startsWith('.') && entry.name !== '.gitignore') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllFiles(fullPath, baseDir));
    } else {
      results.push({ filePath: fullPath, relativePath: path.relative(baseDir, fullPath) });
    }
  }
  return results;
}

async function main() {
  const token = await getAccessToken();
  const octokit = new Octokit({ auth: token });

  console.log('Collecting files...');
  const files = getAllFiles(WORKSPACE, WORKSPACE);
  console.log(`Found ${files.length} files to sync`);

  // Get the current commit SHA on main
  let currentSha: string | undefined;
  try {
    const { data: ref } = await octokit.git.getRef({ owner: OWNER, repo: REPO, ref: `heads/${BRANCH}` });
    currentSha = ref.object.sha;
    console.log(`Current HEAD: ${currentSha}`);
  } catch (e: any) {
    console.log('Branch not found, will create new');
  }

  // Create blobs for all files
  console.log('Creating blobs...');
  const treeItems: { path: string; mode: '100644'; type: 'blob'; sha: string }[] = [];
  
  const BATCH_SIZE = 10;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(async (f) => {
      const content = fs.readFileSync(f.filePath);
      const { data } = await octokit.git.createBlob({
        owner: OWNER, repo: REPO,
        content: content.toString('base64'),
        encoding: 'base64',
      });
      return { path: f.relativePath, mode: '100644' as const, type: 'blob' as const, sha: data.sha };
    }));
    treeItems.push(...results);
    process.stdout.write(`  ${Math.min(i + BATCH_SIZE, files.length)}/${files.length} files uploaded\r`);
  }
  console.log('\nCreating tree...');

  // Create tree
  const { data: tree } = await octokit.git.createTree({
    owner: OWNER, repo: REPO,
    tree: treeItems,
  });

  console.log('Creating commit...');
  const commitParams: any = {
    owner: OWNER, repo: REPO,
    message: 'Sync: Admin dashboard expansion - multi-admin users, segments, automations, reviews, drops, promo analytics',
    tree: tree.sha,
  };
  if (currentSha) commitParams.parents = [currentSha];

  const { data: commit } = await octokit.git.createCommit(commitParams);

  console.log('Updating branch reference...');
  if (currentSha) {
    await octokit.git.updateRef({
      owner: OWNER, repo: REPO,
      ref: `heads/${BRANCH}`,
      sha: commit.sha,
      force: true,
    });
  } else {
    await octokit.git.createRef({
      owner: OWNER, repo: REPO,
      ref: `refs/heads/${BRANCH}`,
      sha: commit.sha,
    });
  }

  console.log(`\nSuccessfully synced to GitHub!`);
  console.log(`Commit: ${commit.sha}`);
  console.log(`View at: https://github.com/${OWNER}/${REPO}`);
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
