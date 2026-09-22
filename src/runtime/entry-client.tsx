/** Browser entry: hydrates the prerendered page and loads the theme styles. */
import './theme.css'
import 'virtual:novon/styles'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { App } from './app.tsx'
import { installNavigation } from './navigation.ts'
import { updatePageHead } from './page-head.ts'
import { createSiteIndex, loadPage } from './content.ts'
import { normalizePathname } from './lib.ts'
import config from 'virtual:novon/config'

const site = createSiteIndex(config)
const root = document.getElementById('novon-root')
const url = normalizePathname(window.location.pathname, config.base)
const route = site.byPath.get(url)
const page = route?.file ? await loadPage(route.file) : undefined

if (root) {
  const app = <App config={config} url={url} site={site} page={page} />
  // Dev has no server render to attach to, so mount instead of hydrating.
  const reactRoot = import.meta.env.DEV ? createRoot(root) : hydrateRoot(root, app)
  if (import.meta.env.DEV) reactRoot.render(app)
  const dispose = installNavigation({
    base: config.base,
    paths: site.byPath,
    load: async (path) => {
      const route = site.byPath.get(path)
      const page = route?.file ? await loadPage(route.file) : undefined
      if (route?.file && !page) throw new Error('Page module missing')
      return page
    },
    commit: (url, page) => {
      flushSync(() => reactRoot.render(<App config={config} url={url} site={site} page={page} />))
      updatePageHead(config, site.byPath.get(url)!)
    },
  })
  import.meta.hot?.dispose(dispose)
}
