'use strict';

const fs = require('node:fs');
const path = require('node:path');

const CONFIG_FILE_NAMES = Object.freeze(['novon.config.json', 'novon.json']);
const CONTENT_EXTENSIONS = Object.freeze(new Set(['.md', '.mdx']));
const IGNORED_DIRECTORY_NAMES = Object.freeze(new Set(['.git', 'node_modules']));

class BuildError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = 'BuildError';
  }
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isPathInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function isPathSameOrInside(parent, candidate) {
  return parent === candidate || isPathInside(parent, candidate);
}

function describePath(filePath) {
  return path.relative(process.cwd(), filePath) || filePath;
}

function readProjectConfig(rootDir) {
  let configPath;

  for (const fileName of CONFIG_FILE_NAMES) {
    const candidate = path.join(rootDir, fileName);
    if (fs.existsSync(candidate)) {
      configPath = candidate;
      break;
    }
  }

  if (!configPath) {
    throw new BuildError(
      `cannot find ${CONFIG_FILE_NAMES[0]} in ${describePath(rootDir)}; run "novon init" first`,
    );
  }

  let source;
  try {
    source = fs.readFileSync(configPath, 'utf8');
  } catch (error) {
    throw new BuildError(`cannot read ${describePath(configPath)}: ${error.message}`, { cause: error });
  }

  let config;
  try {
    config = JSON.parse(source);
  } catch (error) {
    throw new BuildError(`invalid JSON in ${describePath(configPath)}: ${error.message}`, { cause: error });
  }

  if (!isRecord(config)) {
    throw new BuildError(`${describePath(configPath)} must contain a JSON object`);
  }

  return { config, configPath };
}

function getSection(config, key, configPath) {
  if (!Object.prototype.hasOwnProperty.call(config, key)) {
    return {};
  }

  // A string is a convenient shorthand for the content/output path. It is
  // handled as a top-level value rather than as a nested section.
  if ((key === 'content' || key === 'build' || key === 'output') && typeof config[key] === 'string') {
    return {};
  }

  if (!isRecord(config[key])) {
    throw new BuildError(`${describePath(configPath)}.${key} must be an object`);
  }

  return config[key];
}

function firstConfiguredValue(configPath, candidates, label) {
  for (const candidate of candidates) {
    if (candidate === undefined) {
      continue;
    }

    if (typeof candidate !== 'string' || candidate.trim() === '') {
      throw new BuildError(`${describePath(configPath)} ${label} must be a non-empty string`);
    }

    return candidate.trim();
  }

  return undefined;
}

function getConfiguredString(config, sections, keys, configPath, label) {
  const candidates = [];

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(config, key)) {
      candidates.push(config[key]);
    }
  }

  for (const section of sections) {
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(section, key)) {
        candidates.push(section[key]);
      }
    }
  }

  return firstConfiguredValue(configPath, candidates, label);
}

function getConfiguredPath(config, sections, directKeys, sectionKeys, configPath, label) {
  const candidates = [];

  for (const key of directKeys) {
    if (Object.prototype.hasOwnProperty.call(config, key)) {
      // `content`, `build`, and `output` are also supported as nested
      // objects. Their object values are validated by getSection and resolved
      // below.
      if (isRecord(config[key]) && (key === 'content' || key === 'build' || key === 'output')) {
        continue;
      }
      candidates.push(config[key]);
    }
  }

  for (const section of sections) {
    for (const key of sectionKeys) {
      if (Object.prototype.hasOwnProperty.call(section, key)) {
        candidates.push(section[key]);
      }
    }
  }

  return firstConfiguredValue(configPath, candidates, label);
}

