import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  UserCheck, 
  DollarSign, 
  Package, 
  Building2, 
  BarChart3,
  X,
  Camera,
  Clock,
  FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const { user, hasPermission } = useAuth();

  const menuItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      permission: 'dashboard'
    },
    {
      id: 'company',
      name: 'Company Management',
      icon: Building2,
      permission: 'company_manage',
      roles: ['chairman', 'company_admin']
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
      id: 'rentals',
      name: 'Rental Management',
      icon: Package,
      permission: 'rentals',
      roles: ['chairman', 'company_admin', 'branch_head']
    },
    {
      id: 'attendance',
      name: 'Attendance',
      icon: Clock,
      permission: 'attendance',
      roles: ['chairman', 'company_admin', 'branch_head']
    },
    {
      id: 'quotations',
      name: 'Quotations',
      icon: FileText,
      permission: 'quotations',
      roles: ['chairman', 'company_admin', 'branch_head']
    },
    {
      id: 'reports',
      name: 'Reports & Analytics',
      icon: BarChart3,
      permission: 'reports',
      roles: ['chairman', 'company_admin', 'branch_head']
    }
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
        fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-gray-900">PhotoERP</h1>
              <p className="text-xs text-gray-500">{user?.role?.replace('_', ' ').toUpperCase()}</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg hover:bg-gray-100 lg:hidden"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false); // Close mobile menu
                  }}
                  className={`
                    w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  {item.name}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.name?.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;