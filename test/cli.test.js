"use strict";

const { spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const cliPath = path.join(__dirname, '..', 'src', 'cli.js');
const commandNames = ['init', 'dev', 'studio', 'build', 'publish'];

function runCli(...args) {
  let options = {};
  if (args.length > 0 && typeof args[args.length - 1] === 'object') {
    options = args.pop();
  }

  return spawnSync(process.execPath, [cliPath, ...args], {
    encoding: 'utf8',
    ...options,
  });
}

function withTempDirectory(callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'novon-init-'));

  try {
    return callback(directory);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test('help lists the complete public command surface', () => {
  const result = runCli('--help');

  assert.equal(result.status, 0);
  for (const commandName of commandNames) {
    assert.match(result.stdout, new RegExp(`^\\s+${commandName}\\s`, 'm'));
  }
  assert.match(result.stdout, /Usage: novon <command>/);
});

test('help is shown when no command is supplied', () => {
  const result = runCli();

  assert.equal(result.status, 0);
  assert.match(result.stdout, /novon - a documentation site toolkit/);
});

test('version reports the package version', () => {
  const result = runCli('--version');

  assert.equal(result.status, 0);
  assert.match(result.stdout, /^0\.1\.0\n$/);
});

test('each command has a dedicated help entry', () => {
  for (const commandName of commandNames) {
    const result = runCli(commandName, '--help');

    assert.equal(result.status, 0);
    assert.match(result.stdout, new RegExp(`^Usage: novon ${commandName}$`, 'm'));
  }
});

test('unknown commands fail with an actionable message', () => {
  const result = runCli('unknown');

  assert.equal(result.status, 1);
  assert.match(result.stderr, /unknown command 'unknown'/);
  assert.match(result.stderr, /novon --help/);
});

test('init creates the shared project config and an example MDX page', () => {
  withTempDirectory((directory) => {
    const result = runCli('init', { cwd: directory });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /novon init: initialized/);
    assert.deepEqual(
      JSON.parse(fs.readFileSync(path.join(directory, 'novon.config.json'), 'utf8')),
      {
        contentDir: 'content',
        outputDir: 'dist',
      },
    );
    assert.match(
      fs.readFileSync(path.join(directory, 'content', 'index.mdx'), 'utf8'),
      /^---\ntitle: Welcome to novon\n---\n/,
    );
  });
});

test('init is repeatable without changing generated files', () => {
  withTempDirectory((directory) => {
    const first = runCli('init', { cwd: directory });
    const configPath = path.join(directory, 'novon.config.json');
    const pagePath = path.join(directory, 'content', 'index.mdx');
    const configBefore = fs.readFileSync(configPath, 'utf8');
    const pageBefore = fs.readFileSync(pagePath, 'utf8');
    const second = runCli('init', { cwd: directory });

    assert.equal(first.status, 0);
    assert.equal(second.status, 0);
    assert.match(second.stdout, /already initialized/);
    assert.equal(fs.readFileSync(configPath, 'utf8'), configBefore);
    assert.equal(fs.readFileSync(pagePath, 'utf8'), pageBefore);
  });
});

test('init preserves unrelated files in an existing directory', () => {
  withTempDirectory((directory) => {
    const existingPath = path.join(directory, 'notes.md');
    fs.writeFileSync(existingPath, 'keep this content\n');

    const result = runCli('init', { cwd: directory });

    assert.equal(result.status, 0);
    assert.equal(fs.readFileSync(existingPath, 'utf8'), 'keep this content\n');
    assert.match(result.stdout, /Created:.*novon\.config\.json/);
  });
});

test('init refuses to overwrite a conflicting config and leaves the directory unchanged', () => {
  withTempDirectory((directory) => {
    const configPath = path.join(directory, 'novon.config.json');
    const existingConfig = '{\n  "contentDir": "my-content"\n}\n';
    fs.writeFileSync(configPath, existingConfig);

    const result = runCli('init', { cwd: directory });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /novon\.config\.json.*refusing to overwrite/);
    assert.equal(fs.readFileSync(configPath, 'utf8'), existingConfig);
    assert.equal(fs.existsSync(path.join(directory, 'content')), false);
  });
});

test('init refuses to overwrite a conflicting example page', () => {
  withTempDirectory((directory) => {
    const pagePath = path.join(directory, 'content', 'index.mdx');
    fs.mkdirSync(path.dirname(pagePath));
    const existingPage = '# My content\n';
    fs.writeFileSync(pagePath, existingPage);

    const result = runCli('init', { cwd: directory });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /content\/index\.mdx.*refusing to overwrite/);
    assert.equal(fs.readFileSync(pagePath, 'utf8'), existingPage);
    assert.equal(fs.existsSync(path.join(directory, 'novon.config.json')), false);
  });
});
