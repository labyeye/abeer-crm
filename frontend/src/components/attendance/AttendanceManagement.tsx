import { useState, useEffect } from "react";
import { X, Clock, Calendar, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useNotification } from "../../contexts/NotificationContext";
import { useAuth } from "../../contexts/AuthContext";
import { attendanceAPI, staffAPI } from "../../services/api";

interface Staff {
  _id: string;
  name: string;
  employeeId?: string;
  designation?: string;
  branch?: {
    name: string;
  };
  isActive?: boolean;
  performance?: {
    score?: number;
    lateArrivals?: number;
    completedTasks?: number;
  };
  avatarUrl?: string;
}

interface AttendanceRecord {
  _id?: string;
  date: string;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkIn?: {
    time: string;
  };
  checkOut?: {
    time: string;
  };
  workingHours?: string;
}

interface AttendanceDetailsRecord {
  _id?: string;
  date: string;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkIn?: {
    time: string;
  };
  checkOut?: {
    time: string;
  };
  workingHours?: string;
}

const AttendanceManagement = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceModalStaff, setAttendanceModalStaff] = useState<Staff | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [historyStartDate, setHistoryStartDate] = useState<string>('');
  const [historyEndDate, setHistoryEndDate] = useState<string>('');
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [staffSearchTerm, setStaffSearchTerm] = useState("");
  const [attendanceDetailsModalStaff, setAttendanceDetailsModalStaff] = useState<Staff | null>(null);
  const [attendanceDetailsHistory, setAttendanceDetailsHistory] = useState<AttendanceDetailsRecord[]>([]);
  const [attendanceDetailsLoading, setAttendanceDetailsLoading] = useState(false);
  const [myAttendanceHistory, setMyAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [myAttendanceLoading, setMyAttendanceLoading] = useState(false);
  const { addNotification } = useNotification();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'staff') {
      fetchMyAttendance();
    } else {
      fetchStaff();
    }
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await staffAPI.getStaff();
      console.log("Staff API response:", res);
      setStaffList(res.data?.data || res.data || []);
    } catch {
      setStaffList([]);
    }
  };

  const fetchMyAttendance = async () => {
    setMyAttendanceLoading(true);
    try {
      const res = await attendanceAPI.getMyAttendance();
      setMyAttendanceHistory(res.data?.data || res.data || []);
    } catch (error: any) {
      console.error("Failed to fetch my attendance:", error);
      setMyAttendanceHistory([]);
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to load your attendance records",
      });
    } finally {
      setMyAttendanceLoading(false);
    }
  };

  const handleCheckIn = async (staffId: string) => {
    setAttendanceLoading(true);
    try {
      await attendanceAPI.checkIn({ staffId });
      addNotification({
        type: "success",
        title: "Check In",
        message: "Check-in marked successfully.",
      });
      if (user?.role === 'staff') {
        fetchMyAttendance(); 
      }
    } catch (error: unknown) {
      addNotification({
        type: "error",
        title: "Check In",
        message: error instanceof Error ? error.message : "Failed to mark check-in.",
      });
    } finally {
      setAttendanceLoading(false);
      setShowCheckInModal(false);
    }
  };

  const handleCheckOut = async (staffId: string) => {
    setAttendanceLoading(true);
    try {
      await attendanceAPI.checkOut({ staffId });
      addNotification({
        type: "success",
        title: "Check Out",
        message: "Check-out marked successfully.",
      });
      if (user?.role === 'staff') {
        fetchMyAttendance(); 
      }
    } catch (error: unknown) {
      addNotification({
        type: "error",
        title: "Check Out",
        message: error instanceof Error ? error.message : "Failed to mark check-out.",
      });
    } finally {
      setAttendanceLoading(false);
      setShowCheckOutModal(false);
    }
  };

  const filteredStaffList = staffList.filter((staff: Staff) => {
    const term = staffSearchTerm.toLowerCase();
    return (
      staff.name.toLowerCase().includes(term) ||
      staff.employeeId?.toLowerCase().includes(term) ||
      staff.designation?.toLowerCase().includes(term)
    );
  });

  const handleViewAttendanceDetails = async (staff: Staff) => {
    setAttendanceDetailsModalStaff(staff);
    setAttendanceDetailsLoading(true);
    try {
      const params: any = { staff: staff._id };
      if (historyStartDate) params.startDate = historyStartDate;
      if (historyEndDate) params.endDate = historyEndDate;
      const res = await attendanceAPI.getAttendance(params);
      setAttendanceDetailsHistory(res.data || []);
    } catch {
      setAttendanceDetailsHistory([]);
    } finally {
      setAttendanceDetailsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return CheckCircle;
      case 'absent': return XCircle;
      case 'late': return AlertTriangle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-50';
      case 'absent': return 'text-red-600 bg-red-50';
      case 'late': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  
  if (user?.role === 'staff') {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white p-8">
          <h1 className="text-3xl font-bold">My Attendance</h1>
          <p className="text-blue-100 mt-2">Track your daily attendance and working hours</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Present Days</p>
                <p className="text-2xl font-bold text-gray-900">
                  {myAttendanceHistory.filter(a => a.status === 'present').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Late Days</p>
                <p className="text-2xl font-bold text-gray-900">
                  {myAttendanceHistory.filter(a => a.status === 'late').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {myAttendanceHistory.reduce((sum, a) => sum + (parseFloat(a.workingHours || '0')), 0).toFixed(1)}h
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            onClick={() => setShowCheckInModal(true)}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Check In
          </button>
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            onClick={() => setShowCheckOutModal(true)}
          >
            <Clock className="w-5 h-5 mr-2" />
            Check Out
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Attendance History</h2>
          </div>
          <div className="p-6">
            {myAttendanceLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading your attendance...</p>
              </div>
            ) : myAttendanceHistory.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records</h3>
                <p className="text-gray-600">Your attendance records will appear here once you start checking in.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myAttendanceHistory.map((record) => {
                  const StatusIcon = getStatusIcon(record.status);
                  return (
                    <div key={record._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-4 ${getStatusColor(record.status)}`}>
                          <StatusIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {new Date(record.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-sm text-gray-600 capitalize">{record.status.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {record.checkIn?.time ? new Date(record.checkIn.time).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Not checked in'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {record.checkOut?.time ? `Out: ${new Date(record.checkOut.time).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}` : 'Not checked out'}
                        </p>
                        {record.workingHours && (
                          <p className="text-sm font-medium text-blue-600">{record.workingHours}h worked</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {}
        {showCheckInModal && user?.role === 'staff' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Check In</h2>
                <button
                  onClick={() => setShowCheckInModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Check In</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to check in for today? This will mark your attendance as present.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCheckInModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      
                      
                      
                      setShowCheckInModal(false);
                      addNotification({
                        type: "info",
                        title: "Check In",
                        message: "Please contact your manager to set up your staff profile for check-in functionality.",
                      });
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Check In
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {}
        {showCheckOutModal && user?.role === 'staff' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Check Out</h2>
                <button
                  onClick={() => setShowCheckOutModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="text-center">
                <Clock className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Check Out</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to check out for today? This will calculate your working hours.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCheckOutModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowCheckOutModal(false);
                      addNotification({
                        type: "info",
                        title: "Check Out",
                        message: "Please contact your manager to set up your staff profile for check-out functionality.",
                      });
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Check Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Attendance Management
      </h1>
      <div className="flex gap-4 mb-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => setShowCheckInModal(true)}
        >
          Mark Check In
        </button>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={() => setShowCheckOutModal(true)}
        >
          Mark Check Out
        </button>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search staff by name, ID, or designation..."
          value={staffSearchTerm}
          onChange={(e) => setStaffSearchTerm(e.target.value)}
          className="border p-2 rounded w-full"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Staff</th>
              <th className="p-2">Employee ID</th>
              <th className="p-2">Designation</th>
              <th className="p-2">Branch</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaffList.map((staff: Staff) => (
              <tr key={staff._id} className="border-b">
                <td className="p-2 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {staff.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={staff.avatarUrl} alt={staff.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-semibold text-gray-700">{staff.name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{staff.name}</div>
                      {staff.isActive === false ? (
                        <div className="text-xs text-red-600">Inactive</div>
                      ) : (
                        <div className="text-xs text-green-600">Active</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-2 whitespace-nowrap">{staff.employeeId}</td>
                <td className="p-2 whitespace-nowrap">{staff.designation}</td>
                <td className="p-2 whitespace-nowrap">{staff.branch?.name ?? "-"}</td>
                <td className="p-2 whitespace-nowrap flex items-center gap-3">
                  <div className="text-sm text-gray-600">Score: <span className="font-semibold text-gray-900">{staff.performance?.score ?? '-'}</span></div>
                  <button
                    className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                    onClick={() => handleViewAttendanceDetails(staff)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Mark Check In</h2>
              <button
                onClick={() => setShowCheckInModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <table className="min-w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2">Name</th>
                  <th className="p-2">Employee ID</th>
                  <th className="p-2">Designation</th>
                  <th className="p-2">Branch</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff: Staff) => (
                  <tr key={staff._id} className="border-b">
                    <td className="p-2 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {staff.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={staff.avatarUrl} alt={staff.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-semibold text-gray-700">{staff.name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase()}</span>
                          )}
                        </div>
                        <div>{staff.name}</div>
                      </div>
                    </td>
                    <td className="p-2 whitespace-nowrap">{staff.employeeId}</td>
                    <td className="p-2 whitespace-nowrap">{staff.designation}</td>
                    <td className="p-2 whitespace-nowrap">{staff.branch?.name ?? "-"}</td>
                    <td className="p-2 whitespace-nowrap">
                      <button
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
                        onClick={() => handleCheckIn(staff._id)}
                        disabled={attendanceLoading}
                      >
                        Check In
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {}
      {showCheckOutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Mark Check Out
              </h2>
              <button
                onClick={() => setShowCheckOutModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <table className="min-w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2">Name</th>
                  <th className="p-2">Employee ID</th>
                  <th className="p-2">Designation</th>
                  <th className="p-2">Branch</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff: Staff) => (
                  <tr key={staff._id} className="border-b">
                    <td className="p-2 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {staff.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={staff.avatarUrl} alt={staff.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-semibold text-gray-700">{staff.name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase()}</span>
                          )}
                        </div>
                        <div>{staff.name}</div>
                      </div>
                    </td>
                    <td className="p-2 whitespace-nowrap">{staff.employeeId}</td>
                    <td className="p-2 whitespace-nowrap">{staff.designation}</td>
                    <td className="p-2 whitespace-nowrap">{staff.branch?.name ?? "-"}</td>
                    <td className="p-2 whitespace-nowrap">
                      <button
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
                        onClick={() => handleCheckOut(staff._id)}
                        disabled={attendanceLoading}
                      >
                        Check Out
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {attendanceModalStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Attendance History - {attendanceModalStaff.name}
              </h2>
              <button
                onClick={() => {
                  setAttendanceModalStaff(null);
                  setAttendanceHistory([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex gap-2 items-center mb-4">
              <label className="text-sm text-gray-600">From</label>
              <input type="date" className="border p-1 rounded" value={historyStartDate} onChange={(e) => setHistoryStartDate(e.target.value)} />
              <label className="text-sm text-gray-600">To</label>
              <input type="date" className="border p-1 rounded" value={historyEndDate} onChange={(e) => setHistoryEndDate(e.target.value)} />
              <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => handleViewAttendanceDetails(attendanceModalStaff)}>Filter</button>
            </div>
            {attendanceLoading ? (
              <div className="w-8 h-8 animate-spin border-4 border-t-transparent rounded-full border-blue-600 mx-auto"></div>
            ) : attendanceHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                No attendance records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2">Date</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Marked At</th>
                      <th className="p-2">Check In</th>
                      <th className="p-2">Check Out</th>
                      <th className="p-2">Working Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceHistory.map(
                      (att: AttendanceRecord, idx: number) => (
                        <tr key={att._id || idx} className="border-b">
                          <td className="p-2 whitespace-nowrap">
                            {new Date(att.date).toLocaleDateString()}
                          </td>
                          <td className="p-2 font-semibold whitespace-nowrap">
                            {att.status === "present"
                              ? "Present"
                              : att.status === "absent"
                              ? "Absent"
                              : att.status.charAt(0).toUpperCase() +
                                att.status.slice(1)}
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            {att.checkIn?.time
                              ? new Date(att.checkIn.time).toLocaleString()
                              : "-"}
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            {att.checkIn?.time
                              ? new Date(att.checkIn.time).toLocaleTimeString()
                              : "-"}
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            {att.checkOut?.time
                              ? new Date(att.checkOut.time).toLocaleTimeString()
                              : "-"}
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            {att.workingHours ?? "-"}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      {attendanceDetailsModalStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Attendance History - {attendanceDetailsModalStaff.name}
              </h2>
              <button
                onClick={() => {
                  setAttendanceDetailsModalStaff(null);
                  setAttendanceDetailsHistory([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {attendanceDetailsLoading ? (
              <div className="w-8 h-8 animate-spin border-4 border-t-transparent rounded-full border-blue-600 mx-auto"></div>
            ) : attendanceDetailsHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                No attendance records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2">Date</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Check In</th>
                      <th className="p-2">Check Out</th>
                      <th className="p-2">Working Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceDetailsHistory.map(
                      (att: AttendanceDetailsRecord, idx: number) => (
                        <tr key={att._id || idx} className="border-b">
                          <td className="p-2 whitespace-nowrap">
                            {new Date(att.date).toLocaleDateString()}
                          </td>
                          <td className="p-2 font-semibold whitespace-nowrap">
                            {att.status === "present"
                              ? "Present"
                              : att.status === "absent"
                              ? "Absent"
                              : att.status.charAt(0).toUpperCase() +
                                att.status.slice(1)}
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            {att.checkIn?.time
                              ? new Date(att.checkIn.time).toLocaleString()
                              : "-"}
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            {att.checkOut?.time
                              ? new Date(att.checkOut.time).toLocaleTimeString()
                              : "-"}
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            {att.workingHours ?? "-"}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;
