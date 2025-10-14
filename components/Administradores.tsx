
import React, { useState, useEffect, useCallback } from 'react';
import { Administrador, Cajero, Notification as NotificationType, NotificationType as NTEnum } from '../types';
import {
  fetchAllAdmins,
  updateAdmin,
  fetchCajerosForAdmin,
  getAdminIdByName,
  getCajeroIdByName,
} from '../services/api';
import Spinner from './Spinner';
import { ICONS } from '../constants';
import Modal from './Modal';
import Notification from './Notification';
import { ButtonSidebar } from './ui/ButtonSideBar';

interface adminProps {
  admin: Administrador;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Administradores: React.FC<adminProps> = ({ admin, isOpen, setIsOpen }) => {
  const [admins, setAdmins] = useState<Administrador[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAdmin, setEditingAdmin] = useState<Administrador | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<Omit<NotificationType, 'id'> | null>(null);
  
  const emptyAdmin: Omit<Administrador, 'id'> = { nombre: '', contrasena: '', permisoAdmin: false };

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllAdmins();
      console.log(data);
      setAdmins(data);
    } catch (error) {
       setNotification({ message: 'Error al cargar administradores.', type: NTEnum.ERROR });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const handleEdit = (admin: Administrador) => {
    setEditingAdmin(admin);
    setIsNew(false);
  };
  
  const handleAddNew = () => {
    setEditingAdmin({ ...emptyAdmin, id: -1 }); // temp id
    setIsNew(true);
  };

  const handleSave = async (adminToSave: Administrador | Omit<Administrador, 'id'>, assignedCajeroIds: number[]) => {
    setSaving(true);
    setNotification(null);
    try {
      let savedAdminData;
      if ('id' in adminToSave && adminToSave.id !== -1) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...updates } = adminToSave;
        savedAdminData = await updateAdmin(id, updates);
      } else {
        // Función createAdmin no disponible en la API Flask
        setNotification({ message: 'La creación de administradores no está disponible en la API Flask.', type: NTEnum.ERROR });
        return;
      }

      // Función updateAdminCajeroRelations no disponible en la API Flask
      // const savedAdminId = savedAdminData?.[0]?.id;
      // if(savedAdminId) {
      //   await updateAdminCajeroRelations(savedAdminId, assignedCajeroIds);
      // }

      setNotification({ message: 'Administrador guardado con éxito.', type: NTEnum.SUCCESS });
      setEditingAdmin(null);
      loadAdmins();
    } catch (error) {
      const err = error as Error;
      setNotification({ message: `Error al guardar: ${err.message}`, type: NTEnum.ERROR });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Spinner /></div>;
  }

  return (
    <>
      <div>
        {notification && <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification(null)} />}
        <div className="flex-col md:flex-row justify-between items-center mb-6">
          <div className="flex justify-start items-center mb-6">
            <ButtonSidebar isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
            <h1 className="text-3xl ml-2 font-bold text-white">Administradores</h1>
          </div>
          <div className="flex justify-between items-center">
          <p>Total: {admins.length}</p>
            <button onClick={handleAddNew} className=" inline-flex items-center justify-center px-2 py-2 ml-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-gray-900">
                {ICONS.plus}
                <span className="ml-2">Agregar</span>
            </button>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nombre</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Permiso Super Admin</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Editar</span></th>
              </tr>
            </thead>
            <tbody className="bg-gray-800/50 divide-y divide-gray-700">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{admin.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {admin.permisoAdmin ? 
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500/20 text-green-300">Sí</span> : 
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-500/20 text-red-300">No</span>
                      }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(admin)} className="text-emerald-400 hover:text-emerald-300">{ICONS.edit}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editingAdmin && (
          <EditAdminModal
            admin={editingAdmin}
            isNew={isNew}
            onClose={() => setEditingAdmin(null)}
            onSave={handleSave}
            isSaving={saving}
          />
        )}
      </div>
    </>
  );
};

interface EditAdminModalProps {
  admin: Administrador | Omit<Administrador, 'id'>;
  isNew: boolean;
  onClose: () => void;
  onSave: (admin: Administrador | Omit<Administrador, 'id'>, assignedCajeroIds: number[]) => void;
  isSaving: boolean;
}

