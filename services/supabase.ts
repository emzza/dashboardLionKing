import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import { Administrador, Cajero, Macro } from '../types';


// IMPORTANT: These should be in environment variables (.env file)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL_KEY;
const supabaseKey = import.meta.env.VITE_SUPABASE_API_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- AUTH ---
export const signIn = async (nombre: string, contrasena: string): Promise<Administrador | null> => {
    const { data, error } = await supabase
        .from('administradores')
        .select('*')
        .eq('nombre', nombre)
        .eq('contrasena', contrasena)
        .single();
    if (error) {
        console.error('Error signing in:', error.message);
        return null;
    }
    return data as Administrador;
};

// --- MACROS ---
export const fetchMacro = async (id: number): Promise<Macro | null> => {
    const { data, error } = await supabase
        .from('macros')
        .select('*')
        .eq('id', id)
        .single();
    if (error) {
        console.error('Error fetching macro:', error.message);
        return null;
    }
    return data;
};

export const updateMacro = async (id: number, updates: Partial<Macro>) => {
    const { data, error } = await supabase
        .from('macros')
        .update(updates)
        .eq('id', id)
        .select();
    if (error) throw new Error(error.message);
    return data;
};

// --- CAJEROS ---
export const fetchCajerosForAdmin = async (adminId: number): Promise<Cajero[]> => {
    const { data: relations, error: relationError } = await supabase
        .from('cajerosxadministradores')
        .select('idcajero')
        .eq('idadministrador', adminId);

    if (relationError) {
        console.error('Error fetching admin-cajero relations:', relationError.message);
        return [];
    }

    const cajeroIds = relations.map(r => r.idcajero);
    if (cajeroIds.length === 0) return [];

    const { data: cajeros, error: cajerosError } = await supabase
        .from('cajeros')
        .select('*')
        .in('id', cajeroIds);

    if (cajerosError) {
        console.error('Error fetching cajeros:', cajerosError.message);
        return [];
    }

    return cajeros || [];
};

export const updateCajero = async (id: number, updates: Partial<Cajero>) => {
    const { data, error } = await supabase
        .from('cajeros')
        .update(updates)
        .eq('id', id)
        .select();
    if (error) throw new Error(error.message);
    return data;
};

export const fetchAllCajeros = async (): Promise<Cajero[]> => {
    const { data, error } = await supabase
        .from('cajeros')
        .select('*')
        .order('nombre', { ascending: true });
    if (error) {
        console.error('Error fetching all cajeros:', error.message);
        return [];
    }
    return data || [];
};

export const createCajero = async (newCajero: Omit<Cajero, 'id'>) => {
    const { data, error } = await supabase
        .from('cajeros')
        .insert([newCajero])
        .select();
    if (error) throw new Error(error.message);
    return data;
};

// --- RELATIONS ---
export const linkCajeroToAdmin = async (cajeroId: number, adminId: number) => {
    const { error } = await supabase
        .from('cajerosxadministradores')
        .insert([{ idadministrador: adminId, idcajero: cajeroId }]);
    
    if (error) throw new Error(`Error linking cajero to admin: ${error.message}`);

    return true;
}

export const fetchCajeroIdsForAdmin = async (adminId: number): Promise<number[]> => {
    const { data, error } = await supabase
        .from('cajerosxadministradores')
        .select('idcajero')
        .eq('idadministrador', adminId);
    
    if (error) {
        console.error('Error fetching admin-cajero relations:', error.message);
        return [];
    }
    
    return data.map(r => r.idcajero);
};

export const updateAdminCajeroRelations = async (adminId: number, cajeroIds: number[]) => {
    // 1. Delete existing relations
    const { error: deleteError } = await supabase
        .from('cajerosxadministradores')
        .delete()
        .eq('idadministrador', adminId);

    if (deleteError) throw new Error(`Error deleting old relations: ${deleteError.message}`);

    // 2. Insert new relations if there are any
    if (cajeroIds.length > 0) {
        const relations = cajeroIds.map(cajeroId => ({
            idadministrador: adminId,
            idcajero: cajeroId,
        }));
        
        const { error: insertError } = await supabase
            .from('cajerosxadministradores')
            .insert(relations);

        if (insertError) throw new Error(`Error inserting new relations: ${insertError.message}`);
    }

    return true;
};

// --- ADMINISTRADORES ---
export const fetchAllAdmins = async (): Promise<Administrador[]> => {
    const { data, error } = await supabase
        .from('administradores')
        .select('*');
    if (error) {
        console.error('Error fetching admins:', error.message);
        return [];
    }
    return data || [];
};

export const updateAdmin = async (id: number, updates: Partial<Administrador>) => {
    const { data, error } = await supabase
        .from('administradores')
        .update(updates)
        .eq('id', id)
        .select();
    if (error) throw new Error(error.message);
    return data;
};

export const createAdmin = async (newAdmin: Omit<Administrador, 'id'>) => {
    const { data, error } = await supabase
        .from('administradores')
        .insert([newAdmin])
        .select();
    if (error) throw new Error(error.message);
    return data;
};

// --- REALTIME SUBSCRIPTIONS ---

/**
 * Subscribes to updates on a specific list of cajeros.
 * @param cajeroIds - The IDs of cajeros to watch.
 * @param onUpdate - Callback function to execute with the updated cajero data.
 * @returns The RealtimeChannel for unsubscribing.
 */
export const subscribeToCajeroChanges = (cajeroIds: number[], onUpdate: (updatedCajero: Cajero) => void): RealtimeChannel => {
    const channel = supabase.channel(`cajeros-updates-${Date.now()}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'cajeros',
                filter: `id=in.(${cajeroIds.join(',')})`
            },
            (payload) => {
                onUpdate(payload.new as Cajero);
            }
        )
        .subscribe();

    return channel;
};

/**
 * Subscribes to changes in the admin-cajero relationship table.
 * @param adminId - The ID of the administrator to watch.
 * @param onRelationChange - Callback function to execute when a relationship changes.
 * @returns The RealtimeChannel for unsubscribing.
 */
export const subscribeToRelationChanges = (adminId: number, onRelationChange: () => void): RealtimeChannel => {
    const channel = supabase.channel(`admin-relations-changes-${adminId}`)
        .on(
            'postgres_changes',
            {
                event: '*', // Listen for INSERT, UPDATE, DELETE
                schema: 'public',
                table: 'cajerosxadministradores',
                filter: `idadministrador=eq.${adminId}`
            },
            () => {
                onRelationChange();
            }
        )
        .subscribe();
    
    return channel;
}