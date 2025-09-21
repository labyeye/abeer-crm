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
  Camera,
  Clock,
  FileText,
  CheckSquare,
  Truck,
  TrendingUp
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
      permission: 'dashboard'
    },
    {
      id: 'company',
      name: 'Branch Management',
      icon: Building2,
      permission: 'company_manage',
      roles: ['chairman'] // Removed 'branch_head' so branch users can't see this
    },
    {
      id: 'staff',
      name: 'Staff Management',
      icon: Users,
      permission: 'staff_manage',
      roles: ['chairman', 'company_admin', 'branch_head']
    },
    {
      id: 'bookings',
      name: 'Bookings',
      icon: Calendar,
      permission: 'bookings',
      roles: ['chairman', 'company_admin', 'branch_head', 'staff']
    },
    {
      id: 'clients',
      name: 'Client Management',
      icon: UserCheck,
      permission: 'clients',
      roles: ['chairman', 'company_admin', 'branch_head']
    },
    {
      id: 'finance',
      name: 'Finance',
      icon: DollarSign,
      permission: 'finance',
      roles: ['chairman', 'company_admin', 'branch_head']
    },
    {
      id: 'inventory',
      name: 'Inventory',
      icon: Package,
      permission: 'inventory',
      roles: ['chairman', 'company_admin', 'branch_head']
    },
    
    {
      id: 'attendance',
      name: 'Attendance',
      icon: Clock,
      permission: 'attendance',
      roles: ['chairman', 'company_admin', 'branch_head', 'staff']
    },
    {
      id: 'quotations',
      name: 'Quotations',
      icon: FileText,
      permission: 'quotations',
      roles: ['chairman', 'company_admin', 'branch_head']
    },
    {
      id: 'tasks',
      name: 'Task Management',
      icon: CheckSquare,
      permission: 'tasks',
      roles: ['chairman', 'company_admin', 'branch_head', 'staff']
    },
    {
      id: 'daily-expenses',
      name: 'Daily Expenses',
      icon: DollarSign,
      permission: 'daily_expenses',
      roles: ['chairman', 'company_admin', 'branch_head']
    },
    {
      id: 'vendors',
      name: 'Vendor Management',
      icon: Truck,
      permission: 'vendors',
      roles: ['chairman', 'company_admin', 'branch_head']
    },
    {
      id: 'analytics',
      name: 'Advanced Analytics',
      icon: TrendingUp,
      permission: 'analytics',
      roles: ['chairman', 'company_admin', 'branch_head']
    },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role || '');
  });

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-gray-50 to-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 border-r border-gray-200 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-gray-900">Abeer CRM</h1>
              <p className="text-xs text-gray-500 font-medium">{user?.role?.replace('_', ' ').toUpperCase()}</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <nav className="flex-1 mt-4 px-3 overflow-y-auto">
          <div className="space-y-1 pb-4">
            {filteredMenuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              // Add section dividers
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
                      setIsOpen(false); // Close mobile menu
                    }}
                    className={`
                      w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative group
                      ${isActive 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-[1.02]' 
                        : 'text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-md hover:scale-[1.01]'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`} />
                    <span className="truncate">{item.name}</span>
                    {isActive && (
                      <div className="absolute right-3">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="p-4 bg-white border-t border-gray-200 shadow-inner mt-auto">
          <div className="flex items-center p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 cursor-pointer group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <span className="text-white font-bold text-sm">
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-900 transition-colors">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize font-medium group-hover:text-blue-600 transition-colors">{user?.role?.replace('_', ' ')}</p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full shadow-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;