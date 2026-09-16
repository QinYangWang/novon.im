'use strict';

const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const cliPath = path.join(__dirname, '..', 'src', 'cli.js');

function runCli(cwd, ...args) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: 'utf8',
  });
}

function request(url) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const requestObject = http.get(
      {
        hostname: target.hostname,
        path: target.pathname,
        port: target.port,
      },
      (response) => {
        const chunks = [];
        response.setEncoding('utf8');
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          resolve({
            body: chunks.join(''),
            statusCode: response.statusCode,
          });
        });
      },
    );
    requestObject.on('error', reject);
  });
}

function waitForDevServer(child) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let settled = false;
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      finish(() => reject(new Error(`dev server did not start:\n${stdout}\n${stderr}`)));
    }, 5000);

    const finish = (callback) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      callback();
    };

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      const match = stdout.match(/novon dev preview available at (http:\/\/[^\s]+)/);
      if (match) {
        finish(() => resolve({ stderr, stdout, url: match[1] }));
      }
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.once('error', (error) => {
      finish(() => reject(error));
    });
    child.once('close', (code, signal) => {
      finish(() => reject(new Error(`dev server exited before listening (${code ?? signal}):\n${stdout}\n${stderr}`)));
    });
  });
}

function stopProcess(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let forceTimer;
    const finish = () => {
      clearTimeout(forceTimer);
      resolve();
    };

    child.once('close', finish);
    child.kill('SIGTERM');
    forceTimer = setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGKILL');
      }
    }, 3000);
  });
}

test('the documented init to dev to build journey works end to end', async () => {
  const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'novon-e2e-'));
  let devProcess;

  try {
    const init = runCli(projectDir, 'init');
    assert.equal(init.status, 0, init.stderr);
    assert.match(init.stdout, /novon init: initialized/);
    assert.ok(fs.existsSync(path.join(projectDir, 'novon.config.json')));
    assert.ok(fs.existsSync(path.join(projectDir, 'content', 'index.mdx')));

    devProcess = spawn(process.execPath, [cliPath, 'dev', '--port', '0'], {
      cwd: projectDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const dev = await waitForDevServer(devProcess);

    const initial = await request(dev.url);
    assert.equal(initial.statusCode, 200);
    assert.match(initial.body, /This is your first novon page\./);

    const pagePath = path.join(projectDir, 'content', 'index.mdx');
    const updatedPage = fs
      .readFileSync(pagePath, 'utf8')
      .replace('This is your first novon page.', 'This page was updated locally.');
    fs.writeFileSync(pagePath, updatedPage);

    const updated = await request(dev.url);
    assert.equal(updated.statusCode, 200);
    assert.match(updated.body, /This page was updated locally\./);
    assert.doesNotMatch(updated.body, /This is your first novon page\./);

    await stopProcess(devProcess);
    devProcess = null;

    const build = runCli(projectDir, 'build');
    assert.equal(build.status, 0, build.stderr);
    assert.match(build.stdout, /generated 1 page/);

    const outputPath = path.join(projectDir, 'dist', 'index.html');
    assert.ok(fs.existsSync(outputPath));
    const output = fs.readFileSync(outputPath, 'utf8');
    assert.match(output, /^<!doctype html>/);
    assert.match(output, /This page was updated locally\./);
  } finally {
    if (devProcess) {
      await stopProcess(devProcess);
    }
    fs.rmSync(projectDir, { recursive: true, force: true });
  }
});
