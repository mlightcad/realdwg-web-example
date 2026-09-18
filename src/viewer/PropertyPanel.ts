import type {
  AcDbDatabase,
  AcDbEntity,
  AcDbEntityRuntimeProperty,
  AcDbBlockTableRecord,
  AcDbLayerTableRecord,
  AcDbSymbolTableRecord
} from '@mlightcad/data-model'
import { colorToCss, formatPropValue, isColorValue } from './format'
import type { CenterSelection, TableKind } from './types'

export class PropertyPanel {
  readonly root: HTMLElement
  private body: HTMLElement
  private database: AcDbDatabase | null = null

  constructor() {
    this.root = document.createElement('aside')
    this.root.className = 'pane'

    const header = document.createElement('div')
    header.className = 'pane-header'
    header.textContent = 'Properties'

    this.body = document.createElement('div')
    this.body.className = 'prop-groups'

    this.root.appendChild(header)
    this.root.appendChild(this.body)
    this.clear('Select a table record or entity to inspect properties.')
  }

  setDatabase(database: AcDbDatabase | null) {
    this.database = database
    this.clear(
      database
        ? 'Select a table record or entity to inspect properties.'
        : 'Open a drawing to inspect object properties.'
    )
  }

  show(selection: CenterSelection) {
    if (!this.database || selection.kind === 'none') {
      this.clear(
        this.database
          ? 'Select a table record or entity to inspect properties.'
          : 'Open a drawing to inspect object properties.'
      )
      return
    }

    if (selection.kind === 'entity') {
      const entity = this.database.getObjectById(selection.objectId)
      if (!(entity && 'properties' in entity)) {
        this.clear(`Entity ${selection.objectId} was not found.`)
        return
      }
      this.renderEntity(entity as AcDbEntity)
      return
    }

    this.renderRecord(selection.table, selection.name)
  }

  private clear(message: string) {
    this.body.innerHTML = ''
    const hint = document.createElement('div')
    hint.className = 'empty-hint'
    hint.textContent = message
    this.body.appendChild(hint)
  }

  private renderEntity(entity: AcDbEntity) {
    this.body.innerHTML = ''
    const typeRow = document.createElement('div')
    typeRow.className = 'prop-group-title'
    typeRow.textContent = entity.type
    this.body.appendChild(typeRow)

    for (const group of entity.properties.groups) {
      const title = document.createElement('div')
      title.className = 'prop-group-title'
      title.textContent = group.groupName
      this.body.appendChild(title)

      for (const prop of group.properties) {
        this.body.appendChild(this.propRow(prop.name, this.readProp(prop), prop))
      }
    }
  }

  private readProp(prop: AcDbEntityRuntimeProperty): unknown {
    try {
      return prop.accessor?.get?.() ?? (prop as { value?: unknown }).value
    } catch {
      return '—'
    }
  }

  private renderRecord(table: TableKind, name: string) {
    const record = this.getRecord(table, name)
    if (!record) {
      this.clear(`Record "${name}" was not found.`)
      return
    }

    this.body.innerHTML = ''
    const title = document.createElement('div')
    title.className = 'prop-group-title'
    title.textContent = `${tableLabel(table)} · ${name}`
    this.body.appendChild(title)

    const attrs = record.attrs.attributes as Record<string, unknown>
    const preferredOrder = ['name', 'objectId', 'ownerId']
    const keys = [
      ...preferredOrder.filter(key => key in attrs),
      ...Object.keys(attrs)
        .filter(key => !preferredOrder.includes(key))
        .sort((a, b) => a.localeCompare(b))
    ]

    for (const key of keys) {
      const value = attrs[key]
      if (key === 'gsView' && value && typeof value === 'object' && !Array.isArray(value)) {
        const nested = value as Record<string, unknown>
        for (const nestedKey of Object.keys(nested).sort((a, b) =>
          a.localeCompare(b)
        )) {
          const nestedValue = nested[nestedKey]
          this.body.appendChild(
            this.simpleRow(
              attrLabel(`gsView.${nestedKey}`),
              formatPropValue(nestedValue),
              isColorValue(nestedValue) ? nestedValue : undefined
            )
          )
        }
        continue
      }

      this.body.appendChild(
        this.simpleRow(
          attrLabel(key),
          formatPropValue(value),
          isColorValue(value) ? value : undefined
        )
      )
    }

    if (table === 'layer') {
      const layer = record as AcDbLayerTableRecord
      this.body.appendChild(this.simpleRow('Frozen', String(layer.isFrozen)))
      this.body.appendChild(this.simpleRow('Locked', String(layer.isLocked)))
    } else if (table === 'block') {
      const block = record as AcDbBlockTableRecord
      this.body.appendChild(
        this.simpleRow('Entities', String([...block.newIterator()].length))
      )
      this.body.appendChild(
        this.simpleRow('Model space', String(block.isModelSapce))
      )
      this.body.appendChild(
        this.simpleRow('Paper space', String(block.isPaperSapce))
      )
    }
  }

