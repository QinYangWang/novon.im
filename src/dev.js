'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const { renderThemePage } = require('./theme');

const CONFIG_FILENAMES = Object.freeze([
  'novon.config.json',
  '.novon.json',
  'novon.json',
]);
const CONTENT_DIRECTORY = 'content';
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 3000;
const MARKDOWN_EXTENSIONS = Object.freeze(['.md', '.mdx']);
const IGNORED_DIRECTORY_NAMES = new Set(['.git', 'dist', 'node_modules']);

class DevError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = 'DevError';
    this.code = 'NOVON_DEV_ERROR';
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function pathLabel(filePath) {
  return JSON.stringify(filePath);
}

function isWithinDirectory(rootPath, candidatePath) {
  const relativePath = path.relative(rootPath, candidatePath);
  return (
    relativePath === '' ||
    (!relativePath.startsWith(`..${path.sep}`) &&
      relativePath !== '..' &&
      !path.isAbsolute(relativePath))
  );
}

function resolveInside(rootPath, value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new DevError(`${label} must be a non-empty relative path.`);
  }

  const candidatePath = path.resolve(rootPath, value);
  if (!isWithinDirectory(rootPath, candidatePath)) {
    throw new DevError(`${label} ${pathLabel(value)} must stay inside the project directory.`);
  }

  return candidatePath;
}

function ensureDirectory(directoryPath, description) {
  let stats;
  try {
    stats = fs.lstatSync(directoryPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new DevError(
        `${description} ${pathLabel(directoryPath)} does not exist. Run "novon init" first.`,
        { cause: error },
      );
    }
    throw new DevError(
      `cannot read ${description} ${pathLabel(directoryPath)}: ${error.message}.`,
      { cause: error },
    );
  }

  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new DevError(`${description} ${pathLabel(directoryPath)} is not a directory.`);
  }
}

function parsePort(value, source = 'port') {
  if (typeof value === 'number') {
    if (Number.isInteger(value) && value >= 0 && value <= 65535) {
      return value;
    }
  } else if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const port = Number(value.trim());
    if (Number.isInteger(port) && port >= 0 && port <= 65535) {
      return port;
    }
  }

  throw new DevError(`${source} must be an integer between 0 and 65535.`);
}

function parseHost(value, source = 'host') {
  if (typeof value !== 'string' || value.trim() === '' || value.includes('\0')) {
    throw new DevError(`${source} must be a non-empty host name or IP address.`);
  }
  return value.trim();
}

function takeOptionValue(args, index, option) {
  const value = args[index + 1];
  if (value === undefined || value === '' || value === '--' || value.startsWith('-')) {
    throw new DevError(`${option} requires a value. Run "novon dev --help" for usage.`);
  }
  return value;
}

