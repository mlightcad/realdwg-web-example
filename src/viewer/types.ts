export type TableKind =
  | 'layer'
  | 'linetype'
  | 'textStyle'
  | 'dimStyle'
  | 'block'
  | 'view'
  | 'viewport'
  | 'ucs'
  | 'appId'

export type NavSelection =
  | { kind: 'overview' }
  | { kind: 'header' }
  | { kind: 'table'; table: TableKind }
  | { kind: 'block'; blockName: string }

export type CenterSelection =
  | { kind: 'none' }
  | { kind: 'entity'; objectId: string }
  | { kind: 'record'; table: TableKind; name: string }
