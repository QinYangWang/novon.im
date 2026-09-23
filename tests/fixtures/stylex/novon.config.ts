import { defineConfig } from 'novon/config'

export default defineConfig({
  title: 'StyleX contract',
  layout: 'docs',
  base: '/design/',
  theme: { radius: '0.5rem', css: ['./overrides.css'] },
  components: { StyleXContract: './contract.tsx' },
  plugins: [],
})