function parseDevOptions(args = []) {
  if (!Array.isArray(args)) {
    throw new DevError('dev options must be an array.');
  }

  let rootDir = process.cwd();
  let configPath = null;
  let host = null;
  let port = null;
  let positionalRoot = null;
  let parseOptions = true;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (parseOptions && argument === '--') {
      parseOptions = false;
      continue;
    }

    if (parseOptions && (argument === '-p' || argument === '--port')) {
      const value = takeOptionValue(args, index, argument);
      port = parsePort(value, argument);
      index += 1;
      continue;
    }

    if (parseOptions && argument.startsWith('--port=')) {
      port = parsePort(argument.slice('--port='.length), '--port');
      continue;
    }

    if (parseOptions && argument === '--host') {
      const value = takeOptionValue(args, index, argument);
      host = parseHost(value, argument);
      index += 1;
      continue;
    }

    if (parseOptions && argument.startsWith('--host=')) {
      host = parseHost(argument.slice('--host='.length), '--host');
      continue;
    }

    if (parseOptions && argument === '--config') {
      configPath = takeOptionValue(args, index, argument);
      index += 1;
      continue;
    }

    if (parseOptions && argument.startsWith('--config=')) {
      configPath = argument.slice('--config='.length);
      if (configPath === '') {
        throw new DevError('--config requires a value. Run "novon dev --help" for usage.');
      }
      continue;
    }

    if (parseOptions && argument === '--root') {
      const value = takeOptionValue(args, index, argument);
      rootDir = value;
      index += 1;
      continue;
    }

    if (parseOptions && argument.startsWith('--root=')) {
      rootDir = argument.slice('--root='.length);
      if (rootDir === '') {
        throw new DevError('--root requires a value. Run "novon dev --help" for usage.');
      }
      continue;
    }

    if (parseOptions && argument.startsWith('-')) {
      throw new DevError(
        `unknown dev option ${JSON.stringify(argument)}. Run "novon dev --help" for usage.`,
      );
    }

    if (positionalRoot !== null) {
      throw new DevError(
        'dev accepts at most one project directory. Run "novon dev --help" for usage.',
      );
    }
    positionalRoot = argument;
  }

  if (positionalRoot !== null) {
    if (rootDir !== process.cwd()) {
      throw new DevError('use either a project directory or --root, not both.');
    }
    rootDir = positionalRoot;
  }

  let resolvedRoot;
  try {
    resolvedRoot = path.resolve(rootDir);
  } catch (error) {
    throw new DevError(`cannot resolve the project directory: ${error.message}.`, {
      cause: error,
    });
  }

  if (port === null && process.env.NOVON_PORT !== undefined) {
    port = parsePort(process.env.NOVON_PORT, 'NOVON_PORT');
  }

  if (host === null && process.env.NOVON_HOST !== undefined) {
    host = parseHost(process.env.NOVON_HOST, 'NOVON_HOST');
  }

  return {
    rootDir: resolvedRoot,
    configPath,
    host,
    port,
  };
}

function readConfigFile(configPath) {
  let source;
  try {
    source = fs.readFileSync(configPath, 'utf8');
  } catch (error) {
    throw new DevError(`cannot read config file ${pathLabel(configPath)}: ${error.message}.`, {
      cause: error,
    });
  }

  let config;
  try {
    config = JSON.parse(source);
  } catch (error) {
    throw new DevError(
      `config file ${pathLabel(configPath)} is not valid JSON: ${error.message}.`,
      { cause: error },
    );
  }

  if (!isObject(config)) {
    throw new DevError(`config file ${pathLabel(configPath)} must contain a JSON object.`);
  }

  return config;
}

function findConfigFile(rootPath, requestedConfigPath) {
  if (requestedConfigPath !== null && requestedConfigPath !== undefined) {
    const configPath = resolveInside(rootPath, requestedConfigPath, 'config path');
    let stats;
    try {
      stats = fs.lstatSync(configPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new DevError(
          `config file ${pathLabel(configPath)} does not exist. Run "novon init" first.`,
          { cause: error },
        );
      }
      throw new DevError(`cannot inspect config file ${pathLabel(configPath)}: ${error.message}.`, {
        cause: error,
      });
    }
    if (stats.isSymbolicLink() || !stats.isFile()) {
      throw new DevError(`config path ${pathLabel(configPath)} is not a regular file.`);
    }
    return configPath;
  }

  for (const fileName of CONFIG_FILENAMES) {
    const configPath = path.join(rootPath, fileName);
    try {
      const stats = fs.lstatSync(configPath);
      if (stats.isSymbolicLink() || !stats.isFile()) {
        throw new DevError(`config path ${pathLabel(configPath)} is not a regular file.`);
      }
      return configPath;
    } catch (error) {
      if (error.code === 'ENOENT') {
        continue;
      }
      if (error instanceof DevError) {
        throw error;
      }
      throw new DevError(`cannot inspect config file ${pathLabel(configPath)}: ${error.message}.`, {
        cause: error,
      });
    }
  }

  throw new DevError(
    `no novon config found in ${pathLabel(rootPath)}. Expected ${CONFIG_FILENAMES[0]}; run "novon init" first.`,
  );
}

function firstValue(objects, keys) {
  for (const object of objects) {
    if (!isObject(object)) {
      continue;
    }
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        return object[key];
      }
    }
  }
  return undefined;
}

function configSections(config) {
  return [config, config.dev, config.server, config.site];
}

