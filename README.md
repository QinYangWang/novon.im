# novon

A static blog and documentation generator built on **Bun**, **Vite**, **React** and
**shadcn/ui (Base UI)**.

Write MDX. Configure one file. Get a fast static site for Vercel, Cloudflare Pages
or GitHub Pages.

```bash
bun add -g novon

novon new my-docs                 # documentation site
novon new my-blog --template blog # blog

cd my-docs
novon dev                         # http://localhost:4321
novon build                       # static output in dist/
```

A novon site is **only MDX and a config file** — no `package.json`, no build
scripts, no theme source to maintain:

```text
my-docs/
├── novon.config.ts        # title, navigation, theme, plugins
└── content/
    ├── index.mdx          #   → /
    ├── getting-started.mdx#   → /getting-started
    └── guide/
        ├── index.mdx      #   → /guide          (labels the sidebar group)
        └── writing.mdx    #   → /guide/writing
```

The file tree becomes the URL structure and the sidebar. Add a file, get a page.

## Layouts

Docs and blog are **layout layers**, not separate site modes. Share one config,
content tree and build, and mount a layout by URL prefix:

```ts
export default defineConfig({
  title: 'My project',
  layout: 'docs',
  layers: [{ path: '/blog', layout: 'blog' }],
  nav: [{ label: 'Guide', href: '/guide' }, { label: 'Blog', href: '/blog' }],
})
```

The longest segment prefix wins; layer paths exclude `base`. Sidebars,
previous/next links, post lists and tags are scoped to their layer. Search and
sitemap stay site-wide; RSS includes posts from all blog layers.

`template` is a deprecated alias for the default `layout`. The CLI's
`--template` flag only selects starter content.

**`docs`** — a full-height sidebar rail (brand, search, grouped navigation with
icons, and a system/light/dark switcher in its footer), a content header with
**Copy Markdown** and **Open** actions, an "On this page" column, previous/next
cards and a "last updated" line. Top-level directories render as labelled
sections, deeper ones as collapsible groups.

**`blog`** — a narrow single column in the style of a personal site: name and
role, segmented navigation, a **Copy URL** control, a section of posts written as
title + description, and a "Connect" block of arrow chips (email, social, rss).
The layer root lists posts newest first; a root blog also keeps `/blog`.
Tags live at `<layer>/tags/<tag>` (or `/tags/<tag>` for a root blog). A real
index page replaces the generated list. A post opens with its cover and caption.

`BaseLayout`, `DocsLayout`, `BlogLayout`, `DocsPage` and `BlogPage` are exported
from `novon`: layouts own chrome, pages own content. Both share the same
provider and component kit. See [Layout layers](docs/content/guide/layouts.mdx).

## The component kit

Both layouts are assembled from one set of components, exported from `novon`
so a custom component or theme override can use them:

| Component | Purpose |
| --- | --- |
| `PillNav` | Segmented navigation with an indicator that slides between items. |
| `IconBadge` | Rounded-square icon container used on cards and rows. |
| `Section` | Titled block with the standard vertical rhythm. |
| `Reveal` | Reveals its children on scroll. |
| `ScrollProgress`, `ReadingProgress` | Reading progress, pinned to the top or inline. |
| `ArrowPill`, `SocialPills` | Pill links, and a row built from `theme.social`. |
| `CopyUrlButton`, `PageActions` | Copy the current URL, or the page's Markdown. |
| `ThemeSwitch`, `ThemeToggle` | Three-way and single theme controls. |

```tsx
import { ArrowPill, IconBadge, PillNav, Reveal, Section } from 'novon'
```

