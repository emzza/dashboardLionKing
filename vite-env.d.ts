/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL_KEY: string;
  readonly VITE_SUPABASE_API_KEY: string;
  // podés agregar más variables si querés
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