function configuredContent(config) {
  const value = firstValue(configSections(config), [
    'contentDir',
    'contentDirectory',
    'docsDir',
    'sourceDir',
  ]);

  if (value !== undefined) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new DevError('contentDir must be a non-empty relative directory path.');
    }
    return { directory: value, entry: null };
  }

  const content = firstValue(configSections(config), ['content', 'source']);
  if (content === undefined) {
    return null;
  }
  if (isObject(content)) {
    const directory = firstValue([content], ['dir', 'directory', 'root', 'path']);
    const entry = firstValue([content], ['entry', 'file', 'contentFile']);
    if (directory === undefined && entry === undefined) {
      throw new DevError('content must specify a directory or entry file path.');
    }
    if (directory !== undefined && (typeof directory !== 'string' || directory.trim() === '')) {
      throw new DevError('content directory must be a non-empty relative path.');
    }
    if (entry !== undefined && (typeof entry !== 'string' || entry.trim() === '')) {
      throw new DevError('content entry must be a non-empty MDX or Markdown file path.');
    }
    return { directory: directory || '.', entry: entry || null };
  }
  if (typeof content !== 'string' || content.trim() === '') {
    throw new DevError('content must be a non-empty relative path.');
  }

  if (MARKDOWN_EXTENSIONS.includes(path.extname(content).toLowerCase())) {
    return { directory: path.dirname(content), entry: content };
  }
  return { directory: content, entry: null };
}

function configuredEntry(config) {
  const content = firstValue(configSections(config), ['content', 'source']);
  const entry = firstValue(configSections(config).concat(isObject(content) ? [content] : []), [
    'entry',
    'index',
    'homepage',
    'file',
    'contentFile',
  ]);
  if (entry === undefined || entry === null) {
    return null;
  }
  if (typeof entry !== 'string' || entry.trim() === '') {
    throw new DevError('entry must be a non-empty MDX or Markdown file path.');
  }
  return entry;
}

function configuredTitle(config) {
  const title = firstValue(configSections(config), ['title', 'name']);
  if (title === undefined || title === null || String(title).trim() === '') {
    return 'novon';
  }
  if (typeof title !== 'string') {
    throw new DevError('site title must be a string.');
  }
  return title.trim();
}

function configuredDescription(config) {
  const description = firstValue(configSections(config), ['description']);
  if (description === undefined || description === null) {
    return '';
  }
  if (typeof description !== 'string') {
    throw new DevError('site description must be a string.');
  }
  return description.trim();
}

function configuredLanguage(config) {
  const language = firstValue(configSections(config), ['lang', 'language']);
  if (language === undefined || language === null || String(language).trim() === '') {
    return 'en';
  }
  if (typeof language !== 'string' || !/^[A-Za-z0-9-]+$/.test(language.trim())) {
    throw new DevError('site language must contain only letters, numbers, and hyphens.');
  }
  return language.trim();
}

function configuredServer(config) {
  const host = firstValue(configSections(config), ['host']);
  const port = firstValue(configSections(config), ['port']);
  return {
    host: host === undefined || host === null ? null : parseHost(host, 'config host'),
    port: port === undefined || port === null ? null : parsePort(port, 'config port'),
  };
}

function resolveProjectRoot(rootDirectory) {
  let rootPath;
  try {
    rootPath = path.resolve(rootDirectory || process.cwd());
  } catch (error) {
    throw new DevError(`cannot resolve the project directory: ${error.message}.`, {
      cause: error,
    });
  }

  let stats;
  try {
    stats = fs.lstatSync(rootPath);
  } catch (error) {
    throw new DevError(`cannot access project directory ${pathLabel(rootPath)}: ${error.message}.`, {
      cause: error,
    });
  }
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new DevError(`project path ${pathLabel(rootPath)} is not a directory.`);
  }
  return rootPath;
}

function resolveContentDirectory(rootPath, config, contentSetting) {
  if (contentSetting !== null) {
    return resolveInside(rootPath, contentSetting.directory, 'contentDir');
  }

  for (const directoryName of [CONTENT_DIRECTORY, 'docs', 'pages']) {
    const candidatePath = path.join(rootPath, directoryName);
    try {
      const stats = fs.lstatSync(candidatePath);
      if (stats.isDirectory() && !stats.isSymbolicLink()) {
        return candidatePath;
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new DevError(`cannot inspect content directory ${pathLabel(candidatePath)}: ${error.message}.`, {
          cause: error,
        });
      }
    }
  }

  // Keep the canonical location in the returned project so the resulting error
  // points at the same path that `novon init` would create.
  return path.join(rootPath, CONTENT_DIRECTORY);
}

