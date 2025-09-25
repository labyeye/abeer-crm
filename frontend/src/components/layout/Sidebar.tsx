import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  UserCheck, 
  DollarSign, 
  Package, 
  Building2, 
  X,
  Clock,
  FileText,
  CheckSquare,
  Truck,
  
  Star
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const { user } = useAuth();

  const menuItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      permission: 'dashboard',
      color: 'primary'
    },
    {
      id: 'company',
      name: 'Branch Management',
      icon: Building2,
      permission: 'company_manage',
      roles: ['chairman'],
      color: 'purple'
    },
    {
      id: 'staff',
      name: 'Staff Management',
      icon: Users,
      permission: 'staff_manage',
      roles: ['chairman', 'admin'],
      color: 'teal'
    },
    {
      id: 'bookings',
      name: 'Bookings',
      icon: Calendar,
      permission: 'bookings',
      roles: ['chairman', 'admin', 'staff'],
      color: 'secondary'
    },
    {
      id: 'clients',
      name: 'Client Management',
      icon: UserCheck,
      permission: 'clients',
      roles: ['chairman', 'admin'],
      color: 'success'
    },
    {
      id: 'finance',
      name: 'Finance',
      icon: DollarSign,
      permission: 'finance',
      roles: ['chairman', 'admin'],
      color: 'warning'
    },
    {
      id: 'inventory',
      name: 'Inventory',
      icon: Package,
      permission: 'inventory',
      roles: ['chairman', 'admin'],
      color: 'indigo'
    },
    {
      id: 'attendance',
      name: 'Attendance',
      icon: Clock,
      permission: 'attendance',
      roles: ['chairman', 'company_admin', 'branch_head', 'staff'],
      color: 'pink'
    },
    {
      id: 'quotations',
      name: 'Quotations',
      icon: FileText,
      permission: 'quotations',
      roles: ['chairman', 'company_admin', 'branch_head'],
      color: 'primary'
    },
    {
      id: 'tasks',
      name: 'Task Management',
      icon: CheckSquare,
      permission: 'tasks',
      roles: ['chairman', 'company_admin', 'branch_head', 'staff'],
      color: 'success'
    },
    {
      id: 'daily-expenses',
      name: 'Daily Expenses',
      icon: DollarSign,
      permission: 'daily_expenses',
      roles: ['chairman', 'company_admin', 'branch_head'],
      color: 'error'
    },
    {
      id: 'vendors',
      name: 'Vendor Management',
      icon: Truck,
      permission: 'vendors',
      roles: ['chairman', 'company_admin', 'branch_head'],
      color: 'teal'
    },
    {
      id: 'categories',
      name: 'Category Management',
      icon: Star,
      permission: 'categories',
      roles: ['chairman', 'company_admin', 'branch_head', 'admin'],
      color: 'purple'
    },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role || '');
  });

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      primary: isActive 
        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700',
      secondary: isActive 
        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white' 
        : 'text-gray-700 hover:bg-amber-50 hover:text-amber-700',
      success: isActive 
        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' 
        : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700',
      warning: isActive 
        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' 
        : 'text-gray-700 hover:bg-orange-50 hover:text-orange-700',
      error: isActive 
        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' 
        : 'text-gray-700 hover:bg-red-50 hover:text-red-700',
      purple: isActive 
        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' 
        : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700',
      teal: isActive 
        ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white' 
        : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700',
      pink: isActive 
        ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white' 
        : 'text-gray-700 hover:bg-pink-50 hover:text-pink-700',
      indigo: isActive 
        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white' 
        : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700',
    };
    return colors[color as keyof typeof colors] || colors.primary;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 sidebar transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="flex items-center">
            
            <div className="ml-3">
              <h1 className="text-xl font-bold font-display">Abeer Motion Picture CRM</h1>
              <p className="text-xs text-primary-100 font-medium opacity-90">
                {user?.role?.replace('_', ' ').toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-primary-500 hover:bg-opacity-20 transition-colors lg:hidden"
          >
            <X className="w-5 h-5 text-primary-100" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-6 px-4 overflow-y-auto">
          <div className="space-y-2 pb-4">
            {filteredMenuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              // If an item is inactive, force a primary bg as requested. Active items use their defined color gradient.
              const colorClasses = isActive
                ? getColorClasses(item.color || 'primary', true)
                : '#FDFEFE text-black hover:bg-gray-50';
              
              const isAdvancedFeature = ['ai-insights', 'mobile-app', 'automation', 'integrations'].includes(item.id);
              const isPreviousAdvanced = index > 0 && ['ai-insights', 'mobile-app', 'automation', 'integrations'].includes(filteredMenuItems[index - 1].id);
              const showDivider = (item.id === 'ai-insights' && !isPreviousAdvanced) || 
                                 (item.id === 'reports' && !isAdvancedFeature);
              
              return (
                <div key={item.id}>
                  {showDivider && (
                    <div className="my-4">
                      <div className="border-t border-gray-200"></div>
                      {item.id === 'ai-insights' && (
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                          Advanced Features
                        </p>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsOpen(false);
                    }}
                    className={`sidebar-nav-item w-full ${colorClasses} ${
                      isActive ? 'shadow-md transform scale-[1.02]' : 'hover:transform hover:translate-x-1'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-black'}`}
                      // Use inline color to ensure the SVG stroke uses the intended color
                      style={{ color: isActive ? '#ffffff' : '#000000' }}
                    />
                    <span className={`truncate font-medium ${isActive ? 'text-white' : 'text-black'}`}>{item.name}</span>
                    {isActive && (
                      <div className="ml-auto">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 mt-auto border-t border-gray-200">
          <div className="flex items-center p-3 rounded-xl transition-all duration-200 cursor-pointer group card hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <span className="text-white font-bold text-sm">
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize font-medium">{user?.role?.replace('_', ' ')}</p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full shadow-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;