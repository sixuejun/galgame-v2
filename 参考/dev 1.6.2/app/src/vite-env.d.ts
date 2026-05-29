/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_FILE_PATH: string
  readonly VITE_APP_TITLE: string
  readonly VITE_DEBUG: string
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 构建时注入的全局变量
declare const __APP_VERSION__: string
declare const __BUILD_TIME__: string
