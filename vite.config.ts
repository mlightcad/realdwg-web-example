import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  // Relative asset URLs work on GitHub Pages project sites and local preview.
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        guide: resolve(__dirname, 'guide.html')
      }
    }
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: './node_modules/@mlight-cad/dwg-converter/dist/*-worker.js',
          dest: 'assets'
        },
        {
          src: './node_modules/@mlight-cad/dwg-converter/dist/dwg-codepage-*.bin',
          dest: 'assets'
        }
      ]
    })
  ]
})
