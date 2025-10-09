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
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error en petición a ${endpoint}:`, error);
    throw error;
  }
};

// --- AUTENTICACIÓN ---
export const signIn = async (nombre: string, contrasena: string): Promise<Administrador | null> => {
  try {
    const response = await apiRequest<Administrador>('/iniciar_sesion_administrador', {
      method: 'POST',
      body: JSON.stringify({ nombre, contrasena }),
    });
    
    return response.success ? response.data || null : null;
  } catch (error) {
    console.error('Error signing in:', error);
    return null;
  }
};

// --- MACROS ---
export const fetchMacro = async (id: number): Promise<Macro | null> => {
  try {
    // Como la API solo devuelve los CBUs de la tabla macros (ID = 1), ignoramos el parámetro id
    const response = await apiRequest<{cbu90: string, cbu100: string}>('/obtener_cbus_macro', {
      method: 'GET',
    });
    
    return response.success && response.data ? {
      id: 1,
      'cbu90%': response.data.cbu90,
      'cbu100%': response.data.cbu100,
    } : null;
  } catch (error) {
    console.error('Error fetching macro:', error);
    return null;
  }
};

export const updateMacro = async (id: number, updates: Partial<Macro>) => {
  try {
    const response = await apiRequest('/modificar_cbus_macro', {
      method: 'PUT',
      body: JSON.stringify({
        cbu90_nuevo: updates['cbu90%'],
        cbu100_nuevo: updates['cbu100%'],
      }),
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Error updating macro');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error updating macro:', error);
    throw error;
  }
};

// --- CAJEROS ---
export const fetchCajerosForAdmin = async (adminId: number): Promise<Cajero[]> => {
  try {
    const response = await apiRequest<Cajero[]>('/obtener_cajeros_por_administrador', {
      method: 'POST',
      body: JSON.stringify({ id_administrador: adminId }),
    });
    
    return response.success ? response.data || [] : [];
  } catch (error) {
    console.error('Error fetching cajeros for admin:', error);
    return [];
  }
};

export const updateCajero = async (id: number, updates: Partial<Cajero>) => {
  try {
    const response = await apiRequest('/modificar_cajero_por_id', {
      method: 'PUT',
      body: JSON.stringify({
        id_cajero: id,
        ...updates,
      }),
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Error updating cajero');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error updating cajero:', error);
    throw error;
  }
};

// --- ADMINISTRADORES ---
export const fetchAllAdmins = async (): Promise<Administrador[]> => {
  try {
    const response = await apiRequest<Administrador[]>('/obtener_todos_administradores', {
      method: 'GET',
    });
    
    return response.success ? response.data || [] : [];
  } catch (error) {
    console.error('Error fetching admins:', error);
    return [];
  }
};

export const updateAdmin = async (id: number, updates: Partial<Administrador>) => {
  try {
    const response = await apiRequest('/modificar_administrador_por_id', {
      method: 'PUT',
      body: JSON.stringify({
        id_admin: id,
        ...updates,
      }),
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Error updating admin');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error updating admin:', error);
    throw error;
  }
};

// --- FUNCIONES AUXILIARES PARA OBTENER IDs ---
export const getAdminIdByName = async (nombre: string): Promise<number | null> => {
  try {
    const response = await apiRequest<{id: number}>('/obtener_id_administrador_por_nombre', {
      method: 'POST',
      body: JSON.stringify({ nombre }),
    });
    
    return response.success && response.data ? response.data.id : null;
  } catch (error) {
    console.error('Error getting admin ID by name:', error);
    return null;
  }
};

export const getCajeroIdByName = async (nombre: string): Promise<number | null> => {
  try {
    const response = await apiRequest<{id: number}>('/obtener_id_cajero_por_nombre', {
      method: 'POST',
      body: JSON.stringify({ nombre }),
    });
    
    return response.success && response.data ? response.data.id : null;
  } catch (error) {
    console.error('Error getting cajero ID by name:', error);
    return null;
  }
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
  // Esta función no tiene equivalente directo en la API Flask
  console.warn('createCajero: Esta función no tiene equivalente en la API Flask');
  throw new Error('Función no disponible en la API Flask');
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

// --- SUSCRIPCIONES EN TIEMPO REAL ---
// Las suscripciones en tiempo real no están disponibles con una API REST
// Se implementa un sistema de polling como alternativa

interface MockChannel {
  unsubscribe: () => void;
}

export const subscribeToCajeroChanges = (
  cajeroIds: number[], 
  onUpdate: (updatedCajero: Cajero) => void
): MockChannel => {
  console.warn('subscribeToCajeroChanges: Las suscripciones en tiempo real no están disponibles con la API REST');
  console.log('Se recomienda implementar polling manual para obtener actualizaciones');
  
  // Retornamos un objeto mock para mantener compatibilidad
  return {
    unsubscribe: () => console.log('Mock unsubscribe called for cajero changes'),
  };
};

export const subscribeToRelationChanges = (
  adminId: number, 
  onRelationChange: () => void
): MockChannel => {
  console.warn('subscribeToRelationChanges: Las suscripciones en tiempo real no están disponibles con la API REST');
  console.log('Se recomienda implementar polling manual para obtener actualizaciones');
  
  // Retornamos un objeto mock para mantener compatibilidad
  return {
    unsubscribe: () => console.log('Mock unsubscribe called for relation changes'),
  };
};

// Función auxiliar para remover canales (compatibilidad con Supabase)
export const supabase = {
  removeChannel: (channel: MockChannel) => {
    if (channel && typeof channel.unsubscribe === 'function') {
      channel.unsubscribe();
    }
  }
};

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