'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const cliPath = path.join(__dirname, '..', 'src', 'cli.js');
const temporaryProjects = [];

function makeProject(files) {
  const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'novon-build-test-'));
  temporaryProjects.push(projectDir);

  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(projectDir, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  }

  return projectDir;
}

function runBuild(projectDir, ...args) {
  return spawnSync(process.execPath, [cliPath, 'build', ...args], {
    cwd: projectDir,
    encoding: 'utf8',
  });
}

test.afterEach(() => {
  while (temporaryProjects.length) {
    fs.rmSync(temporaryProjects.pop(), { recursive: true, force: true });
  }
});

test('build renders the initialized project into directly hostable HTML', () => {
  const projectDir = makeProject({
    'novon.config.json': JSON.stringify({
      title: 'Example docs',
      description: 'A small example site',
      contentDir: 'content',
      outputDir: 'dist',
    }),
    'content/index.mdx': `---
title: Welcome
---

# Hello, novon

This is **a working page**.
`,
  });

  const result = runBuild(projectDir);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /generated 1 page in .*dist/);

  const output = fs.readFileSync(path.join(projectDir, 'dist', 'index.html'), 'utf8');
  assert.match(output, /^<!doctype html>/);
  assert.match(output, /<title>Welcome \| Example docs<\/title>/);
  assert.match(output, /<h1>Hello, novon<\/h1>/);
  assert.match(output, /This is <strong>a working page<\/strong>\./);
});

test('build supports nested pages and an output override', () => {
  const projectDir = makeProject({
    'novon.config.json': JSON.stringify({ title: 'Docs', contentDir: 'content', outputDir: 'dist' }),
    'content/index.mdx': '# Home',
    'content/guide/first.mdx': '# First guide',
  });

  const result = runBuild(projectDir, '--output', 'public-site');
  assert.equal(result.status, 0, result.stderr);
  assert.ok(fs.existsSync(path.join(projectDir, 'public-site', 'index.html')));
  assert.match(
    fs.readFileSync(path.join(projectDir, 'public-site', 'guide', 'first.html'), 'utf8'),
    /<h1>First guide<\/h1>/,
  );
  assert.equal(fs.existsSync(path.join(projectDir, 'dist')), false);
});

test('build rejects a missing project configuration with an actionable error', () => {
  const projectDir = makeProject({});

  const result = runBuild(projectDir);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /cannot find novon\.config\.json/);
  assert.match(result.stderr, /novon init/);
  assert.equal(fs.existsSync(path.join(projectDir, 'dist')), false);
});

test('build preserves the previous output when configuration is invalid', () => {
  const projectDir = makeProject({
    'novon.config.json': '{ invalid json',
    'dist/index.html': 'previous complete output',
  });

  const result = runBuild(projectDir);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /invalid JSON/);
  assert.equal(
    fs.readFileSync(path.join(projectDir, 'dist', 'index.html'), 'utf8'),
    'previous complete output',
  );
});

test('build rejects missing content and does not create an output directory', () => {
  const projectDir = makeProject({
    'novon.config.json': JSON.stringify({ title: 'Docs', contentDir: 'articles', outputDir: 'dist' }),
  });

  const result = runBuild(projectDir);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /content source .*articles.*does not exist/);
  assert.equal(fs.existsSync(path.join(projectDir, 'dist')), false);
});

test('build preserves the previous output when a page cannot be rendered', () => {
  const projectDir = makeProject({
    'novon.config.json': JSON.stringify({ title: 'Docs', contentDir: 'content', outputDir: 'dist' }),
    'content/index.mdx': '---\ntitle: Unfinished\n\n# not reachable',
    'dist/index.html': 'previous complete output',
  });

  const result = runBuild(projectDir);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /front matter .*not closed/);
  assert.equal(
    fs.readFileSync(path.join(projectDir, 'dist', 'index.html'), 'utf8'),
    'previous complete output',
  );
});
