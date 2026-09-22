/** Server/build-only PNG renderer. No browser, remote fonts, or runtime endpoint required. */
import { readFile } from 'node:fs/promises'
import { createElement as h } from 'react'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { OG_HEIGHT, OG_WIDTH } from '../social.ts'

let font: Promise<Buffer> | undefined
const loadFont = () => (font ??= readFile(new URL('./fonts/NotoSans-Regular.ttf', import.meta.url)))

export interface OgCard {
  site: string
  title: string
  description?: string
  path: string
  template: 'docs' | 'blog'
  author?: string
}

/** Bound layout and work even for exceptionally long/unbroken frontmatter. */
function text(value: string | undefined, limit: number): string {
  const characters = Array.from((value ?? '').replace(/\s+/g, ' ').trim())
  return characters.length > limit ? `${characters.slice(0, limit - 1).join('')}…` : characters.join('')
}

export async function renderOgImage(card: OgCard): Promise<Uint8Array> {
  const title = text(card.title, 120)
  const svg = await satori(
    h('div', {
      style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#141414', color: '#fafafa', padding: '52px 64px', fontFamily: 'Noto Sans' },
    },
    h('div', { style: { display: 'flex', alignItems: 'center', fontSize: 26, color: '#d4d4d4', gap: 16 } },
      h('div', { style: { width: 16, height: 16, borderRadius: 4, background: '#fafafa', flexShrink: 0 } }),
      text(card.site, 60)),
    h('div', { style: { display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 1, gap: 20 } },
      h('div', { style: { fontSize: title.length > 70 ? 50 : 64, lineHeight: 1.15, letterSpacing: '-2px', wordBreak: 'break-word', lineClamp: 3 } }, title),
      h('div', { style: { fontSize: 25, lineHeight: 1.5, color: '#b5b5b5', wordBreak: 'break-word', lineClamp: 2 } }, text(card.description, 150))),
    h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #404040', paddingTop: 24, gap: 32, fontSize: 18, color: '#b5b5b5' } },
      h('div', null, text(card.author || (card.template === 'docs' ? 'Documentation' : 'Journal'), 55)),
      h('div', { style: { maxWidth: 620, wordBreak: 'break-all', lineClamp: 1 } }, text(card.path, 75)))),
    { width: OG_WIDTH, height: OG_HEIGHT, fonts: [{ name: 'Noto Sans', data: await loadFont(), weight: 400, style: 'normal' }] },
  )
  return new Resvg(svg, { font: { loadSystemFonts: false } }).render().asPng()
}
