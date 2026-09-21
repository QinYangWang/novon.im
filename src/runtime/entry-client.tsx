/** Browser entry: hydrates the prerendered page and loads the theme styles. */
import './theme.css'
import 'virtual:novon/styles'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { App } from './app.tsx'
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
  if (import.meta.env.DEV) createRoot(root).render(app)
  else hydrateRoot(root, app)
}
