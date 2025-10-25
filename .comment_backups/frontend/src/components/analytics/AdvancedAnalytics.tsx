import { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  IndianRupee,
  Users,
  Camera,
  Clock,
  Target,
  Award,
  AlertCircle,
  Download,
  RefreshCw
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import NeomorphicCard from '../ui/NeomorphicCard';
import NeomorphicButton from '../ui/NeomorphicButton';
import LoadingSpinner from '../ui/LoadingSpinner';

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    revenueGrowth: number;
    totalBookings: number;
    bookingsGrowth: number;
    averageOrderValue: number;
    aovGrowth: number;
    clientRetention: number;
    retentionGrowth: number;
  };
  revenueAnalysis: {
    monthlyRevenue: Array<{ month: string; revenue: number; bookings: number }>;
    revenueByService: Array<{ service: string; revenue: number; percentage: number }>;
    paymentStatus: { collected: number; pending: number; overdue: number };
  };
  operationalMetrics: {
    productivity: {
      tasksCompleted: number;
      onTimeDelivery: number;
      averageProjectDuration: number;
      resourceUtilization: number;
    };
    qualityMetrics: {
      clientSatisfaction: number;
      revisionsRequested: number;
      complaintResolution: number;
      qualityScore: number;
    };
  };
  clientAnalytics: {
    segmentation: Array<{ segment: string; count: number; revenue: number }>;
    acquisitionChannels: Array<{ channel: string; clients: number; conversion: number }>;
    lifetimeValue: number;
    churnRate: number;
  };
  teamPerformance: {
    staffMetrics: Array<{
      staffId: string;
      name: string;
      designation: string;
      projectsCompleted: number;
      efficiency: number;
      clientRating: number;
      revenue: number;
    }>;
    departmentPerformance: Array<{
      department: string;
      efficiency: number;
      revenue: number;
      growth: number;
    }>;
  };
  marketingROI: {
    campaignPerformance: Array<{
      campaign: string;
      spend: number;
      leads: number;
      conversions: number;
      roi: number;
    }>;
    leadConversion: {
      totalLeads: number;
      qualifiedLeads: number;
      conversions: number;
      conversionRate: number;
    };
  };
  forecasting: {
    projectedRevenue: Array<{ month: string; projected: number; actual?: number }>;
    seasonalTrends: Array<{ season: string; multiplier: number }>;
    growthPrediction: {
      nextQuarter: number;
      nextYear: number;
      confidence: number;
    };
  };
}