function resolveProject(rootDir, configData, outputOverride) {
  const { config, configPath } = configData;
  const site = getSection(config, 'site', configPath);
  const content = getSection(config, 'content', configPath);
  const build = getSection(config, 'build', configPath);
  const output = getSection(config, 'output', configPath);

  const title = getConfiguredString(
    config,
    [site],
    ['title', 'name'],
    configPath,
    'site title',
  ) || path.basename(rootDir) || 'novon site';

  const description = getConfiguredString(
    config,
    [site],
    ['description'],
    configPath,
    'site description',
  ) || '';

  const lang = getConfiguredString(
    config,
    [site],
    ['lang', 'language'],
    configPath,
    'site language',
  ) || 'en';

  if (!/^[A-Za-z0-9-]+$/.test(lang)) {
    throw new BuildError(`${describePath(configPath)} site language must contain only letters, numbers, and hyphens`);
  }

  const configuredContentDir = getConfiguredPath(
    config,
    [content],
    ['contentDir', 'contentDirectory', 'sourceDir', 'source', 'content'],
    ['dir', 'directory', 'root', 'path'],
    configPath,
    'content directory',
  );

  const configuredEntry = getConfiguredString(
    config,
    [content],
    ['entry', 'file', 'contentFile'],
    configPath,
    'content entry',
  );

  let contentPath;
  if (configuredEntry) {
    const contentBase = configuredContentDir || '.';
    contentPath = path.resolve(rootDir, contentBase, configuredEntry);
  } else if (configuredContentDir) {
    contentPath = path.resolve(rootDir, configuredContentDir);
  } else {
    contentPath = findDefaultContentPath(rootDir);
  }

  const outputDirValue = outputOverride || getConfiguredPath(
    config,
    [build, output],
    ['outputDir', 'outDir', 'output', 'distDir', 'buildDir', 'destinationDir', 'build'],
    ['outputDir', 'outDir', 'dir', 'directory', 'output', 'path'],
    configPath,
    'output directory',
  ) || 'dist';
  const outputPath = path.resolve(rootDir, outputDirValue);

  if (!isPathSameOrInside(rootDir, contentPath)) {
    throw new BuildError(
      `content source ${describePath(contentPath)} must stay inside the project directory`,
    );
  }

  if (!isPathSameOrInside(rootDir, outputPath)) {
    throw new BuildError(
      `output directory ${describePath(outputPath)} must stay inside the project directory`,
    );
  }

  if (outputPath === rootDir) {
    throw new BuildError('output directory cannot be the project root; choose a subdirectory such as "dist"');
  }

  if (isPathSameOrInside(outputPath, contentPath)) {
    throw new BuildError(
      `output directory ${describePath(outputPath)} cannot contain the content source ${describePath(contentPath)}`,
    );
  }

  return {
    rootDir,
    configPath,
    config,
    title,
    description,
    lang,
    contentPath,
    outputPath,
    publicPath: resolveOptionalDirectory(config, [build, site], ['publicDir', 'staticDir', 'assetsDir'], rootDir, configPath),
  };
}

function resolveOptionalDirectory(config, sections, keys, rootDir, configPath) {
  const value = getConfiguredPath(config, sections, keys, keys, configPath, 'static asset directory');
  if (!value) {
    return null;
  }

  return path.resolve(rootDir, value);
}

function findDefaultContentPath(rootDir) {
  for (const directoryName of ['content', 'docs', 'pages']) {
    const candidate = path.join(rootDir, directoryName);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  for (const fileName of ['index.mdx', 'index.md']) {
    const candidate = path.join(rootDir, fileName);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return path.join(rootDir, 'content');
}

function assertReadableContent(contentPath) {
  let stats;
  try {
    stats = fs.statSync(contentPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new BuildError(
        `content source ${describePath(contentPath)} does not exist; check contentDir in novon.config.json`,
      );
    }
    throw new BuildError(`cannot inspect content source ${describePath(contentPath)}: ${error.message}`, { cause: error });
  }

  if (!stats.isDirectory() && !stats.isFile()) {
    throw new BuildError(`content source ${describePath(contentPath)} must be a directory or an MDX file`);
  }
}

function hasContentExtension(filePath) {
  return CONTENT_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function collectContentFiles(contentPath, outputPath) {
  assertReadableContent(contentPath);
  const stats = fs.statSync(contentPath);

  if (stats.isFile()) {
    if (!hasContentExtension(contentPath)) {
      throw new BuildError(`content entry ${describePath(contentPath)} must use the .mdx or .md extension`);
    }
    return [{ absolutePath: contentPath, relativePath: path.basename(contentPath) }];
  }

  const files = [];

  function visit(directory, relativeDirectory) {
    let entries;
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch (error) {
      throw new BuildError(`cannot read content directory ${describePath(directory)}: ${error.message}`, { cause: error });
    }

    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      if (entry.name.startsWith('.') || IGNORED_DIRECTORY_NAMES.has(entry.name)) {
        continue;
      }

      const absolutePath = path.join(directory, entry.name);
      const relativePath = path.join(relativeDirectory, entry.name);

      if (absolutePath === outputPath) {
        continue;
      }

      if (entry.isDirectory()) {
        visit(absolutePath, relativePath);
      } else if (entry.isFile() && hasContentExtension(entry.name)) {
        files.push({ absolutePath, relativePath });
      }
    }
  }

  visit(contentPath, '');

  if (files.length === 0) {
    throw new BuildError(
      `no .mdx or .md content was found in ${describePath(contentPath)}; add a page before running novon build`,
    );
  }

  return files;
}

function parseScalar(value) {
  const trimmed = value.trim();

  if (trimmed === '') {
    return '';
  }

  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    if (trimmed.startsWith('"')) {
      try {
        return JSON.parse(trimmed);
      } catch {
        throw new BuildError(`invalid quoted value in front matter: ${trimmed}`);
      }
    }
    return trimmed.slice(1, -1).replace(/''/g, "'");
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
  if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(trimmed)) {
    return Number(trimmed);
  }

  return trimmed;
}

function parseFrontMatter(source, filePath) {
  const normalizedSource = source.replace(/^\uFEFF/, '');
  if (!normalizedSource.startsWith('---\n') && !normalizedSource.startsWith('---\r\n')) {
    return { attributes: {}, body: normalizedSource };
  }

  const lines = normalizedSource.split(/\r?\n/);
  const attributes = {};
  let closingIndex = -1;

  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].trim() === '---' || lines[index].trim() === '...') {
      closingIndex = index;
      break;
    }
  }

  if (closingIndex === -1) {
    throw new BuildError(`front matter in ${describePath(filePath)} is not closed with ---`);
  }

  for (let index = 1; index < closingIndex; index += 1) {
    const line = lines[index];
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }

    const match = line.match(/^\s*([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)\s*$/);
    if (!match) {
      throw new BuildError(`invalid front matter line ${index + 1} in ${describePath(filePath)}`);
    }

    attributes[match[1]] = parseScalar(match[2]);
  }

  return {
    attributes,
    body: lines.slice(closingIndex + 1).join('\n'),
  };
}