function resolveEntryPath(rootPath, contentDirectory, contentSetting, config) {
  const configuredPath = configuredEntry(config) || (contentSetting && contentSetting.entry);
  if (configuredPath === null || configuredPath === undefined) {
    return null;
  }

  const entryPath = resolveInside(rootPath, configuredPath, 'entry path');
  if (!isWithinDirectory(contentDirectory, entryPath)) {
    throw new DevError('entry path must stay inside contentDir.');
  }
  if (!MARKDOWN_EXTENSIONS.includes(path.extname(entryPath).toLowerCase())) {
    throw new DevError('entry path must point to an .md or .mdx file.');
  }
  return entryPath;
}

function loadProject(options = {}) {
  if (typeof options === 'string') {
    options = { rootDir: options };
  }
  if (!isObject(options)) {
    throw new DevError('project options must be an object.');
  }

  const rootPath = resolveProjectRoot(options.rootDir || process.cwd());
  const configPath = findConfigFile(rootPath, options.configPath ?? null);
  const config = readConfigFile(configPath);
  const contentSetting = configuredContent(config);
  const contentDirectory = resolveContentDirectory(rootPath, config, contentSetting);
  ensureDirectory(contentDirectory, 'content directory');
  const entryPath = resolveEntryPath(rootPath, contentDirectory, contentSetting, config);
  const server = configuredServer(config);

  const project = {
    rootPath,
    configPath,
    config,
    contentDirectory,
    entryPath,
    title: configuredTitle(config),
    description: configuredDescription(config),
    lang: configuredLanguage(config),
    host: server.host,
    port: server.port,
  };

  const files = collectContentFiles(project);
  if (files.length === 0) {
    throw new DevError(
      `no Markdown or MDX files found in ${pathLabel(contentDirectory)}. Add a page or run "novon init" in an empty project.`,
    );
  }
  if (entryPath !== null && !files.includes(entryPath)) {
    throw new DevError(`entry file ${pathLabel(entryPath)} does not exist in contentDir.`);
  }

  return project;
}

function collectContentFiles(project) {
  const files = [];
  const { contentDirectory } = project;

  function visit(directoryPath) {
    let entries;
    try {
      entries = fs.readdirSync(directoryPath, { withFileTypes: true });
    } catch (error) {
      throw new DevError(`cannot read content directory ${pathLabel(directoryPath)}: ${error.message}.`, {
        cause: error,
      });
    }

    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.isDirectory()) {
        continue;
      }
      const entryPath = path.join(directoryPath, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORY_NAMES.has(entry.name)) {
          visit(entryPath);
        }
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      if (MARKDOWN_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
        files.push(entryPath);
      }
    }
  }

  visit(contentDirectory);
  return files;
}

function parseFrontmatterValue(value) {
  const trimmed = value.trim();
  if (trimmed === '') {
    return '';
  }
  if (trimmed === 'true') {
    return true;
  }
  if (trimmed === 'false') {
    return false;
  }
  if (trimmed === 'null') {
    return null;
  }
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    if (trimmed.startsWith('"')) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return trimmed.slice(1, -1);
      }
    }
    return trimmed.slice(1, -1).replaceAll("''", "'");
  }
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1).split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  return trimmed;
}

