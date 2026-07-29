import type {
  AcDbDatabase,
  AcDbEntity,
  AcDbSymbolTableRecord
} from '@mlightcad/data-model'
import type { DrawingStats } from './collectStats'
import { colorToCss, formatBytes, formatColor, formatMs, formatNumber } from './format'
import type { CenterSelection, NavSelection, TableKind } from './types'

const PAGE_SIZE = 200

export class CenterPane {
  readonly root: HTMLElement
  private toolbar: HTMLElement
  private tableWrap: HTMLElement
  private searchInput: HTMLInputElement
  private typeFilter: HTMLSelectElement
  private database: AcDbDatabase | null = null
  private stats: DrawingStats | null = null
  private selection: NavSelection = { kind: 'overview' }
  private entities: AcDbEntity[] = []
  private selectedKey: string | null = null
  private onSelect: (selection: CenterSelection) => void

  constructor(onSelect: (selection: CenterSelection) => void) {
    this.onSelect = onSelect
    this.root = document.createElement('section')
    this.root.className = 'pane'

    const header = document.createElement('div')
    header.className = 'pane-header'
    header.textContent = 'Contents'

    this.toolbar = document.createElement('div')
    this.toolbar.className = 'center-toolbar'
    this.toolbar.hidden = true

    this.searchInput = document.createElement('input')
    this.searchInput.type = 'search'
    this.searchInput.placeholder = 'Filter…'
    this.searchInput.addEventListener('input', () => this.refreshList())

    this.typeFilter = document.createElement('select')
    this.typeFilter.addEventListener('change', () => this.refreshList())
    const allOpt = document.createElement('option')
    allOpt.value = ''
    allOpt.textContent = 'All types'
    this.typeFilter.appendChild(allOpt)

    this.toolbar.appendChild(this.searchInput)
    this.toolbar.appendChild(this.typeFilter)

    this.tableWrap = document.createElement('div')
    this.tableWrap.className = 'table-wrap'

    this.root.appendChild(header)
    this.root.appendChild(this.toolbar)
    this.root.appendChild(this.tableWrap)
    this.showHint('Open a DWG or DXF file to browse the drawing database.')
  }

  setDatabase(database: AcDbDatabase | null, stats: DrawingStats | null) {
    this.database = database
    this.stats = stats
    this.selectedKey = null
    this.selection = { kind: 'overview' }
    this.showNav(this.selection)
  }

  showNav(selection: NavSelection) {
    this.selection = selection
    this.selectedKey = null
    this.onSelect({ kind: 'none' })
    this.refreshList()
  }

  private showHint(text: string) {
    this.toolbar.hidden = true
    this.tableWrap.innerHTML = ''
    const hint = document.createElement('div')
    hint.className = 'empty-hint'
    hint.textContent = text
    this.tableWrap.appendChild(hint)
  }

  private refreshList() {
    if (!this.database || !this.stats) {
      this.showHint('Open a DWG or DXF file to browse the drawing database.')
      return
    }

    const { selection } = this
    if (selection.kind === 'overview') {
      this.toolbar.hidden = true
      this.renderKeyValueTable([
        ['File', this.stats.fileName],
        ['Format', this.stats.fileType.toUpperCase()],
        ['Size', formatBytes(this.stats.fileSize)],
        ['Parse time', formatMs(this.stats.durationMs)],
        ['Version', this.stats.version],
        ['Total entities', formatNumber(this.stats.entityTotal)],
        ['Model space entities', formatNumber(this.stats.modelSpaceEntities)],
        ['Paper space entities', formatNumber(this.stats.paperSpaceEntities)],
        ['Block definitions', formatNumber(this.stats.blockDefinitions)],
        ['Layers', formatNumber(this.stats.layers)],
        ['Linetypes', formatNumber(this.stats.linetypes)],
        ['Text styles', formatNumber(this.stats.textStyles)],
        ['Dim styles', formatNumber(this.stats.dimStyles)],
        ['Views', formatNumber(this.stats.views)],
        ['Viewports', formatNumber(this.stats.viewports)],
        ['UCS', formatNumber(this.stats.ucs)],
        ['App IDs', formatNumber(this.stats.appIds)]
      ])
      return
    }

    if (selection.kind === 'header') {
      this.toolbar.hidden = true
      const db = this.database
      this.renderKeyValueTable([
        ['ACADVER', db.version?.name ?? '—'],
        ['CLAYER', db.clayer],
        ['CECOLOR', formatColor(db.cecolor)],
        ['CELTYPE', db.celtype],
        ['CELTSCALE', String(db.celtscale)],
        ['LUNITS', String(db.lunits)],
        ['LUPREC', String(db.luprec)],
        ['AUNITS', String(db.aunits)],
        ['AUPREC', String(db.auprec)],
        ['ANGBASE', String(db.angbase)],
        ['ANGDIR', String(db.angdir)]
      ])
      return
    }

    if (selection.kind === 'table') {
      this.renderSymbolTable(selection.table)
      return
    }

    if (selection.kind === 'block') {
      this.renderBlockEntities(selection.blockName)
    }
  }

  private renderKeyValueTable(rows: Array<[string, string]>) {
    this.tableWrap.innerHTML = ''
    const table = document.createElement('table')
    table.className = 'data-table'
    table.innerHTML = '<thead><tr><th>Property</th><th>Value</th></tr></thead>'
    const tbody = document.createElement('tbody')
    for (const [key, value] of rows) {
      const tr = document.createElement('tr')
      tr.innerHTML = `<td>${escapeHtml(key)}</td><td>${escapeHtml(value)}</td>`
      tbody.appendChild(tr)
    }
    table.appendChild(tbody)
    this.tableWrap.appendChild(table)
  }

  private getTableRecords(table: TableKind): AcDbSymbolTableRecord[] {
    const tables = this.database!.tables
    switch (table) {
      case 'layer':
        return [...tables.layerTable.newIterator()]
      case 'linetype':
        return [...tables.linetypeTable.newIterator()]
      case 'textStyle':
        return [...tables.textStyleTable.newIterator()]
      case 'dimStyle':
        return [...tables.dimStyleTable.newIterator()]
      case 'block':
        return [...tables.blockTable.newIterator()]
      case 'view':
        return [...tables.viewTable.newIterator()]
      case 'viewport':
        return [...tables.viewportTable.newIterator()]
      case 'ucs':
        return [...tables.ucsTable.newIterator()]
      case 'appId':
        return [...tables.appIdTable.newIterator()]
    }
  }

  private renderSymbolTable(table: TableKind) {
    this.toolbar.hidden = false
    this.typeFilter.hidden = true
    const query = this.searchInput.value.trim().toLowerCase()
    let records = this.getTableRecords(table)
    if (query) {
      records = records.filter(r => r.name.toLowerCase().includes(query))
    }

    this.tableWrap.innerHTML = ''
    const el = document.createElement('table')
    el.className = 'data-table'
    const thead = document.createElement('thead')
    thead.innerHTML =
      table === 'layer'
        ? '<tr><th>Name</th><th>Color</th><th>Linetype</th><th>Flags</th></tr>'
        : table === 'block'
          ? '<tr><th>Name</th><th>Entities</th><th>Object ID</th></tr>'
          : '<tr><th>Name</th><th>Object ID</th></tr>'
    el.appendChild(thead)

    const tbody = document.createElement('tbody')
    for (const record of records) {
      const tr = document.createElement('tr')
      const key = `${table}:${record.name}`
      tr.setAttribute('aria-selected', this.selectedKey === key ? 'true' : 'false')
      tr.addEventListener('click', () => {
        this.selectedKey = key
        tbody
          .querySelectorAll('tr')
          .forEach(row => row.setAttribute('aria-selected', 'false'))
        tr.setAttribute('aria-selected', 'true')
        this.onSelect({ kind: 'record', table, name: record.name })
      })

      if (table === 'layer') {
        const layer = record as import('@mlightcad/data-model').AcDbLayerTableRecord
        const colorLabel = formatColor(layer.color)
        const css = colorToCss(layer.color)
        const flags = [
          layer.isOff ? 'Off' : null,
          layer.isFrozen ? 'Frozen' : null,
          layer.isLocked ? 'Locked' : null,
          !layer.isPlottable ? 'NoPlot' : null
        ]
          .filter(Boolean)
          .join(', ')
        tr.innerHTML = `
          <td>${escapeHtml(layer.name)}</td>
          <td>${css ? `<span class="color-swatch" style="background:${css}"></span>` : ''}${escapeHtml(colorLabel)}</td>
          <td>${escapeHtml(layer.linetype || '—')}</td>
          <td>${escapeHtml(flags || '—')}</td>`
      } else if (table === 'block') {
        const block = record as import('@mlightcad/data-model').AcDbBlockTableRecord
        const count = [...block.newIterator()].length
        tr.innerHTML = `
          <td>${escapeHtml(block.name)}</td>
          <td>${count}</td>
          <td>${escapeHtml(block.objectId)}</td>`
      } else {
        tr.innerHTML = `
          <td>${escapeHtml(record.name)}</td>
          <td>${escapeHtml(record.objectId)}</td>`
      }
      tbody.appendChild(tr)
    }
    el.appendChild(tbody)
    this.tableWrap.appendChild(el)

    if (records.length === 0) {
      this.showHint('No records match the current filter.')
      this.toolbar.hidden = false
    }
  }

