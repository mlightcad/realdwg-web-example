import type { DrawingStats } from './collectStats'
import { createCollapsibleSection } from './collapsible'
import { formatBytes, formatMs, formatNumber } from './format'

export class StatsPane {
  readonly root: HTMLElement
  private content: HTMLElement

  constructor() {
    const section = createCollapsibleSection({
      title: 'Database stats',
      className: 'stats-box',
      storageKey: 'sidebar.stats'
    })
    this.root = section.root
    this.content = document.createElement('div')
    this.content.className = 'stats-content'
    section.body.appendChild(this.content)
    this.clear()
  }

  clear() {
    this.content.innerHTML = ''
    const hint = document.createElement('div')
    hint.className = 'empty-hint'
    hint.style.padding = '0'
    hint.textContent = 'Open a DWG or DXF file to see statistics.'
    this.content.appendChild(hint)
  }

  render(stats: DrawingStats | null) {
    if (!stats) {
      this.clear()
      return
    }

    const rows: Array<[string, string]> = [
      ['File', stats.fileName],
      ['Format', stats.fileType.toUpperCase()],
      ['Size', formatBytes(stats.fileSize)],
      ['Parse', formatMs(stats.durationMs)],
      ['Version', stats.version],
      ['Entities', formatNumber(stats.entityTotal)],
      ['Model space', formatNumber(stats.modelSpaceEntities)],
      ['Paper space', formatNumber(stats.paperSpaceEntities)],
      ['Blocks', formatNumber(stats.blockDefinitions)],
      ['Layers', formatNumber(stats.layers)],
      ['Linetypes', formatNumber(stats.linetypes)],
      ['Text styles', formatNumber(stats.textStyles)],
      ['Dim styles', formatNumber(stats.dimStyles)]
    ]

    const dl = document.createElement('dl')
    dl.className = 'stats-grid'
    for (const [label, value] of rows) {
      const dt = document.createElement('dt')
      dt.textContent = label
      const dd = document.createElement('dd')
      dd.textContent = value
      dd.title = value
      dl.appendChild(dt)
      dl.appendChild(dd)
    }
    this.content.innerHTML = ''
    this.content.appendChild(dl)
  }
}
