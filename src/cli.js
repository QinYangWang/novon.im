#!/usr/bin/env node
'use strict';

const packageInfo = require('../package.json');
const { initializeProject } = require('./init');
const { devHelpText, runDev } = require('./dev');
const { buildHelpText, runBuild } = require('./build');

const commands = Object.freeze([
  Object.freeze({
    name: 'init',
    description: 'initialize a novon documentation directory',
    help: [
      'Initialize a novon project in the current directory.',
      '',
      'Creates novon.config.json and content/index.mdx without overwriting',
      'existing files.',
    ].join('\n'),
  }),
  Object.freeze({
    name: 'dev',
    description: 'start the local novon development server',
  }),
  Object.freeze({
    name: 'studio',
    description: 'open the novon editing workspace',
  }),
  Object.freeze({
    name: 'build',
    description: 'build a novon site into static files',
  }),
  Object.freeze({
    name: 'publish',
    description: 'publish a novon site to a hosting platform',
  }),
]);

const commandByName = new Map(commands.map((command) => [command.name, command]));

function helpText() {
  const commandLines = commands.map(({ name, description }) =>
    `  ${name.padEnd(8)} ${description}`,
  );

  return [
    'novon - a documentation site toolkit',
    '',
    'Usage: novon <command> [options]',
    '',
    'Commands:',
    ...commandLines,
    '',
    'Options:',
    '  -h, --help     show help information',
    '  -v, --version  show the installed version',
    '',
    'ฅ^•ﻌ^•ฅ',
  ].join('\n');
}

function commandHelp(command) {
  if (command.help) {
    return [`Usage: novon ${command.name}`, '', command.help].join('\n');
  }

  if (command.name === 'dev') {
    return devHelpText();
  }

  if (command.name === 'build') {
    return buildHelpText();
  }

  return [
    `Usage: novon ${command.name}`,
    '',
    command.description,
    '',
    'This command is part of the public CLI contract. Its implementation is not',
    'included in the current project skeleton yet.',
  ].join('\n');
}

function main(args = process.argv.slice(2)) {
  const [firstArg, ...rest] = args;

  if (!firstArg || firstArg === '-h' || firstArg === '--help') {
    console.log(helpText());
    return 0;
  }

  if (firstArg === '-v' || firstArg === '--version') {
    console.log(packageInfo.version);
    return 0;
  }

  if (firstArg === 'help') {
    const requestedCommand = rest[0];
    const command = requestedCommand && commandByName.get(requestedCommand);

    if (!requestedCommand) {
      console.log(helpText());
      return 0;
    }

    if (!command) {
      console.error(`novon: unknown command '${requestedCommand}'`);
      return 1;
    }

    console.log(commandHelp(command));
    return 0;
  }

  const command = commandByName.get(firstArg);

  if (!command) {
    console.error(`novon: unknown command '${firstArg}'`);
    console.error('Run "novon --help" to see available commands.');
    return 1;
  }

  if (rest.includes('-h') || rest.includes('--help')) {
    console.log(commandHelp(command));
    return 0;
  }

  if (command.name === 'init') {
    if (rest.length > 0) {
      console.error('novon init: this command does not accept arguments.');
      console.error('Run "novon init --help" for usage information.');
      return 1;
    }

    try {
      const result = initializeProject();

      if (result.status === 'already-initialized') {
        console.log('novon init: project is already initialized; no files were changed.');
      } else {
        console.log('novon init: initialized a project in the current directory.');
        console.log(`Created: ${result.createdFiles.join(', ')}`);
      }
      return 0;
    } catch (error) {
      console.error(`novon init: ${error.message}`);
      return 1;
    }
  }

  if (command.name === 'dev') {
    try {
      return runDev(rest);
    } catch (error) {
      console.error(`novon dev: ${error.message}`);
      return 1;
    }
  }

  if (command.name === 'build') {
    return runBuild(rest);
  }

  console.log(`novon ${command.name} is not implemented in this project skeleton yet.`);
  return 0;
}

if (require.main === module) {
  const result = main();
  if (result && typeof result.then === 'function') {
    result.then(
      (exitCode) => {
        process.exitCode = exitCode;
      },
      (error) => {
        console.error(`novon dev: ${error.message}`);
        process.exitCode = 1;
      },
    );
  } else {
    process.exitCode = result;
  }
}

module.exports = {
  commands,
  commandHelp,
  helpText,
  main,
};
