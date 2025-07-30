import React, { useState } from 'react';
import { 
  BarChart3, 
  Plus, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Camera,
  Download,
  Filter,
  Eye,
  PieChart,
  LineChart,
  Target,
  Award,
  Clock,
  MapPin
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

const ReportsAndAnalytics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [filterPeriod, setFilterPeriod] = useState('month');
  const [filterBranch, setFilterBranch] = useState('all');
  const { addNotification } = useNotification();

  const overviewStats = {
    totalRevenue: 485750,
    totalBookings: 342,
    activeClients: 156,
    completionRate: 94.2,
    avgProjectValue: 1420,
    customerSatisfaction: 4.7,
    monthlyGrowth: 18.5,
    yearlyGrowth: 45.2
  };

  const monthlyPerformance = [
    { month: 'Jul 2023', revenue: 38000, bookings: 28, clients: 22, satisfaction: 4.5 },
    { month: 'Aug 2023', revenue: 42000, bookings: 32, clients: 26, satisfaction: 4.6 },
    { month: 'Sep 2023', revenue: 39000, bookings: 29, clients: 24, satisfaction: 4.4 },
    { month: 'Oct 2023', revenue: 45000, bookings: 35, clients: 28, satisfaction: 4.7 },
    { month: 'Nov 2023', revenue: 48000, bookings: 38, clients: 31, satisfaction: 4.6 },
    { month: 'Dec 2023', revenue: 52000, bookings: 42, clients: 34, satisfaction: 4.8 },
    { month: 'Jan 2024', revenue: 55000, bookings: 45, clients: 37, satisfaction: 4.7 }
  ];

  const branchPerformance = [
    {
      branch: 'Manhattan',
      revenue: 125000,
      bookings: 89,
      staff: 8,
      satisfaction: 4.8,
      growth: 22.5,
      topService: 'Wedding Photography'
    },
    {
      branch: 'Brooklyn',
      revenue: 98000,
      bookings: 72,
      staff: 6,
      satisfaction: 4.6,
      growth: 18.2,
      topService: 'Corporate Events'
    },
    {
      branch: 'Queens',
      revenue: 87000,
      bookings: 65,
      staff: 7,
      satisfaction: 4.7,
      growth: 15.8,
      topService: 'Family Portraits'
    },
    {
      branch: 'Los Angeles',
      revenue: 112000,
      bookings: 78,
      staff: 10,
      satisfaction: 4.9,
      growth: 25.1,
      topService: 'Fashion Photography'
    }
  ];

  const serviceAnalytics = [
    {
      service: 'Wedding Photography',
      bookings: 89,
      revenue: 178000,
      avgPrice: 2000,
      satisfaction: 4.9,
      growth: 28.5,
      color: 'bg-pink-500'
    },
    {
      service: 'Corporate Events',
      bookings: 67,
      revenue: 134000,
      avgPrice: 2000,
      satisfaction: 4.6,
      growth: 15.2,
      color: 'bg-blue-500'
    },
    {
      service: 'Family Portraits',
      bookings: 124,
      revenue: 62000,
      avgPrice: 500,
      satisfaction: 4.8,
      growth: 22.1,
      color: 'bg-emerald-500'
    },
    {
      service: 'Product Photography',
      bookings: 45,
      revenue: 67500,
      avgPrice: 1500,
      satisfaction: 4.5,
      growth: 35.8,
      color: 'bg-purple-500'
    },
    {
      service: 'Fashion Photography',
      bookings: 17,
      revenue: 44200,
      avgPrice: 2600,
      satisfaction: 4.7,
      growth: 42.3,
      color: 'bg-amber-500'
    }
  ];

  const staffPerformance = [
    {
      name: 'Alex Rodriguez',
      role: 'Senior Photographer',
      branch: 'Manhattan',
      bookings: 45,
      revenue: 89000,
      satisfaction: 4.9,
      punctuality: 98,
      taskCompletion: 96,
      overallScore: 4.8
    },
    {
      name: 'Sarah Chen',
      role: 'Video Editor',
      branch: 'Brooklyn',
      bookings: 38,
      revenue: 76000,
      satisfaction: 4.7,
      punctuality: 95,
      taskCompletion: 98,
      overallScore: 4.7
    },
    {
      name: 'Mike Johnson',
      role: 'Assistant Photographer',
      branch: 'Queens',
      bookings: 52,
      revenue: 62400,
      satisfaction: 4.6,
      punctuality: 92,
      taskCompletion: 94,
      overallScore: 4.4
    },
    {
      name: 'David Kim',
      role: 'Senior Photographer',
      branch: 'Los Angeles',
      bookings: 41,
      revenue: 82000,
      satisfaction: 4.8,
      punctuality: 97,
      taskCompletion: 95,
      overallScore: 4.7
    }
  ];

  const clientAnalytics = [
    {
      segment: 'Wedding Clients',
      count: 89,
      avgSpend: 2000,
      retention: 85,
      satisfaction: 4.9,
      growth: 28.5
    },
    {
      segment: 'Corporate Clients',
      count: 34,
      avgSpend: 3940,
      retention: 92,
      satisfaction: 4.6,
      growth: 15.2
    },
    {
      segment: 'Individual Clients',
      count: 156,
      avgSpend: 650,
      retention: 78,
      satisfaction: 4.7,
      growth: 22.1
    },
    {
      segment: 'Commercial Clients',
      count: 23,
      avgSpend: 2935,
      retention: 88,
      satisfaction: 4.5,
      growth: 35.8
    }
  ];

  const financialBreakdown = {
    revenue: {
      services: 425000,
      equipment: 35000,
      training: 15000,
      other: 10750
    },
    expenses: {
      salaries: 185000,
      equipment: 95000,
      rent: 48000,
      marketing: 25000,
      utilities: 18000,
      other: 15000
    }
  };

  const handleGenerateReport = () => {
    addNotification({
      type: 'success',
      title: 'Report Generated',
      message: 'Custom report has been generated and is ready for download'
    });
  };

  const handleExportData = (type: string) => {
    addNotification({
      type: 'info',
      title: 'Export Started',
      message: `${type} data export has been initiated`
    });
  };

  const maxRevenue = Math.max(...monthlyPerformance.map(m => m.revenue));
  const maxBookings = Math.max(...monthlyPerformance.map(m => m.bookings));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Business intelligence and performance analytics</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => handleExportData('Analytics')}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all duration-200 flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </button>
          <button
            onClick={handleGenerateReport}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">${overviewStats.totalRevenue.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 mr-1" />
                <span className="text-sm text-emerald-600 font-medium">+{overviewStats.monthlyGrowth}%</span>
              </div>
            </div>
            <div className="bg-emerald-500 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900">{overviewStats.totalBookings}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
                <span className="text-sm text-blue-600 font-medium">+12.3%</span>
              </div>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Clients</p>
              <p className="text-3xl font-bold text-gray-900">{overviewStats.activeClients}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-purple-600 mr-1" />
                <span className="text-sm text-purple-600 font-medium">+8.7%</span>
              </div>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Satisfaction</p>
              <p className="text-3xl font-bold text-gray-900">{overviewStats.customerSatisfaction}</p>
              <div className="flex items-center mt-2">
                <Award className="w-4 h-4 text-amber-600 mr-1" />
                <span className="text-sm text-amber-600 font-medium">Excellent</span>
              </div>
            </div>
            <div className="bg-amber-500 p-3 rounded-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'branches', name: 'Branch Performance', icon: MapPin },
              { id: 'services', name: 'Service Analytics', icon: Camera },
              { id: 'staff', name: 'Staff Performance', icon: Users },
              { id: 'clients', name: 'Client Analytics', icon: Target },
              { id: 'financial', name: 'Financial Breakdown', icon: PieChart }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Filter className="w-4 h-4 text-gray-400 mr-2" />
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Branches</option>
                <option value="manhattan">Manhattan</option>
                <option value="brooklyn">Brooklyn</option>
                <option value="queens">Queens</option>
                <option value="los-angeles">Los Angeles</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Performance Trends */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend (7 Months)</h3>
                  <div className="space-y-3">
                    {monthlyPerformance.map((data) => (
                      <div key={data.month} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">{data.month}</span>
                          <span className="font-medium text-gray-900">${(data.revenue / 1000).toFixed(0)}k</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Trend (7 Months)</h3>
                  <div className="space-y-3">
                    {monthlyPerformance.map((data) => (
                      <div key={data.month} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">{data.month}</span>
                          <span className="font-medium text-gray-900">{data.bookings} bookings</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${(data.bookings / maxBookings) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p className="text-gray-700">• Revenue increased by 18.5% this month</p>
                    <p className="text-gray-700">• Wedding photography shows highest growth (28.5%)</p>
                    <p className="text-gray-700">• Customer satisfaction improved to 4.7/5</p>
                    <p className="text-gray-700">• Manhattan branch leads in performance</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-700">• 94.2% project completion rate</p>
                    <p className="text-gray-700">• Average project value: $1,420</p>
                    <p className="text-gray-700">• 156 active clients this month</p>
                    <p className="text-gray-700">• Staff performance score: 4.6/5</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'branches' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {branchPerformance.map((branch) => (
                  <div key={branch.branch} className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{branch.branch} Branch</h3>
                      <div className="flex items-center text-emerald-600">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">+{branch.growth}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Revenue</p>
                        <p className="text-xl font-bold text-gray-900">${branch.revenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Bookings</p>
                        <p className="text-xl font-bold text-gray-900">{branch.bookings}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Staff</p>
                        <p className="text-xl font-bold text-gray-900">{branch.staff}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Satisfaction</p>
                        <p className="text-xl font-bold text-gray-900">{branch.satisfaction}</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3">
                      <p className="text-sm text-gray-600">Top Service:</p>
                      <p className="font-medium text-gray-900">{branch.topService}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {serviceAnalytics.map((service) => (
                  <div key={service.service} className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full ${service.color} mr-3`}></div>
                        <h3 className="text-lg font-semibold text-gray-900">{service.service}</h3>
                      </div>
                      <div className="flex items-center text-emerald-600">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">+{service.growth}%</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Bookings:</span>
                        <span className="font-medium text-gray-900">{service.bookings}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Revenue:</span>
                        <span className="font-medium text-gray-900">${service.revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg Price:</span>
                        <span className="font-medium text-gray-900">${service.avgPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Satisfaction:</span>
                        <span className="font-medium text-gray-900">{service.satisfaction}/5</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Staff Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Branch
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bookings
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Overall Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {staffPerformance.map((staff) => (
                      <tr key={staff.name} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                            <div className="text-sm text-gray-500">{staff.role}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {staff.branch}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {staff.bookings}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${staff.revenue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Punctuality:</span>
                              <span>{staff.punctuality}%</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>Completion:</span>
                              <span>{staff.taskCompletion}%</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>Satisfaction:</span>
                              <span>{staff.satisfaction}/5</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Award className="w-4 h-4 text-yellow-400 mr-1" />
                            <span className="text-sm font-medium text-gray-900">{staff.overallScore}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'clients' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {clientAnalytics.map((segment) => (
                  <div key={segment.segment} className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{segment.segment}</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Client Count</p>
                        <p className="text-2xl font-bold text-gray-900">{segment.count}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Avg Spend</p>
                        <p className="text-2xl font-bold text-gray-900">${segment.avgSpend}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Retention Rate</p>
                        <p className="text-2xl font-bold text-gray-900">{segment.retention}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Satisfaction</p>
                        <p className="text-2xl font-bold text-gray-900">{segment.satisfaction}/5</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-gray-600">Growth Rate:</span>
                      <div className="flex items-center text-emerald-600">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span className="font-medium">+{segment.growth}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Breakdown */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
                  <div className="space-y-4">
                    {Object.entries(financialBreakdown.revenue).map(([category, amount]) => {
                      const total = Object.values(financialBreakdown.revenue).reduce((sum, val) => sum + val, 0);
                      const percentage = (amount / total) * 100;
                      
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 capitalize">{category}:</span>
                            <span className="font-medium text-gray-900">${amount.toLocaleString()}</span>
                          </div>
                          <div className="bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500">{percentage.toFixed(1)}% of total revenue</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Expense Breakdown */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
                  <div className="space-y-4">
                    {Object.entries(financialBreakdown.expenses).map(([category, amount]) => {
                      const total = Object.values(financialBreakdown.expenses).reduce((sum, val) => sum + val, 0);
                      const percentage = (amount / total) * 100;
                      
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 capitalize">{category}:</span>
                            <span className="font-medium text-gray-900">${amount.toLocaleString()}</span>
                          </div>
                          <div className="bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500">{percentage.toFixed(1)}% of total expenses</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Profit Analysis */}
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      ${Object.values(financialBreakdown.revenue).reduce((sum, val) => sum + val, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">
                      ${Object.values(financialBreakdown.expenses).reduce((sum, val) => sum + val, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Net Profit</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${(Object.values(financialBreakdown.revenue).reduce((sum, val) => sum + val, 0) - 
                         Object.values(financialBreakdown.expenses).reduce((sum, val) => sum + val, 0)).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsAndAnalytics;