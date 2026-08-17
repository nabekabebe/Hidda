/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FAMILY_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
