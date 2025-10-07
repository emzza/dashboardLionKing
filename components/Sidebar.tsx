import React from 'react';
import { ICONS } from '../constants';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: 'macros' | 'cajeros' | 'administradores') => void;
  onLogout: () => void;
  permisoAdmin: boolean;
  adminName: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  onLogout,
  permisoAdmin,
  adminName,
  isOpen,
  setIsOpen,
}) => {
  const navItems = [
    { id: 'cajeros', label: 'Cajeros', icon: ICONS.cajeros, visible: true },
    { id: 'macros', label: 'Macros', icon: ICONS.macros, visible: true },
    { id: 'administradores', label: 'Administradores', icon: ICONS.admins, visible: permisoAdmin },
  ];

  const NavLink: React.FC<{ item: any }> = ({ item }) => (
    <button
      onClick={() => setActiveView(item.id)}
      className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
        activeView === item.id
          ? 'bg-emerald-600 text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {item.icon}
      <span className="ml-3">{item.label}</span>
    </button>
  );

  return (
    <>
      {/* --- Sidebar principal --- */}
      <div
          className={`
            flex flex-col bg-gray-800/90 backdrop-blur-md border-r border-gray-700 z-40
            transform transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            fixed top-0 left-0 h-full w-64
            md:static md:translate-x-0 md:flex-shrink-0
          `}
        >
        <div className="px-6 py-5 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Panel de Control</h2>
          <p className="text-sm text-gray-400 mt-1">Bienvenido, {adminName}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.filter((item) => item.visible).map((item) => (
            <NavLink key={item.id} item={item} />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-300 rounded-lg hover:bg-red-600/50 hover:text-white transition-colors duration-200"
          >
            {ICONS.logout}
            <span className="ml-3">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* --- Overlay fuera del sidebar --- */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