function parseFrontmatter(source, filePath) {
  const normalizedSource = source.replace(/^\uFEFF/, '');
  if (!normalizedSource.startsWith('---')) {
    return { attributes: {}, body: normalizedSource };
  }

  const firstLineEnd = normalizedSource.indexOf('\n');
  if (firstLineEnd === -1 || normalizedSource.slice(0, firstLineEnd).trim() !== '---') {
    return { attributes: {}, body: normalizedSource };
  }

  const lines = normalizedSource.slice(firstLineEnd + 1).split(/\r?\n/);
  let closingIndex = -1;
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].trim() === '---' || lines[index].trim() === '...') {
      closingIndex = index;
      break;
    }
  }
  if (closingIndex === -1) {
    throw new DevError(`front matter in ${pathLabel(filePath)} is not closed with "---".`);
  }

  const attributes = {};
  for (let index = 0; index < closingIndex; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }
    const separator = line.indexOf(':');
    if (separator <= 0) {
      throw new DevError(
        `front matter in ${pathLabel(filePath)} has an invalid line ${index + 2}; use "key: value".`,
      );
    }
    const key = line.slice(0, separator).trim();
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(key)) {
      throw new DevError(`front matter key ${JSON.stringify(key)} in ${pathLabel(filePath)} is invalid.`);
    }
    attributes[key] = parseFrontmatterValue(line.slice(separator + 1));
  }

  return {
    attributes,
    body: lines.slice(closingIndex + 1).join('\n'),
  };
}

