/**
 * The novon application shell. Rendered by the prerenderer at build time and
 * hydrated in the browser.
 */
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import { MDXProvider } from '@mdx-js/react'
import type { RuntimeConfig, ThemeOverrides } from '../types.ts'
import type { PageModule, SiteIndex } from './content.ts'
import { behavior } from './design-system/behaviors.ts'
import { media, space } from './design-system/tokens.stylex.ts'
import { mdxComponents } from './mdx.tsx'
import { SiteProvider } from './site.tsx'
import { BlogLayout, BlogPage, DefaultNotFound, DocsLayout, DocsPage, OverrideProvider, useOverride } from './shell.tsx'
import { flattenNav, siteForRoute, titleOf } from './content.ts'
import { customComponents } from 'virtual:novon/components'
import { themeOverrides } from 'virtual:novon/theme'

export interface AppProps {
  config: RuntimeConfig
  url: string
  site: SiteIndex
  page?: PageModule
  overrides?: ThemeOverrides
}

const styles = stylex.create({
  notFound: {
    marginInline: 'auto',
    maxWidth: '48rem',
    paddingInline: { default: space.four, [media.wide]: space.six },
    paddingBlock: space.sixteen,
  },
})

function AppBody({ config, url, site, page }: AppProps) {
  const NotFound = useOverride('NotFound', DefaultNotFound)
  const route = site.byPath.get(url)
  const headings = page?.headings ?? []
  const title = route ? titleOf(route) : 'Not found'
  const description = route?.meta.description ?? (route?.isIndex ? config.description : undefined)

  const components = React.useMemo(
    () => ({ ...mdxComponents, ...customComponents }),
    [],
  )

  if (!route) {
    return (
      <div {...stylex.props(styles.notFound)}>
        <NotFound url={url} />
      </div>
    )
  }

  const content = page?.default ? (
    <MDXProvider key={url} components={components}>
      <page.default />
    </MDXProvider>
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

  return route.layout === 'blog'
    ? <BlogLayout><BlogPage {...layoutProps} /></BlogLayout>
    : <DocsLayout {...layoutProps}><DocsPage {...layoutProps} /></DocsLayout>
}


export function App(props: AppProps) {
  const { config, url } = props
  const site = React.useMemo(() => siteForRoute(props.site, props.site.byPath.get(url)), [props.site, url])
  return (
    <OverrideProvider value={{ ...themeOverrides, ...props.overrides }}>
      <SiteProvider value={{ config, base: config.base, site, url }}>
        <AppBody {...props} site={site} />
        <span role="status" aria-live="polite" {...stylex.props(behavior.visuallyHidden)}>
          {site.byPath.has(url) ? titleOf(site.byPath.get(url)!) : 'Page not found'}
        </span>
      </SiteProvider>
    </OverrideProvider>
  )
}

export { customComponents }
