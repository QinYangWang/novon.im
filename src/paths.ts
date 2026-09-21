/**
 * Route-to-file mapping, shared by the build (which writes the files) and the
 * theme (which links to them), so the two can never drift apart.
 */

/** `/guide/setup` -> `guide/setup/index.html`, `/` -> `index.html`. */
export function outputPath(routePath: string): string {
  if (routePath === '/') return 'index.html'
  return `${stripSlashes(routePath)}/index.html`
}

/** `/guide/setup` -> `guide/setup.md`, `/` -> `index.md`. */
export function markdownPath(routePath: string): string {
  if (routePath === '/') return 'index.md'
  return `${stripSlashes(routePath)}.md`
}

function stripSlashes(routePath: string): string {
  return routePath.replace(/^\/+/, '').replace(/\/+$/, '')
}
