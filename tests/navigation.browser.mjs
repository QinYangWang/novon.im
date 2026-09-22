/** Build docs first; install Chromium with `bunx playwright-core install chromium`. */
import { chromium } from 'playwright-core'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'

const root = resolve('docs/dist')
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.md': 'text/markdown' }
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
  page.on('pageerror', error => errors.push(String(error)))
  const settle = () => page.waitForFunction(() => !document.documentElement.hasAttribute('data-navigating'))
  const link = (href) => page.locator(`#novon-sidebar a[href="${href}"]`)
  const click = async (href) => { await link(href).click(); await page.waitForURL(origin + href); await settle() }
  const sentinel = () => page.evaluate(() => window.__sentinel)

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

  await click('/components/tabs')
  await page.getByRole('tab', { name: 'npm', exact: true }).click()
  await click('/components/accordion')
  await page.goBack(); await page.waitForURL('**/components/tabs'); await settle()
  assert.equal(await page.getByRole('tab', { name: 'bun', exact: true }).getAttribute('aria-selected'), 'true')
  await page.getByRole('button', { name: 'Copy Markdown', exact: true }).click()
  await page.getByRole('button', { name: 'Copied', exact: true }).waitFor()
  assert((await page.evaluate(() => navigator.clipboard.readText())).includes('title: Tabs'))
  await click('/components/card')
  await page.getByRole('button', { name: 'Copy Markdown', exact: true }).click()
  await page.getByRole('button', { name: 'Copied', exact: true }).waitFor()
  assert((await page.evaluate(() => navigator.clipboard.readText())).includes('title: Cards'))

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

  await page.setViewportSize({ width: 320, height: 760 })
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page.getByRole('dialog', { name: 'Documentation navigation' }).locator('a[href="/components/callouts"]').click()
  await page.waitForURL('**/components/callouts'); await settle()
  await page.waitForTimeout(200)
  assert.equal(await page.getByRole('dialog').count(), 0)
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(await page.getByRole('button', { name: 'Copy Markdown', exact: true }).evaluate(el => getComputedStyle(el).transitionDuration), '0s')

  // Nested static examples are separate sites: native entry, then progressive links.
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

  const noJS = await browser.newPage({ javaScriptEnabled: false })
  await noJS.goto(origin + '/components/callouts/')
  assert.equal(await noJS.locator('h1').textContent(), 'Callouts')
  await noJS.locator('#novon-sidebar a[href="/components/card"]').click()
  assert.equal(await noJS.locator('h1').textContent(), 'Cards')

  // Opt-out links still cause a document load.
  await page.goto(origin + '/components')
  await page.evaluate(() => window.__sentinel = 44)
  await injectClick('/components/callouts', { 'data-no-router': '' })
  await page.waitForURL('**/components/callouts'); await page.waitForLoadState()
  assert.equal(await sentinel(), undefined)
  // load does not wait for top-level-await hydration of the entry module.
  await page.waitForFunction(() => Boolean(history.state?.novonKey))

  // Missing deployment chunks recover via the generated HTML rather than a
  // blank article. Allow the retry made by the fresh document to succeed.
  let failed = false
  await page.route('**/assets/media-*.js', async route => {
    if (!failed) { failed = true; await route.abort('failed') }
    else await route.continue()
  })
  await page.evaluate(() => window.__sentinel = 45)
  await injectClick('/components/media')
  await page.waitForURL('**/components/media'); await page.waitForLoadState()
  await page.getByRole('heading', { name: 'Media', exact: true }).waitFor()
  assert(failed)
  assert.equal(await sentinel(), undefined)
  assert.deepEqual(errors, [])
  console.log('PASS: progressive docs/blog navigation, shell, state, metadata, copy, search, history, hashes, races, mobile, reduced motion, no-JS and opt-out')
} finally {
  await browser?.close()
  server.close()
}
