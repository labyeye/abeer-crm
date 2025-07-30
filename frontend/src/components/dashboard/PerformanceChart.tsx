import React from 'react';
import { TrendingUp } from 'lucide-react';

const PerformanceChart = () => {
  const monthlyData = [
    { month: 'Jan', bookings: 45, revenue: 32000 },
    { month: 'Feb', bookings: 52, revenue: 38000 },
    { month: 'Mar', bookings: 48, revenue: 35000 },
    { month: 'Apr', bookings: 61, revenue: 42000 },
    { month: 'May', bookings: 55, revenue: 39000 },
    { month: 'Jun', bookings: 67, revenue: 48000 }
  ];

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));
  const maxBookings = Math.max(...monthlyData.map(d => d.bookings));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Performance Overview</h2>
          <p className="text-gray-600">Monthly bookings and revenue trends</p>
        </div>
        <div className="flex items-center text-emerald-600">
          <TrendingUp className="w-5 h-5 mr-2" />
          <span className="font-medium">+18% this month</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Revenue Chart */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
          <div className="space-y-3">
            {monthlyData.map((data) => (
              <div key={data.month} className="flex items-center">
                <div className="w-12 text-sm text-gray-600">{data.month}</div>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-20 text-sm font-medium text-gray-900">
                  ${(data.revenue / 1000).toFixed(0)}k
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bookings Chart */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Monthly Bookings</h3>
          <div className="space-y-3">
            {monthlyData.map((data) => (
              <div key={data.month} className="flex items-center">
                <div className="w-12 text-sm text-gray-600">{data.month}</div>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(data.bookings / maxBookings) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-20 text-sm font-medium text-gray-900">
                  {data.bookings}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceChart;