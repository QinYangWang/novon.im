import { defineConfig } from 'novon/config'

export default defineConfig({
  title: '__TITLE__',
  description: 'Writing from __TITLE__.',
  // Set `url` to get absolute links in rss.xml and sitemap.xml.
  // url: 'https://example.com',
  template: 'blog',

  nav: [
    { label: 'Posts', href: '/' },
    { label: 'About', href: '/about' },
  ],

  theme: {
    accent: 'rose',
    darkMode: true,

    // Static files live in `public/` and are copied to the output root,
    // so `/avatar.png` below refers to `public/avatar.png`.
    // logo: '/logo.svg',
    // favicon: '/favicon.svg',

    social: {
      // github: 'https://github.com/your-org/__NAME__',
      // x: 'https://x.com/your-handle',
    },

    footer: {
      text: '© __TITLE__',
      links: [],
    },

    // Add your own stylesheets (relative to the site root):
    // css: ['./styles/extra.css'],

    // Replace built-in theme parts with your own components:
    // override: { HomePage: './theme/Home.tsx' },
  },

  // Custom components available in every .mdx file without an import:
  // components: { Newsletter: './components/Newsletter.tsx' },

  plugins: ['search', 'sitemap', 'rss', 'llms'],
})
