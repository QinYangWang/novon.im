import { defineConfig } from 'novon/config'

export default defineConfig({
  title: '__TITLE__',
  description: 'Documentation for __TITLE__.',
  // Set `url` to get absolute links in sitemap.xml and rss.xml.
  // url: 'https://example.com',
  template: 'docs',

  nav: [
    { label: 'Guide', href: '/guide' },
    { label: 'Components', href: '/guide/components' },
  ],

  theme: {
    accent: 'orange',
    radius: '0.75rem',
    darkMode: true,
    toc: true,

    // Static files live in `public/` and are copied to the output root,
    // so `/logo.svg` below refers to `public/logo.svg`.
    // logo: '/logo.svg',
    // logoDark: '/logo-dark.svg',
    // favicon: '/favicon.svg',

    social: {
      // github: 'https://github.com/your-org/__NAME__',
    },

    // Shows "Edit this page" at the bottom of every page.
    // editLink: { base: 'https://github.com/your-org/__NAME__/edit/main/' },

    footer: {
      text: '© __TITLE__',
      links: [],
    },

    // Add your own stylesheets (relative to the site root):
    // css: ['./styles/extra.css'],

    // Replace built-in theme parts with your own components:
    // override: { Header: './theme/Header.tsx', Sidebar: './theme/Sidebar.tsx' },
  },

  // Custom components available in every .mdx file without an import:
  // components: { Pricing: './components/Pricing.tsx' },

  // Enable built-in plugins by name.
  plugins: ['search', 'sitemap', 'rss', 'llms'],

  // Extra remark/rehype plugins:
  // mdx: { remarkPlugins: [], rehypePlugins: [] },
})