function stripMdxStatements(source) {
  return source
    .split(/\r?\n/)
    .filter((line) => !/^\s*(?:import|export)\b/.test(line))
    .join('\n');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeUrl(value) {
  const url = value.trim();
  if (/^(?:javascript|data|vbscript):/i.test(url)) {
    return '#';
  }
  return url;
}

function renderInline(value) {
  const tokens = [];
  const token = (html) => {
    const marker = `\u0000${tokens.length}\u0000`;
    tokens.push(html);
    return marker;
  };

  let text = value;

  text = text.replace(/!\[([^\]]*)\]\((\S+?)(?:\s+["']([^"']*)["'])?\)/g, (_match, alt, url, caption) => {
    const title = caption ? ` title="${escapeHtml(caption)}"` : '';
    return token(`<img src="${escapeHtml(safeUrl(url))}" alt="${escapeHtml(alt)}"${title}>`);
  });

  text = text.replace(/\[([^\]]+)\]\((\S+?)(?:\s+["']([^"']*)["'])?\)/g, (_match, label, url, caption) => {
    const title = caption ? ` title="${escapeHtml(caption)}"` : '';
    return token(`<a href="${escapeHtml(safeUrl(url))}"${title}>${renderInline(label)}</a>`);
  });

  text = text.replace(/`([^`\n]+)`/g, (_match, code) => token(`<code>${escapeHtml(code)}</code>`));
  text = escapeHtml(text);

  text = text.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');
  text = text.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');
  text = text.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  text = text.replace(/_([^_\n]+)_/g, '<em>$1</em>');
  text = text.replace(/ {2}\n/g, '<br>\n');

  return text.replace(/\u0000(\d+)\u0000/g, (_match, index) => tokens[Number(index)]);
}

function isBlockStart(line) {
  return /^(?:\s{0,3}#{1,6}\s+|\s{0,3}(?:[-+*]\s+|\d+[.)]\s+|>\s?)|\s{0,3}```|\s{0,3}~~~|\s{0,3}(?:---|___|\*\*\*)\s*$)/.test(line);
}

