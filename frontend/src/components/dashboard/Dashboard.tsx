import React, { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { inventoryAPI, bookingAPI, staffAPI, clientAPI } from '../../services/api';
import StatCard from '../ui/StatCard';
import RecentActivity from './RecentActivity';
import QuickActions from './QuickActions';
import PerformanceChart from './PerformanceChart';

const Dashboard = () => {
  const { user } = useAuth();
  const [inventoryStats, setInventoryStats] = useState<any>(null);
  const [bookingStats, setBookingStats] = useState<any>(null);
  const [staffStats, setStaffStats] = useState<any>(null);
  const [clientStats, setClientStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const [inventoryRes, bookingRes, staffRes, clientRes] = await Promise.all([
        inventoryAPI.getInventoryStats(),
        bookingAPI.getBookings({ limit: 100 }),
        staffAPI.getStaff(),
        clientAPI.getClients()
      ]);
      setInventoryStats(inventoryRes.data);
      setBookingStats(bookingRes.data);
      setStaffStats(staffRes.data);
      setClientStats(clientRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic business stats
  const stats = [
    {
      title: 'Total Bookings',
      value: bookingStats ? bookingStats.length.toString() : '0',
      change: bookingStats ? `+${bookingStats.filter((b: any) => new Date(b.createdAt) > new Date(Date.now() - 30*24*60*60*1000)).length} this month` : '',
      changeType: 'increase' as const,
      icon: Calendar,
      color: 'blue' as const
    },
    {
      title: 'Active Projects',
      value: bookingStats ? bookingStats.filter((b: any) => b.status === 'in_progress' || b.status === 'confirmed').length.toString() : '0',
      change: bookingStats ? `+${bookingStats.filter((b: any) => b.status === 'confirmed').length} confirmed` : '',
      changeType: 'increase' as const,
      icon: Camera,
      color: 'green' as const
    },
    {
      title: 'Monthly Revenue',
      value: bookingStats ? `₹${bookingStats.reduce((sum: number, b: any) => sum + (b.pricing?.totalAmount || 0), 0).toLocaleString()}` : '₹0',
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
            <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0]}!</h1>
            <p className="text-blue-100 mt-2">Here's what's happening with your photography business today.</p>
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

      {/* Inventory Stats Grid - Only show if user has inventory access */}
      {inventoryStats && ['chairman', 'admin', 'manager'].includes(user?.role || '') && (
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Today's Schedule</h2>
              <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                View All
              </button>
            </div>
            <div className="space-y-4">
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
            </div>
          </div>
        </div>
        {/* Quick Actions & Recent Activity */}
        <div className="space-y-6">
          <QuickActions />
          <RecentActivity />
        </div>
      </div>
      {/* Performance Chart */}
      <PerformanceChart />
    </div>
  );
};

export default Dashboard;