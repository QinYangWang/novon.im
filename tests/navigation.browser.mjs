/** Build docs first; install Chromium with `bunx playwright-core install chromium`. */
import { chromium } from 'playwright-core'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'

const root = resolve('docs/dist')
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.md': 'text/markdown' }
const server = createServer(async (request, response) => {
  try {
    let file = resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname))
    if (file !== root && !file.startsWith(root + sep)) throw new Error('outside root')
    if ((await stat(file)).isDirectory()) file += '/index.html'
    response.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream')
    response.end(await readFile(file))
  } catch { response.writeHead(404); response.end('Not found') }
})
await new Promise(done => server.listen(0, '127.0.0.1', done))
const origin = `http://127.0.0.1:${server.address().port}`
let browser
try {
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await context.newPage()
  const errors = []
  const failedResponses = []
  page.on('pageerror', error => errors.push(`${page.url()}: ${String(error)}`))
  page.on('response', response => { if (response.status() >= 400) failedResponses.push([response.status(), response.url()]) })
  const settle = () => page.waitForFunction(() => !document.documentElement.hasAttribute('data-navigating'))
  const link = (href) => page.locator(`#novon-sidebar a[href="${href}"]`)
  const click = async (href) => { await link(href).click(); await page.waitForURL(origin + href); await settle() }
  const sentinel = () => page.evaluate(() => window.__sentinel)
  // Metadata keeps the public URL; fetch through it by mapping back to the test server.
  const SITE_URL = 'https://qinyangwang.github.io/novon.im'
  const local = (url) => url.startsWith(SITE_URL) ? origin + url.slice(SITE_URL.length) : url
  const ogImage = async () => {
    const url = await page.locator('meta[property="og:image"]').getAttribute('content')
    const response = await page.request.get(local(url))
    return { url, status: response.status(), type: response.headers()['content-type'], bytes: (await response.body()).length }
  }

  await page.goto(origin + '/guide/architecture/')
  await page.getByRole('button', { name: 'Collapse sidebar', exact: true }).click()
  await page.evaluate(() => { window.__sentinel = 42; window.__sidebar = document.querySelector('#novon-sidebar') })
  assert(await page.getByRole('navigation', { name: 'On this page' }).isVisible())
  await page.evaluate(() => scrollTo({ top: 700, behavior: 'instant' }))
  const expand = page.getByRole('button', { name: 'Show sidebar', exact: true })
  assert((await expand.boundingBox()).y < 60, 'collapsed control stays in chrome while scrolling')
  await expand.click()
  await click('/components')
  assert.equal(await sentinel(), 42)
  assert(await page.evaluate(() => window.__sidebar === document.querySelector('#novon-sidebar')))
  assert.equal(await page.title(), 'Components · novon')
  assert.equal(await page.evaluate(() => scrollY), 0)
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://qinyangwang.github.io/novon.im/components')
  assert.equal(await page.locator('main').evaluate(el => el === document.activeElement), true)

  // Generated OG cards are real PNGs, differ per route, and follow client navigation.
  const componentsOg = await ogImage()
  assert(componentsOg.url.startsWith('https://qinyangwang.github.io/novon.im/_og/'), componentsOg.url)
  assert.equal(componentsOg.status, 200)
  assert.equal(componentsOg.type, 'image/png')
  assert(componentsOg.bytes > 5000, 'OG card is a rendered image')
  assert.equal(await page.locator('meta[property="og:image:width"]').getAttribute('content'), '1200')
  assert.equal(await page.locator('meta[property="og:image:height"]').getAttribute('content'), '630')
  assert.equal(await page.locator('meta[name="twitter:card"]').getAttribute('content'), 'summary_large_image')
  await click('/guide/architecture')
  assert.notEqual((await ogImage()).url, componentsOg.url, 'each route gets its own card')
  assert.equal(await page.locator('meta[property="og:type"]').getAttribute('content'), 'website')
  await click('/components')

  await click('/components/tabs')
  await page.getByRole('tab', { name: 'npm', exact: true }).click()
  await click('/components/accordion')
  await page.goBack(); await page.waitForURL('**/components/tabs'); await settle()
  assert.equal(await page.getByRole('tab', { name: 'bun', exact: true }).getAttribute('aria-selected'), 'true')
  await page.getByRole('button', { name: 'Copy Markdown', exact: true }).click()
  await page.getByRole('button', { name: 'Copied', exact: true }).waitFor()
  assert((await page.evaluate(() => navigator.clipboard.readText())).includes('title: Tabs'))
  await click('/components/card')
  // The label changes on click, but the button must not resize and shove the
  // neighbouring "Open" control around.
  const copyWidth = (await page.getByRole('button', { name: 'Copy Markdown', exact: true }).boundingBox()).width
  await page.getByRole('button', { name: 'Copy Markdown', exact: true }).click()
  const copiedButton = page.getByRole('button', { name: 'Copied', exact: true })
  await copiedButton.waitFor()
  assert(Math.abs((await copiedButton.boundingBox()).width - copyWidth) < 0.5, 'copy button keeps its width')
  assert((await page.evaluate(() => navigator.clipboard.readText())).includes('title: Cards'))
  await page.getByRole('button', { name: 'Copy Markdown', exact: true }).waitFor()

  await page.keyboard.press('Control+k')
  assert.equal(await page.getByRole('dialog').count(), 1, 'only the visible search trigger owns the shortcut')
  await page.getByRole('textbox', { name: 'Search documentation' }).fill('Architecture')
  await page.getByRole('textbox', { name: 'Search documentation' }).press('Enter')
  await page.waitForURL('**/guide/architecture'); await settle()
  await page.waitForTimeout(200)
  await page.evaluate(() => scrollTo({ top: 900, behavior: 'instant' }))
  await page.waitForTimeout(100)
  const y = await page.evaluate(() => scrollY)
  await click('/components/code')
  await page.goBack(); await page.waitForURL('**/guide/architecture'); await settle()
  assert(Math.abs(await page.evaluate(() => scrollY) - y) < 5, 'history restores scroll')
  await page.goForward(); await page.waitForURL('**/components/code'); await settle()

  const injectClick = (href, attributes = {}) => page.evaluate(({href, attributes}) => {
    const a = document.createElement('a'); a.href = href
    for (const [name, value] of Object.entries(attributes)) a.setAttribute(name, value)
    document.body.append(a); a.click(); a.remove()
  }, {href, attributes})
  await injectClick('/guide/components#cards')
  await page.waitForURL('**/guide/components#cards'); await settle()
  assert(Math.abs((await page.locator('h3#cards').boundingBox()).y - 80) < 10)
  assert.equal(await link('/guide/components').getAttribute('aria-current'), 'page')

  // Slow A must not overwrite a faster B, including the address bar and head.
  await page.route('**/assets/configuration-*.js', async route => { await new Promise(r => setTimeout(r, 600)); await route.continue() })
  await injectClick('/guide/configuration')
  await injectClick('/components/blog?from=test')
  await page.waitForURL('**/components/blog?from=test'); await settle()
  await page.waitForTimeout(800)
  assert.equal(await page.title(), 'Blog lists · novon')
  assert.equal(await sentinel(), 42)

  // The table of contents must visit every section, in order, as the page
  // scrolls. Near the bottom it used to jump straight to the last heading,
  // skipping the short closing sections in between.
  await injectClick('/guide/layouts')
  await page.waitForURL('**/guide/layouts'); await settle()
  await page.waitForTimeout(100)
  const activeToc = () => page.locator('[aria-current="location"]').first().getAttribute('data-toc-id')
  const sweep = await page.evaluate(async () => {
    const ids = [...document.querySelectorAll('nav[aria-label="On this page"] a[data-toc-id]')].map((a) => a.dataset.tocId)
    const max = document.documentElement.scrollHeight - innerHeight
    const seq = []
    for (let i = 0; i <= 200; i++) {
      window.scrollTo({ top: (max * i) / 200, behavior: 'instant' })
      await new Promise((done) => requestAnimationFrame(done))
      await new Promise((done) => requestAnimationFrame(done))
      const id = document.querySelector('[aria-current="location"]')?.dataset.tocId
      if (id && id !== seq[seq.length - 1]) seq.push(id)
    }
    return { ids, seq }
  })
  assert(sweep.ids.length > 3, 'the page has a table of contents')
  assert.deepEqual(sweep.seq, sweep.ids, `the outline visits every section in order: ${sweep.seq.join(' > ')}`)
  // A fast jump must not leave the previous section highlighted.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(120)
  assert.equal(await activeToc(), sweep.ids[0], 'a fast jump updates the highlight')
  // A heading that cannot reach the reading line (a short closing section) still
  // becomes active when its link is followed.
  await page.locator('nav[aria-label="On this page"] a[data-toc-id]').nth(sweep.ids.length - 2).click()
  await page.waitForTimeout(700)
  assert.equal(await activeToc(), sweep.ids[sweep.ids.length - 2], 'a followed link stays highlighted')

  await page.setViewportSize({ width: 320, height: 760 })
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page.getByRole('dialog', { name: 'Documentation navigation' }).locator('a[href="/components/callouts"]').click()
  await page.waitForURL('**/components/callouts'); await settle()
  await page.waitForTimeout(200)
  assert.equal(await page.getByRole('dialog').count(), 0)
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(await page.getByRole('button', { name: 'Copy Markdown', exact: true }).evaluate(el => getComputedStyle(el).transitionDuration), '0s')

  // Docs and blog are layers of one app: switching layouts keeps the document.
  await injectClick('/blog')
  await page.waitForURL('**/blog'); await settle()
  assert.equal(await sentinel(), 42)
  assert.equal(await page.locator('html').getAttribute('data-layout'), 'blog')
  assert.equal(await page.locator('#novon-sidebar').count(), 0)
  assert.equal(await page.locator('main').count(), 1)
  assert.equal(await page.locator('h1').textContent(), 'Blog')
  assert.equal(await page.locator('main a[href="/guide/architecture"]').count(), 0)
  await page.locator('main a[href="/blog/layout-layers"]').click()
  await page.waitForURL('**/blog/layout-layers'); await settle()
  assert.equal(await page.locator('h1').textContent(), 'One site, two layouts')
  assert.equal(await page.locator('main a').filter({ hasText: 'All posts' }).getAttribute('href'), '/blog')
  await injectClick('/blog/tags/layouts')
  await page.waitForURL('**/blog/tags/layouts'); await settle()
  assert.equal(await page.locator('h1').textContent(), 'Posts tagged “layouts”')
  assert.equal(await page.locator('a[href="/blog/tags/layouts"]').count(), 1)
  await injectClick('/guide/layouts')
  await page.waitForURL('**/guide/layouts'); await settle()
  assert.equal(await sentinel(), 42)
  assert.equal(await page.locator('html').getAttribute('data-layout'), 'docs')
  assert.equal(await page.locator('#novon-sidebar').count(), 1)
  assert.equal(await page.locator('#novon-sidebar a[href="/blog/layout-layers"]').count(), 0)
  await page.goBack(); await page.waitForURL('**/blog/tags/layouts'); await settle()
  assert.equal(await page.locator('html').getAttribute('data-layout'), 'blog')

  // Markdown tables keep the prose width instead of shrinking to their content,
  // and an embedded example iframe resolves inside the deployment base.
  await page.goto(origin + '/guide/deploying/')
  await settle()
  const table = await page.evaluate(() => {
    const prose = document.querySelector('.novon-prose')
    const table = prose?.querySelector('table')
    return { prose: prose.getBoundingClientRect().width, table: table?.getBoundingClientRect().width ?? 0 }
  })
  assert(Math.abs(table.table - table.prose) < 2, `table spans the prose width: ${JSON.stringify(table)}`)
  await page.goto(origin + '/examples/docs/')
  await settle()
  assert.equal(await page.locator('iframe').getAttribute('src'), '/examples/docs-template/')

  // Starter presets are still available as standalone scaffolding examples.
  await page.goto(origin + '/examples/blog-template/')
  await page.waitForTimeout(300)
  await page.evaluate(() => window.__sentinel = 43)
  await page.locator('a[href="/examples/blog-template/blog"]').first().click()
  await page.waitForURL('**/examples/blog-template/blog'); await settle()
  assert.equal(await sentinel(), 43)
  assert.equal(await page.locator('a[aria-current="page"]').first().getAttribute('href'), '/examples/blog-template/blog')
  await page.locator('a[href="/examples/blog-template/hello-world"]').first().click()
  await page.waitForURL('**/examples/blog-template/hello-world'); await settle()
  assert.equal(await sentinel(), 43)

  // The published example must ship working, correctly based assets.
  for (const path of ['/examples/docs-template/guide/writing/', '/examples/blog-template/hello-world/']) {
    const example = await context.newPage()
    const bad = []
    example.on('response', response => { if (response.status() >= 400) bad.push([response.status(), response.url()]) })
    await example.goto(origin + path, { waitUntil: 'networkidle' })
    assert.deepEqual(bad, [], `no failed requests under ${path}`)
    assert.notEqual(await example.locator('body').evaluate(el => getComputedStyle(el).fontFamily), '"Times New Roman"', 'stylesheet applied')
    const card = await example.locator('meta[property="og:image"]').getAttribute('content')
    assert(card.startsWith('https://qinyangwang.github.io/novon.im/examples/'), card)
    const cardResponse = await example.request.get(local(card))
    assert.equal(cardResponse.status(), 200)
    assert((cardResponse.headers()['content-type'] ?? '').startsWith('image/'), card)
    // The docs example has no image frontmatter, so it must get a generated card;
    // the blog post sets `image: /cover.svg` and keeps it.
    assert.equal(card.includes('/_og/'), path.includes('/docs-template/'), card)
    await example.close()
  }

  const noJS = await browser.newPage({ javaScriptEnabled: false })
  await noJS.goto(origin + '/components/callouts/')
  assert.equal(await noJS.locator('h1').textContent(), 'Callouts')
  await noJS.locator('#novon-sidebar a[href="/components/card"]').click()
  assert.equal(await noJS.locator('h1').textContent(), 'Cards')
  await noJS.goto(origin + '/blog/layout-layers/')
  assert.equal(await noJS.locator('h1').textContent(), 'One site, two layouts')
  assert.equal(await noJS.locator('html').getAttribute('data-layout'), 'blog')
  assert.equal(await noJS.locator('main').count(), 1)
  await noJS.locator('main a').filter({ hasText: 'All posts' }).click()
  assert.equal(await noJS.locator('h1').textContent(), 'Blog')

  // Opt-out links still cause a document load.
  await page.goto(origin + '/components')
  await page.evaluate(() => window.__sentinel = 44)
  await injectClick('/components/callouts', { 'data-no-router': '' })
  await page.waitForURL('**/components/callouts'); await page.waitForLoadState()
  assert.equal(await sentinel(), undefined)
  // load does not wait for top-level-await hydration of the entry module.
  await page.waitForFunction(() => Boolean(history.state?.novonKey))

  // No unexpected 404s anywhere up to this point.
  assert.deepEqual(failedResponses, [], `no failed responses: ${JSON.stringify(failedResponses)}`)

  // Missing deployment chunks recover via the generated HTML rather than a
  // blank article. Allow the retry made by the fresh document to succeed.
  let aborted = false
  await page.route('**/assets/media-*.js', async route => {
    if (!aborted) { aborted = true; await route.abort('failed') }
    else await route.continue()
  })
  await page.evaluate(() => window.__sentinel = 45)
  await injectClick('/components/media')
  await page.waitForURL('**/components/media'); await page.waitForLoadState()
  await page.getByRole('heading', { name: 'Media', exact: true }).waitFor()
  assert(aborted)
  assert.equal(await sentinel(), undefined)
  assert.deepEqual(errors, [])
  console.log('PASS: progressive docs/blog navigation, shell, state, metadata, OG cards, highlighted code, copy, search, history, hashes, races, mobile, reduced motion, no-JS and opt-out')
} finally {
  await browser?.close()
  server.close()
}
