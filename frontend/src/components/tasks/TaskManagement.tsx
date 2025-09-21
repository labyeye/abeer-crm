import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Play, 
  Plus,
  Search
} from 'lucide-react';
import { taskAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import NeomorphicCard from '../ui/NeomorphicCard';
import NeomorphicButton from '../ui/NeomorphicButton';
import NeomorphicModal from '../ui/NeomorphicModal';
import LoadingSpinner from '../ui/LoadingSpinner';

interface Task {
  _id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  scheduledDate: string;
  scheduledTime: { start: string; end: string };
  location: { address: string; city: string };
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
  progress: number;
  estimatedDuration: number;
}

const TaskManagement = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
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
    title: '',
    description: '',
    type: 'manual',
    priority: 'medium',
    scheduledDate: '',
    scheduledTime: { start: '', end: '' },
    location: { address: '', city: '' },
    estimatedDuration: 60
  });

  useEffect(() => {
    fetchTasks();
    fetchTaskStats();
  }, []);

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
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.booking?.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.booking?.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }
    if (filters.type) {
      filtered = filtered.filter(task => task.type === filters.type);
    }
    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }
    if (filters.date) {
      const filterDate = new Date(filters.date).toDateString();
      filtered = filtered.filter(task => 
        new Date(task.scheduledDate).toDateString() === filterDate
      );
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
      if (!newTask.title || !newTask.scheduledDate) {
        addNotification({
          type: 'error',
          title: 'Validation Error',
          message: 'Please fill in required fields (Title and Date)'
        });
        return;
      }

      await taskAPI.createTask(newTask);
      await fetchTasks();
      setShowCreateModal(false);
      setNewTask({
        title: '',
        description: '',
        type: 'manual',
        priority: 'medium',
        scheduledDate: '',
        scheduledTime: { start: '', end: '' },
        location: { address: '', city: '' },
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'equipment_prep': return '🔧';
      case 'travel': return '🚗';
      case 'main_function': return '📸';
      case 'data_backup': return '💾';
      default: return '📋';
    }
  };

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
            className="bg-blue-500 text-white hover:bg-blue-600"
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="equipment_prep">Equipment Prep</option>
              <option value="travel">Travel</option>
              <option value="main_function">Main Function</option>
              <option value="data_backup">Data Backup</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          
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
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <NeomorphicCard key={task._id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              {}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getTypeIcon(task.type)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{task.title}</h3>
                    <p className="text-sm text-gray-600">{task.booking?.bookingNumber}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority.toUpperCase()}
                  </span>
                </div>
              </div>

              {}
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(task.scheduledDate).toLocaleDateString()}
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  {task.scheduledTime?.start} - {task.scheduledTime?.end}
                </div>
                
                {task.location?.address && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {task.location.address}
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-600">
                  <User className="w-4 h-4 mr-2" />
                  {task.booking?.client?.name}
                </div>
              </div>

              {}
              {task.assignedTo && task.assignedTo.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Assigned Staff:</p>
                  <div className="space-y-1">
                    {task.assignedTo.map((assignment, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{assignment.staff?.user?.name}</span>
                        <span className="text-gray-500">{assignment.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {}
              {task.progress > 0 && (
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="text-gray-900 font-medium">{task.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {}
              <div className="flex items-center space-x-2 pt-2">
                {task.status === 'assigned' && (
                  <NeomorphicButton
                    onClick={() => handleUpdateTaskStatus(task._id, 'in_progress')}
                    className="flex-1 bg-blue-500 text-white text-sm"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Start
                  </NeomorphicButton>
                )}
                
                {task.status === 'in_progress' && (
                  <NeomorphicButton
                    onClick={() => handleCompleteTask(task._id, '')}
                    className="flex-1 bg-green-500 text-white text-sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Complete
                  </NeomorphicButton>
                )}
                
                {(task.status === 'assigned' || task.status === 'in_progress') && (
                  <NeomorphicButton
                    onClick={() => {
                      const reason = prompt('Please enter reason for skipping:');
                      if (reason) handleSkipTask(task._id, reason);
                    }}
                    className="flex-1 bg-red-500 text-white text-sm"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Skip
                  </NeomorphicButton>
                )}
              </div>
            </div>
          </NeomorphicCard>
        ))}
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter task title..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter task description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Type
              </label>
              <select
                value={newTask.type}
                onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="manual">Manual Task</option>
                <option value="equipment_prep">Equipment Preparation</option>
                <option value="travel">Travel</option>
                <option value="main_function">Main Function</option>
                <option value="data_backup">Data Backup</option>
              </select>
            </div>

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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Date *
              </label>
              <input
                type="date"
                value={newTask.scheduledDate}
                onChange={(e) => setNewTask({ ...newTask, scheduledDate: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={newTask.scheduledTime.start}
                onChange={(e) => setNewTask({ 
                  ...newTask, 
                  scheduledTime: { ...newTask.scheduledTime, start: e.target.value }
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={newTask.scheduledTime.end}
                onChange={(e) => setNewTask({ 
                  ...newTask, 
                  scheduledTime: { ...newTask.scheduledTime, end: e.target.value }
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Address
              </label>
              <input
                type="text"
                value={newTask.location.address}
                onChange={(e) => setNewTask({ 
                  ...newTask, 
                  location: { ...newTask.location, address: e.target.value }
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter address..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={newTask.location.city}
                onChange={(e) => setNewTask({ 
                  ...newTask, 
                  location: { ...newTask.location, city: e.target.value }
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter city..."
              />
            </div>
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
              className="px-6 py-2 bg-blue-500 text-white hover:bg-blue-600"
            >
              Create Task
            </NeomorphicButton>
          </div>
        </div>
      </NeomorphicModal>
    </div>
  );
};

export default TaskManagement;
