import React, { useState } from 'react';
import { 
  Menu, 
  Bell, 
  Search, 
  Settings, 
  LogOut,
  User,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();
  const { addNotification } = useNotification();

  const handleLogout = () => {
    logout();
    addNotification({
      type: 'success',
      title: 'Logged Out',
      message: 'You have been successfully logged out.'
    });
  };

  const mockNotifications = [
    { id: 1, title: 'New booking request', message: 'Wedding photography for Dec 25', time: '2 min ago', unread: true },
    { id: 2, title: 'Payment received', message: '$2,500 from John Doe', time: '1 hour ago', unread: true },
    { id: 3, title: 'Task completed', message: 'Photo editing finished', time: '3 hours ago', unread: false },
  ];

  const unreadCount = mockNotifications.filter(n => n.unread).length;

  return (
    <header className="header">
      <div className="flex items-center justify-between px-6 py-4">
        
        {/* Left side */}
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-neutral-100 lg:hidden transition-colors"
          >
            <Menu className="w-5 h-5 text-neutral-600" />
          </button>
          
          {/* Search */}
          <div className="ml-4 header-search">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search everything..."
              className="form-input pl-10 pr-4 py-2.5 w-full bg-neutral-50 border-neutral-200 focus:bg-white focus:border-primary-500"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-lg hover:bg-neutral-100 relative transition-colors"
            >
              <Bell className="w-5 h-5 text-neutral-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 text-white text-xs rounded-full flex items-center justify-center font-medium animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 modal bg-white rounded-xl shadow-xl border z-50">
                <div className="modal-header">
                  <h3 className="font-semibold text-neutral-900">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {mockNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${
                        notification.unread ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-neutral-900 text-sm">{notification.title}</h4>
                          <p className="text-neutral-600 text-sm mt-1">{notification.message}</p>
                          <span className="text-xs text-neutral-500 mt-1">{notification.time}</span>
                        </div>
                        {notification.unread && (
                          <div className="w-2 h-2 bg-primary-500 rounded-full ml-2"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="modal-footer justify-center">
                  <button className="btn btn-ghost text-primary-600 hover:text-primary-700 text-sm font-medium">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2.5 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
                  <span className="text-white font-semibold text-sm">
                    {user?.name?.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              )}
              <span className="text-neutral-700 font-medium hidden sm:block">{user?.name}</span>
              <ChevronDown className="w-4 h-4 text-neutral-500" />
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 modal bg-white rounded-xl shadow-xl border z-50">
                <div className="p-2">
                  <button className="w-full flex items-center px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors">
                    <User className="w-4 h-4 mr-3 text-neutral-500" />
                    <span className="font-medium">Profile</span>
                  </button>
                  <button className="w-full flex items-center px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors">
                    <Settings className="w-4 h-4 mr-3 text-neutral-500" />
                    <span className="font-medium">Settings</span>
                  </button>
                  <hr className="my-2 border-neutral-200" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 py-2.5 text-sm text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;