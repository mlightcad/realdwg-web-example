import { resolve } from 'node:path'
import { defineConfig, searchForWorkspaceRoot } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// Local `link:` deps resolve outside this repo; main-thread parse dynamically
// imports sibling `dwg-parser-main.js` via @fs and needs that path allowed.
const localDwgConverter = resolve(
  __dirname,
  '../realdwg-web/packages/dwg-converter'
)
const localDataModel = resolve(__dirname, '../realdwg-web/packages/data-model')

export default defineConfig({
  // Relative asset URLs work on GitHub Pages project sites and local preview.
  base: './',
  server: {
    fs: {
      allow: [
        searchForWorkspaceRoot(__dirname),
        localDwgConverter,
        localDataModel
      ]
    }
  },
  optimizeDeps: {
    // Keep the converter as native ESM so
    // `new URL('./dwg-parser-main.js', import.meta.url)` resolves next to
    // dist/dwg-converter.js. Prebundling into .vite/deps breaks that sibling
    // import (main-thread parse fails in `pnpm dev` only).
    exclude: ['@mlight-cad/dwg-converter']
  },
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
          // Bundled app chunks resolve this as a sibling of import.meta.url.
          src: './node_modules/@mlight-cad/dwg-converter/dist/dwg-parser-main.js',
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