  private getRecord(
    table: TableKind,
    name: string
  ): AcDbSymbolTableRecord | undefined {
    const tables = this.database!.tables
    switch (table) {
      case 'layer':
        return tables.layerTable.getAt(name)
      case 'linetype':
        return tables.linetypeTable.getAt(name)
      case 'textStyle':
        return tables.textStyleTable.getAt(name)
      case 'dimStyle':
        return tables.dimStyleTable.getAt(name)
      case 'block':
        return tables.blockTable.getAt(name)
      case 'view':
        return tables.viewTable.getAt(name)
      case 'viewport':
        return tables.viewportTable.getAt(name)
      case 'ucs':
        return tables.ucsTable.getAt(name)
      case 'appId':
        return tables.appIdTable.getAt(name)
    }
  }

  private propRow(
    name: string,
    value: unknown,
    prop?: AcDbEntityRuntimeProperty
  ): HTMLElement {
    const row = document.createElement('div')
    row.className = 'prop-row'
    const nameEl = document.createElement('div')
    nameEl.className = 'prop-name'
    nameEl.textContent = name
    const valueEl = document.createElement('div')
    valueEl.className = 'prop-value'

    if (prop?.type === 'color') {
      const css = colorToCss(value as never)
      if (css) {
        const swatch = document.createElement('span')
        swatch.className = 'color-swatch'
        swatch.style.background = css
        valueEl.appendChild(swatch)
      }
    }

    valueEl.append(formatPropValue(value))
    row.appendChild(nameEl)
    row.appendChild(valueEl)
    return row
  }

  private simpleRow(
    name: string,
    value: string,
    color?: import('@mlightcad/data-model').AcCmColor
  ): HTMLElement {
    const row = document.createElement('div')
    row.className = 'prop-row'
    const nameEl = document.createElement('div')
    nameEl.className = 'prop-name'
    nameEl.textContent = name
    const valueEl = document.createElement('div')
    valueEl.className = 'prop-value'
    const css = colorToCss(color)
    if (css) {
      const swatch = document.createElement('span')
      swatch.className = 'color-swatch'
      swatch.style.background = css
      valueEl.appendChild(swatch)
    }
    valueEl.append(value)
    row.appendChild(nameEl)
    row.appendChild(valueEl)
    return row
  }
}

const ATTR_LABELS: Record<string, string> = {
  name: 'Name',
  objectId: 'Object ID',
  ownerId: 'Owner ID',
  extensionDictionary: 'Extension dictionary',
  isOff: 'Off',
  isFrozen: 'Frozen',
  isLocked: 'Locked',
  isPlottable: 'Plottable',
  isHidden: 'Hidden',
  isInUse: 'In use',
  lineWeight: 'Line weight',
  materialId: 'Material ID',
  layoutId: 'Layout ID',
  previewIcon: 'Preview icon',
  blockInsertUnits: 'Block insert units',
  blockScaling: 'Block scaling',
  standardFlags: 'Standard flags',
  standardFlag: 'Standard flag'
}

const attrLabel = (key: string): string => {
  if (ATTR_LABELS[key]) return ATTR_LABELS[key]
  if (key.startsWith('gsView.')) {
    return `View · ${attrLabel(key.slice('gsView.'.length))}`
  }
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

const tableLabel = (table: TableKind): string => {
  switch (table) {
    case 'layer':
      return 'Layer'
    case 'linetype':
      return 'Linetype'
    case 'textStyle':
      return 'Text style'
    case 'dimStyle':
      return 'Dim style'
    case 'block':
      return 'Block'
    case 'view':
      return 'View'
    case 'viewport':
      return 'Viewport'
    case 'ucs':
      return 'UCS'
    case 'appId':
      return 'App ID'
  }
}
