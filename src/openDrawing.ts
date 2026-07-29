import {
  AcDbDatabase,
  AcDbDatabaseConverterManager,
  AcDbFileType,
  acdbHostApplicationServices,
  AcDbOpenDatabaseOptions
} from '@mlightcad/data-model'
import { AcDbDwgConverter } from '@mlight-cad/dwg-converter'

let convertersRegistered = false

const registerConverters = () => {
  if (convertersRegistered) return

  const licenseKey = import.meta.env.VITE_DWG_LICENSE_KEY as string | undefined
  const dwgConverter = new AcDbDwgConverter({
    convertByEntityType: false,
    useWorker: true,
    parserWorkerUrl: `${import.meta.env.BASE_URL}assets/dwg-parser-worker.js`,
    ...(licenseKey ? { licenseKey } : {})
  })
  AcDbDatabaseConverterManager.instance.register(AcDbFileType.DWG, dwgConverter)
  convertersRegistered = true
}

export const getFileType = (fileName: string): AcDbFileType => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  return extension === 'dwg' ? AcDbFileType.DWG : AcDbFileType.DXF
}

export interface OpenDrawingResult {
  database: AcDbDatabase
  fileType: AcDbFileType
  durationMs: number
}

export const openDrawing = async (
  buffer: ArrayBuffer,
  fileName: string
): Promise<OpenDrawingResult> => {
  registerConverters()

  const fileType = getFileType(fileName)
  const database = new AcDbDatabase()
  acdbHostApplicationServices().workingDatabase = database

  const options: AcDbOpenDatabaseOptions = {
    minimumChunkSize: 1000,
    readOnly: true,
    fileName
  }

  const start = performance.now()
  await database.read(buffer, options, fileType)
  const durationMs = performance.now() - start

  return { database, fileType, durationMs }
}
