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
description: How to write.    # meta description, feeds, post list
order: 1                      # position inside its sidebar group
label: Writing                # shorter sidebar label
draft: true                   # hidden from production builds
date: 2026-01-31              # blog lists, RSS, sitemap
tags: [guide, mdx]
author: Ada Lovelace
toc: false                    # hide "On this page" for this page
sidebar: false                # not a page in the sidebar, not a post in lists
slug: custom-url              # override the URL (keeps the sidebar position)
---
```

Directories and files starting with `_` are ignored (partials).

Headings get stable anchor ids, and `h2`–`h4` are collected into the "On this
page" panel from the same source on the server and in the browser.

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

The shadcn/ui primitives novon itself is built from are exported too, all on
Base UI: `Button`, `Badge`, `Card`, `Input`, `Kbd`, `Separator`, `ScrollArea`,
`Tabs`, `Accordion`, `Collapsible`, `Tooltip`, `Dialog`, `Popover`.

## Configuration

```ts
// novon.config.ts
import { defineConfig } from 'novon/config'

export default defineConfig({
  title: 'My Docs',
  description: 'Documentation for My Docs.',
  url: 'https://docs.example.com',   // absolute links in sitemap.xml / rss.xml
  base: '/',                         // or '/my-repo/' on GitHub Pages
  template: 'docs',                  // or 'blog'
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

### Built-in plugins

| Name | Output |
| --- | --- |
| `search` | `search-index.json` — client-side search with `⌘K` |
| `sitemap` | `sitemap.xml` |
| `rss` | `rss.xml` (dated pages only) |
| `llms` | `llms.txt` |

## Extending

**Custom components** — available in MDX without an import:

```ts
components: { PricingTable: './components/PricingTable.tsx' }
```

**Theme overrides** — replace any built-in part (`Header`, `Sidebar`,
`TableOfContents`, `Footer`, `HomePage`, `NotFound`):

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

## Deliberate limits

- Content lives in `content/` and is not configurable — that is what makes the
  dev server work with no generated entry files.
- There is no client-side router: links are real page loads, so every route is a
  static HTML file. Sidebar, search, tabs and theme switching still hydrate.
- Sidebar nesting is derived from directories; there is no separate nav file.
