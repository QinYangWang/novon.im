/**
 * The novon application shell. Rendered by the prerenderer at build time and
 * hydrated in the browser.
 */
import * as React from 'react'
import { MDXProvider } from '@mdx-js/react'
import type { RuntimeConfig, ThemeOverrides } from '../types.ts'
import type { PageModule, SiteIndex } from './content.ts'
import { mdxComponents } from './mdx.tsx'
import { SiteProvider } from './site.tsx'
import { BlogLayout, DefaultHomePage, DefaultNotFound, DocsLayout, OverrideProvider, useOverride } from './shell.tsx'
import { flattenNav } from './content.ts'
import { customComponents } from 'virtual:novon/components'
import { themeOverrides } from 'virtual:novon/theme'

export interface AppProps {
  config: RuntimeConfig
  url: string
  site: SiteIndex
  page?: PageModule
  overrides?: ThemeOverrides
}

function AppBody({ config, url, site, page }: AppProps) {
  const NotFound = useOverride('NotFound', DefaultNotFound)
  const HomePage = useOverride('HomePage', DefaultHomePage)
  const route = site.byPath.get(url)
  const headings = page?.headings ?? []
  const title = route ? route.meta.label || route.meta.title || lastSegment(route.path) : 'Not found'
  const description = route?.meta.description ?? (route?.isIndex ? config.description : undefined)

  const components = React.useMemo(
    () => ({ ...mdxComponents, ...customComponents }),
    [],
  )

  if (!route) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-6">
        <NotFound url={url} />
      </div>
    )
  }

  const content = page?.default ? (
    <MDXProvider components={components}>
      <page.default />
    </MDXProvider>
  ) : config.template === 'blog' ? (
    <HomePage site={site} config={config} />
  ) : null

  const layoutProps = {
    route,
    url,
    title,
    description: typeof description === 'string' ? description : undefined,
    headings,
    children: content,
    prevNext: flattenNav(site.nav),
    config,
    site,
  }

  return config.template === 'blog' ? <BlogLayout {...layoutProps} /> : <DocsLayout {...layoutProps} />
}

function lastSegment(path: string): string {
  const parts = path.split('/').filter(Boolean)
  return parts[parts.length - 1] ?? 'Home'
}

export function App(props: AppProps) {
  const { config, url, site } = props
  return (
    <OverrideProvider value={{ ...themeOverrides, ...(props.overrides ?? {}) }}>
      <SiteProvider value={{ config, base: config.base, site, url }}>
        <AppBody {...props} />
      </SiteProvider>
    </OverrideProvider>
  )
}

export { customComponents }
