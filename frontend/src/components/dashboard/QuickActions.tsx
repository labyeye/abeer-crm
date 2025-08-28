import { Plus, Calendar, Users, FileText, Clock, CheckSquare } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

const QuickActions = () => {
  const { addNotification } = useNotification();
  const { user } = useAuth();

  const getActionsByRole = () => {
    switch (user?.role) {
      case 'chairman':
      case 'company_admin':
      case 'branch_head':
        return [
          {
            id: 'booking',
            name: 'New Booking',
            icon: Plus,
            color: 'bg-blue-500 hover:bg-blue-600',
            action: () => addNotification({
              type: 'info',
              title: 'Quick Action',
              message: 'New booking form opened'
            })
          },
          {
            id: 'schedule',
            name: 'Schedule Shoot',
            icon: Calendar,
            color: 'bg-emerald-500 hover:bg-emerald-600',
            action: () => addNotification({
              type: 'info',
              title: 'Quick Action',
              message: 'Schedule form opened'
            })
          },
          {
            id: 'staff',
            name: 'Add Staff',
            icon: Users,
            color: 'bg-purple-500 hover:bg-purple-600',
            action: () => addNotification({
              type: 'info',
              title: 'Quick Action',
              message: 'Staff management opened'
            })
          },
          {
            id: 'invoice',
            name: 'Create Invoice',
            icon: FileText,
            color: 'bg-amber-500 hover:bg-amber-600',
            action: () => addNotification({
              type: 'info',
              title: 'Quick Action',
              message: 'Invoice creator opened'
            })
          }
        ];
      
      case 'staff':
        return [
          {
            id: 'attendance',
            name: 'Mark Attendance',
            icon: Clock,
            color: 'bg-green-500 hover:bg-green-600',
            action: () => addNotification({
              type: 'info',
              title: 'Quick Action',
              message: 'Attendance marked successfully'
            })
          },
          {
            id: 'tasks',
            name: 'View Tasks',
            icon: CheckSquare,
            color: 'bg-blue-500 hover:bg-blue-600',
            action: () => addNotification({
              type: 'info',
              title: 'Quick Action',
              message: 'Tasks view opened'
            })
          }
        ];
      
      case 'client':
        return [
          {
            id: 'booking',
            name: 'New Booking',
            icon: Plus,
            color: 'bg-blue-500 hover:bg-blue-600',
            action: () => addNotification({
              type: 'info',
              title: 'Quick Action',
              message: 'New booking form opened'
            })
          },
          {
            id: 'payments',
            name: 'View Payments',
            icon: FileText,
            color: 'bg-amber-500 hover:bg-amber-600',
            action: () => addNotification({
              type: 'info',
              title: 'Quick Action',
              message: 'Payments view opened'
            })
          }
        ];
      
      default:
        return [];
    }
  };

  const actions = getActionsByRole();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.action}
              className={`${action.color} text-white p-4 rounded-lg transition-all duration-200 transform hover:scale-105 flex flex-col items-center space-y-2`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-sm font-medium">{action.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;