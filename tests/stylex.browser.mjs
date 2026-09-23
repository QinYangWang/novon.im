/** Builds an isolated site; also accepts NOVON_CLI=/installed/novon/bin/novon.js. */
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { cp, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { extname, join, resolve, sep } from 'node:path'
import { chromium } from 'playwright-core'

const site = await mkdtemp(join(tmpdir(), 'novon-stylex-'))
const cli = resolve(process.env.NOVON_CLI || 'bin/novon.js')
const bun = process.env.BUN_BIN || 'bun'
let browser, server, dev
let devLog = ''
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.md': 'text/markdown' }
try {
  await cp('tests/fixtures/stylex', site, { recursive: true })
  const build = spawnSync(bun, [cli, 'build'], { cwd: site, encoding: 'utf8', timeout: 90000 })
  assert.equal(build.status, 0, build.stdout + build.stderr)
  const dist = join(site, 'dist')
  server = createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
      assert(pathname.startsWith('/design/'))
      let file = resolve(dist, '.' + pathname.slice('/design'.length))
      assert(file === dist || file.startsWith(dist + sep))
      if ((await stat(file)).isDirectory()) file += '/index.html'
      res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream')
      res.end(await readFile(file))
    } catch { res.writeHead(404); res.end('Not found') }
  })
  await new Promise(done => server.listen(0, '127.0.0.1', done))
  const origin = `http://127.0.0.1:${server.address().port}`
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  // Font CDN availability is not part of the compiler contract.
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort())
  const errors = []
  page.on('pageerror', error => errors.push(String(error)))
  page.on('console', message => { if (message.type() === 'error' && /hydration|didn't match/i.test(message.text())) errors.push(message.text()) })
  const css = (id, prop) => page.getByTestId(id).evaluate((el, prop) => getComputedStyle(el)[prop], prop)
  await page.goto(origin + '/design/')
  await page.getByTestId('contract').filter({ visible: true }).waitFor()
  await page.waitForFunction(() => document.querySelector('[data-testid="contract"]')?.dataset.ready === 'true')
  assert.equal(await css('default', 'display'), 'flex', 'extracted CSS is linked through the manifest')
  assert.equal(await css('override', 'paddingLeft'), '24px', 'xstyle overrides component styles')
  assert.equal(await css('dynamic', 'paddingLeft'), '18px', 'dynamic variables compile')
  assert.equal(await css('array', 'paddingLeft'), '22px', 'xstyle arrays compose in order')
  assert.equal(await css('override', 'paddingLeft'), '24px', 'the earlier style loses per property')
  assert.equal(await css('null', 'backgroundColor'), 'rgba(0, 0, 0, 0)')
  assert.equal(await css('site', 'backgroundColor'), 'rgb(32, 64, 96)', 'theme.css site override stays live')
  assert.equal(await css('site', 'borderRadius'), '14px', 'scoped radius resolves at the consumer')
  assert.equal(await css('kbd', 'fontSize'), '12px')
  assert((await css('kbd', 'fontFamily')).includes('Geist Mono'))
  assert.equal(await css('responsive', 'display'), 'flex')
  const light = await css('success', 'color')
  const nested = await css('nested', 'color')
  assert.notEqual(light, nested, 'nested theme resolves variables at the consumer')

  const contrasts = {}
  for (const theme of ['light', 'dark']) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme)
    contrasts[theme] = await page.evaluate(() => {
      const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
      const rgb = color => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3) }
      const luminance = rgb => rgb.map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }).reduce((n, v, i) => n + v * [.2126, .7152, .0722][i], 0)
      return Object.fromEntries(['default', 'secondary', 'outline', 'success', 'warning', 'danger', 'kbd'].map(id => {
        const el = document.querySelector(`[data-testid="${id}"]`)
        let node = el, bg
        do { bg = getComputedStyle(node).backgroundColor; node = node.parentElement } while (node && bg === 'rgba(0, 0, 0, 0)')
        const [a, b] = [luminance(rgb(getComputedStyle(el).color)), luminance(rgb(bg))].sort((a, b) => b - a)
        return [id, (a + .05) / (b + .05)]
      }))
    })
    for (const [id, ratio] of Object.entries(contrasts[theme])) assert(ratio >= 4.5, `${theme}/${id}: ${ratio.toFixed(2)}:1`)
  }
  assert.equal(await css('success', 'color'), nested)
  for (const width of [320, 640, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    assert.equal(await css('responsive', 'display'), width < 640 ? 'none' : 'flex')
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no page overflow at ${width}`)
  }
  await page.setViewportSize({ width: 640, height: 900 })
  await page.evaluate(() => document.documentElement.style.fontSize = '200%')
  assert(await page.getByTestId('long').evaluate(el => el.scrollWidth <= el.clientWidth), 'text resize does not clip status')
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' })
  assert.equal(await css('success', 'animationName'), 'none')
  assert.notEqual(await css('success', 'color'), await css('success', 'backgroundColor'), 'forced colors remain distinguishable')

  const noJS = await browser.newPage({ javaScriptEnabled: false })
  await noJS.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort())
  await noJS.goto(origin + '/design/')
  assert.equal(await noJS.getByTestId('default').evaluate(el => getComputedStyle(el).display), 'flex', 'SSG has styles before hydration')
  assert.equal(await noJS.getByTestId('default').getAttribute('class'), await page.getByTestId('default').getAttribute('class'), 'SSR/client classes match')
  await noJS.close()

  // A fresh dev process, no persisted compiler cache; test the custom HTML shell
  // and CSS updates, not just production extraction. Use a non-root base too.
  const port = server.address().port
  await new Promise(done => server.close(done)); server = undefined
  // A separate port: the browser keeps keep-alive sockets to the static
  // server, and reusing the port would let a dev request ride a dead one.
  const devOrigin = `http://127.0.0.1:${port + 1}`
  dev = spawn(bun, [cli, 'dev', '--port', String(port + 1)], { cwd: site, env: { ...process.env, NOVON_HOST: '127.0.0.1' }, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] })
  dev.stdout.on('data', data => { devLog += data })
  dev.stderr.on('data', data => { devLog += data })
  let ready = false
  for (let i = 0; i < 150; i++) {
    try { if ((await fetch(devOrigin + '/design/', { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break } } catch {}
    await new Promise(done => setTimeout(done, 100))
  }
  assert(ready, devLog)
  await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'no-preference' })
  const pending = new Set()
  page.on('request', request => pending.add(request.url()))
  page.on('requestfinished', request => pending.delete(request.url()))
  page.on('requestfailed', request => pending.delete(request.url()))
  await page.goto(devOrigin + '/design/', { waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(error => {
    console.error(devLog, errors, 'Pending requests:', [...pending])
    throw error
  })
  await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-testid="dynamic"]') || document.body).paddingLeft === '18px', undefined, { timeout: 60_000 }).catch(async error => {
    // Raw evaluate only: locator waits in diagnostics mask the original error.
    const state = await page.evaluate(() => ({
      body: document.body.innerText.slice(0, 800),
      probe: [...document.querySelectorAll('[data-testid]')].map(el => `${el.dataset.testid}:${getComputedStyle(el).paddingLeft}`),
      links: [...document.querySelectorAll('link')].map(el => `${el.rel}:${el.href}`),
    }))
    const response = await page.request.get(devOrigin + '/design/virtual:stylex.css').catch(() => null)
    const depsDir = join(site, '.novon', 'vite', 'deps')
    const depFiles = await readdir(depsDir).catch(() => [])
    const metadata = await readFile(join(depsDir, '_metadata.json'), 'utf8').catch(() => 'no metadata')
    console.error(devLog, errors, 'Pending:', [...pending], state, response?.status(),
      (await response?.text() ?? '').slice(0, 500),
      '\nDEP FILES:', depFiles.filter(name => !name.endsWith('.map')),
      '\nMETADATA:', metadata)
    throw error
  })
  assert.equal(await css('array', 'paddingLeft'), '22px', 'dev composition matches production')
  const component = join(site, 'contract.tsx')
  await writeFile(component, (await readFile(component, 'utf8'))
    .replace('styles.dynamic(18)', 'styles.dynamic(24)')
    .replace('paddingInline: space.six', 'paddingInline: space.eight'))
  // Null-safe: React Refresh remounts empty the DOM for a frame.
  const paddingIs = ([id, value]) => {
    const el = document.querySelector(`[data-testid="${id}"]`)
    return Boolean(el) && getComputedStyle(el).paddingLeft === value
  }
  await page.waitForFunction(paddingIs, ['dynamic', '24px'], { timeout: 60_000 })
  await page.waitForFunction(paddingIs, ['override', '32px'], { timeout: 60_000 })
  assert.deepEqual(errors, [], 'no runtime/hydration errors')
  console.log('PASS: StyleX client/SSG/dev/HMR, external site + base path, variants, xstyle composition, ref, themes, contrast, narrow widths, text resize, forced colors, no-JS')
  console.log('Minimum measured contrast:', Math.min(...Object.values(contrasts).flatMap(Object.values)).toFixed(2) + ':1')
} finally {
  if (dev?.pid) {
    try {
      if (process.platform === 'win32') dev.kill('SIGTERM')
      else process.kill(-dev.pid, 'SIGTERM')
    } catch {}
  }
  await browser?.close()
  if (server) await new Promise(done => server.close(done))
  await rm(site, { recursive: true, force: true })
}