const EditAdminModal: React.FC<EditAdminModalProps> = ({ admin, isNew, onClose, onSave, isSaving }) => {
  const [formData, setFormData] = useState(admin);
  const [allCajeros, setAllCajeros] = useState<Cajero[]>([]);
  const [assignedCajeroIds, setAssignedCajeroIds] = useState<Set<number>>(new Set());
  const [loadingCajeros, setLoadingCajeros] = useState(!isNew);

  useEffect(() => {
    const loadRelations = async () => {
        if (isNew || !('id' in admin)) return;
        setLoadingCajeros(true);
        try {
            // Usando fetchCajerosForAdmin en lugar de fetchAllCajeros y fetchCajeroIdsForAdmin
            const cajerosData = await fetchCajerosForAdmin(admin.id);
            setAllCajeros(cajerosData);
            setAssignedCajeroIds(new Set(cajerosData.map(c => c.id)));
        } catch (e) {
            console.error("Error loading cajero relations", e);
        } finally {
            setLoadingCajeros(false);
        }
    };

    if (!isNew) {
      loadRelations();
    } else {
      // fetchAllCajeros no disponible en la API Flask
      // Para nuevos administradores, no mostramos cajeros disponibles
      setAllCajeros([]);
    }
  }, [admin, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCajeroToggle = (cajeroId: number) => {
    setAssignedCajeroIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(cajeroId)) {
            newSet.delete(cajeroId);
        } else {
            newSet.add(cajeroId);
        }
        return newSet;
    });
  };

  const handleSelectAll = () => setAssignedCajeroIds(new Set(allCajeros.map(c => c.id)));
  const handleDeselectAll = () => setAssignedCajeroIds(new Set());
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, Array.from(assignedCajeroIds));
  };

  return (
    <Modal title={isNew ? "Nuevo Administrador" : "Editar Administrador"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-4 text-gray-300">
            <div>
                <label htmlFor="nombre" className="block text-sm font-medium mb-1">Nombre</label>
                <input type="text" name="nombre" id="nombre" value={formData.nombre} onChange={handleChange} required
                 className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"/>
            </div>
             <div>
                <label htmlFor="contrasena" className="block text-sm font-medium mb-1">Contraseña</label>
                <input type="password" name="contrasena" id="contrasena" value={formData.contrasena} onChange={handleChange} required={isNew || formData.contrasena !== ''}
                placeholder={isNew ? "" : "Dejar en blanco para no cambiar"}
                 className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"/>
            </div>
            <div className="flex items-center">
                <input type="checkbox" name="permisoAdmin" id="permisoAdmin" checked={formData.permisoAdmin} onChange={handleChange}
                className="h-4 w-4 text-emerald-600 border-gray-500 rounded bg-gray-700 focus:ring-emerald-500"/>
                <label htmlFor="permisoAdmin" className="ml-2 block text-sm">Permiso Super Admin</label>
            </div>
            <div className="border-t border-gray-600 pt-4">
              <h4 className="text-md font-medium text-white mb-2">Cajeros Asignados</h4>
              {loadingCajeros ? <Spinner /> : (
                <>
                  <div className="flex gap-2 mb-2">
                    <button type="button" onClick={handleSelectAll} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded">Seleccionar Todos</button>
                    <button type="button" onClick={handleDeselectAll} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded">Deseleccionar Todos</button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 bg-gray-900/50 p-2 rounded-md border border-gray-600">
                    {allCajeros.length > 0 ? allCajeros.map(cajero => (
                      <div key={cajero.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`cajero-${cajero.id}`}
                          checked={assignedCajeroIds.has(cajero.id)}
                          onChange={() => handleCajeroToggle(cajero.id)}
                          className="h-4 w-4 text-emerald-600 border-gray-500 rounded bg-gray-700 focus:ring-emerald-500"
                        />
                        <label htmlFor={`cajero-${cajero.id}`} className="ml-2 block text-sm">{cajero.nombre}</label>
                      </div>
                    )) : <p className="text-sm text-gray-500">No hay cajeros para asignar.</p>}
                  </div>
                </>
              )}
            </div>
        </div>
        <div className="bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
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


export default Administradores;