function plainTitle(value) {
  return String(value)
    .replace(/[*_`~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .trim();
}

function headingFromMarkdown(body) {
  for (const line of body.split(/\r?\n/)) {
    const match = line.match(/^\s*#\s+(.+?)\s*#*\s*$/);
    if (match) {
      return plainTitle(match[1]);
    }
  }
  return null;
}

function documentRoute(relativePath, attributes = {}) {
  const configuredRoute = attributes.slug !== undefined ? attributes.slug : attributes.permalink;
  if (configuredRoute !== undefined) {
    if (typeof configuredRoute !== 'string' || configuredRoute.trim() === '') {
      throw new DevError(`slug/permalink for ${pathLabel(relativePath)} must be a non-empty string.`);
    }
    let route = configuredRoute.trim().replace(/^\/+/, '');
    route = route.replace(/\/+$/, '');
    if (route === '') {
      return '/';
    }
    return `/${route}`;
  }

  const slashPath = relativePath.split(path.sep).join('/');
  const extension = path.extname(slashPath);
  const withoutExtension = slashPath.slice(0, -extension.length);
  const baseName = path.posix.basename(withoutExtension).toLowerCase();
  if (baseName === 'index') {
    const directory = path.posix.dirname(withoutExtension);
    return directory === '.' ? '/' : `/${directory}/`;
  }
  return `/${withoutExtension}`;
}

function readProjectDocuments(project) {
  const filePaths = collectContentFiles(project);
  const documents = filePaths.map((filePath) => {
    let source;
    try {
      source = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      throw new DevError(`cannot read content file ${pathLabel(filePath)}: ${error.message}.`, {
        cause: error,
      });
    }

    const { attributes, body } = parseFrontmatter(source, filePath);
    const relativePath = path.relative(project.contentDirectory, filePath);
    const titleValue = attributes.title;
    if (titleValue !== undefined && (typeof titleValue !== 'string' || titleValue.trim() === '')) {
      throw new DevError(`title in front matter for ${pathLabel(relativePath)} must be a non-empty string.`);
    }
    const descriptionValue = attributes.description;
    if (descriptionValue !== undefined && typeof descriptionValue !== 'string') {
      throw new DevError(`description in front matter for ${pathLabel(relativePath)} must be a string.`);
    }
    const title =
      typeof titleValue === 'string'
        ? titleValue.trim()
        : headingFromMarkdown(body) || plainTitle(path.basename(filePath, path.extname(filePath)));
    const visibleBody = body
      .split(/\r?\n/)
      .filter((line) => !/^\s*(?:import|export)\s/.test(line))
      .join('\n')
      .replace(/<!--[^]*?-->/g, '')
      .trim();
    if (!visibleBody) {
      throw new DevError(`content file ${pathLabel(relativePath)} does not contain renderable content.`);
    }

    return {
      filePath,
      relativePath,
      route: documentRoute(relativePath, attributes),
      title,
      attributes,
      body,
    };
  });

  documents.sort((left, right) => left.route.localeCompare(right.route));
  return documents;
}

function safeHref(value) {
  const href = String(value).trim();
  if (/^(?:https?:|mailto:|\/|#)/i.test(href)) {
    return escapeHtml(href);
  }
  return '#';
}

function inlineMarkdown(value) {
  const tokens = [];
  const token = (html) => {
    const marker = `\u0000${tokens.length}\u0000`;
    tokens.push(html);
    return marker;
  };

  let text = escapeHtml(value);
  text = text.replace(/!\[([^\]]*)\]\((\S+?)(?:\s+["'].*?["'])?\)/g, (_match, alt, source) =>
    token(`<img src="${safeHref(source)}" alt="${escapeHtml(alt)}">`),
  );
  text = text.replace(/\[([^\]]+)\]\((\S+?)(?:\s+["'].*?["'])?\)/g, (_match, label, href) =>
    token(`<a href="${safeHref(href)}">${label}</a>`),
  );
  text = text.replace(/`([^`]+)`/g, (_match, code) => token(`<code>${code}</code>`));
  text = text.replace(/\*\*(.+?)\*\*|__(.+?)__/g, (_match, strongA, strongB) =>
    token(`<strong>${strongA || strongB}</strong>`),
  );
  text = text.replace(/~~(.+?)~~/g, (_match, content) => token(`<del>${content}</del>`));
  text = text.replace(/(?<!\w)\*([^*\n]+)\*(?!\w)|(?<!\w)_([^_\n]+)_(?!\w)/g, (_match, emA, emB) =>
    token(`<em>${emA || emB}</em>`),
  );
  text = text.replace(/ {2,}$/g, '<br>');

  return text.replace(/\u0000(\d+)\u0000/g, (_match, index) => tokens[Number(index)]);
}

function renderMarkdown(body) {
  const lines = body.replace(/\r/g, '').split('\n');
  const output = [];
  let paragraph = [];
  let index = 0;

  const flushParagraph = () => {
    if (paragraph.length === 0) {
      return;
    }
    output.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed === '') {
      flushParagraph();
      index += 1;
      continue;
    }

    const fence = line.match(/^\s*(`{3,}|~{3,})\s*([^ ]*)\s*$/);
    if (fence) {
      flushParagraph();
      const fenceMarker = fence[1][0];
      const codeLines = [];
      index += 1;
      while (index < lines.length && !new RegExp(`^\\s*${fenceMarker}{${fence[1].length},}\\s*$`).test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }
      const language = fence[2] ? ` class="language-${escapeHtml(fence[2])}"` : '';
      output.push(`<pre><code${language}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      flushParagraph();
      const level = heading[1].length;
      output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^\s{0,3}(?:\*\s*){3,}$/.test(line) || /^\s{0,3}(?:-\s*){3,}$/.test(line)) {
      flushParagraph();
      output.push('<hr>');
      index += 1;
      continue;
    }

    const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      const items = [];
      while (index < lines.length) {
        const item = lines[index].match(/^\s*[-*+]\s+(.+)$/);
        if (!item) {
          break;
        }
        items.push(`<li>${inlineMarkdown(item[1])}</li>`);
        index += 1;
      }
      output.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      const items = [];
      while (index < lines.length) {
        const item = lines[index].match(/^\s*\d+[.)]\s+(.+)$/);
        if (!item) {
          break;
        }
        items.push(`<li>${inlineMarkdown(item[1])}</li>`);
        index += 1;
      }
      output.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    if (/^\s*>/.test(line)) {
      flushParagraph();
      const quoteLines = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^\s*>\s?/, ''));
        index += 1;
      }
      output.push(`<blockquote>${renderMarkdown(quoteLines.join('\n'))}</blockquote>`);
      continue;
    }

    // Imports, exports, and JSX expressions are part of MDX but cannot be
    // executed by the dependency-free preview. Omitting them keeps the page
    // readable while the Markdown around them remains visible.
    if (/^\s*(?:import|export)\s/.test(line) || /^\s*\{\/\*/.test(line)) {
      flushParagraph();
      index += 1;
      continue;
    }

    paragraph.push(trimmed);
    index += 1;
  }
  flushParagraph();
  return output.join('\n');
}

function encodeRoute(route) {
  return encodeURI(route).replaceAll('"', '%22');
}

function canonicalRoute(route) {
  if (route === '/') {
    return '/';
  }
  return route.replace(/\/+$/, '');
}