const AdvancedAnalytics = () => {
  const { addNotification } = useNotification();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'operations' | 'clients' | 'team' | 'marketing' | 'forecasting'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      // API call would go here
      const mockData: AnalyticsData = {
        overview: {
          totalRevenue: 2850000,
          revenueGrowth: 12.5,
          totalBookings: 147,
          bookingsGrowth: 8.3,
          averageOrderValue: 19387,
          aovGrowth: 4.2,
          clientRetention: 78.5,
          retentionGrowth: 3.1
        },
        revenueAnalysis: {
          monthlyRevenue: [
            { month: 'Jul', revenue: 420000, bookings: 22 },
            { month: 'Aug', revenue: 380000, bookings: 19 },
            { month: 'Sep', revenue: 450000, bookings: 24 },
            { month: 'Oct', revenue: 520000, bookings: 26 },
            { month: 'Nov', revenue: 480000, bookings: 23 },
            { month: 'Dec', revenue: 600000, bookings: 33 }
          ],
          revenueByService: [
            { service: 'Wedding Photography', revenue: 1200000, percentage: 42.1 },
            { service: 'Corporate Events', revenue: 680000, percentage: 23.9 },
            { service: 'Pre-Wedding Shoots', revenue: 420000, percentage: 14.7 },
            { service: 'Product Photography', revenue: 350000, percentage: 12.3 },
            { service: 'Others', revenue: 200000, percentage: 7.0 }
          ],
          paymentStatus: {
            collected: 2400000,
            pending: 320000,
            overdue: 130000
          }
        },
        operationalMetrics: {
          productivity: {
            tasksCompleted: 1247,
            onTimeDelivery: 87.3,
            averageProjectDuration: 12.5,
            resourceUtilization: 82.1
          },
          qualityMetrics: {
            clientSatisfaction: 4.6,
            revisionsRequested: 2.3,
            complaintResolution: 94.2,
            qualityScore: 91.8
          }
        },
        clientAnalytics: {
          segmentation: [
            { segment: 'Premium Clients', count: 28, revenue: 1420000 },
            { segment: 'Regular Clients', count: 89, revenue: 1100000 },
            { segment: 'Budget Clients', count: 156, revenue: 330000 }
          ],
          acquisitionChannels: [
            { channel: 'Referrals', clients: 98, conversion: 34.2 },
            { channel: 'Social Media', clients: 67, conversion: 12.5 },
            { channel: 'Website', clients: 45, conversion: 8.7 },
            { channel: 'Events/Exhibitions', clients: 32, conversion: 18.9 }
          ],
          lifetimeValue: 45600,
          churnRate: 12.3
        },
        teamPerformance: {
          staffMetrics: [
            {
              staffId: '1',
              name: 'John Doe',
              designation: 'Lead Photographer',
              projectsCompleted: 34,
              efficiency: 92.5,
              clientRating: 4.8,
              revenue: 680000
            },
            {
              staffId: '2',
              name: 'Alice Smith',
              designation: 'Photo Editor',
              projectsCompleted: 156,
              efficiency: 89.2,
              clientRating: 4.6,
              revenue: 420000
            },
            {
              staffId: '3',
              name: 'Bob Johnson',
              designation: 'Videographer',
              projectsCompleted: 28,
              efficiency: 85.7,
              clientRating: 4.7,
              revenue: 380000
            }
          ],
          departmentPerformance: [
            { department: 'Photography', efficiency: 91.2, revenue: 1680000, growth: 15.3 },
            { department: 'Video Production', efficiency: 87.8, revenue: 920000, growth: 8.7 },
            { department: 'Post-Production', efficiency: 89.5, revenue: 250000, growth: 22.1 }
          ]
        },
        marketingROI: {
          campaignPerformance: [
            { campaign: 'Wedding Season Campaign', spend: 45000, leads: 234, conversions: 56, roi: 3.2 },
            { campaign: 'Corporate Events', spend: 28000, leads: 156, conversions: 34, roi: 2.8 },
            { campaign: 'Social Media Ads', spend: 35000, leads: 189, conversions: 23, roi: 1.9 }
          ],
          leadConversion: {
            totalLeads: 1247,
            qualifiedLeads: 456,
            conversions: 147,
            conversionRate: 32.2
          }
        },
        forecasting: {
          projectedRevenue: [
            { month: 'Jan 2025', projected: 520000, actual: undefined },
            { month: 'Feb 2025', projected: 480000, actual: undefined },
            { month: 'Mar 2025', projected: 650000, actual: undefined },
            { month: 'Apr 2025', projected: 720000, actual: undefined }
          ],
          seasonalTrends: [
            { season: 'Spring (Mar-May)', multiplier: 1.35 },
            { season: 'Summer (Jun-Aug)', multiplier: 0.85 },
            { season: 'Monsoon (Sep-Nov)', multiplier: 1.15 },
            { season: 'Winter (Dec-Feb)', multiplier: 1.65 }
          ],
          growthPrediction: {
            nextQuarter: 18.5,
            nextYear: 24.2,
            confidence: 87.3
          }
        }
      };
      setAnalyticsData(mockData);
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to fetch analytics data'
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, fetchAnalyticsData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
    addNotification({
      type: 'success',
      title: 'Success',
      message: 'Analytics data refreshed'
    });
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString()}`;
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
          <p className="text-gray-600">Unable to load analytics data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive business intelligence and insights</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Period:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <NeomorphicButton
            onClick={handleRefresh}
            disabled={refreshing}
            className="border border-gray-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </NeomorphicButton>
          <NeomorphicButton className="border border-gray-300">
            <Download className="w-4 h-4 mr-2" />
            Export
          </NeomorphicButton>
        </div>
      </div>

      {/* Navigation Tabs */}
      <NeomorphicCard className="p-2">
        <div className="flex items-center space-x-1 overflow-x-auto">
          {[
            { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
            { id: 'revenue' as const, label: 'Revenue', icon: IndianRupee },
            { id: 'operations' as const, label: 'Operations', icon: Target },
            { id: 'clients' as const, label: 'Clients', icon: Users },
            { id: 'team' as const, label: 'Team', icon: Award },
            { id: 'marketing' as const, label: 'Marketing', icon: TrendingUp },
            { id: 'forecasting' as const, label: 'Forecasting', icon: Calendar }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </NeomorphicCard>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <NeomorphicCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.overview.totalRevenue)}</p>
                  <div className={`flex items-center space-x-1 ${getGrowthColor(analyticsData.overview.revenueGrowth)}`}>
                    {getGrowthIcon(analyticsData.overview.revenueGrowth)}
                    <span className="text-sm font-medium">{analyticsData.overview.revenueGrowth}%</span>
                  </div>
                </div>
                <IndianRupee className="w-8 h-8 text-green-500" />
              </div>
            </NeomorphicCard>
            
            <NeomorphicCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalBookings}</p>
                  <div className={`flex items-center space-x-1 ${getGrowthColor(analyticsData.overview.bookingsGrowth)}`}>
                    {getGrowthIcon(analyticsData.overview.bookingsGrowth)}
                    <span className="text-sm font-medium">{analyticsData.overview.bookingsGrowth}%</span>
                  </div>
                </div>
                <Camera className="w-8 h-8 text-blue-500" />
              </div>
            </NeomorphicCard>
            
            <NeomorphicCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.overview.averageOrderValue)}</p>
                  <div className={`flex items-center space-x-1 ${getGrowthColor(analyticsData.overview.aovGrowth)}`}>
                    {getGrowthIcon(analyticsData.overview.aovGrowth)}
                    <span className="text-sm font-medium">{analyticsData.overview.aovGrowth}%</span>
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </NeomorphicCard>
            
            <NeomorphicCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Client Retention</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.clientRetention}%</p>
                  <div className={`flex items-center space-x-1 ${getGrowthColor(analyticsData.overview.retentionGrowth)}`}>
                    {getGrowthIcon(analyticsData.overview.retentionGrowth)}
                    <span className="text-sm font-medium">{analyticsData.overview.retentionGrowth}%</span>
                  </div>
                </div>
                <Users className="w-8 h-8 text-orange-500" />
              </div>
            </NeomorphicCard>
          </div>

          {/* Revenue Chart */}
          <NeomorphicCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
            <div className="h-64 flex items-end justify-between space-x-2">
              {analyticsData.revenueAnalysis.monthlyRevenue.map((month, index) => {
                const maxRevenue = Math.max(...analyticsData.revenueAnalysis.monthlyRevenue.map(m => m.revenue));
                const height = (month.revenue / maxRevenue) * 100;
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="w-full flex flex-col items-center">
                      <div className="text-xs text-gray-600 mb-1">{formatCurrency(month.revenue)}</div>
                      <div 
                        className="w-full bg-blue-500 rounded-t-lg transition-all duration-500 hover:bg-blue-600"
                        style={{ height: `${height}%` }}
                      ></div>
                    </div>
                    <div className="text-sm font-medium text-gray-700 mt-2">{month.month}</div>
                    <div className="text-xs text-gray-500">{month.bookings} bookings</div>
                  </div>
                );
              })}
            </div>
          </NeomorphicCard>

          {/* Service Revenue Breakdown */}
          <NeomorphicCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Service</h3>
            <div className="space-y-4">
              {analyticsData.revenueAnalysis.revenueByService.map((service, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <span className="font-medium text-gray-900">{service.service}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${service.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-medium text-gray-900">{formatCurrency(service.revenue)}</div>
                    <div className="text-sm text-gray-500">{service.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </NeomorphicCard>
        </div>
      )}

      {/* Operations Tab */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          {/* Productivity Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <NeomorphicCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tasks Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.operationalMetrics.productivity.tasksCompleted}</p>
                </div>
                <Target className="w-8 h-8 text-blue-500" />
              </div>
            </NeomorphicCard>
            
            <NeomorphicCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">On-Time Delivery</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.operationalMetrics.productivity.onTimeDelivery}%</p>
                </div>
                <Clock className="w-8 h-8 text-green-500" />
              </div>
            </NeomorphicCard>
            
            <NeomorphicCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Project Duration</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.operationalMetrics.productivity.averageProjectDuration} days</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
            </NeomorphicCard>
            
            <NeomorphicCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Resource Utilization</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.operationalMetrics.productivity.resourceUtilization}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-500" />
              </div>
            </NeomorphicCard>
          </div>

          {/* Quality Metrics */}
          <NeomorphicCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{analyticsData.operationalMetrics.qualityMetrics.clientSatisfaction}</div>
                <div className="text-sm text-gray-600">Client Satisfaction</div>
                <div className="text-xs text-gray-500">out of 5.0</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{analyticsData.operationalMetrics.qualityMetrics.revisionsRequested}</div>
                <div className="text-sm text-gray-600">Avg Revisions</div>
                <div className="text-xs text-gray-500">per project</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{analyticsData.operationalMetrics.qualityMetrics.complaintResolution}%</div>
                <div className="text-sm text-gray-600">Complaint Resolution</div>
                <div className="text-xs text-gray-500">within 24 hours</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{analyticsData.operationalMetrics.qualityMetrics.qualityScore}%</div>
                <div className="text-sm text-gray-600">Overall Quality Score</div>
                <div className="text-xs text-gray-500">based on reviews</div>
              </div>
            </div>
          </NeomorphicCard>
        </div>
      )}

      {/* Team Performance Tab */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          {/* Staff Performance */}
          <NeomorphicCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Staff Member</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Projects</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Efficiency</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Rating</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.teamPerformance.staffMetrics.map((staff, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{staff.name}</div>
                          <div className="text-sm text-gray-500">{staff.designation}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-900">{staff.projectsCompleted}</td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${staff.efficiency >= 90 ? 'text-green-600' : staff.efficiency >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {staff.efficiency}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1">
                          <span className="font-medium text-gray-900">{staff.clientRating}</span>
                          <span className="text-yellow-500">★</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{formatCurrency(staff.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </NeomorphicCard>

          {/* Department Performance */}
          <NeomorphicCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h3>
            <div className="space-y-4">
              {analyticsData.teamPerformance.departmentPerformance.map((dept, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{dept.department}</h4>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="text-sm">
                        <span className="text-gray-600">Efficiency: </span>
                        <span className="font-medium text-gray-900">{dept.efficiency}%</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Revenue: </span>
                        <span className="font-medium text-gray-900">{formatCurrency(dept.revenue)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Growth: </span>
                        <span className={`font-medium ${getGrowthColor(dept.growth)}`}>{dept.growth}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center space-x-1 ${getGrowthColor(dept.growth)}`}>
                      {getGrowthIcon(dept.growth)}
                      <span className="font-medium">{dept.growth}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </NeomorphicCard>
        </div>
      )}

      {/* Forecasting Tab */}
      {activeTab === 'forecasting' && (
        <div className="space-y-6">
          {/* Growth Predictions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <NeomorphicCard className="p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Next Quarter Growth</p>
                <p className="text-3xl font-bold text-green-600">{analyticsData.forecasting.growthPrediction.nextQuarter}%</p>
                <p className="text-xs text-gray-500 mt-1">Projected</p>
              </div>
            </NeomorphicCard>
            
            <NeomorphicCard className="p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Next Year Growth</p>
                <p className="text-3xl font-bold text-blue-600">{analyticsData.forecasting.growthPrediction.nextYear}%</p>
                <p className="text-xs text-gray-500 mt-1">Projected</p>
              </div>
            </NeomorphicCard>
            
            <NeomorphicCard className="p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Prediction Confidence</p>
                <p className="text-3xl font-bold text-purple-600">{analyticsData.forecasting.growthPrediction.confidence}%</p>
                <p className="text-xs text-gray-500 mt-1">Accuracy</p>
              </div>
            </NeomorphicCard>
          </div>

          {/* Seasonal Trends */}
          <NeomorphicCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Trends</h3>
            <div className="space-y-3">
              {analyticsData.forecasting.seasonalTrends.map((season, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{season.season}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(season.multiplier / 2) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-medium text-gray-900">{season.multiplier}x</span>
                  </div>
                </div>
              ))}
            </div>
          </NeomorphicCard>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalytics;
