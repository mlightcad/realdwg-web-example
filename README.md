# RealDWG-Web Example

Customer-facing demo for [@mlightcad/data-model](https://www.npmjs.com/package/@mlightcad/data-model) (npmjs) and the private DWG converter [`@mlight-cad/dwg-converter`](https://github.com/mlight-cad/dwg-converter) (GitHub Packages).

It is both:

1. An **integration sample** — how to authenticate, install, deploy worker assets, register `AcDbDwgConverter`, and call `AcDbDatabase.read()`
2. A **DWG/DXF database viewer** — browse preview, stats, symbol tables, block entities, and entity properties after parse

This is **not** a canvas CAD viewer. For WebGL viewing see [`cad-simple-viewer-example`](https://github.com/mlightcad/cad-simple-viewer-example).

**Live demo:** https://mlightcad.github.io/realdwg-web-example/

![RealDWG-Web Example](docs/images/realdwg-web-example.jpg)

## Features

- Open local `.dwg` / `.dxf` files in the browser
- DWG via private `@mlight-cad/dwg-converter` (web worker)
- DXF via built-in MIT `AcDbNativeDxfConverter`
- Left pane: thumbnail preview + database stats + navigation tree
- Center: symbol table records or entity list (filter / type)
- Right: property inspector (`entity.properties`)
- Export the opened database as DXF

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 10
- A GitHub token with `read:packages` and access to `@mlight-cad/dwg-converter`

## Getting started

`.npmrc` is already configured so that:

- `@mlightcad/*` (e.g. `data-model`) installs from **npmjs**
- `@mlight-cad/*` (`dwg-converter`) installs from **GitHub Packages**

```bash
# PowerShell
$env:GITHUB_TOKEN = "ghp_..."

# bash
export GITHUB_TOKEN=ghp_...

pnpm install
pnpm dev
```

Open the printed URL, then **Open DWG / DXF**.

Do **not** set `@mlightcad:registry` to GitHub Packages — that breaks public packages on npmjs.

## License key

Optional. Copy `.env.example` to `.env`:

```bash
VITE_DWG_LICENSE_KEY=your-signed-key
```

Omit the key to use the converter’s **30-day evaluation** trial.

If you need a formal **trial license request** (e.g. longer evaluation or production pilots), see the DWG proprietary parser docs: [`PROPRIETARY-PARSER.md` → “Trial License”](https://github.com/mlightcad/cad-viewer/blob/main/PROPRIETARY-PARSER.md#trial-license).

## Worker assets

Vite copies these into `assets/` at build/dev time:

- `dwg-parser-worker.js`
- `dwg-codepage-*.bin`

Registration in code:

```ts
import { AcDbDatabaseConverterManager, AcDbFileType } from '@mlightcad/data-model'
import { AcDbDwgConverter } from '@mlight-cad/dwg-converter'

const converter = new AcDbDwgConverter({
  parserWorkerUrl: './assets/dwg-parser-worker.js',
  licenseKey: import.meta.env.VITE_DWG_LICENSE_KEY
})
AcDbDatabaseConverterManager.instance.register(AcDbFileType.DWG, converter)
```

See the in-app **Integration Guide** button (opens `guide.html` in a new tab) for the full read pipeline.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Vite dev server |
| `pnpm build` | Typecheck + production build |
| `pnpm preview` | Serve `dist/` |

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| 401/403 installing `@mlight-cad/dwg-converter` | Missing/invalid `GITHUB_TOKEN` or no package access |
| Worker failed to load / 404 | `dwg-parser-worker.js` not copied to `assets/` |
| License / trial error | Trial expired or invalid `VITE_DWG_LICENSE_KEY` |

## License

MIT for this example app. `@mlight-cad/dwg-converter` remains private / UNLICENSED and is distributed separately.
