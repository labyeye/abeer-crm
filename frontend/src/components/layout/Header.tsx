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
  <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        
        {}
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          
          {}
          <div className="ml-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {}
        <div className="flex items-center space-x-4">
          
          {}
          <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg hover:bg-gray-100 relative"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

            {}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {mockNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                        notification.unread ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
                          <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                          <span className="text-xs text-gray-500 mt-1">{notification.time}</span>
                        </div>
                        {notification.unread && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 text-center border-t border-gray-200">
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user?.name?.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              )}
              <span className="text-gray-700 font-medium hidden sm:block">{user?.name}</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-2">
                  <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                    <User className="w-4 h-4 mr-3" />
                    Profile
                  </button>
                  <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                  </button>
                  <hr className="my-2" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Logout
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