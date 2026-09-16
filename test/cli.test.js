"use strict";

const { spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const cliPath = path.join(__dirname, '..', 'src', 'cli.js');
const commandNames = ['init', 'dev', 'studio', 'build', 'publish'];

function runCli(...args) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    encoding: 'utf8',
  });
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
