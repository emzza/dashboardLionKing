import React, { useState } from 'react';
import { Administrador } from '../types';
import Sidebar from './Sidebar';
import Macros from './Macros';
import Cajeros from './Cajeros';
import Administradores from './Administradores';

interface DashboardProps {
  admin: Administrador;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

type ViewType = 'macros' | 'cajeros' | 'administradores';

const Dashboard: React.FC<DashboardProps> = ({ admin, onLogout, isOpen, setIsOpen }) => {
  const [activeView, setActiveView] = useState<ViewType>('cajeros');

  const renderContent = () => {
    switch (activeView) {
      case 'macros':
        return <Macros admin={admin} isOpen={isOpen} setIsOpen={setIsOpen} />;
      case 'cajeros':
        return <Cajeros admin={admin} isOpen={isOpen} setIsOpen={setIsOpen} />;
      case 'administradores':
        return admin.permisoAdmin ? <Administradores admin={admin} isOpen={isOpen} setIsOpen={setIsOpen} /> : <p>No tiene permisos para ver esta sección.</p>;
      default:
        return <Cajeros admin={admin} isOpen={isOpen} setIsOpen={setIsOpen} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onLogout={onLogout}
        permisoAdmin={admin.permisoAdmin}
        adminName={admin.nombre}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;
