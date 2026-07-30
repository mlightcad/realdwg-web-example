import { type DwgParseMode, openDrawing } from './openDrawing'
import { showToast } from './toast'
import { DatabaseViewer } from './viewer/DatabaseViewer'
import { formatMs } from './viewer/format'

const fileInput = document.getElementById('fileInput') as HTMLInputElement
const openButton = document.getElementById('openButton') as HTMLButtonElement
const exportButton = document.getElementById('exportButton') as HTMLButtonElement
const guideButton = document.getElementById('guideButton') as HTMLButtonElement
const parseModeSelect = document.getElementById(
  'parseModeSelect'
) as HTMLSelectElement
const statusEl = document.getElementById('status') as HTMLDivElement
const viewerRoot = document.getElementById('viewerRoot') as HTMLElement
const loadingOverlay = document.getElementById(
  'loadingOverlay'
) as HTMLDivElement
const loadingText = document.getElementById('loadingText') as HTMLDivElement
const loadingSub = document.getElementById('loadingSub') as HTMLDivElement

const viewer = new DatabaseViewer(viewerRoot)
let lastFile: File | null = null
let lastDatabase: import('@mlightcad/data-model').AcDbDatabase | null = null
let lastDownloadUrl: string | null = null

const getParseMode = (): DwgParseMode =>
  parseModeSelect.value === 'main' ? 'main' : 'worker'

const parseModeLabel = (mode: DwgParseMode) =>
  mode === 'main' ? 'main thread' : 'web worker'

const setStatus = (message: string, kind: 'ok' | 'error' | '' = '') => {
  statusEl.textContent = message
  statusEl.classList.remove('ok', 'error')
  if (kind) statusEl.classList.add(kind)
}

const setLoading = (busy: boolean, message?: string, parseMode?: DwgParseMode) => {
  openButton.disabled = busy
  fileInput.disabled = busy
  parseModeSelect.disabled = busy
  if (busy) {
    exportButton.disabled = true
    loadingText.textContent = message ?? 'Opening drawing…'
    const mode = parseMode ?? getParseMode()
    loadingSub.textContent =
      mode === 'main'
        ? 'Parsing DWG on the main thread (DXF is always main-thread)'
        : 'Parsing DWG / DXF in a web worker'
    loadingOverlay.hidden = false
    document.body.style.overflow = 'hidden'
  } else {
    loadingOverlay.hidden = true
    document.body.style.overflow = ''
    exportButton.disabled = lastDatabase == null
  }
}

openButton.addEventListener('click', () => fileInput.click())

guideButton.addEventListener('click', () => {
  window.open('./guide.html', '_blank', 'noopener,noreferrer')
})

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0]
  if (!file) return

  const parseMode = getParseMode()
  lastFile = file
  lastDatabase = null
  exportButton.disabled = true
  viewer.clear()
  setLoading(true, `Opening ${file.name}…`, parseMode)
  setStatus(`Opening ${file.name} (${parseModeLabel(parseMode)})…`)

  try {
    const buffer = await file.arrayBuffer()
    setLoading(true, `Parsing ${file.name}…`, parseMode)
    const result = await openDrawing(buffer, file.name, { parseMode })
    lastDatabase = result.database
    viewer.load({
      database: result.database,
      fileName: file.name,
      fileType: result.fileType,
      fileSize: file.size,
      durationMs: result.durationMs
    })
    setStatus(
      `Opened ${file.name} in ${formatMs(result.durationMs)} (${parseModeLabel(result.parseMode)})`,
      'ok'
    )
  } catch (error) {
    console.error(error)
    viewer.clear()
    setStatus('Failed to open drawing.', 'error')
    showToast((error as Error).message || 'Failed to open drawing.', 'error')
  } finally {
    setLoading(false)
    fileInput.value = ''
  }
})

exportButton.addEventListener('click', () => {
  if (!lastFile || !lastDatabase) return

  exportButton.disabled = true
  try {
    setStatus('Exporting DXF…')
    const dxf = lastDatabase.dxfOut(undefined, 6)
    const base =
      lastFile.name.lastIndexOf('.') >= 0
        ? lastFile.name.slice(0, lastFile.name.lastIndexOf('.'))
        : lastFile.name
    const fileName = `${base}.dxf`
    const payload = typeof dxf === 'string' ? dxf : new Uint8Array(dxf)
    const blob = new Blob([payload], { type: 'application/dxf;charset=utf-8' })
    if (lastDownloadUrl) URL.revokeObjectURL(lastDownloadUrl)
    lastDownloadUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = lastDownloadUrl
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    setStatus(`Exported ${fileName}`, 'ok')
  } catch (error) {
    console.error(error)
    setStatus('Export failed.', 'error')
    showToast((error as Error).message || 'Export failed.', 'error')
  } finally {
    exportButton.disabled = lastDatabase == null
  }
})

setStatus('Open a DWG or DXF file to browse its drawing database.')
