import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const packageJsonPath = join(root, 'package.json')
const viteConfigPath = join(root, 'vite.config.ts')

const LOCAL_DEPS = {
  '@mlight-cad/dwg-converter': '../realdwg-web/packages/dwg-converter',
  '@mlightcad/data-model': '../realdwg-web/packages/data-model',
}

const updatePackageJson = () => {
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'))

  if (!pkg.dependencies) {
    console.error('package.json has no dependencies field')
    process.exit(1)
  }

  let changed = false
  for (const [name, localPath] of Object.entries(LOCAL_DEPS)) {
    if (!(name in pkg.dependencies)) {
      console.warn(`Skip ${name}: not found in dependencies`)
      continue
    }
    const prev = pkg.dependencies[name]
    if (prev === localPath) {
      console.log(`${name}: already using ${localPath}`)
      continue
    }
    pkg.dependencies[name] = localPath
    changed = true
    console.log(`${name}: ${prev} → ${localPath}`)
  }

  if (changed) {
    writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`)
    console.log('Updated package.json.')
  }

  return changed
}

/**
 * Apply vite.config.ts tweaks needed when linking sibling realdwg-web packages:
 * - server.fs.allow for @fs loads of dwg-parser-main.js
 * - static copy of dwg-parser-main.js for production builds (idempotent if
 *   already present in the base vite.config)
 */
const updateViteConfig = () => {
  let source = readFileSync(viteConfigPath, 'utf8')
  let changed = false

  if (!source.includes('searchForWorkspaceRoot')) {
    if (
      !source.includes("import { defineConfig } from 'vite'") &&
      !source.includes('import { defineConfig } from "vite"')
    ) {
      console.error(
        'vite.config.ts: expected `import { defineConfig } from \'vite\'`; skip vite patch'
      )
    } else {
      source = source.replace(
        /import \{ defineConfig \} from (['"])vite\1/,
        "import { defineConfig, searchForWorkspaceRoot } from 'vite'"
      )
      changed = true
      console.log('vite.config.ts: import searchForWorkspaceRoot')
    }
  } else {
    console.log('vite.config.ts: searchForWorkspaceRoot already imported')
  }

  if (!source.includes('localDwgConverter')) {
    const localPathsBlock = `
// Local \`link:\` deps resolve outside this repo; main-thread parse dynamically
// imports sibling \`dwg-parser-main.js\` via @fs and needs that path allowed.
const localDwgConverter = resolve(
  __dirname,
  '../realdwg-web/packages/dwg-converter'
)
const localDataModel = resolve(__dirname, '../realdwg-web/packages/data-model')
`

    if (!/export default defineConfig\(\{/.test(source)) {
      console.error(
        'vite.config.ts: expected `export default defineConfig({`; skip local path consts'
      )
    } else {
      source = source.replace(
        /export default defineConfig\(\{/,
        `${localPathsBlock.trimStart()}\nexport default defineConfig({`
      )
      changed = true
      console.log('vite.config.ts: add localDwgConverter / localDataModel')
    }
  } else {
    console.log('vite.config.ts: local path consts already present')
  }

  if (!/server:\s*\{\s*fs:\s*\{\s*allow:/.test(source)) {
    if (!/base:\s*(['"])\.\/\1,/.test(source)) {
      console.error(
        "vite.config.ts: expected `base: './',`; skip server.fs.allow"
      )
    } else {
      source = source.replace(
        /base:\s*(['"])\.\/\1,/,
        `base: './',
  server: {
    fs: {
      allow: [
        searchForWorkspaceRoot(__dirname),
        localDwgConverter,
        localDataModel
      ]
    }
  },`
      )
      changed = true
      console.log('vite.config.ts: add server.fs.allow for local packages')
    }
  } else {
    console.log('vite.config.ts: server.fs.allow already present')
  }

  const parserMainCopySrc =
    './node_modules/@mlight-cad/dwg-converter/dist/dwg-parser-main.js'
  if (!source.includes(parserMainCopySrc)) {
    const workerRe =
      /(\{\s*src:\s*(['"])\.\/node_modules\/@mlight-cad\/dwg-converter\/dist\/\*-worker\.js\2,\s*dest:\s*(['"])assets\3\s*\},)/
    if (!workerRe.test(source)) {
      console.error(
        'vite.config.ts: expected worker static-copy target; skip dwg-parser-main.js'
      )
    } else {
      source = source.replace(
        workerRe,
        `$1
        {
          // Bundled app chunks resolve this as a sibling of import.meta.url.
          src: '${parserMainCopySrc}',
          dest: 'assets'
        },`
      )
      if (!source.includes(parserMainCopySrc)) {
        console.error(
          'vite.config.ts: failed to insert dwg-parser-main.js copy target'
        )
      } else {
        changed = true
        console.log('vite.config.ts: copy dwg-parser-main.js to assets')
      }
    }
  } else {
    console.log('vite.config.ts: dwg-parser-main.js copy already present')
  }

  if (changed) {
    writeFileSync(viteConfigPath, source)
    console.log('Updated vite.config.ts.')
  }

  return changed
}

const pkgChanged = updatePackageJson()
const viteChanged = updateViteConfig()

if (!pkgChanged && !viteChanged) {
  console.log('No changes needed.')
  process.exit(0)
}

if (pkgChanged) {
  console.log('Run pnpm install to link local packages.')
}
