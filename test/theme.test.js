const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { buildProject } = require('../src/build');
const { startDevServer } = require('../src/dev');

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

function extractStyle(html) {
  const match = html.match(/<style>([\s\S]*?)<\/style>/);
  assert.ok(match, 'the page should include the default theme stylesheet');
  return match[1];
}

test('dev preview and static build share one reading theme and page shell', async () => {
  const rootPath = fs.mkdtempSync(path.join(os.tmpdir(), 'novon-theme-'));
  let instance;

  try {
    fs.mkdirSync(path.join(rootPath, 'content'));
    fs.writeFileSync(
      path.join(rootPath, 'novon.config.json'),
      `${JSON.stringify({
        description: 'A quiet place for notes.',
        contentDir: 'content',
        lang: 'en',
        outputDir: 'dist',
        title: 'Notes',
      }, null, 2)}\n`,
    );
    fs.writeFileSync(
      path.join(rootPath, 'content', 'index.mdx'),
      '# Home\n\nA calm page with `inline code`.\n',
    );
    fs.writeFileSync(
      path.join(rootPath, 'content', 'guide.mdx'),
      '# Guide\n\nA second page.\n',
    );

    instance = await startDevServer({ rootDir: rootPath, port: 0 });
    const preview = await request(instance.url);
    assert.equal(preview.statusCode, 200);

    buildProject({ rootDir: rootPath });
    const built = fs.readFileSync(path.join(rootPath, 'dist', 'index.html'), 'utf8');

    assert.equal(extractStyle(preview.body), extractStyle(built));
    for (const className of [
      'novon-site',
      'novon-header',
      'novon-header-inner',
      'novon-brand',
      'novon-nav',
      'novon-nav-list',
      'novon-main',
      'novon-article',
      'novon-footer',
    ]) {
      assert.match(preview.body, new RegExp(`class="${className}"`));
      assert.match(built, new RegExp(`class="${className}"`));
    }

    const style = extractStyle(preview.body);
    assert.match(style, /color-scheme:\s*light dark/);
    assert.match(style, /prefers-color-scheme:\s*dark/);
    assert.match(style, /max-width:\s*44rem/);
    assert.match(style, /overflow-x:\s*auto/);
    assert.doesNotMatch(style, /grid-template-columns/);
    assert.doesNotMatch(preview.body, /class="layout"/);
    assert.match(preview.body, /novon · ฅ\^•ﻌ•\^ฅ/);
    assert.match(built, /novon · ฅ\^•ﻌ•\^ฅ/);
  } finally {
    if (instance) {
      await instance.close();
    }
    fs.rmSync(rootPath, { recursive: true, force: true });
  }
});
