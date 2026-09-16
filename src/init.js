'use strict';

const fs = require('node:fs');
const path = require('node:path');

const {
  CONFIG_FILENAME,
  ENTRY_PAGE_PATH,
  EXAMPLE_PAGE,
  INITIAL_CONFIG_TEXT,
} = require('./project');

class InitError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = 'InitError';
    this.code = 'NOVON_INIT_ERROR';
  }
}

function describeFile(relativePath) {
  return `"${relativePath}"`;
}

function fileSystemDetail(error) {
  switch (error && error.code) {
    case 'EACCES':
    case 'EPERM':
      return 'permission denied';
    case 'ENOSPC':
      return 'the disk is full';
    case 'EROFS':
      return 'the file system is read-only';
    default:
      return error && error.message ? error.message : 'an unknown file-system error';
  }
}

function readLinkSafe(filePath) {
  try {
    return fs.lstatSync(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

function ensureProjectRoot(rootDirectory) {
  let rootPath;

  try {
    rootPath = path.resolve(rootDirectory);
  } catch (error) {
    throw new InitError(`cannot use the initialization directory: ${fileSystemDetail(error)}.`, {
      cause: error,
    });
  }

  let rootStats;
  try {
    rootStats = fs.lstatSync(rootPath);
  } catch (error) {
    throw new InitError(
      `cannot initialize the project directory: ${fileSystemDetail(error)}.`,
      { cause: error },
    );
  }

  if (!rootStats.isDirectory() || rootStats.isSymbolicLink()) {
    throw new InitError(`the initialization path ${describeFile(rootPath)} is not a directory.`);
  }

  return rootPath;
}

function checkParentDirectories(rootPath, relativePath) {
  const parentPath = path.dirname(relativePath);

  if (parentPath === '.') {
    return;
  }

  let currentPath = rootPath;
  for (const segment of parentPath.split(path.sep)) {
    currentPath = path.join(currentPath, segment);
    const stats = readLinkSafe(currentPath);

    if (!stats) {
      return;
    }

    if (stats.isSymbolicLink()) {
      throw new InitError(
        `${describeFile(path.relative(rootPath, currentPath))} is a symbolic link; refusing to follow it.`,
      );
    }

    if (!stats.isDirectory()) {
      throw new InitError(
        `${describeFile(path.relative(rootPath, currentPath))} is not a directory; refusing to replace it.`,
      );
    }
  }
}

function inspectTarget(rootPath, relativePath, expectedContent) {
  const targetPath = path.join(rootPath, relativePath);
  const stats = readLinkSafe(targetPath);

  if (!stats) {
    return { state: 'missing', absolutePath: targetPath };
  }

  if (stats.isSymbolicLink()) {
    throw new InitError(
      `${describeFile(relativePath)} is a symbolic link; refusing to follow or replace it.`,
    );
  }

  if (!stats.isFile()) {
    throw new InitError(
      `${describeFile(relativePath)} is not a regular file; refusing to replace it.`,
    );
  }

  let content;
  try {
    content = fs.readFileSync(targetPath, 'utf8');
  } catch (error) {
    throw new InitError(
      `cannot inspect ${describeFile(relativePath)}: ${fileSystemDetail(error)}.`,
      { cause: error },
    );
  }

  if (content !== expectedContent) {
    throw new InitError(
      `${describeFile(relativePath)} already exists with different content; refusing to overwrite it.`,
    );
  }

  return { state: 'matching', absolutePath: targetPath };
}

function ensureParentDirectory(rootPath, relativePath, createdDirectories) {
  const parentPath = path.dirname(relativePath);

  if (parentPath === '.') {
    return;
  }

  let currentPath = rootPath;
  for (const segment of parentPath.split(path.sep)) {
    currentPath = path.join(currentPath, segment);
    const stats = readLinkSafe(currentPath);

    if (stats) {
      if (stats.isSymbolicLink() || !stats.isDirectory()) {
        throw new InitError(
          `cannot create ${describeFile(relativePath)} because ${describeFile(
            path.relative(rootPath, currentPath),
          )} is not a safe directory.`,
        );
      }
      continue;
    }

    try {
      fs.mkdirSync(currentPath, { mode: 0o755 });
      createdDirectories.push(currentPath);
    } catch (error) {
      throw new InitError(
        `cannot create the content directory for ${describeFile(relativePath)}: ${fileSystemDetail(
          error,
        )}.`,
        { cause: error },
      );
    }
  }
}

function writeNewFile(rootPath, relativePath, content, createdFiles) {
  const targetPath = path.join(rootPath, relativePath);
  let descriptor;

  try {
    descriptor = fs.openSync(targetPath, 'wx', 0o644);
    createdFiles.push({ absolutePath: targetPath, content });
    fs.writeFileSync(descriptor, content, 'utf8');
  } catch (error) {
    if (error.code === 'EEXIST') {
      throw new InitError(
        `${describeFile(relativePath)} appeared during initialization; refusing to overwrite it.`,
        { cause: error },
      );
    }

    throw new InitError(
      `cannot create ${describeFile(relativePath)}: ${fileSystemDetail(error)}.`,
      { cause: error },
    );
  } finally {
    if (descriptor !== undefined) {
      try {
        fs.closeSync(descriptor);
      } catch {
        // The original write error, if any, is more useful to the caller.
      }
    }
  }
}

function rollback(createdFiles, createdDirectories) {
  for (const { absolutePath, content } of [...createdFiles].reverse()) {
    try {
      const stats = fs.lstatSync(absolutePath);
      if (stats.isFile() && fs.readFileSync(absolutePath, 'utf8') === content) {
        fs.unlinkSync(absolutePath);
      }
    } catch {
      // Keep rollback best-effort and never hide the initialization failure.
    }
  }

  for (const directoryPath of [...createdDirectories].reverse()) {
    try {
      if (fs.readdirSync(directoryPath).length === 0) {
        fs.rmdirSync(directoryPath);
      }
    } catch {
      // Keep a directory that was populated or cannot be inspected.
    }
  }
}

function initializeProject(rootDirectory = process.cwd()) {
  const rootPath = ensureProjectRoot(rootDirectory);
  const targets = [
    {
      relativePath: CONFIG_FILENAME,
      expectedContent: INITIAL_CONFIG_TEXT,
    },
    {
      relativePath: ENTRY_PAGE_PATH,
      expectedContent: EXAMPLE_PAGE,
    },
  ];

  for (const target of targets) {
    checkParentDirectories(rootPath, target.relativePath);
  }

  const states = targets.map((target) => ({
    ...target,
    ...inspectTarget(rootPath, target.relativePath, target.expectedContent),
  }));
  const pendingTargets = states.filter((target) => target.state === 'missing');

  if (pendingTargets.length === 0) {
    return {
      status: 'already-initialized',
      rootPath,
      createdFiles: [],
    };
  }

  const createdFiles = [];
  const createdDirectories = [];

  try {
    for (const target of pendingTargets) {
      ensureParentDirectory(rootPath, target.relativePath, createdDirectories);
    }

    for (const target of pendingTargets) {
      writeNewFile(rootPath, target.relativePath, target.expectedContent, createdFiles);
    }
  } catch (error) {
    rollback(createdFiles, createdDirectories);
    if (error instanceof InitError) {
      throw error;
    }
    throw new InitError(`cannot initialize the project: ${fileSystemDetail(error)}.`, {
      cause: error,
    });
  }

  return {
    status: 'created',
    rootPath,
    createdFiles: createdFiles.map(({ absolutePath }) => path.relative(rootPath, absolutePath)),
  };
}

module.exports = {
  InitError,
  initializeProject,
};
