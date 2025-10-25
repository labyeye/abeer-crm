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