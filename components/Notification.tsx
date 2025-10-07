import React, { useEffect } from 'react';
import { NotificationType } from '../types';

interface NotificationProps {
  message: string;
  type: NotificationType;
  onDismiss: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const baseClasses = 'fixed top-5 right-5 p-4 rounded-md shadow-lg text-white text-sm z-50 animate-fade-in-down';
  const typeClasses = {
    [NotificationType.SUCCESS]: 'bg-green-600/80 backdrop-blur-sm border border-green-500',
    [NotificationType.ERROR]: 'bg-red-600/80 backdrop-blur-sm border border-red-500',
    [NotificationType.INFO]: 'bg-emerald-600/80 backdrop-blur-sm border border-emerald-500',
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      {message}
    </div>
  );
};

export default Notification;