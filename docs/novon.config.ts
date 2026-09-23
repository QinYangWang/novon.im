import { defineConfig } from 'novon/config'
import examples from './plugins/examples.ts'

export default defineConfig({
  title: 'novon',
  description: 'A static blog and documentation generator built on Bun, Vite, React and shadcn/ui.',
  // Absolute links in sitemap.xml. Change this if you fork the repository.
  url: 'https://qinyangwang.github.io/novon.im',
  layout: 'docs',
  layers: [{ path: '/blog', layout: 'blog' }],

  nav: [
    { label: 'Guide', href: '/guide' },
    { label: 'Blog', href: '/blog' },
    { label: 'Components', href: '/components' },
    { label: 'GitHub', href: 'https://github.com/QinYangWang/novon.im' },
  ],

  theme: {
    accent: 'zinc',
    radius: '0.5rem',
    darkMode: true,
    toc: true,
    logo: '/logo.svg',
    logoDark: '/logo-dark.svg',
    favicon: '/favicon.svg',

    social: {
      github: 'https://github.com/QinYangWang/novon.im',
    },

    // The site lives in `docs/`, so the prefix includes that segment.
    editLink: { base: 'https://github.com/QinYangWang/novon.im/edit/main/docs' },

    footer: {
      text: '© novon — MIT licensed',
    },
  },

  plugins: ['search', 'sitemap', 'llms', examples],
})
