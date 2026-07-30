import {
  AcDbDatabase,
  AcDbDatabaseConverterManager,
  AcDbFileType,
  acdbHostApplicationServices,
  AcDbOpenDatabaseOptions
} from '@mlightcad/data-model'
import { AcDbDwgConverter } from '@mlight-cad/dwg-converter'

/** Where DWG parsing runs. DXF always uses the native main-thread converter. */
export type DwgParseMode = 'worker' | 'main'

let registeredParseMode: DwgParseMode | null = null

const registerConverters = (parseMode: DwgParseMode) => {
  if (registeredParseMode === parseMode) return

  const useWorker = parseMode === 'worker'
  const licenseKey = import.meta.env.VITE_DWG_LICENSE_KEY as string | undefined
  const dwgConverter = new AcDbDwgConverter({
    convertByEntityType: false,
    useWorker,
    ...(useWorker
      ? {
          parserWorkerUrl: `${import.meta.env.BASE_URL}assets/dwg-parser-worker.js`
        }
      : {}),
    ...(licenseKey ? { licenseKey } : {})
  })
  AcDbDatabaseConverterManager.instance.register(AcDbFileType.DWG, dwgConverter)
  registeredParseMode = parseMode
}

export const getFileType = (fileName: string): AcDbFileType => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  return extension === 'dwg' ? AcDbFileType.DWG : AcDbFileType.DXF
}

export interface OpenDrawingOptions {
  /** DWG parse threading. Defaults to `'worker'`. Ignored for DXF. */
  parseMode?: DwgParseMode
}

export interface OpenDrawingResult {
  database: AcDbDatabase
  fileType: AcDbFileType
  durationMs: number
  parseMode: DwgParseMode
}

export const openDrawing = async (
  buffer: ArrayBuffer,
  fileName: string,
  options: OpenDrawingOptions = {}
): Promise<OpenDrawingResult> => {
  const parseMode = options.parseMode ?? 'worker'
  registerConverters(parseMode)

  const fileType = getFileType(fileName)
  const database = new AcDbDatabase()
  acdbHostApplicationServices().workingDatabase = database

  const openOptions: AcDbOpenDatabaseOptions = {
    minimumChunkSize: 1000,
    readOnly: true,
    fileName
  }

  const start = performance.now()
  await database.read(buffer, openOptions, fileType)
  const durationMs = performance.now() - start

  return { database, fileType, durationMs, parseMode }
}