function normalizeRequestPath(requestPath) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(requestPath);
  } catch {
    return null;
  }
  if (decodedPath.includes('\0') || decodedPath.includes('\\')) {
    return null;
  }
  const segments = decodedPath.split('/');
  if (segments.some((segment) => segment === '..')) {
    return null;
  }
  const normalized = `/${segments.filter(Boolean).join('/')}`;
  return normalized === '/' ? '/' : normalized.replace(/\/+$/, '');
}

function findDocument(documents, requestPath) {
  const normalizedPath = normalizeRequestPath(requestPath);
  if (normalizedPath === null) {
    return null;
  }
  return documents.find((document) => canonicalRoute(document.route) === normalizedPath) || null;
}

function renderPage(project, documents, document) {
  const title = document && document.title !== project.title
    ? `${document.title} | ${project.title}`
    : project.title;
  const article = document ? renderMarkdown(document.body) : '';
  const articleBody = article.includes('<h1>')
    ? article
    : `<h1>${escapeHtml(document ? document.title : project.title)}</h1>${article}`;
  const navigation = documents.map((item) => ({
    current: document !== null && document !== undefined && item.filePath === document.filePath,
    href: encodeRoute(item.route),
    label: item.title,
  }));
  const description = document && document.attributes.description !== undefined
    ? document.attributes.description.trim()
    : project.description;

  return renderThemePage({
    body: articleBody,
    description,
    homeHref: '/',
    lang: project.lang,
    navigation,
    pageTitle: title,
    siteTitle: project.title,
  });
}

function renderErrorPage(message) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>novon dev error</title></head><body><main><h1>novon dev could not render this page</h1><p class="error">${escapeHtml(message)}</p></main></body></html>`;
}

function sendResponse(response, statusCode, body, contentType = 'text/html; charset=utf-8', method = 'GET') {
  const bodyBuffer = Buffer.from(body, 'utf8');
  response.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    'Content-Length': bodyBuffer.length,
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
  });
  if (method !== 'HEAD') {
    response.end(bodyBuffer);
    return;
  }
  response.end();
}

function requestPath(requestUrl) {
  try {
    return new URL(requestUrl || '/', 'http://novon.local').pathname;
  } catch {
    return null;
  }
}

function handleRequest(request, response, options) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }

  const pathname = requestPath(request.url);
  if (pathname === null) {
    sendResponse(response, 400, renderErrorPage('the request URL is invalid.'));
    return;
  }

  if (pathname === '/__novon/health') {
    try {
      const project = loadProject(options);
      const documents = readProjectDocuments(project);
      sendResponse(
        response,
        200,
        JSON.stringify({ status: 'ok', pages: documents.length }),
        'application/json; charset=utf-8',
        request.method,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendResponse(response, 500, JSON.stringify({ status: 'error', error: message }), 'application/json; charset=utf-8', request.method);
    }
    return;
  }

  let project;
  let documents;
  try {
    project = loadProject(options);
    documents = readProjectDocuments(project);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendResponse(response, 500, renderErrorPage(message), 'text/html; charset=utf-8', request.method);
    return;
  }

  const document = findDocument(documents, pathname);
  if (document === null) {
    sendResponse(response, 404, renderErrorPage(`page ${pathnameLabel(pathname)} was not found.`), 'text/html; charset=utf-8', request.method);
    return;
  }

  sendResponse(response, 200, renderPage(project, documents, document), 'text/html; charset=utf-8', request.method);
}

function pathnameLabel(value) {
  return JSON.stringify(value);
}

function listenErrorMessage(error, host, port) {
  const address = `${host}:${port}`;
  if (error && error.code === 'EADDRINUSE') {
    return `cannot start the dev server on ${address}: the address is already in use. Stop the other process or retry with --port <another-port>.`;
  }
  if (error && (error.code === 'EACCES' || error.code === 'EPERM')) {
    return `cannot start the dev server on ${address}: permission was denied. Choose an unprivileged port such as 3000 with --port 3000.`;
  }
  if (error && (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN')) {
    return `cannot start the dev server: host ${JSON.stringify(host)} could not be resolved. Try --host ${DEFAULT_HOST}.`;
  }
  return `cannot start the dev server on ${address}: ${error && error.message ? error.message : 'unknown network error'}.`;
}

function displayHost(host) {
  if (host === '0.0.0.0' || host === '::') {
    return 'localhost';
  }
  if (host.includes(':') && !host.startsWith('[')) {
    return `[${host}]`;
  }
  return host;
}

function serverUrl(host, port) {
  return `http://${displayHost(host)}:${port}`;
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (!error || error.code === 'ERR_SERVER_NOT_RUNNING') {
        resolve();
        return;
      }
      reject(error);
    });
  });
}

