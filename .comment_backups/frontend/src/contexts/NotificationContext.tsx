import React, { createContext, useContext, useState } from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'error': return XCircle;
      case 'warning': return AlertTriangle;
      default: return Info;
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-amber-50 border-amber-200 text-amber-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => {
          const Icon = getIcon(notification.type);
          const colors = getColors(notification.type);
          
          return (
            <div
              key={notification.id}
              className={`max-w-sm w-full border rounded-lg p-4 shadow-lg backdrop-blur-sm transition-all duration-300 ${colors}`}
            >
              <div className="flex items-start">
                <Icon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{notification.title}</h3>
                  <p className="text-sm mt-1 opacity-90">{notification.message}</p>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};