function renderMarkdown(source, filePath) {
  const lines = source.split(/\r?\n/);
  const output = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const fence = line.match(/^\s{0,3}(```+|~~~+)(.*)$/);
    if (fence) {
      const marker = fence[1][0];
      const language = fence[2].trim().split(/\s+/)[0];
      const codeLines = [];
      let closed = false;
      index += 1;

      while (index < lines.length) {
        if (new RegExp(`^\\s{0,3}${marker}{3,}\\s*$`).test(lines[index])) {
          closed = true;
          index += 1;
          break;
        }
        codeLines.push(lines[index]);
        index += 1;
      }

      if (!closed) {
        throw new BuildError(`code fence in ${describePath(filePath)} is not closed`);
      }

      const className = language ? ` class="language-${escapeHtml(language)}"` : '';
      output.push(`<pre><code${className}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      const level = heading[1].length;
      output.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^\s{0,3}(?:---|___|\*\*\*)\s*$/.test(line)) {
      output.push('<hr>');
      index += 1;
      continue;
    }

    if (/^\s{0,3}[-+*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length) {
        const item = lines[index].match(/^\s{0,3}[-+*]\s+(.+)$/);
        if (!item) {
          break;
        }
        items.push(`<li>${renderInline(item[1])}</li>`);
        index += 1;
      }
      output.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    if (/^\s{0,3}\d+[.)]\s+/.test(line)) {
      const items = [];
      while (index < lines.length) {
        const item = lines[index].match(/^\s{0,3}\d+[.)]\s+(.+)$/);
        if (!item) {
          break;
        }
        items.push(`<li>${renderInline(item[1])}</li>`);
        index += 1;
      }
      output.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    if (/^\s{0,3}>/.test(line)) {
      const quoteLines = [];
      while (index < lines.length && /^\s{0,3}>/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^\s{0,3}>\s?/, ''));
        index += 1;
      }
      output.push(`<blockquote>${renderMarkdown(quoteLines.join('\n'), filePath)}</blockquote>`);
      continue;
    }

    if (/^\s*</.test(line) && />\s*$/.test(line)) {
      const rawLines = [];
      while (index < lines.length && lines[index].trim()) {
        rawLines.push(lines[index]);
        index += 1;
      }
      output.push(rawLines.join('\n'));
      continue;
    }

    const paragraphLines = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    output.push(`<p>${renderInline(paragraphLines.join('\n'))}</p>`);
  }

  return output.join('\n');
}

function pageTitle(attributes, siteTitle, relativePath) {
  if (attributes.title !== undefined) {
    if (typeof attributes.title !== 'string' || !attributes.title.trim()) {
      throw new BuildError(`title in front matter for ${relativePath} must be a non-empty string`);
    }
    return attributes.title.trim();
  }

  return relativePath === 'index.mdx' || relativePath === 'index.md'
    ? siteTitle
    : path.basename(relativePath, path.extname(relativePath));
}

function routeFromPage(relativePath, attributes) {
  let route = relativePath.replace(/\\/g, '/').replace(/\.(?:md|mdx)$/i, '.html');

  const configuredRoute = attributes.slug !== undefined ? attributes.slug : attributes.permalink;
  if (configuredRoute !== undefined) {
    if (typeof configuredRoute !== 'string' || !configuredRoute.trim()) {
      throw new BuildError(`slug/permalink for ${relativePath} must be a non-empty string`);
    }

    route = configuredRoute.trim().replace(/^\/+/, '');
    route = route.replace(/\/$/, '');
    if (!route) {
      route = 'index';
    }
    if (!path.posix.extname(route)) {
      route = `${route}.html`;
    }
  }

  const normalized = path.posix.normalize(route);
  if (normalized === '.' || normalized === '..' || normalized.startsWith('../') || normalized.includes('/../') || path.posix.isAbsolute(normalized)) {
    throw new BuildError(`page route ${route} for ${relativePath} must stay inside the output directory`);
  }

  return normalized;
}