function startDevServer(options = {}) {
  if (!isObject(options)) {
    return Promise.reject(new DevError('dev server options must be an object.'));
  }

  let rootPath;
  try {
    rootPath = resolveProjectRoot(options.rootDir || process.cwd());
  } catch (error) {
    return Promise.reject(error);
  }

  const projectOptions = {
    rootDir: rootPath,
    configPath: options.configPath ?? null,
  };
  let project;
  let host;
  let port;
  try {
    project = loadProject(projectOptions);
    host = options.host === null || options.host === undefined ? project.host || DEFAULT_HOST : parseHost(options.host);
    port = options.port === null || options.port === undefined ? project.port ?? DEFAULT_PORT : parsePort(options.port, 'port');
    // Read every page once before opening the port. A malformed project should
    // fail as a command error instead of producing a server that only fails on
    // its first request.
    readProjectDocuments(project);
  } catch (error) {
    return Promise.reject(error);
  }

  const server = http.createServer((request, response) => handleRequest(request, response, projectOptions));
  return new Promise((resolve, reject) => {
    let settled = false;
    const onError = (error) => {
      if (settled) {
        return;
      }
      settled = true;
      reject(new DevError(listenErrorMessage(error, host, port), { cause: error }));
    };
    const onListening = () => {
      settled = true;
      server.off('error', onError);
      const address = server.address();
      const actualPort = address && typeof address === 'object' ? address.port : port;
      const actualHost = address && typeof address === 'object' && address.address ? address.address : host;
      resolve({
        address,
        project,
        server,
        url: serverUrl(actualHost, actualPort),
        close: () => closeServer(server),
      });
    };

    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, host);
  });
}

function runDev(args = [], io = console) {
  const options = parseDevOptions(args);
  return startDevServer(options).then((instance) => {
    const log = typeof io.log === 'function' ? io.log.bind(io) : console.log;
    log(`novon dev preview available at ${instance.url}`);
    log('Press Ctrl+C to stop.');

    return new Promise((resolve, reject) => {
      let stopping = false;
      const onSignal = () => {
        if (stopping) {
          return;
        }
        stopping = true;
        cleanup();
        instance.close().then(() => resolve(0), reject);
      };
      const onError = (error) => {
        if (stopping) {
          return;
        }
        stopping = true;
        cleanup();
        instance.close().finally(() => reject(new DevError(listenErrorMessage(error, options.host || DEFAULT_HOST, options.port ?? DEFAULT_PORT), { cause: error })));
      };
      const cleanup = () => {
        process.off('SIGINT', onSignal);
        process.off('SIGTERM', onSignal);
        instance.server.off('error', onError);
      };

      process.once('SIGINT', onSignal);
      process.once('SIGTERM', onSignal);
      instance.server.once('error', onError);
    });
  });
}

function devHelpText() {
  return [
    'Usage: novon dev',
    '',
    'start a local preview server for the current novon project',
    '',
    'Options:',
    '  -p, --port <port>     listen on a port (default: 3000)',
    '      --host <host>     bind to a host (default: 127.0.0.1)',
    '      --config <file>   use a specific novon config file',
    '      --root <directory> preview a different project directory',
    '  -h, --help             show help information',
    '',
    'The preview reads Markdown/MDX files for every request, so save a file and',
    'refresh the page to see content changes without reinitializing the project.',
  ].join('\n');
}

module.exports = {
  CONFIG_FILENAMES,
  CONTENT_DIRECTORY,
  DEFAULT_HOST,
  DEFAULT_PORT,
  DevError,
  collectContentFiles,
  devHelpText,
  documentRoute,
  findDocument,
  loadProject,
  parseDevOptions,
  parseFrontmatter,
  renderMarkdown,
  renderPage,
  runDev,
  serverUrl,
  startDevServer,
};
