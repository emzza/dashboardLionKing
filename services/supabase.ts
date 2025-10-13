import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Creamos el cliente de Supabase usando variables de entorno de Vite
// Si no están definidas, se registra un warning para facilitar el diagnóstico
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase: faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el entorno.');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');