function renderPage(source, filePath, project, relativePath, route) {
  const parsed = parseFrontMatter(source, filePath);
  const body = renderMarkdown(stripMdxStatements(parsed.body), filePath);
  const visibleBody = body.replace(/<!--[^]*?-->/g, '').trim();

  if (!visibleBody) {
    throw new BuildError(`${describePath(filePath)} does not contain renderable content`);
  }

  const title = pageTitle(parsed.attributes, project.title, relativePath);
  const description = parsed.attributes.description === undefined
    ? project.description
    : parsed.attributes.description;

  if (typeof description !== 'string') {
    throw new BuildError(`description in front matter for ${relativePath} must be a string`);
  }

  const titleText = title === project.title ? title : `${title} | ${project.title}`;
  const indexHref = path.posix.relative(path.posix.dirname(route), 'index.html') || 'index.html';
  const descriptionTag = description.trim()
    ? `\n    <meta name="description" content="${escapeHtml(description.trim())}">`
    : '';

  return `<!doctype html>
<html lang="${escapeHtml(project.lang)}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(titleText)}</title>${descriptionTag}
    <style>
      :root { color-scheme: light dark; font-family: system-ui, sans-serif; line-height: 1.6; }
      body { margin: 0; background: Canvas; color: CanvasText; }
      .novon-page { box-sizing: border-box; max-width: 52rem; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
      .novon-header { margin-bottom: 3rem; border-bottom: 1px solid color-mix(in srgb, CanvasText 20%, transparent); padding-bottom: 1rem; }
      .novon-header a { color: inherit; font-weight: 700; text-decoration: none; }
      article h1, article h2, article h3 { line-height: 1.25; }
      article img { max-width: 100%; height: auto; }
      pre { overflow-x: auto; padding: 1rem; border-radius: .5rem; background: color-mix(in srgb, CanvasText 10%, Canvas); }
      code { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
      :not(pre) > code { padding: .1rem .3rem; border-radius: .25rem; background: color-mix(in srgb, CanvasText 10%, Canvas); }
      .novon-footer { margin-top: 3rem; opacity: .7; font-size: .875rem; }
    </style>
  </head>
  <body>
    <div class="novon-page">
      <header class="novon-header"><a href="${escapeHtml(indexHref)}">${escapeHtml(project.title)}</a></header>
      <main><article>${body}</article></main>
      <footer class="novon-footer">novon ฅ^•ﻌ^•ฅ</footer>
    </div>
  </body>
</html>
`;
}

function copyDirectoryContents(sourceDir, destinationDir) {
  let stats;
  try {
    stats = fs.statSync(sourceDir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new BuildError(`static asset directory ${describePath(sourceDir)} does not exist`);
    }
    throw new BuildError(`cannot inspect static asset directory ${describePath(sourceDir)}: ${error.message}`, { cause: error });
  }

  if (!stats.isDirectory()) {
    throw new BuildError(`static asset path ${describePath(sourceDir)} must be a directory`);
  }

  fs.cpSync(sourceDir, destinationDir, {
    recursive: true,
    filter: (source) => source !== destinationDir,
  });
}

function writePage(stagingDir, route, html) {
  const destination = path.resolve(stagingDir, route);
  if (!(destination === stagingDir || isPathInside(stagingDir, destination))) {
    throw new BuildError(`page route ${route} must stay inside the output directory`);
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, html, 'utf8');
}

