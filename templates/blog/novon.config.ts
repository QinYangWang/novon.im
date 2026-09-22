import { defineConfig } from 'novon/config'

export default defineConfig({
  title: '__TITLE__',
  // Shown as the intro paragraph on the home page.
  description: 'Writing from __TITLE__.',
  // Set `url` to get absolute links in rss.xml and sitemap.xml.
  // url: 'https://example.com',
  template: 'blog',

  nav: [
    { label: 'home', href: '/' },
    { label: 'blog', href: '/blog' },
    { label: 'about', href: '/about' },
  ],

  theme: {
    accent: 'orange',
    darkMode: true,

    // Social previews are generated per page by default (1200×630 PNG), from
    // each post's title and description. A post's `image` frontmatter is used
    // as its cover and preview instead. Set `generateOgImages: false` to stop.

    // Static files live in `public/` and are copied to the output root,
    // so `/logo.svg` below refers to `public/logo.svg`.
    // logo: '/logo.svg',
    // favicon: '/favicon.svg',

    social: {
      // `email` is rendered as a mailto link in the footer.
      email: 'your@email.com',
      // github: 'https://github.com/your-org/__NAME__',
      // x: 'https://x.com/your-handle',
    },

    footer: {
      text: '© __TITLE__. MIT Licensed.',
      // Rendered next to the built-in rss and github links:
      // links: [{ label: 'view source', href: 'https://github.com/you/repo' }],
    },

    // Add your own stylesheets (relative to the site root):
    // css: ['./styles/extra.css'],

    // Replace built-in theme parts with your own components:
    // override: { HomePage: './theme/Home.tsx' },
  },

  // Custom components available in every .mdx file without an import:
  // components: { Newsletter: './components/Newsletter.tsx' },

  // Add 'search' for the ⌘K palette.
  plugins: ['rss', 'sitemap', 'llms'],

  // Extra remark/rehype plugins, and Shiki syntax highlighting:
  // mdx: {
  //   highlight: { theme: { light: 'github-light', dark: 'github-dark' } },
  //   remarkPlugins: [],
  //   rehypePlugins: [],
  // },
})
