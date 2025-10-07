import React, { useState, useEffect, useCallback } from 'react';
import { Administrador, Macro, Notification as NotificationType, NotificationType as NTEnum } from '../types';
import { fetchMacro, updateMacro } from '../services/supabase';
import Spinner from './Spinner';
import Notification from './Notification';
import { ButtonSidebar } from './ui/ButtonSideBar';


interface macrosProps {
  admin: Administrador;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}


const Macros: React.FC<macrosProps> = ({ admin, isOpen, setIsOpen }) => {
  const [macro, setMacro] = useState<Macro | null>(null);
  const [formData, setFormData] = useState({ 'cbu100%': '', 'cbu90%': '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<Omit<NotificationType, 'id'> | null>(null);

  const loadMacro = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMacro(1);
      if (data) {
        setMacro(data);
        setFormData({ 'cbu100%': data['cbu100%'] || '', 'cbu90%': data['cbu90%'] || '' });
      }
    } catch (error) {
        setNotification({ message: 'Error al cargar los datos del macro.', type: NTEnum.ERROR });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMacro();
  }, [loadMacro]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!macro) return;
    setSaving(true);
    setNotification(null);
    try {
      await updateMacro(macro.id, formData);
      setNotification({ message: 'Macro actualizado con éxito.', type: NTEnum.SUCCESS });
    } catch (error) {
      const err = error as Error;
      setNotification({ message: `Error al actualizar: ${err.message}`, type: NTEnum.ERROR });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    );
  }

  if (!macro) {
    return <p className="text-center text-red-400">No se pudieron cargar los datos del macro.</p>;
  }

  return (
    <div>
      {notification && <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification(null)} />}
      <div className="flex justify-start items-center mb-6"> 
        <ButtonSidebar isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
        <h1 className="text-2xl ml-2 font-bold text-white">Macros</h1>
      </div>
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="cbu100" className="block text-sm font-medium text-gray-300 mb-2">
              CBU 100%
            </label>
            <textarea
              name="cbu100%"
              id="cbu100"
              rows={4}
              value={formData['cbu100%']}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
              placeholder="Ingrese el CBU para 100%"
            />
          </div>
          <div>
            <label htmlFor="cbu90" className="block text-sm font-medium text-gray-300 mb-2">
              CBU 90%
            </label>
            <textarea
              name="cbu90%"
              id="cbu90"
              rows={4}
              value={formData['cbu90%']}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
              placeholder="Ingrese el CBU para 90%"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center items-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-gray-800 disabled:bg-emerald-500"
            >
              {saving ? <Spinner /> : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Macros;