function replaceOutputDirectory(stagingDir, outputDir) {
  const outputParent = path.dirname(outputDir);
  fs.mkdirSync(outputParent, { recursive: true });

  const backupPath = `${outputDir}.novon-previous-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let movedExisting = false;

  try {
    if (fs.existsSync(outputDir)) {
      fs.renameSync(outputDir, backupPath);
      movedExisting = true;
    }

    fs.renameSync(stagingDir, outputDir);
  } catch (error) {
    try {
      if (fs.existsSync(outputDir) && movedExisting) {
        fs.rmSync(outputDir, { recursive: true, force: true });
      }
      if (movedExisting && fs.existsSync(backupPath)) {
        fs.renameSync(backupPath, outputDir);
      }
    } catch (rollbackError) {
      throw new BuildError(
        `could not install build output and rollback also failed: ${error.message}; ${rollbackError.message}`,
        { cause: error },
      );
    }
    throw new BuildError(`could not install build output at ${describePath(outputDir)}: ${error.message}`, { cause: error });
  }

  if (movedExisting) {
    try {
      fs.rmSync(backupPath, { recursive: true, force: true });
    } catch (error) {
      // The new output is complete. A failed cleanup should not turn a successful
      // build into a failure, but leave a useful diagnostic for the caller.
      return { cleanupWarning: error.message };
    }
  }

  return { cleanupWarning: null };
}

function buildProject(options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const configData = readProjectConfig(rootDir);
  const project = resolveProject(rootDir, configData, options.outputDir);
  const files = collectContentFiles(project.contentPath, project.outputPath);
  const pages = [];
  const routes = new Map();

  for (const file of files) {
    let source;
    try {
      source = fs.readFileSync(file.absolutePath, 'utf8');
    } catch (error) {
      throw new BuildError(`cannot read ${describePath(file.absolutePath)}: ${error.message}`, { cause: error });
    }

    const parsed = parseFrontMatter(source, file.absolutePath);
    const route = routeFromPage(file.relativePath, parsed.attributes);
    if (routes.has(route)) {
      throw new BuildError(
        `pages ${routes.get(route)} and ${file.relativePath} resolve to the same output ${route}`,
      );
    }
    routes.set(route, file.relativePath);
    pages.push({ file, route, source });
  }

  const outputParent = path.dirname(project.outputPath);
  fs.mkdirSync(outputParent, { recursive: true });
  let stagingDir;
  try {
    stagingDir = fs.mkdtempSync(path.join(outputParent, `.${path.basename(project.outputPath)}.novon-build-`));

    if (project.publicPath) {
      copyDirectoryContents(project.publicPath, stagingDir);
    } else {
      const defaultPublicPath = path.join(project.rootDir, 'public');
      if (fs.existsSync(defaultPublicPath) && defaultPublicPath !== project.outputPath) {
        copyDirectoryContents(defaultPublicPath, stagingDir);
      }
    }

    for (const page of pages) {
      const html = renderPage(page.source, page.file.absolutePath, project, page.file.relativePath, page.route);
      writePage(stagingDir, page.route, html);
    }

    const replacement = replaceOutputDirectory(stagingDir, project.outputPath);
    stagingDir = null;

    return {
      outputDir: project.outputPath,
      pageCount: pages.length,
      assetDirectory: project.publicPath || (fs.existsSync(path.join(project.rootDir, 'public')) ? path.join(project.rootDir, 'public') : null),
      cleanupWarning: replacement.cleanupWarning,
    };
  } catch (error) {
    if (stagingDir) {
      fs.rmSync(stagingDir, { recursive: true, force: true });
    }
    if (error instanceof BuildError) {
      throw error;
    }
    throw new BuildError(`build failed: ${error.message}`, { cause: error });
  }
}

function parseBuildArgs(args, cwd = process.cwd()) {
  let projectDir = cwd;
  let outputDir;
  let positionalProject = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '-o' || argument === '--output' || argument === '--out-dir') {
      index += 1;
      if (!args[index] || args[index].startsWith('-')) {
        throw new BuildError(`${argument} requires a directory path`);
      }
      outputDir = args[index];
      continue;
    }

    const outputMatch = argument.match(/^(?:--output|--out-dir)=(.+)$/);
    if (outputMatch) {
      outputDir = outputMatch[1];
      continue;
    }

    if (argument === '--root' || argument === '--project') {
      index += 1;
      if (!args[index] || args[index].startsWith('-')) {
        throw new BuildError(`${argument} requires a project directory`);
      }
      if (positionalProject) {
        throw new BuildError('a project directory was provided more than once');
      }
      projectDir = args[index];
      continue;
    }

    const rootMatch = argument.match(/^(?:--root|--project)=(.+)$/);
    if (rootMatch) {
      if (positionalProject) {
        throw new BuildError('a project directory was provided more than once');
      }
      projectDir = rootMatch[1];
      continue;
    }

    if (argument.startsWith('-')) {
      throw new BuildError(`unknown build option ${argument}; run "novon build --help"`);
    }

    if (positionalProject) {
      throw new BuildError('build accepts only one project directory');
    }
    projectDir = argument;
    positionalProject = true;
  }

  return {
    rootDir: path.resolve(cwd, projectDir),
    outputDir: outputDir ? path.resolve(cwd, outputDir) : undefined,
  };
}

function buildHelpText() {
  return [
    'Usage: novon build',
    '',
    'Build the local novon project into a complete static site.',
    'Pass a project directory as the first argument when building outside the current directory.',
    'The project must contain novon.config.json and at least one .mdx page.',
    '',
    'Options:',
    '  -o, --output <directory>  override the configured output directory',
    '      --root <directory>    select the project directory',
    '  -h, --help                show help information',
  ].join('\n');
}

function runBuild(args = [], io = console) {
  let options;
  try {
    options = parseBuildArgs(args);
  } catch (error) {
    io.error(`novon build: ${error.message}`);
    return 1;
  }

  try {
    const result = buildProject(options);
    const output = describePath(result.outputDir);
    const pageLabel = result.pageCount === 1 ? 'page' : 'pages';
    io.log(`novon build: generated ${result.pageCount} ${pageLabel} in ${output}`);
    if (result.cleanupWarning) {
      io.error(`novon build: output cleanup warning: ${result.cleanupWarning}`);
    }
    return 0;
  } catch (error) {
    const message = error instanceof BuildError ? error.message : error.message;
    io.error(`novon build: ${message}`);
    return 1;
  }
}

module.exports = {
  BuildError,
  CONFIG_FILE_NAMES,
  buildHelpText,
  buildProject,
  escapeHtml,
  parseBuildArgs,
  parseFrontMatter,
  renderInline,
  renderMarkdown,
  runBuild,
};
