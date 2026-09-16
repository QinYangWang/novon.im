'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { parseDevOptions, startDevServer } = require('../src/dev');

const cliPath = path.join(__dirname, '..', 'src', 'cli.js');

function createProject() {
  const rootPath = fs.mkdtempSync(path.join(os.tmpdir(), 'novon-dev-'));
  const contentPath = path.join(rootPath, 'content');
  fs.mkdirSync(contentPath);
  fs.writeFileSync(
    path.join(rootPath, 'novon.config.json'),
    `${JSON.stringify({ contentDir: 'content' }, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(contentPath, 'index.mdx'),
    '---\ntitle: Home\n---\n\n# Home\n\nThe first version.\n',
  );
  return rootPath;
}

function request(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const requestUrl = new URL(url);
    const requestObject = http.request(
      {
        hostname: requestUrl.hostname,
        method,
        path: `${requestUrl.pathname}${requestUrl.search}`,
        port: requestUrl.port,
      },
      (response) => {
        const chunks = [];
        response.setEncoding('utf8');
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          resolve({
            body: chunks.join(''),
            headers: response.headers,
            statusCode: response.statusCode,
          });
        });
      },
    );
    requestObject.on('error', reject);
    requestObject.end();
  });
}

test('dev parses a project and reflects saved MDX changes on the next request', async () => {
  const rootPath = createProject();
  let instance;
  try {
    instance = await startDevServer({ rootDir: rootPath, port: 0 });

    const initial = await request(instance.url);
    assert.equal(initial.statusCode, 200);
    assert.match(initial.body, /The first version\./);
    assert.match(initial.body, /Home/);

    fs.writeFileSync(
      path.join(rootPath, 'content', 'index.mdx'),
      '---\ntitle: Home\n---\n\n# Home\n\nThe updated version.\n',
    );
    const updated = await request(instance.url);
    assert.equal(updated.statusCode, 200);
    assert.match(updated.body, /The updated version\./);
    assert.doesNotMatch(updated.body, /The first version\./);
  } finally {
    if (instance) {
      await instance.close();
    }
    fs.rmSync(rootPath, { recursive: true, force: true });
  }
});

test('dev serves nested pages and returns a useful 404', async () => {
  const rootPath = createProject();
  let instance;
  try {
    fs.mkdirSync(path.join(rootPath, 'content', 'guide'));
    fs.writeFileSync(
      path.join(rootPath, 'content', 'guide', 'getting-started.mdx'),
      '# Getting started\n\nFollow these steps.\n',
    );
    instance = await startDevServer({ rootDir: rootPath, port: 0 });

    const page = await request(`${instance.url}/guide/getting-started`);
    assert.equal(page.statusCode, 200);
    assert.match(page.body, /Follow these steps\./);

    const missing = await request(`${instance.url}/missing`);
    assert.equal(missing.statusCode, 404);
    assert.match(missing.body, /page.*missing.*was not found/i);
  } finally {
    if (instance) {
      await instance.close();
    }
    fs.rmSync(rootPath, { recursive: true, force: true });
  }
});

test('dev rejects a missing project and invalid ports before starting', async () => {
  const rootPath = fs.mkdtempSync(path.join(os.tmpdir(), 'novon-dev-empty-'));
  try {
    await assert.rejects(
      startDevServer({ rootDir: rootPath, port: 0 }),
      /no novon config.*novon\.config\.json.*novon init/i,
    );
    assert.throws(() => parseDevOptions(['--port', 'not-a-port']), /integer between 0 and 65535/);
    assert.throws(() => parseDevOptions(['--port', '65536']), /integer between 0 and 65535/);
  } finally {
    fs.rmSync(rootPath, { recursive: true, force: true });
  }
});

test('dev reports invalid startup options through the CLI', () => {
  const rootPath = createProject();
  try {
    const result = spawnSync(process.execPath, [cliPath, 'dev', '--port', 'bad'], {
      cwd: rootPath,
      encoding: 'utf8',
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /novon dev:/);
    assert.match(result.stderr, /integer between 0 and 65535/);
  } finally {
    fs.rmSync(rootPath, { recursive: true, force: true });
  }
});
