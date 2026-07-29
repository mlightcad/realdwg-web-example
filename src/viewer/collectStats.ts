import type { AcDbDatabase, AcDbFileType } from '@mlightcad/data-model'
import { AcDbBlockTableRecord } from '@mlightcad/data-model'

export interface DrawingStats {
  fileName: string
  fileType: AcDbFileType
  fileSize: number
  durationMs: number
  version: string
  entityTotal: number
  modelSpaceEntities: number
  paperSpaceEntities: number
  blockDefinitions: number
  layers: number
  linetypes: number
  textStyles: number
  dimStyles: number
  views: number
  viewports: number
  ucs: number
  appIds: number
}

export const collectStats = (
  database: AcDbDatabase,
  meta: {
    fileName: string
    fileType: AcDbFileType
    fileSize: number
    durationMs: number
  }
): DrawingStats => {
  const tables = database.tables
  let entityTotal = 0
  let modelSpaceEntities = 0
  let paperSpaceEntities = 0
  let blockDefinitions = 0

  for (const block of tables.blockTable.newIterator()) {
    const count = [...block.newIterator()].length
    entityTotal += count
    if (block.isModelSapce) {
      modelSpaceEntities = count
    } else if (block.isPaperSapce) {
      paperSpaceEntities += count
    } else if (
      !AcDbBlockTableRecord.isModelSapceName(block.name) &&
      !AcDbBlockTableRecord.isPaperSapceName(block.name)
    ) {
      blockDefinitions += 1
    }
  }

  return {
    fileName: meta.fileName,
    fileType: meta.fileType,
    fileSize: meta.fileSize,
    durationMs: meta.durationMs,
    version: database.version?.name ?? '—',
    entityTotal,
    modelSpaceEntities,
    paperSpaceEntities,
    blockDefinitions,
    layers: tables.layerTable.numEntries,
    linetypes: tables.linetypeTable.numEntries,
    textStyles: tables.textStyleTable.numEntries,
    dimStyles: tables.dimStyleTable.numEntries,
    views: tables.viewTable.numEntries,
    viewports: tables.viewportTable.numEntries,
    ucs: tables.ucsTable.numEntries,
    appIds: tables.appIdTable.numEntries
  }
}
