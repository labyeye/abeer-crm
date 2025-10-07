import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  
  CheckCircle, 
  XCircle, 
  Play, 
  Plus,
  Search
} from 'lucide-react';
import { taskAPI, bookingAPI, staffAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import NeomorphicCard from '../ui/NeomorphicCard';
import NeomorphicButton from '../ui/NeomorphicButton';
import NeomorphicModal from '../ui/NeomorphicModal';
import LoadingSpinner from '../ui/LoadingSpinner';

interface Task {
  _id: string;
  status: string;
  priority: string;
  workStartDate?: string;
  workEndDate?: string;
  assignedTo: Array<{
    staff: {
      _id: string;
      employeeId: string;
      designation: string;
      user: { name: string };
    };
    role: string;
  }>;
  booking: {
    bookingNumber: string;
    client: { name: string; phone: string };
    functionDetails: { type: string };
  };
  bookingService?: string;
  progress: number;
  estimatedDuration: number;
}

const TaskManagement = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editPriority, setEditPriority] = useState<string>('medium');
  const [editWorkStartDate, setEditWorkStartDate] = useState<string>('');
  const [editWorkEndDate, setEditWorkEndDate] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    priority: '',
    assignedStaff: '',
    date: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [taskStats, setTaskStats] = useState<any>(null);
  const [newTask, setNewTask] = useState({
    priority: 'medium',
    scheduledTime: { start: '', end: '' },
    estimatedDuration: 60
  });
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [bookingServices, setBookingServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [assignedStaffSelection, setAssignedStaffSelection] = useState<Array<{ staffId: string; source: 'branch' | 'vendor' }>>([]);
  const [workStartDate, setWorkStartDate] = useState<string>('');
  const [workEndDate, setWorkEndDate] = useState<string>('');

  useEffect(() => {
    fetchTasks();
    fetchTaskStats();
    fetchBookingsAndStaff();
  }, []);

  const fetchBookingsAndStaff = async () => {
    try {
      const bookingRes = await bookingAPI.getBookings();
      const staffRes = await staffAPI.getStaff();
      setBookings(bookingRes.data || bookingRes || []);
      setStaffList(staffRes.data || staffRes || []);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    applyFilters();
  }, [tasks, filters, searchTerm]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getTasks();
      setTasks(response.data || []);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to fetch tasks'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskStats = async () => {
    try {
      const response = await taskAPI.getTaskStats();
      setTaskStats(response.data);
    } catch (error) {
      console.error('Failed to fetch task stats:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];
    if (searchTerm) {
      filtered = filtered.filter(task =>
        (task.booking?.bookingNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.booking?.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.bookingService || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }
    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }
    if (filters.date) {
      const filterDate = new Date(filters.date).toDateString();
      filtered = filtered.filter(task => {
        const d = task.workStartDate || task.workEndDate || '';
        return d && new Date(d).toDateString() === filterDate;
      });
    }

    setFilteredTasks(filtered);
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
      await taskAPI.updateTask(taskId, { status });
      await fetchTasks();
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Task status updated successfully'
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update task status'
      });
    }
  };

  const handleSkipTask = async (taskId: string, reason: string) => {
    try {
      await taskAPI.skipTask(taskId, reason);
      await fetchTasks();
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Task skipped and client notified'
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to skip task'
      });
    }
  };

  const handleCompleteTask = async (taskId: string, notes: string) => {
    try {
      await taskAPI.completeTask(taskId, { notes });
      await fetchTasks();
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Task completed successfully'
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to complete task'
      });
    }
  };

  const handleCreateTask = async () => {
    try {
      // minimal validation: booking must be selected or assigned staff must exist
      if (!selectedBookingId && assignedStaffSelection.length === 0) {
        addNotification({
          type: 'error',
          title: 'Validation Error',
          message: 'Please select a booking or assign staff before creating a task.'
        });
        return;
      }
      const payload: any = {
        priority: newTask.priority,
        scheduledTime: newTask.scheduledTime,
        estimatedDuration: newTask.estimatedDuration,
        bookingId: selectedBookingId || undefined,
        bookingService: selectedService || undefined,
        workStartDate: workStartDate || undefined,
        workEndDate: workEndDate || undefined,
        assignedStaff: assignedStaffSelection.map(a => ({ staffId: a.staffId, source: a.source }))
      };

      await taskAPI.createTask(payload);
      await fetchTasks();
      setShowCreateModal(false);
      setNewTask({
        priority: 'medium',
        scheduledTime: { start: '', end: '' },
        estimatedDuration: 60
      });
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Task created successfully'
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create task'
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await taskAPI.updateTask(taskId, { isDeleted: true });
      await fetchTasks();
      addNotification({ type: 'success', title: 'Deleted', message: 'Task deleted' });
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Error', message: err?.response?.data?.message || 'Failed to delete task' });
    }
  };

  const openEditModal = (task: Task) => {
    setEditTask(task);
    setEditPriority(task.priority || 'medium');
    setEditWorkStartDate(task.workStartDate ? task.workStartDate.split('T')[0] : '');
    setEditWorkEndDate(task.workEndDate ? task.workEndDate.split('T')[0] : '');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editTask) return;
    try {
      await taskAPI.updateTask(editTask._id, {
        priority: editPriority,
        workStartDate: editWorkStartDate || undefined,
        workEndDate: editWorkEndDate || undefined
      });
      setShowEditModal(false);
      setEditTask(null);
      await fetchTasks();
      addNotification({ type: 'success', title: 'Saved', message: 'Task updated' });
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Error', message: err?.response?.data?.message || 'Failed to update task' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'assigned': return 'text-yellow-600 bg-yellow-100';
      case 'pending': return 'text-gray-600 bg-gray-100';
      case 'skipped': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // task type was removed; no type icon helper needed

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600 mt-1">Manage and track task assignments</p>
        </div>
        
  {(user?.role === 'chairman' || user?.role === 'admin') && (
          <NeomorphicButton
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-black hover:bg-blue-600 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </NeomorphicButton>
        )}
      </div>

      {}
      {taskStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <NeomorphicCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{taskStats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </NeomorphicCard>
          
          <NeomorphicCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{taskStats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </NeomorphicCard>
          
          <NeomorphicCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</p>
              </div>
              <Play className="w-8 h-8 text-blue-500" />
            </div>
          </NeomorphicCard>
          
          <NeomorphicCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{taskStats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </NeomorphicCard>
          
          <NeomorphicCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Skipped</p>
                <p className="text-2xl font-bold text-red-600">{taskStats.skipped}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </NeomorphicCard>
        </div>
      )}

      {}
      <NeomorphicCard className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search tasks..."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>
          
          {/* Type filter removed per request */}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <NeomorphicButton
              onClick={() => {
                setFilters({
                  status: '',
                  type: '',
                  priority: '',
                  assignedStaff: '',
                  date: ''
                });
                setSearchTerm('');
              }}
              className="w-full"
            >
              Clear Filters
            </NeomorphicButton>
          </div>
        </div>
      </NeomorphicCard>

      {}
      <div className="bg-white rounded shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTasks.map(task => (
              <tr key={task._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.booking?.bookingNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{task.bookingService || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{(task.workStartDate || task.workEndDate) ? `${task.workStartDate ? new Date(task.workStartDate).toLocaleDateString() : ''}${task.workEndDate ? ' - ' + new Date(task.workEndDate).toLocaleDateString() : ''}` : 'No dates'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{task.booking?.client?.name || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{task.assignedTo?.map(a => ((a.staff as any)?.name || (a.staff as any)?.user?.name)).filter(Boolean).join(', ') || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>{task.status.replace('_',' ').toUpperCase()}</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>{task.priority.toUpperCase()}</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button onClick={() => openEditModal(task)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                  <button onClick={() => handleDeleteTask(task._id)} className="text-red-600 hover:text-red-900">Delete</button>
                  {task.status === 'assigned' && <button onClick={() => handleUpdateTaskStatus(task._id, 'in_progress')} className="text-blue-600 hover:text-blue-900">Start</button>}
                  {task.status === 'in_progress' && <button onClick={() => handleCompleteTask(task._id, '')} className="text-green-600 hover:text-green-900">Complete</button>}
                  {(task.status === 'assigned' || task.status === 'in_progress') && <button onClick={() => { const reason = prompt('Please enter reason for skipping:'); if (reason) handleSkipTask(task._id, reason); }} className="text-red-500 hover:text-red-800">Skip</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredTasks.length === 0 && (
        <NeomorphicCard className="p-8 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Found</h3>
          <p className="text-gray-600">
            {tasks.length === 0 
              ? "No tasks have been created yet." 
              : "No tasks match your current filters."
            }
          </p>
        </NeomorphicCard>
      )}

      {}
      <NeomorphicModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Task"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title and Description removed — tasks derive context from booking/service */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Booking</label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2" value={selectedBookingId} onChange={async (e) => {
                const id = e.target.value;
                setSelectedBookingId(id);
                if (!id) { setBookingServices([]); setSelectedService(''); return; }
                try {
                  const api = await import('../../services/api');
                  const res = await api.bookingAPI.getBooking(id);
                  const booking = res.data || res || {};
                  // collect services and functionDetailsList services
                  const services: any[] = [];
                  if (booking.services && booking.services.length) {
                    booking.services.forEach((s: any, idx: number) => {
                      const typeLabel = Array.isArray(s.serviceType) && s.serviceType.length ? ` - ${s.serviceType.join(', ')}` : '';
                      const label = `${s.service}${typeLabel}`;
                      services.push({ id: `svc_${idx}`, name: label, value: label });
                    });
                  }
                  if (booking.functionDetailsList && booking.functionDetailsList.length) {
                    booking.functionDetailsList.forEach((f: any, idx: number) => {
                      if (f.service) {
                        const typeLabel = Array.isArray(f.serviceType) && f.serviceType.length ? ` - ${f.serviceType.join(', ')}` : '';
                        const label = `${f.service}${typeLabel}`;
                        services.push({ id: `fd_svc_${idx}`, name: label, value: label });
                      } else {
                        const label = f.event || `Function ${idx+1}`;
                        services.push({ id: `fd_${idx}`, name: label, value: label });
                      }
                    });
                  }
                  setBookingServices(services);
                  // auto-populate assigned staff from booking
                  const assignedIds: any[] = [];
                  if (booking.functionDetailsList && booking.functionDetailsList.length) {
                    booking.functionDetailsList.forEach((fd: any) => {
                      if (fd.assignedStaff && fd.assignedStaff.length) assignedIds.push(...fd.assignedStaff);
                    });
                  }
                  if (assignedIds.length === 0 && booking.staffAssignment && booking.staffAssignment.length) {
                    assignedIds.push(...booking.staffAssignment.map((s: any) => s.staff));
                  }
                  setAssignedStaffSelection(assignedIds.map((sid: any) => ({ staffId: sid, source: 'branch' })));
                } catch (err) {
                  setBookingServices([]);
                }
              }}>
                <option value="">Select booking</option>
                {bookings.map(b => <option key={b._id} value={b._id}>{b.bookingNumber || (b.client && b.client.name) || b._id}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service (from booking)</label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2" value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
                <option value="">Select service</option>
                {bookingServices.map(s => <option key={s.id} value={s.value || s.name}>{s.name}</option>)}
              </select>
              <div className="space-y-2">
                {assignedStaffSelection.map((a, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select className="flex-1 rounded-lg border border-gray-300 px-3 py-2" value={a.staffId} onChange={(e) => {
                      const arr = [...assignedStaffSelection]; arr[idx].staffId = e.target.value; setAssignedStaffSelection(arr);
                    }}>
                      <option value="">Select staff</option>
                      {staffList.map(s => <option key={s._id} value={s._id}>{s.name} {s.employeeId ? `(${s.employeeId})` : ''}</option>)}
                    </select>
                    <div className="flex items-center gap-2">
                      <label className="text-sm">Branch</label>
                      <input type="radio" name={`source_${idx}`} checked={a.source === 'branch'} onChange={() => { const arr = [...assignedStaffSelection]; arr[idx].source = 'branch'; setAssignedStaffSelection(arr); }} />
                      <label className="text-sm">Vendor</label>
                      <input type="radio" name={`source_${idx}`} checked={a.source === 'vendor'} onChange={() => { const arr = [...assignedStaffSelection]; arr[idx].source = 'vendor'; setAssignedStaffSelection(arr); }} />
                      <button className="px-2 py-1 bg-red-500 text-black rounded" onClick={() => { setAssignedStaffSelection(assignedStaffSelection.filter((_, i) => i !== idx)); }}>Remove</button>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  <button className="px-3 py-2 bg-blue-500 text-black rounded" onClick={() => setAssignedStaffSelection([...assignedStaffSelection, { staffId: '', source: 'branch' }])}>Add staff</button>
                </div>
              </div>
            </div>
            {/* Task type removed */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Work Start Date</label>
              <input type="date" value={workStartDate} onChange={(e) => setWorkStartDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Work End Date</label>
              <input type="date" value={workEndDate} onChange={(e) => setWorkEndDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Duration (minutes)
              </label>
              <input
                type="number"
                value={newTask.estimatedDuration}
                onChange={(e) => setNewTask({ ...newTask, estimatedDuration: parseInt(e.target.value) || 60 })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="15"
                step="15"
              />
            </div>

            {/* Location and scheduled time removed; use booking/service and workStartDate/workEndDate */}
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <NeomorphicButton
              onClick={() => setShowCreateModal(false)}
              className="px-6 py-2"
            >
              Cancel
            </NeomorphicButton>
            <NeomorphicButton
              onClick={handleCreateTask}
              className="px-6 py-2 bg-blue-500 text-black hover:bg-blue-600"
            >
              Create Task
            </NeomorphicButton>
          </div>
        </div>
      </NeomorphicModal>

      {/* Edit Task Modal */}
      <NeomorphicModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Task"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Work Start Date</label>
              <input type="date" value={editWorkStartDate} onChange={(e) => setEditWorkStartDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Work End Date</label>
              <input type="date" value={editWorkEndDate} onChange={(e) => setEditWorkEndDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <NeomorphicButton onClick={() => setShowEditModal(false)} className="px-4 py-2">Cancel</NeomorphicButton>
            <NeomorphicButton onClick={handleSaveEdit} className="px-4 py-2 bg-blue-500 text-white">Save</NeomorphicButton>
          </div>
        </div>
      </NeomorphicModal>
    </div>
  );
};

export default TaskManagement;
