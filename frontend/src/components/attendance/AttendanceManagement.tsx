import React, { useState } from 'react';
import { 
  Clock, 
  Plus, 
  Search, 
  Filter,
  MapPin,
  Camera,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Download,
  Users,
  TrendingUp,
  Target,
  Award
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

const AttendanceManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('today');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('daily');
  const { addNotification } = useNotification();

  const todayAttendance = [
    {
      id: 1,
      staffName: 'Alex Rodriguez',
      role: 'Senior Photographer',
      checkIn: '09:00 AM',
      checkOut: '06:30 PM',
      workingHours: '9h 30m',
      status: 'present',
      location: 'Manhattan Branch',
      gpsLocation: '40.7589, -73.9851',
      photo: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?w=150',
      tasks: ['Wedding Shoot - Johnson Family', 'Equipment Check'],
      overtime: '1h 30m',
      breaks: '1h 00m'
    },
    {
      id: 2,
      staffName: 'Sarah Chen',
      role: 'Video Editor',
      checkIn: '09:15 AM',
      checkOut: '06:00 PM',
      workingHours: '8h 45m',
      status: 'present',
      location: 'Brooklyn Branch',
      gpsLocation: '40.6892, -73.9442',
      photo: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?w=150',
      tasks: ['Video Editing - Corporate Event', 'Client Review'],
      overtime: '0h 45m',
      breaks: '1h 00m'
    },
    {
      id: 3,
      staffName: 'Mike Johnson',
      role: 'Assistant Photographer',
      checkIn: '08:45 AM',
      checkOut: null,
      workingHours: '8h 15m',
      status: 'present',
      location: 'Queens Branch',
      gpsLocation: '40.7282, -73.7949',
      photo: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=150',
      tasks: ['Portrait Session Setup', 'Equipment Maintenance'],
      overtime: '0h 15m',
      breaks: '0h 45m'
    },
    {
      id: 4,
      staffName: 'Emma Wilson',
      role: 'Event Coordinator',
      checkIn: null,
      checkOut: null,
      workingHours: '0h 00m',
      status: 'absent',
      location: 'Miami Branch',
      gpsLocation: null,
      photo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?w=150',
      tasks: [],
      overtime: '0h 00m',
      breaks: '0h 00m',
      reason: 'Sick Leave'
    },
    {
      id: 5,
      staffName: 'David Kim',
      role: 'Senior Photographer',
      checkIn: '09:30 AM',
      checkOut: null,
      workingHours: '7h 30m',
      status: 'late',
      location: 'Los Angeles Branch',
      gpsLocation: '34.0522, -118.2437',
      photo: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=150',
      tasks: ['Fashion Shoot', 'Client Meeting'],
      overtime: '0h 00m',
      breaks: '0h 30m',
      lateBy: '30 minutes'
    }
  ];

  const weeklyAttendance = [
    {
      staffName: 'Alex Rodriguez',
      daysPresent: 5,
      totalHours: '47h 30m',
      overtime: '7h 30m',
      avgCheckIn: '08:55 AM',
      punctuality: 100,
      performance: 4.8
    },
    {
      staffName: 'Sarah Chen',
      daysPresent: 5,
      totalHours: '43h 45m',
      overtime: '3h 45m',
      avgCheckIn: '09:10 AM',
      punctuality: 80,
      performance: 4.6
    },
    {
      staffName: 'Mike Johnson',
      daysPresent: 4,
      totalHours: '35h 20m',
      overtime: '3h 20m',
      avgCheckIn: '08:50 AM',
      punctuality: 90,
      performance: 4.4
    },
    {
      staffName: 'Emma Wilson',
      daysPresent: 3,
      totalHours: '24h 00m',
      overtime: '0h 00m',
      avgCheckIn: '09:00 AM',
      punctuality: 75,
      performance: 4.2
    },
    {
      staffName: 'David Kim',
      daysPresent: 5,
      totalHours: '41h 15m',
      overtime: '1h 15m',
      avgCheckIn: '09:20 AM',
      punctuality: 60,
      performance: 4.5
    }
  ];

  const attendanceReports = [
    {
      month: 'January 2024',
      totalWorkingDays: 22,
      avgAttendance: 92,
      totalHours: 1760,
      overtimeHours: 156,
      lateArrivals: 8,
      earlyDepartures: 3,
      absentDays: 12
    },
    {
      month: 'December 2023',
      totalWorkingDays: 21,
      avgAttendance: 89,
      totalHours: 1680,
      overtimeHours: 142,
      lateArrivals: 12,
      earlyDepartures: 5,
      absentDays: 15
    },
    {
      month: 'November 2023',
      totalWorkingDays: 22,
      avgAttendance: 94,
      totalHours: 1848,
      overtimeHours: 168,
      lateArrivals: 6,
      earlyDepartures: 2,
      absentDays: 8
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return CheckCircle;
      case 'absent': return XCircle;
      case 'late': return AlertTriangle;
      case 'half-day': return Clock;
      default: return User;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-emerald-50 text-emerald-700';
      case 'absent': return 'bg-red-50 text-red-700';
      case 'late': return 'bg-amber-50 text-amber-700';
      case 'half-day': return 'bg-blue-50 text-blue-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const handleMarkAttendance = () => {
    addNotification({
      type: 'info',
      title: 'Mark Attendance',
      message: 'Attendance marking form opened'
    });
  };

  const handleExportReport = () => {
    addNotification({
      type: 'success',
      title: 'Report Exported',
      message: 'Attendance report has been exported successfully'
    });
  };

  const handleViewDetails = (staffName: string) => {
    addNotification({
      type: 'info',
      title: 'View Details',
      message: `Detailed attendance for ${staffName} opened`
    });
  };

  const filteredAttendance = todayAttendance.filter(record => {
    const matchesSearch = record.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const attendanceStats = {
    totalStaff: todayAttendance.length,
    present: todayAttendance.filter(r => r.status === 'present' || r.status === 'late').length,
    absent: todayAttendance.filter(r => r.status === 'absent').length,
    late: todayAttendance.filter(r => r.status === 'late').length,
    avgWorkingHours: '8h 24m',
    totalOvertime: todayAttendance.reduce((sum, r) => {
      const overtime = parseFloat(r.overtime.replace('h', '').replace('m', '')) || 0;
      return sum + overtime;
    }, 0)
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600 mt-1">Track staff attendance, working hours, and performance</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExportReport}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all duration-200 flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
          <button
            onClick={handleMarkAttendance}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Mark Attendance
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Total Staff</p>
              <p className="text-xl font-bold text-gray-900">{attendanceStats.totalStaff}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-emerald-500 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Present</p>
              <p className="text-xl font-bold text-gray-900">{attendanceStats.present}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-red-500 p-2 rounded-lg">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Absent</p>
              <p className="text-xl font-bold text-gray-900">{attendanceStats.absent}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-amber-500 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Late</p>
              <p className="text-xl font-bold text-gray-900">{attendanceStats.late}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-purple-500 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Avg Hours</p>
              <p className="text-xl font-bold text-gray-900">{attendanceStats.avgWorkingHours}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-indigo-500 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Overtime</p>
              <p className="text-xl font-bold text-gray-900">{attendanceStats.totalOvertime.toFixed(1)}h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'daily', name: 'Daily Attendance', icon: Calendar },
              { id: 'weekly', name: 'Weekly Summary', icon: Target },
              { id: 'reports', name: 'Monthly Reports', icon: Award }
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

        {/* Filters and Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="half-day">Half Day</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'daily' && (
            <div className="space-y-4">
              {filteredAttendance.map((record) => {
                const StatusIcon = getStatusIcon(record.status);
                
                return (
                  <div key={record.id} className="bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <img
                          className="w-12 h-12 rounded-full object-cover mr-4"
                          src={record.photo}
                          alt={record.staffName}
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{record.staffName}</h3>
                          <p className="text-sm text-gray-600">{record.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {record.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Time Details</h4>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Check In:</span>
                            <span className="font-medium text-gray-900">{record.checkIn || 'Not checked in'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Check Out:</span>
                            <span className="font-medium text-gray-900">{record.checkOut || 'Not checked out'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Working Hours:</span>
                            <span className="font-medium text-gray-900">{record.workingHours}</span>
                          </div>
                          {record.overtime !== '0h 00m' && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Overtime:</span>
                              <span className="font-medium text-emerald-600">{record.overtime}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Location</h4>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            {record.location}
                          </div>
                          {record.gpsLocation && (
                            <div className="flex items-center text-gray-600">
                              <Camera className="w-4 h-4 mr-2" />
                              GPS: {record.gpsLocation}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Tasks</h4>
                        <div className="text-sm space-y-1">
                          {record.tasks.length > 0 ? (
                            record.tasks.map((task, index) => (
                              <div key={index} className="text-gray-600">• {task}</div>
                            ))
                          ) : (
                            <div className="text-gray-500">No tasks assigned</div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Additional Info</h4>
                        <div className="text-sm space-y-1">
                          {record.reason && (
                            <div className="text-red-600">Reason: {record.reason}</div>
                          )}
                          {record.lateBy && (
                            <div className="text-amber-600">Late by: {record.lateBy}</div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Breaks:</span>
                            <span className="font-medium text-gray-900">{record.breaks}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
                      <button 
                        onClick={() => handleViewDetails(record.staffName)}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'weekly' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Staff Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Days Present
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Overtime
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Check-in
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Punctuality
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {weeklyAttendance.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{record.staffName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{record.daysPresent}/5</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{record.totalHours}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-emerald-600 font-medium">{record.overtime}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{record.avgCheckIn}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{record.punctuality}%</div>
                            <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  record.punctuality >= 90 ? 'bg-emerald-500' :
                                  record.punctuality >= 70 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${record.punctuality}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Award className="w-4 h-4 text-yellow-400 mr-1" />
                            <span className="text-sm font-medium text-gray-900">{record.performance}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              {attendanceReports.map((report, index) => (
                <div key={index} className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{report.month}</h3>
                    <div className="flex items-center text-emerald-600">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">{report.avgAttendance}% Attendance</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Working Days</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Days:</span>
                          <span className="font-medium text-gray-900">{report.totalWorkingDays}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Avg Attendance:</span>
                          <span className="font-medium text-emerald-600">{report.avgAttendance}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Absent Days:</span>
                          <span className="font-medium text-red-600">{report.absentDays}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Working Hours</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Hours:</span>
                          <span className="font-medium text-gray-900">{report.totalHours}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Overtime:</span>
                          <span className="font-medium text-blue-600">{report.overtimeHours}h</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Punctuality</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Late Arrivals:</span>
                          <span className="font-medium text-amber-600">{report.lateArrivals}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Early Departures:</span>
                          <span className="font-medium text-purple-600">{report.earlyDepartures}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Actions</h4>
                      <div className="space-y-2">
                        <button 
                          onClick={() => handleViewDetails(report.month)}
                          className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                        >
                          View Detailed Report
                        </button>
                        <button 
                          onClick={handleExportReport}
                          className="w-full px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors text-sm"
                        >
                          Export PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;