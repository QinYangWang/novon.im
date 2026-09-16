#!/usr/bin/env node
'use strict';

const packageInfo = require('../package.json');

const commands = Object.freeze([
  Object.freeze({
    name: 'init',
    description: 'initialize a novon documentation directory',
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

  console.log(`novon ${command.name} is not implemented in this project skeleton yet.`);
  return 0;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  commands,
  commandHelp,
  helpText,
  main,
};
