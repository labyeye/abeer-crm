import { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Camera,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Package,
  Loader2,
  CheckSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { inventoryAPI, bookingAPI, staffAPI } from '../../services/api';
import StatCard from '../ui/StatCard';
import RecentActivity from './RecentActivity';
import QuickActions from './QuickActions';
import PerformanceChart from './PerformanceChart';

interface BookingStat {
  _id: string;
  createdAt: string;
  status: string;
  pricing?: {
    totalAmount: number;
  };
}

interface StaffStat {
  _id: string;
  name: string;
  status?: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [inventoryStats, setInventoryStats] = useState<any>(null);
  const [bookingStats, setBookingStats] = useState<BookingStat[]>([]);
  const [staffStats, setStaffStats] = useState<StaffStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const [inventoryRes, bookingRes, staffRes] = await Promise.all([
        inventoryAPI.getInventoryStats(),
        bookingAPI.getBookings({ limit: 100 }),
        staffAPI.getStaff()
      ]);
      setInventoryStats(inventoryRes.data);
      setBookingStats(bookingRes.data);
      setStaffStats(staffRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic business stats - show different stats based on role
  const getStatsByRole = () => {
    if (user?.role === 'staff') {
      return [
        {
          title: 'My Tasks',
          value: '0', // This would be fetched from user's tasks
          change: 'Tasks assigned to you',
          changeType: 'neutral' as const,
          icon: CheckCircle,
          color: 'blue' as const
        },
        {
          title: 'Attendance',
          value: 'Present', // This would be fetched from attendance API
          change: 'Today\'s status',
          changeType: 'increase' as const,
          icon: Clock,
          color: 'green' as const
        },
        {
          title: 'Working Hours',
          value: '8h', // This would be calculated from attendance
          change: 'Today\'s hours',
          changeType: 'neutral' as const,
          icon: TrendingUp,
          color: 'purple' as const
        },
        {
          title: 'Performance',
          value: 'Good', // This would be calculated based on tasks completed
          change: 'This month',
          changeType: 'increase' as const,
          icon: Users,
          color: 'yellow' as const
        }
      ];
    }

    // Default stats for management roles
    return [
      {
        title: 'Total Bookings',
        value: bookingStats ? bookingStats.length.toString() : '0',
        change: bookingStats ? `+${bookingStats.filter((b: BookingStat) => new Date(b.createdAt) > new Date(Date.now() - 30*24*60*60*1000)).length} this month` : '',
        changeType: 'increase' as const,
        icon: Calendar,
        color: 'blue' as const
      },
      {
        title: 'Active Projects',
        value: bookingStats ? bookingStats.filter((b: BookingStat) => b.status === 'in_progress' || b.status === 'confirmed').length.toString() : '0',
        change: bookingStats ? `+${bookingStats.filter((b: BookingStat) => b.status === 'confirmed').length} confirmed` : '',
        changeType: 'increase' as const,
        icon: Camera,
        color: 'green' as const
      },
      {
        title: 'Monthly Revenue',
        value: bookingStats ? `₹${bookingStats.reduce((sum: number, b: BookingStat) => sum + (b.pricing?.totalAmount || 0), 0).toLocaleString()}` : '₹0',
        change: '+18% from last month',
        changeType: 'increase' as const,
        icon: DollarSign,
        color: 'purple' as const
      },
      {
        title: 'Team Members',
        value: staffStats ? staffStats.length.toString() : '0',
        change: staffStats ? `+${staffStats.filter((s: any) => s.status === 'active').length} active` : '',
        changeType: 'increase' as const,
        icon: Users,
        color: 'yellow' as const
      }
    ];
  };

  const stats = getStatsByRole();

  // Dynamic inventory stats
  const inventoryStatsCards = inventoryStats ? [
    {
      title: 'Total Inventory Items',
      value: inventoryStats.overview.totalItems.toString(),
      change: `${inventoryStats.overview.lowStockItems} low stock items`,
      changeType: inventoryStats.overview.lowStockItems > 0 ? 'decrease' as const : 'neutral' as const,
      icon: Package,
      color: 'blue' as const
    },
    {
      title: 'Total Quantity',
      value: inventoryStats.overview.totalQuantity.toString(),
      change: `${inventoryStats.overview.outOfStockItems} out of stock`,
      changeType: inventoryStats.overview.outOfStockItems > 0 ? 'decrease' as const : 'neutral' as const,
      icon: Package,
      color: 'green' as const
    },
    {
      title: 'Inventory Value',
      value: `₹${inventoryStats.overview.totalValue ? inventoryStats.overview.totalValue.toLocaleString() : '0'}`,
      change: 'Total asset value',
      changeType: 'neutral' as const,
      icon: DollarSign,
      color: 'purple' as const
    },
    {
      title: 'Low Stock Alert',
      value: inventoryStats.overview.lowStockItems.toString(),
      change: 'Items need restocking',
      changeType: inventoryStats.overview.lowStockItems > 0 ? 'decrease' as const : 'neutral' as const,
      icon: AlertTriangle,
      color: 'yellow' as const
    }
  ] : [];

  // Today's schedule (dynamic from bookings)
  const today = new Date();
  const todayTasks = bookingStats ? bookingStats.filter((b: any) => {
    const d = new Date(b.functionDetails?.date);
    return d.toDateString() === today.toDateString();
  }).map((b: any) => ({
    id: b._id,
    title: b.functionDetails?.type + (b.client ? ` - ${b.client.name}` : ''),
    time: b.functionDetails?.time?.start || '',
    status: b.status,
    location: b.functionDetails?.venue?.name || ''
  })) : [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': return Clock;
      case 'confirmed': return TrendingUp;
      case 'scheduled': return Calendar;
      default: return AlertTriangle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-600 bg-emerald-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'confirmed': return 'text-indigo-600 bg-indigo-50';
      case 'scheduled': return 'text-amber-600 bg-amber-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {user?.role === 'staff' 
                ? `Welcome back, ${user?.name?.split(' ')[0]}!` 
                : `Welcome back, ${user?.name?.split(' ')[0]}!`
              }
            </h1>
            <p className="text-blue-100 mt-2">
              {user?.role === 'staff'
                ? "Here's your personal dashboard with tasks and attendance information."
                : "Here's what's happening with your photography business today."
              }
            </p>
          </div>
          <div className="hidden md:block">
            <Camera className="w-16 h-16 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Business Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Inventory Stats Grid - Only show for management roles */}
      {inventoryStats && ['chairman', 'company_admin', 'branch_head'].includes(user?.role || '') && (
        <>
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Inventory Overview</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {inventoryStatsCards.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>
        </>
      )}

      {/* Staff-specific content */}
      {user?.role === 'staff' && (
        <>
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">My Tasks</h2>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center py-8">
              <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks assigned</h3>
              <p className="text-gray-600">You don't have any tasks assigned to you at the moment.</p>
            </div>
          </div>
        </>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule/Tasks Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {user?.role === 'staff' ? 'My Tasks' : 'Today\'s Schedule'}
              </h2>
              <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {user?.role === 'staff' ? (
                <div className="text-center py-8">
                  <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks assigned</h3>
                  <p className="text-gray-600">You don't have any tasks assigned to you at the moment.</p>
                </div>
              ) : (
                <>
                  {todayTasks.length === 0 && (
                    <div className="text-gray-500 text-center py-8">No bookings scheduled for today.</div>
                  )}
                  {todayTasks.map((task: any) => {
                    const StatusIcon = getStatusIcon(task.status);
                    return (
                      <div key={task.id} className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className={`p-2 rounded-lg mr-4 ${getStatusColor(task.status)}`}>
                          <StatusIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{task.title}</h3>
                          <p className="text-sm text-gray-600">{task.location}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{task.time}</p>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
        {/* Quick Actions & Recent Activity */}
        <div className="space-y-6">
          <QuickActions />
          <RecentActivity />
        </div>
      </div>
      {/* Performance Chart - Only show for management roles */}
      {['chairman', 'company_admin', 'branch_head'].includes(user?.role || '') && (
        <PerformanceChart />
      )}
    </div>
  );
};

export default Dashboard;