The style follows the Vercel/Geist system: monochrome surfaces, hairline alpha
borders, restrained radii and Geist typography, with light and dark as equal
citizens. Everything is a CSS custom property, so a site can override any of it
with a stylesheet (see [Extending](README.md#extending)).

Motion is CSS transitions plus two small hooks — a `ResizeObserver` for the
indicator and an `IntersectionObserver` for reveals. `Reveal` only hides its
content once JavaScript is running, and both are disabled under
`prefers-reduced-motion`, so nothing is ever hidden from a reader without JS.

## Commands

| Command | Description |
| --- | --- |
| `novon new <dir>` | Scaffold a site. `-t, --template docs\|blog`, `--title`, `-f, --force` |
| `novon dev` | Dev server with live reload. `-p, --port`, `--host` |
| `novon build` | Static build. `--out-dir`, `--base /repo/` |
| `novon help`, `novon version` | Documentation and version |

`novon build` writes one `index.html` per route plus `404.html`, so every host
resolves `/guide/writing` without rewrite rules. `--base /my-repo/` produces a
build that works from a subdirectory (GitHub Pages project sites); it rewrites
asset and in-content links together.

## Content

Frontmatter drives everything:

```yaml
---
title: Writing content        # page heading, sidebar label, <title>
description: How to write.    # subtitle, meta description, feeds
icon: FileText                # sidebar icon
order: 1                      # position inside its sidebar section
label: Writing                # shorter sidebar label
draft: true                   # hidden from production builds
date: 2026-01-31              # blog lists, RSS, sitemap
updated: 2026-01-18           # "Last updated on …"
tags: [guide, mdx]
author: Ada Lovelace
toc: false                    # hide "On this page" for this page
sidebar: false                # not a page in the sidebar, not a post in lists
slug: custom-url              # override the URL (keeps the sidebar position)
fullWidth: true               # render without the sidebar and TOC columns
---
```

Directories and files starting with `_` are ignored (partials).

Headings get stable anchor ids, and `h2`–`h4` are collected into the "On this
page" panel from the same source on the server and in the browser.

Every page is published twice: as HTML and as the original Markdown at the same
URL with `.md` appended (`/guide/writing.md`). The **Copy Markdown** button reads
it, and so can your editor or an LLM.

## Components

Components are available in every `.mdx` file **without an import** — an explicit
import always wins.

| Component | Purpose |
| --- | --- |
| `Card`, `CardGroup`, `Columns` | Link grids and layouts |
| `Note`, `Info`, `Tip`, `Warning`, `Caution`, `Danger`, `Callout` | Callouts |
| `Steps`, `Step` | Numbered procedures |
| `Tabs`, `Tab`, `CodeGroup` | Tabbed content and code |
| `Accordion`, `AccordionGroup` | Collapsible sections |
| `Frame`, `Badge`, `Icon`, `Term`, `YouTube` | Media and inline bits |
| `PostList`, `TagList` | Site data, no props needed |

Code blocks are highlighted in both themes, show a filename from
`title="path/to/file"`, take `showLineNumbers`, and have a copy button that
appears on hover.

```mdx
<CardGroup cols={2}>
  <Card title="Getting started" icon="Rocket" href="/getting-started">
    Install novon, run the dev server, build the site.
  </Card>
</CardGroup>

<Tabs>
  <Tab title="bun">`bun add -g novon`</Tab>
  <Tab title="npm">`npm install -g novon`</Tab>
</Tabs>
```

The [component reference](https://qinyangwang.github.io/novon.im/components)
focuses on writing: callouts, cards, steps, code groups, tabs, accordions, tables,
media, badges, author avatars and blog lists. Theme primitives (`Button`, `Card`,
`Badge`, `Avatar`, `Table`, `ScrollArea`, `Kbd`, `Tabs`, `Accordion`, `Dialog` and
`DropdownMenu`) remain exported, with [Base UI](https://base-ui.com) handling
composite interactions.

Unused application widgets (forms, toggles, toasts, loading indicators and the
extra overlay/navigation families) have been removed, including their exports.
Existing pages importing these must use their own components. See the component
reference for the removal list and authoring alternatives.

## Configuration

```ts
// novon.config.ts
import { defineConfig } from 'novon/config'

export default defineConfig({
  title: 'My Docs',
  description: 'Documentation for My Docs.',
  url: 'https://docs.example.com',   // absolute links in sitemap.xml / rss.xml
  base: '/',                         // or '/my-repo/' on GitHub Pages
  layout: 'docs',                    // default layout
  layers: [{ path: '/blog', layout: 'blog' }],
  nav: [{ label: 'Guide', href: '/guide' }],
  theme: {
    accent: 'violet',
    radius: '1rem',
    darkMode: true,
    toc: true,
    logo: '/logo.svg',               // files in public/ are copied as-is
    editLink: { base: 'https://github.com/me/repo/edit/main/' },
    social: { github: 'https://github.com/me' },
    footer: { text: '© Me' },
  },
  plugins: ['search', 'sitemap', 'rss', 'llms'],
})
```

Files in `public/` are copied to the output root. Extra stylesheets go in
`theme.css`; token names follow shadcn/ui (`--primary`, `--background`, …).

### Syntax highlighting

Fenced code is highlighted at build time with [Shiki](https://shiki.style), in a
light and dark theme at once. The theme pair is emitted as CSS variables, so
switching theme never re-highlights and no highlighting JavaScript ships.

```ts
mdx: {
  highlight: {
    theme: { light: 'github-light', dark: 'github-dark' },
    defaultLanguage: 'plaintext',
  },
}
```

`highlight: false` keeps code blocks and the copy button and drops only the
token colors. Language grammars load on demand, and an unknown language falls
back to plain text rather than failing the build.

### Social images

With no image configured, the build renders a `1200×630` PNG per page from its
title, description and route, writes it to `_og/<route>.png`, and points
`og:image` and `twitter:image` at it. Rendering is local and deterministic —
`satori` lays out the card and `@resvg/resvg-js` rasterizes it, so there is no
headless browser, no network request and no serverless endpoint.

A page's `ogImage` (or `image`) frontmatter, then `theme.ogImage`, takes
precedence; `theme.generateOgImages: false` disables generation. The bundled
font covers Latin, Greek and Cyrillic, so set an explicit image for other
scripts. `novon dev` serves the same renderer from `/_og/…` on demand.

### Built-in plugins

| Name | Output |
| --- | --- |
| `search` | `search-index.json` — client-side search with `⌘K` |
| `sitemap` | `sitemap.xml` |
| `rss` | `rss.xml` (visible posts from all blog layers) |
| `llms` | `llms.txt` |

OG image generation is built in rather than a plugin — see
[Social images](#social-images).

## Extending

**Custom components** — available in MDX without an import:

```ts
components: { PricingTable: './components/PricingTable.tsx' }
```

**Theme overrides** — replace any built-in part (`Header`, `Sidebar`,
`TableOfContents`, `Footer`, `HomePage`, `PostListPage`, `NotFound`):

```ts
theme: { override: { Header: './theme/Header.tsx' } }
```

**Plugins** — one object, three hooks:

```ts
// plugins/robots.ts
import { definePlugin } from 'novon/plugin'

export default definePlugin({
  name: 'robots',
  setup({ config, root }) {},                 // once, before the build
  transformHtml(html, page) { return html },  // every page, final document
  postBuild(ctx) {                            // after all pages are written
    ctx.write('robots.txt', 'User-agent: *\nAllow: /\n')
    ctx.log(`${ctx.pages.length} pages`)
  },
})
```

## How it works

`novon dev` and `novon build` generate a small Vite config in `<site>/.novon/`
(safe to delete, self-ignoring), load your config and content, and run Vite under
Bun:

1. **Client bundle** — React + the theme, with the Tailwind stylesheet.
2. **Server bundle** — the same theme, used only for prerendering.
3. **Prerender** — one HTML file per route from the content index.
4. **Plugins** — `sitemap`, `rss`, `search-index.json`, `llms.txt`, `.nojekyll`.

Because the site has no `node_modules`, specifiers inside `novon.config.ts` (and
the local plugins it imports) are rewritten to absolute paths before the config
is loaded, and `content/*.mdx` resolves `novon` and `react` through Vite aliases
into the installed package.

## Development

```bash
bun install
bun test          # unit tests for routing, config loading, plugins
bun run src/cli.ts --help
```

Requires Bun 1.1+.

For the production navigation smoke test (docs and blog, including subdirectory
hosting, history, fragments, mobile and reduced motion):

```bash
(cd docs && bun ../bin/novon.js build)
bunx playwright-core install chromium
bun run test:browser
```

## Deliberate limits

- Content lives in `content/` and is not configurable — that is what makes the
  dev server work with no generated entry files.
- Every route is still a static HTML file. After hydration, internal navigation
  loads the destination's MDX chunk on demand and updates content without
  reloading the document. The shell stays mounted; history, fragments and
  search use the same navigation path. External links and downloads stay native.
  Add `data-no-router` to a link to force a document navigation. Publishing
  changed content still requires a build; this is not server-side regeneration.
- Sidebar nesting is derived from directories; there is no separate nav file, and
  there is no version or multi-product switcher.
- Social preview images are generated at build time: `satori` + `@resvg/resvg-js`
  render a `1200×630` PNG per page from its title, description and route, with no
  headless browser and no serverless endpoint. `theme.ogImage`, or a page's
  `image`/`ogImage` frontmatter, overrides the generated card. The bundled font
  covers Latin, Greek and Cyrillic; other scripts need an explicit image.
- The search palette and tag pages are opt-in for blog layers: enable the
  `search` plugin and add `tags` to posts.
- The blog list shows titles and descriptions rather than dates, following the
  layout it is modelled on. Dates still drive ordering, RSS and the sitemap.
- Motion is CSS rather than a physics library. Springs would need `motion`, which
  is not worth the bundle for a content site.