  private renderBlockEntities(blockName: string) {
    const block = this.database!.tables.blockTable.getAt(blockName)
    if (!block) {
      this.showHint(`Block "${blockName}" was not found.`)
      return
    }

    this.entities = [...block.newIterator()]
    this.toolbar.hidden = false
    this.typeFilter.hidden = false

    const types = [...new Set(this.entities.map(e => e.type))].sort()
    const previous = this.typeFilter.value
    this.typeFilter.innerHTML = ''
    const allOpt = document.createElement('option')
    allOpt.value = ''
    allOpt.textContent = 'All types'
    this.typeFilter.appendChild(allOpt)
    for (const type of types) {
      const opt = document.createElement('option')
      opt.value = type
      opt.textContent = type
      this.typeFilter.appendChild(opt)
    }
    if (types.includes(previous)) this.typeFilter.value = previous

    const query = this.searchInput.value.trim().toLowerCase()
    const type = this.typeFilter.value
    let filtered = this.entities
    if (type) filtered = filtered.filter(e => e.type === type)
    if (query) {
      filtered = filtered.filter(
        e =>
          e.type.toLowerCase().includes(query) ||
          e.layer.toLowerCase().includes(query) ||
          e.objectId.toLowerCase().includes(query)
      )
    }

    const visible = filtered.slice(0, PAGE_SIZE)
    this.tableWrap.innerHTML = ''
    const table = document.createElement('table')
    table.className = 'data-table'
    table.innerHTML =
      '<thead><tr><th>Type</th><th>Layer</th><th>Color</th><th>Object ID</th></tr></thead>'
    const tbody = document.createElement('tbody')

    for (const entity of visible) {
      const tr = document.createElement('tr')
      const key = `entity:${entity.objectId}`
      tr.setAttribute('aria-selected', this.selectedKey === key ? 'true' : 'false')
      tr.addEventListener('click', () => {
        this.selectedKey = key
        tbody
          .querySelectorAll('tr')
          .forEach(row => row.setAttribute('aria-selected', 'false'))
        tr.setAttribute('aria-selected', 'true')
        this.onSelect({ kind: 'entity', objectId: entity.objectId })
      })
      const css = colorToCss(entity.color)
      tr.innerHTML = `
        <td>${escapeHtml(entity.type)}</td>
        <td>${escapeHtml(entity.layer)}</td>
        <td>${css ? `<span class="color-swatch" style="background:${css}"></span>` : ''}${escapeHtml(formatColor(entity.color))}</td>
        <td>${escapeHtml(entity.objectId)}</td>`
      tbody.appendChild(tr)
    }
    table.appendChild(tbody)
    this.tableWrap.appendChild(table)

    if (filtered.length > PAGE_SIZE) {
      const note = document.createElement('div')
      note.className = 'empty-hint'
      note.textContent = `Showing first ${PAGE_SIZE} of ${filtered.length} entities. Refine the filter to narrow results.`
      this.tableWrap.appendChild(note)
    } else if (filtered.length === 0) {
      const note = document.createElement('div')
      note.className = 'empty-hint'
      note.textContent = 'No entities match the current filter.'
      this.tableWrap.appendChild(note)
    }
  }
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
