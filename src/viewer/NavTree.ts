import type { AcDbDatabase } from '@mlightcad/data-model'
import { AcDbBlockTableRecord } from '@mlightcad/data-model'
import type { DrawingStats } from './collectStats'
import { createCollapsibleSection } from './collapsible'
import type { NavSelection, TableKind } from './types'

export class NavTree {
  readonly root: HTMLElement
  private selected: NavSelection = { kind: 'overview' }
  private onSelect: (selection: NavSelection) => void

  constructor(onSelect: (selection: NavSelection) => void) {
    this.onSelect = onSelect
    this.root = document.createElement('div')
    this.root.className = 'nav-tree'
    this.renderEmpty()
  }

  private renderEmpty() {
    this.root.innerHTML = ''
    const hint = document.createElement('div')
    hint.className = 'empty-hint'
    hint.textContent = 'Navigation will appear after a drawing is opened.'
    this.root.appendChild(hint)
  }

  getSelection(): NavSelection {
    return this.selected
  }

  render(database: AcDbDatabase | null, stats: DrawingStats | null) {
    if (!database || !stats) {
      this.renderEmpty()
      return
    }

    this.root.innerHTML = ''
    this.addGroup('General', 'sidebar.nav.general', [
      this.item('Overview', { kind: 'overview' }),
      this.item('Header', { kind: 'header' })
    ])

    const tables: Array<[string, TableKind, number]> = [
      ['Layers', 'layer', stats.layers],
      ['Linetypes', 'linetype', stats.linetypes],
      ['Text styles', 'textStyle', stats.textStyles],
      ['Dim styles', 'dimStyle', stats.dimStyles],
      ['Blocks', 'block', database.tables.blockTable.numEntries],
      ['Views', 'view', stats.views],
      ['Viewports', 'viewport', stats.viewports],
      ['UCS', 'ucs', stats.ucs],
      ['App IDs', 'appId', stats.appIds]
    ]

    this.addGroup(
      'Symbol tables',
      'sidebar.nav.tables',
      tables.map(([label, table, count]) =>
        this.item(label, { kind: 'table', table }, count)
      )
    )

    const spaces: HTMLButtonElement[] = []
    const namedBlocks: HTMLButtonElement[] = []
    for (const block of database.tables.blockTable.newIterator()) {
      const count = [...block.newIterator()].length
      const btn = this.item(
        block.name,
        { kind: 'block', blockName: block.name },
        count,
        true
      )
      if (
        AcDbBlockTableRecord.isModelSapceName(block.name) ||
        AcDbBlockTableRecord.isPaperSapceName(block.name)
      ) {
        spaces.push(btn)
      } else {
        namedBlocks.push(btn)
      }
    }

    this.addGroup('Spaces', 'sidebar.nav.spaces', spaces)
    if (namedBlocks.length > 0) {
      this.addGroup(
        'Block definitions',
        'sidebar.nav.blocks',
        namedBlocks,
        false
      )
    }
  }

  private addGroup(
    label: string,
    storageKey: string,
    items: HTMLElement[],
    expanded = true
  ) {
    const section = createCollapsibleSection({
      title: label,
      className: 'tree-group',
      storageKey,
      expanded
    })
    for (const item of items) {
      section.body.appendChild(item)
    }
    this.root.appendChild(section.root)
  }

  private item(
    label: string,
    selection: NavSelection,
    count?: number,
    indent = false
  ): HTMLButtonElement {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = indent ? 'tree-item indent' : 'tree-item'
    button.setAttribute(
      'aria-selected',
      this.isSame(this.selected, selection) ? 'true' : 'false'
    )

    const name = document.createElement('span')
    name.textContent = label
    button.appendChild(name)

    if (count != null) {
      const badge = document.createElement('span')
      badge.className = 'count'
      badge.textContent = String(count)
      button.appendChild(badge)
    }

    button.addEventListener('click', () => {
      this.selected = selection
      this.root
        .querySelectorAll('.tree-item')
        .forEach(el => el.setAttribute('aria-selected', 'false'))
      button.setAttribute('aria-selected', 'true')
      this.onSelect(selection)
    })

    return button
  }

  private isSame(a: NavSelection, b: NavSelection): boolean {
    if (a.kind !== b.kind) return false
    if (a.kind === 'table' && b.kind === 'table') return a.table === b.table
    if (a.kind === 'block' && b.kind === 'block') {
      return a.blockName === b.blockName
    }
    return true
  }
}
