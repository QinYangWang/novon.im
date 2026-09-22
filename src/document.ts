/**
 * The HTML shell. Used by the dev server and by the prerenderer so both produce
 * the same document.
 */
import type { RuntimeConfig } from './types.ts'
import { absoluteUrl } from './url.ts'

export interface DocumentOptions {
  config: RuntimeConfig
  title: string
  description?: string
  /** Server-rendered markup for the app root. */
  body: string
  /** `<script>` tags for the built client bundle. */
  scripts?: string
  /** `<link rel="stylesheet">` tags. */
  styles?: string
  /** Extra head markup contributed by plugins. */
  head?: string
  /** Social preview image for this page. */
  ogImage?: string
  /** `article` for blog posts. */
  ogType?: string
  /** Dev-only: the Vite client and react-refresh preamble. */
  devScripts?: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Runs before first paint so the stored theme never flashes. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('novon-theme');if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}var r=document.documentElement;r.dataset.theme=t;r.dataset.js='true';}catch(e){}})();`

function joinUrl(base: string, path: string): string {
  if (!path) return base
  if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith('//')) return path
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base
  return `${prefix}${path.startsWith('/') ? path : `/${path}`}`
}

export function renderDocument(options: DocumentOptions): string {
  const { config, title, description, body } = options
  const base = config.base
  const fullTitle = title && title !== config.title ? `${title} · ${config.title}` : config.title
  const canonical = config.url ? absoluteUrl(config, '/') : undefined
  const ogImage = options.ogImage ?? config.theme.ogImage

  const head = [
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(fullTitle)}</title>`,
    description ? `<meta name="description" content="${escapeHtml(description)}" />` : '',
    config.theme.favicon ? `<link rel="icon" href="${escapeHtml(joinUrl(base, config.theme.favicon))}" />` : '',
    canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}" />` : '',
    `<meta property="og:title" content="${escapeHtml(fullTitle)}" />`,
    description ? `<meta property="og:description" content="${escapeHtml(description)}" />` : '',
    `<meta property="og:type" content="${escapeHtml(options.ogType ?? 'website')}" />`,
    ogImage ? `<meta property="og:image" content="${escapeHtml(joinUrl(base, ogImage))}" />` : '',
    `<meta name="generator" content="novon" />`,
    '<meta name="color-scheme" content="light dark" />',
    '<link rel="preconnect" href="https://fonts.googleapis.com" />',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
    '<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400..600&family=Geist+Mono:wght@400..600&display=swap" rel="stylesheet" />',
    `<script>${THEME_INIT_SCRIPT}</script>`,
    options.styles ?? '',
    options.head ?? '',
  ]
    .filter(Boolean)
    .join('\n    ')

  return `<!doctype html>
<html lang="${escapeHtml(config.language)}" data-template="${escapeHtml(config.template)}" data-accent="${escapeHtml(config.theme.accent)}" style="--radius: ${escapeHtml(config.theme.radius)}">
  <head>
    ${head}
  </head>
  <body>
    <div id="novon-root">${body}</div>
    ${options.devScripts ?? ''}
    ${options.scripts ?? ''}
  </body>
</html>
`
}
