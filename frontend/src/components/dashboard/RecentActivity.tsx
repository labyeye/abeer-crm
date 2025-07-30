import React from 'react';
import { Calendar, DollarSign, Users, Camera } from 'lucide-react';

const RecentActivity = () => {
  const activities = [
    {
      id: 1,
      type: 'booking',
      title: 'New booking received',
      description: 'Wedding photography - Sarah & Mike',
      time: '2 hours ago',
      icon: Calendar,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      id: 2,
      type: 'payment',
      title: 'Payment received',
      description: '$2,500 from Johnson Family',
      time: '4 hours ago',
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50'
    },
    {
      id: 3,
      type: 'staff',
      title: 'New staff member',
      description: 'Alex joined as photographer',
      time: '1 day ago',
      icon: Users,
      color: 'text-purple-600 bg-purple-50'
    },
    {
      id: 4,
      type: 'project',
      title: 'Project completed',
      description: 'Corporate event photos delivered',
      time: '2 days ago',
      icon: Camera,
      color: 'text-amber-600 bg-amber-50'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
        <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${activity.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{activity.title}</p>
                <p className="text-gray-600 text-sm">{activity.description}</p>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivity;