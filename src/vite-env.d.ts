/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DWG_LICENSE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
