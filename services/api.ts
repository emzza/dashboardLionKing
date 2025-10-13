import { Administrador, Cajero, Macro } from '../types';

// Configuración de la API Flask
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  
// Interfaces para las respuestas de la API Flask
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Función auxiliar para hacer peticiones HTTP
// Normaliza respuestas: si el backend no envía { success, data }, se envuelve como success=true
const apiRequest = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      // Intentamos leer el cuerpo para obtener mensaje de error si existe
      let message = `HTTP error! status: ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson?.message || errJson?.error) message = errJson.message || errJson.error;
      } catch {}
      return { success: false, message };
    }

    const json = await response.json();
    // Si ya cumple el contrato, retornamos tal cual; si no, envolvemos
    if (typeof json === 'object' && json !== null && ('success' in json || 'data' in json || 'error' in json || 'message' in json)) {
      return json as ApiResponse<T>;
    }
    return { success: true, data: json as T };
  } catch (error: any) {
    console.error(`Error en petición a ${endpoint}:`, error);
    return { success: false, message: error?.message || 'Network/unknown error' };
  }
};

// --- AUTENTICACIÓN ---
export const signIn = async (nombre: string, contrasena: string): Promise<Administrador | null> => {
  const response = await apiRequest<{ admin: Administrador } | Administrador>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ nombre, contrasena }),
  });
  // El backend puede devolver { success: true, admin: {...} }.
  const admin = (response as any).admin ?? response.data ?? null;
  return response.success ? (admin as Administrador) || null : null;
};

// --- MACROS ---
export const fetchMacro = async (id: number): Promise<Macro | null> => {
  // La API devuelve CBUs globales (ID=1); se ignora el parámetro id
  const response = await apiRequest<{ cbu90: string; cbu100: string }>('/macros/cbus', {
    method: 'GET',
  });
  return response.success && response.data ? {
    id: 1,
    'cbu90%': response.data.cbu90,
    'cbu100%': response.data.cbu100,
  } : null;
};

export const updateMacro = async (id: number, updates: Partial<Macro>) => {
  const response = await apiRequest('/macros/cbus', {
    method: 'PUT',
    body: JSON.stringify({
      cbu90: updates['cbu90%'],
      cbu100: updates['cbu100%'],
    }),
  });
  if (!response.success) {
    throw new Error(response.message || 'Error updating macro');
  }
  return response.data;
};

// --- CAJEROS ---
export const fetchCajerosForAdmin = async (adminId: number): Promise<Cajero[]> => {
  const response = await apiRequest<{ cajeros: Cajero[] } | Cajero[]>(`/admin/${adminId}/cajeros`, {
    method: 'GET',
  });
  // El backend puede devolver { success: true, cajeros: [...] } o un array directo
  const cajeros = (response as any).cajeros ?? response.data ?? [];
  // Normalizamos campos para que coincidan con la interfaz Cajero del frontend
  const normalized = Array.isArray(cajeros)
    ? cajeros.map((c: any) => ({
        ...c,
        // Convertir 'open'/'close' a booleano
        estadolinea:
          typeof c.estadolinea === 'string'
            ? c.estadolinea.toLowerCase() === 'open'
            : !!c.estadolinea,
        // Mapear 'conteodia' (backend) a 'conteoDia' (frontend)
        conteoDia: c.conteoDia ?? c.conteodia ?? 0,
      }))
    : [];
  return response.success ? normalized : [];
};

export const updateCajero = async (id: number, updates: Partial<Cajero>) => {
  const response = await apiRequest(`/cajero/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...updates,
    }),
  });
  if (!response.success) {
    throw new Error(response.message || 'Error updating cajero');
  }
  return response.data;
};

// --- ADMINISTRADORES ---
export const fetchAllAdmins = async (): Promise<Administrador[]> => {
  const response = await apiRequest<Administrador[]>('/admin/all', {
    method: 'GET',
  });
  return response.success ? response.data || [] : [];
};

export const updateAdmin = async (id: number, updates: Partial<Administrador>) => {
  const response = await apiRequest(`/admin/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...updates,
    }),
  });
  if (!response.success) {
    throw new Error(response.message || 'Error updating admin');
  }
  return response.data;
};

// --- FUNCIONES AUXILIARES PARA OBTENER IDs ---
export const getAdminIdByName = async (nombre: string): Promise<number | null> => {
  const response = await apiRequest<{ id: number }>(`/admin/name/${encodeURIComponent(nombre)}`, {
    method: 'GET',
  });
  return response.success && response.data ? response.data.id : null;
};

export const getCajeroIdByName = async (nombre: string): Promise<number | null> => {
  const response = await apiRequest<{ id: number }>(`/cajero/name/${encodeURIComponent(nombre)}`, {
    method: 'GET',
  });
  return response.success && response.data ? response.data.id : null;
};

// --- FUNCIONES NO DISPONIBLES EN LA API FLASK ---
// Estas funciones no tienen equivalente directo en la API Flask proporcionada
// Tendrás que implementarlas en el backend o manejarlas de otra manera

export const fetchAllCajeros = async (): Promise<Cajero[]> => {
  // Esta función no tiene equivalente directo en la API Flask
  // Podrías necesitar implementar un endpoint adicional en Flask
  console.warn('fetchAllCajeros: Esta función no tiene equivalente en la API Flask');
  return [];
};

export const createCajero = async (newCajero: Omit<Cajero, 'id'>) => {
  try {
    const response = await fetch(`/api/cajero/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newCajero),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Error al crear cajero');
    }

    return data.cajero; // el objeto que devuelve tu API Flask
  } catch (error) {
    console.error('Error en createCajero:', error);
    throw error;
  }
};


export const linkCajeroToAdmin = async (cajeroId: number, adminId: number) => {
  // Esta función no tiene equivalente directo en la API Flask
  console.warn('linkCajeroToAdmin: Esta función no tiene equivalente en la API Flask');
  throw new Error('Función no disponible en la API Flask');
};

export const fetchCajeroIdsForAdmin = async (adminId: number): Promise<number[]> => {
  // Podemos obtener esto a partir de fetchCajerosForAdmin
  try {
    const cajeros = await fetchCajerosForAdmin(adminId);
    return cajeros.map(cajero => cajero.id);
  } catch (error) {
    console.error('Error fetching cajero IDs for admin:', error);
    return [];
  }
};

export const updateAdminCajeroRelations = async (adminId: number, cajeroIds: number[]) => {
  // Esta función no tiene equivalente directo en la API Flask
  console.warn('updateAdminCajeroRelations: Esta función no tiene equivalente en la API Flask');
  throw new Error('Función no disponible en la API Flask');
};

export const createAdmin = async (newAdmin: Omit<Administrador, 'id'>) => {
  // Esta función no tiene equivalente directo en la API Flask
  console.warn('createAdmin: Esta función no tiene equivalente en la API Flask');
  throw new Error('Función no disponible en la API Flask');
};

// --- ACTUALIZACIONES PERIÓDICAS (POLLING) ---
// Las suscripciones en tiempo real no están disponibles con una API REST
// Se implementa un sistema de polling como alternativa

// --- FUNCIONES DE POLLING PARA SIMULAR TIEMPO REAL ---
// Estas funciones pueden ser utilizadas para implementar actualizaciones periódicas

export const startPolling = (
  pollFunction: () => Promise<void>,
  intervalMs: number = 30000
): NodeJS.Timeout => {
  return setInterval(pollFunction, intervalMs);
};

export const stopPolling = (intervalId: NodeJS.Timeout) => {
  clearInterval(intervalId);
};