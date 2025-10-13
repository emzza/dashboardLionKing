import { createCajero } from '../services/api';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Administrador, Cajero, Notification as NotificationType, NotificationType as NTEnum } from '../types';
import {
  fetchCajerosForAdmin,
  updateCajero,
  startPolling,
  stopPolling,
} from '../services/api';
import Spinner from './Spinner';
import { ButtonSidebar } from './ui/ButtonSideBar';
import { ICONS } from '../constants';
import Modal from './Modal';
import Notification from './Notification';
import { supabase } from '../services/supabase';

interface CajerosProps {
  admin: Administrador;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Cajeros: React.FC<CajerosProps> = ({ admin, isOpen, setIsOpen }) => {
  const [cajeros, setCajeros] = useState<Cajero[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCajero, setEditingCajero] = useState<Cajero | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<Omit<NotificationType, 'id'> | null>(null);
  const [investments, setInvestments] = useState<Record<number, string>>({});
  const [filters, setFilters] = useState({
    nombre: '',
    telefono: '',
    estado: 'todos',
  });

  // Memoize the list of cajero IDs to create a stable dependency for the subscription effect.
  const cajeroIdString = useMemo(() => cajeros.map(c => c.id).sort().join(','), [cajeros]);

  const loadCajeros = useCallback(async () => {
    // Only show the main loader on the very first load.
    if (!cajeros.length) setLoading(true);
    try {
      const data = await fetchCajerosForAdmin(admin.id);
      setCajeros(data);
    } catch (error) {
      setNotification({ message: 'Error al cargar los cajeros.', type: NTEnum.ERROR });
    } finally {
      setLoading(false);
    }
  }, [admin.id, cajeros.length]);


  useEffect(() => {
  loadCajeros();

  const channel = supabase
    .channel('cajeros-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cajeros', filter: 'estadolinea=in.(open,close)'}, (payload) => {
      console.log(payload);
      if (payload.eventType === 'INSERT') setCajeros((prev) => [...prev, payload.new]);
      if (payload.eventType === 'UPDATE') setCajeros((prev) =>
        prev.map((c) => ( c.id === payload.new.id
        ? { ...c, ...payload.new } // Combina sin perder los otros campos
        : c))
      );
      if (payload.eventType === 'DELETE') setCajeros((prev) => prev.filter((c) => c.id !== payload.old.id));
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [admin.id]);

  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleInvestmentChange = (cajeroId: number, value: string) => {
    setInvestments(prev => ({ ...prev, [cajeroId]: value }));
  };

  const filteredCajeros = useMemo(() => {
    return cajeros.filter(cajero => {
      const nombreMatch = cajero.nombre.toLowerCase().includes(filters.nombre.toLowerCase());
      const estadoMatch = filters.estado === 'todos' ||
                            (filters.estado === 'enlinea' && cajero.estadolinea) ||
                            (filters.estado === 'fueradelinea' && !cajero.estadolinea);
      return nombreMatch && estadoMatch;
    }).sort((a, b) => a.nombre.localeCompare(b.nombre)); // Keep a consistent sort order
  }, [cajeros, filters]);

  const handleEdit = (cajero: Cajero) => {
    setEditingCajero(cajero);
  };

  const handleSave = async (updatedCajero: Cajero) => {
    setSaving(true);
    setNotification(null);
    try {
      // The UI will update automatically via the real-time subscription,
      // so we don't need to manually update state here.
      await updateCajero(updatedCajero.id, updatedCajero);
      setNotification({ message: 'Cajero actualizado con éxito.', type: NTEnum.SUCCESS });
      setEditingCajero(null);
    } catch (error) {
      const err = error as Error;
      setNotification({ message: `Error al actualizar: ${err.message}`, type: NTEnum.ERROR });
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (newCajeroData: Omit<Cajero, 'id'>) => {
  setSaving(true);
  setNotification(null);

  try {
    // 📡 Llamada al backend Flask
    const cajeroCreado = await createCajero(newCajeroData);

    // ✅ Agregar el nuevo cajero directamente a la tabla
    setCajeros((prev) => [...prev, cajeroCreado]);

    // ✅ Notificación de éxito
    setNotification({ 
      message: `Cajero "${cajeroCreado.nombre}" creado con éxito.`, 
      type: NTEnum.SUCCESS 
    });

    // ✅ Cerrar el modal
    setCreateModalOpen(false);

  } catch (error) {
    const err = error as Error;
    setNotification({ message: `Error al crear: ${err.message}`, type: NTEnum.ERROR });
  } finally {
    setSaving(false);
  }
};



  if (loading) {
    return <div className="flex justify-center items-center h-full"><Spinner /></div>;
  }

  return (
    <div>
      {notification && <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification(null)} />}
      <div className="flex-col md:flex-row justify-between items-center mb-6">
        <div className="flex justify-start items-center mb-6">
          <ButtonSidebar isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
      
          <h1 className="text-3xl ml-2 font-bold text-white">Cajeros</h1> 
        </div>
        <div className="flex justify-between items-center">
          <p>Total: {cajeros.length}</p>
          {admin.permisoAdmin && (
           <button onClick={() => setCreateModalOpen(true)} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-gray-900">
                {ICONS.plus}
                <span className="ml-2">Nuevo Cajero</span>
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 p-4 bg-gray-800/60 rounded-lg border border-gray-700 flex flex-col md:flex-row items-center gap-4">
        <input
            type="text"
            name="nombre"
            placeholder="Buscar por nombre..."
            value={filters.nombre}
            onChange={handleFilterChange}
            className="w-full md:w-auto bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 flex-grow"
        />
        <select
            name="estado"
            value={filters.estado}
            onChange={handleFilterChange}
            className="w-full md:w-auto bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
        >
            <option value="todos">Todos los estados</option>
            <option value="enlinea">En Línea</option>
            <option value="fueradelinea">Fuera de Línea</option>
        </select>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nombre</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Estado</th>              
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Conteo / Max</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Conteo Día</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Inversión</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">CPM</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Editar</span></th>
            </tr>
          </thead>
         <tbody className="bg-gray-800/50 divide-y divide-gray-700">
         
            {(() => {
              const filteredCajeros = cajeros.filter((c) =>
                ['open', 'close'].includes(c.estadolinea)
              );

              return (
                <>
                  {filteredCajeros.map((cajero) => (
                    <tr
                      key={cajero.id}
                      className={`${
                        cajero.estadolinea === 'open'
                          ? 'bg-green-500/10'
                          : 'bg-red-500/10'
                      } hover:bg-gray-700/50 transition-colors`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {cajero.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            cajero.estadolinea === 'open'
                              ? 'bg-green-500/30 text-green-200'
                              : 'bg-red-500/30 text-red-200'
                          }`}
                        >
                          {cajero.estadolinea === 'open' ? 'En Línea' : 'Fuera de Línea'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {cajero.conteo} / {cajero.maxconteo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {cajero.conteodia}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <input
                          type="number"
                          value={investments[cajero.id] || ''}
                          onChange={(e) =>
                            handleInvestmentChange(cajero.id, e.target.value)
                          }
                          placeholder="Monto"
                          className="w-24 bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                        {(() => {
                          const investment = parseFloat(investments[cajero.id]) || 0;
                          if (investment > 0 && cajero.conteodia > 0) {
                            const cpm = (investment / cajero.conteodia).toFixed(2);
                            return `$${cpm}`;
                          }
                          return '$0.00';
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(cajero)}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          {ICONS.edit}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {cajeros.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center py-10 text-gray-500"
                      >
                        No hay cajeros asignados.
                      </td>
                    </tr>
                  )}

                  {cajeros.length > 0 && filteredCajeros.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center py-10 text-gray-500"
                      >
                        No se encontraron cajeros con los filtros aplicados.
                      </td>
                    </tr>
                  )}
                </>
              );
            })()}
          </tbody>

        </table>
      </div>

      {editingCajero && (
        <EditCajeroModal
          key={editingCajero.id}
          cajero={editingCajero}
          onClose={() => setEditingCajero(null)}
          onSave={handleSave}
          isSaving={saving}
        />
      )}
      {isCreateModalOpen && (
          <CreateCajeroModal
              onClose={() => setCreateModalOpen(false)}
              onSave={handleCreate}
              isSaving={saving}
          />
      )}
    </div>
  );
};

interface EditCajeroModalProps {
  cajero: Cajero;
  onClose: () => void;
  onSave: (cajero: Cajero) => void;
  isSaving: boolean;
}

const EditCajeroModal: React.FC<EditCajeroModalProps> = ({ cajero, onClose, onSave, isSaving }) => {
  const [formData, setFormData] = useState<Cajero>(cajero);

  useEffect(() => {
    setFormData(cajero);
  }, [cajero]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? 0 : parseInt(value, 10) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal title="Editar Cajero" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
            <div>
                <label htmlFor="nombre" className="block text-sm font-medium mb-1">Nombre</label>
                <input type="text" name="nombre" id="nombre" value={formData.nombre} onChange={handleFormChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"/>
            </div>
            <div>
                <label htmlFor="idgrupo" className="block text-sm font-medium mb-1">ID Grupo</label>
                <input type="text" name="idgrupo" id="idgrupo" value={formData.idgrupo} onChange={handleFormChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"/>
            </div>
            <div>
                <label htmlFor="conteo" className="block text-sm font-medium mb-1">Conteo</label>
                <input type="number" name="conteo" id="conteo" value={formData.conteo} onChange={handleFormChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"/>
            </div>
            <div>
                <label htmlFor="maxconteo" className="block text-sm font-medium mb-1">Max Conteo</label>
                <input type="number" name="maxconteo" id="maxconteo" value={formData.maxconteo} onChange={handleFormChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"/>
            </div>
            <div>
                <label htmlFor="conteodia" className="block text-sm font-medium mb-1">Conteo Día</label>
                <input type="number" name="conteodia" id="conteodia" value={formData.conteodia} onChange={handleFormChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"/>
            </div>
             <div className="md:col-span-2 flex items-center">
                <input type="checkbox" name="estadolinea" id="estadolinea" checked={!!formData.estadolinea} onChange={handleFormChange}
                className="h-4 w-4 text-emerald-600 border-gray-500 rounded bg-gray-700 focus:ring-emerald-500"/>
                <label htmlFor="estadolinea" className="ml-2 block text-sm">En Línea</label>
            </div>
        </div>
        <div className="bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse items-center">
          <button type="submit" disabled={isSaving} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-emerald-500">
            {isSaving ? <Spinner/> : 'Guardar'}
          </button>
          <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-500 shadow-sm px-4 py-2 bg-gray-600 text-base font-medium text-white hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm">
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  );
};

interface CreateCajeroModalProps {
    onClose: () => void;
    onSave: (cajero: Omit<Cajero, 'id'>) => void;
    isSaving: boolean;
}

const CreateCajeroModal: React.FC<CreateCajeroModalProps> = ({ onClose, onSave, isSaving }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        idgrupo: '',
        maxconteo: 100,
    });
    const [error, setError] = useState('');

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: name === 'maxconteo' ? parseInt(value, 10) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.nombre || !formData.idgrupo || formData.maxconteo <= 0) {
            setError('El nombre, ID de grupo y un max conteo mayor a 0 son obligatorios.');
            return;
        }
        const newCajero: Omit<Cajero, 'id'> = {
            ...formData,
            estadolinea: false,
            conteo: 0,
            conteodia: 0,
        };
        onSave(newCajero);
    };

    return (
        <Modal title="Nuevo Cajero" onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4 text-gray-300">
                    {error && <p className="text-sm text-red-400 text-center bg-red-900/50 p-2 rounded-md">{error}</p>}
                    <div>
                        <label htmlFor="create-nombre" className="block text-sm font-medium mb-1">Nombre</label>
                        <input type="text" name="nombre" id="create-nombre" value={formData.nombre} onChange={handleFormChange} required
                            className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"/>
                    </div>
                    <div>
                        <label htmlFor="create-idgrupo" className="block text-sm font-medium mb-1">ID Grupo</label>
                        <input type="text" name="idgrupo" id="create-idgrupo" value={formData.idgrupo} onChange={handleFormChange} required
                            className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"/>
                    </div>
                    <div>
                        <label htmlFor="create-maxconteo" className="block text-sm font-medium mb-1">Max Conteo</label>
                        <input type="number" name="maxconteo" id="create-maxconteo" value={formData.maxconteo} onChange={handleFormChange} required
                            className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"/>
                    </div>
                </div>
                <div className="bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" disabled={isSaving} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-emerald-500">
                    {isSaving ? <Spinner/> : 'Crear Cajero'}
                  </button>
                  <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-500 shadow-sm px-4 py-2 bg-gray-600 text-base font-medium text-white hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm">
                    Cancelar
                  </button>
                </div>
            </form>
        </Modal>
    );
};


export default Cajeros;