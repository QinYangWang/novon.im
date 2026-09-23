/** On-demand preview of the same OG cards that the static build writes. */
import type { Plugin } from 'vite'
import type { RuntimeConfig } from '../types.ts'
import { scanContent } from '../content-plugin.ts'
import { createSiteIndex, titleOf } from '../runtime/routes.ts'
import { ogImagePath, resolveOgImage } from '../social.ts'

export function devOgPlugin(root: string, config: RuntimeConfig): Plugin {
  return {
    name: 'novon:dev-og',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        let path = (request.url ?? '/').split('?')[0]
        if (config.base !== '/' && path.startsWith(config.base)) path = `/${path.slice(config.base.length)}`
        if (!path.startsWith('/_og/')) return next()
        if (request.method !== 'GET' && request.method !== 'HEAD') {
          response.writeHead(405, { allow: 'GET, HEAD' }); response.end(); return
        }
        try {
          // Look up an indexed route, never resolve a request path on disk.
          const site = createSiteIndex(config, scanContent(root), true)
          const route = site.routes.find((candidate) => ogImagePath(candidate.path) === path)
          if (!route || !resolveOgImage(config, route.path, route.meta.ogImage ?? route.meta.image)?.generated) {
            response.writeHead(404); response.end('No generated image for this route.'); return
          }
          const { renderOgImage } = await import('./render.ts')
          const author = route.meta.author
          const png = await renderOgImage({
            site: config.title, title: titleOf(route), path: route.path, layout: route.layout ?? config.layout,
            description: route.meta.description ?? (route.isIndex ? config.description : undefined),
            author: typeof author === 'string' ? author : author?.name ?? config.author,
          })
          response.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'no-store', 'content-length': png.length })
          response.end(request.method === 'HEAD' ? undefined : png)
        } catch (error) { next(error as Error) }
      })
    },
  }
}
