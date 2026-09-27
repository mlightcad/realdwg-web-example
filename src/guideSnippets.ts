export const INTEGRATION_SNIPPET = `import {
  AcDbDatabase,
  AcDbDatabaseConverterManager,
  AcDbFileType,
  acdbHostApplicationServices
} from '@mlightcad/data-model'
import { AcDbDwgConverter } from '@mlightcad/dwg-converter'

const converter = new AcDbDwgConverter({
  parserWorkerUrl: '${import.meta.env.BASE_URL}assets/dwg-parser-worker.js',
  licenseKey: import.meta.env.VITE_DWG_LICENSE_KEY
})
AcDbDatabaseConverterManager.instance.register(AcDbFileType.DWG, converter)

const database = new AcDbDatabase()
acdbHostApplicationServices().workingDatabase = database
await database.read(buffer, { minimumChunkSize: 1000, readOnly: true }, AcDbFileType.DWG)`
