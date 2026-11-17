'use strict';

// Run after "npm install". Starts the actual Express application, invokes curl,
// and saves command + real HTTP response for Coursera final-project submission.
const fs = require('node:fs');
const path = require('node:path');
const { spawn, execFileSync } = require('node:child_process');

const directory = path.resolve(__dirname, '..');
const outputDir = path.join(directory, 'evidence');
const port = 5117;
const base = `http://127.0.0.1:${port}`;
const username = 'coursera_demo_' + Date.now();
const password = 'coursework-demo-password';
fs.mkdirSync(outputDir, { recursive: true });

const server = spawn(process.execPath, ['index.js'], {
  cwd: directory,
  env: {
    ...process.env,
    PORT: String(port),
    API_BASE_URL: base,
    JWT_SECRET: 'temporary-ci-jwt-secret-unique-to-assignment',
    SESSION_SECRET: 'temporary-ci-session-secret-unique-to-assignment'
  },
  stdio: ['ignore', 'pipe', 'pipe']
});
server.stderr.on('data', data => process.stderr.write(data));

function curl(args) {
  return execFileSync('curl', ['-sS', ...args], {
    cwd: directory,
    encoding: 'utf8',
    timeout: 15000,
    maxBuffer: 4 * 1024 * 1024
  });
}

function save(name, command, output) {
  fs.writeFileSync(
    path.join(outputDir, name),
    'Command:\n' + command + '\n\nOutput:\n' + output.trim() + '\n',
    'utf8'
  );
  console.log('Created evidence/' + name);
}

const jsonHeader = ['-H', 'Content-Type: application/json'];
const wait = millis => new Promise(resolve => setTimeout(resolve, millis));

async function main() {
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    if (server.exitCode !== null) break;
    try {
      const response = await fetch(base + '/');
      if (response.ok) { ready = true; break; }
    } catch (error) { /* Server has not yet bound to its port. */ }
    await wait(100);
  }
  if (!ready) throw new Error('Express server failed to start on port ' + port);

  const repositoryApi = 'https://api.github.com/repos/Ershanchik/expressBookReviews';
  const repoOutput = curl(['-H', 'User-Agent: Coursera-Book-Review', repositoryApi]);
  const repoDetails = JSON.parse(repoOutput);
  if (!repoDetails.fork ||
      repoDetails.parent?.full_name !== 'ibm-developer-skills-network/expressBookReviews') {
    throw new Error('Cannot verify fork information from GitHub API');
  }
  const forkData = JSON.stringify({
    full_name: repoDetails.full_name,
    fork: repoDetails.fork,
    parent: repoDetails.parent.full_name,
    html_url: repoDetails.html_url
  }, null, 2);
  // Save the exact output of the curl command for reproducible grading.
  save('githubrepo',
    'curl -sS -H "User-Agent: Coursera-Book-Review" ' + repositoryApi,
    repoOutput);

  const queries = [
    ['getallbooks', '/'],
    ['getbooksbyISBN', '/isbn/1'],
    ['getbooksbyauthor', '/author/Chinua%20Achebe'],
    ['getbooksbytitle', '/title/Things%20Fall%20Apart'],
    ['getbookreview', '/review/1']
  ];
  for (const [name, route] of queries) {
    save(name, `curl -sS "${base}${route}"`, curl([base + route]));
  }

  const registerBody = JSON.stringify({ username, password });
  const registerOutput = curl(['-X', 'POST', ...jsonHeader,
    '-d', registerBody, base + '/register']);
  save('register',
    `curl -sS -X POST "${base}/register" -H 'Content-Type: application/json' -d '${registerBody}'`,
    registerOutput);

  const loginOutput = curl(['-X', 'POST', ...jsonHeader,
    '-d', registerBody, base + '/customer/login']);
  const token = JSON.parse(loginOutput).accessToken;
  if (!token) throw new Error('Login did not return an access token');

  // A test JWT must not be published as a valid credential. The original
  // request is real; its token is redacted from the saved output.
  save('login',
    `curl -sS -X POST "${base}/customer/login" -H 'Content-Type: application/json' -d '${registerBody}'`,
    JSON.stringify({ ...JSON.parse(loginOutput), accessToken: '[redacted]' }, null, 2));

  const tokenCommand =
    `TOKEN=$(curl -sS -X POST "${base}/customer/login" -H 'Content-Type: application/json' -d '${registerBody}' | node -e "let data='';process.stdin.on('data',x=>data+=x).on('end',()=>console.log(JSON.parse(data).accessToken))")`;
  const reviewBody = JSON.stringify({ review: 'Great book! Very interesting story.' });
  const reviewOutput = curl(['-X', 'PUT', ...jsonHeader, '-H', 'Authorization: Bearer ' + token,
    '-d', reviewBody, base + '/customer/auth/review/1']);
  save('reviewadded',
    tokenCommand + '\n' +
    `curl -sS -X PUT "${base}/customer/auth/review/1" -H "Authorization: Bearer \$TOKEN" -H 'Content-Type: application/json' -d '${reviewBody}'`,
    reviewOutput);

  const delOutput = curl(['-X', 'DELETE', '-H', 'Authorization: Bearer ' + token,
    base + '/customer/auth/review/1']);
  save('deletereview', tokenCommand + '\n' +
    `curl -sS -X DELETE "${base}/customer/auth/review/1" -H "Authorization: Bearer \$TOKEN"`,
    delOutput);

  const asyncPaths = [
    ['asyncbooks', '/asyncbooks'],
    ['asyncisbn', '/asyncisbn/1'],
    ['asyncauthor', '/asyncauthor/Chinua%20Achebe'],
    ['asynctitle', '/asynctitle/Things%20Fall%20Apart']
  ];
  for (const [name, route] of asyncPaths) {
    save(name, `curl -sS "${base}${route}"`, curl([base + route]));
  }
  console.log('All actual curl requests completed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => {
  server.kill('SIGTERM');
});
