import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter,
  MapPin,
  Clock,
  User,
  Camera,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { bookingAPI, clientAPI, staffAPI, inventoryAPI } from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import NeomorphicModal from '../ui/NeomorphicModal';
import NeomorphicButton from '../ui/NeomorphicButton';
import NeomorphicCard from '../ui/NeomorphicCard';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Booking {
  _id: string;
  bookingNumber: string;
  client: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  functionDetails: {
    type: string;
    date: string;
    time: {
      start: string;
      end: string;
    };
    venue: {
      name: string;
      address: string;
    };
  };
  services: string[];
  pricing: {
    totalAmount: number;
    advanceAmount: number;
    remainingAmount: number;
  };
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  assignedStaff: string[];
  assignedEquipment: string[];
  notes: string;
  branch: {
    _id: string;
    name: string;
  };
  createdBy: {
    _id: string;
    name: string;
  };
}

const BookingManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [formData, setFormData] = useState({
    client: '',
    functionDetails: {
      type: '',
      date: '',
      time: {
        start: '',
        end: ''
      },
      venue: {
        name: '',
        address: ''
      }
    },
    services: [] as string[],
    pricing: {
      totalAmount: 0,
      advanceAmount: 0,
      remainingAmount: 0
    },
    assignedStaff: [] as string[],
    assignedEquipment: [] as string[],
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  
  const { addNotification } = useNotification();
  const { user } = useAuth();

  useEffect(() => {
    fetchBookings();
    fetchClients();
    fetchStaff();
    fetchInventory();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getBookings();
      setBookings(response.data);
    } catch (error) {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to fetch bookings' });
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await clientAPI.getClients();
      setClients(response.data);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await staffAPI.getStaff();
      setStaff(response.data);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await inventoryAPI.getInventory();
      setInventory(response.data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
  };

  const handleAddBooking = () => {
    setFormData({
      client: '',
      functionDetails: {
        type: '',
        date: '',
        time: { start: '', end: '' },
        venue: { name: '', address: '' }
      },
      services: [],
      pricing: { totalAmount: 0, advanceAmount: 0, remainingAmount: 0 },
      assignedStaff: [],
      assignedEquipment: [],
      notes: ''
    });
    setShowAddModal(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setFormData({
      client: booking.client._id,
      functionDetails: {
        type: booking.functionDetails.type,
        date: booking.functionDetails.date.split('T')[0],
        time: booking.functionDetails.time,
        venue: booking.functionDetails.venue
      },
      services: booking.services,
      pricing: booking.pricing,
      assignedStaff: booking.assignedStaff,
      assignedEquipment: booking.assignedEquipment,
      notes: booking.notes || ''
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (showEditModal && selectedBooking) {
        await bookingAPI.updateBooking(selectedBooking._id, formData);
        addNotification({ type: 'success', title: 'Success', message: 'Booking updated successfully' });
        setShowEditModal(false);
      } else {
        await bookingAPI.createBooking(formData);
        addNotification({ type: 'success', title: 'Success', message: 'Booking created successfully' });
        setShowAddModal(false);
      }
      fetchBookings();
    } catch (error: any) {
      addNotification({ 
        type: 'error', 
        title: 'Error', 
        message: error.response?.data?.message || 'Failed to save booking' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await bookingAPI.deleteBooking(bookingId);
        addNotification({ type: 'success', title: 'Success', message: 'Booking deleted successfully' });
        fetchBookings();
      } catch (error: any) {
        addNotification({ 
          type: 'error', 
          title: 'Error', 
          message: error.response?.data?.message || 'Failed to delete booking' 
        });
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return CheckCircle;
      case 'pending': return Clock;
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      case 'in_progress': return AlertTriangle;
      default: return AlertTriangle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-50 text-blue-700';
      case 'pending': return 'bg-amber-50 text-amber-700';
      case 'completed': return 'bg-emerald-50 text-emerald-700';
      case 'cancelled': return 'bg-red-50 text-red-700';
      case 'in_progress': return 'bg-purple-50 text-purple-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.functionDetails.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.functionDetails.venue.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || booking.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Calculate stats for chart
  const statusStats = [
    { name: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, color: '#3B82F6' },
    { name: 'Pending', value: bookings.filter(b => b.status === 'pending').length, color: '#F59E0B' },
    { name: 'In Progress', value: bookings.filter(b => b.status === 'in_progress').length, color: '#8B5CF6' },
    { name: 'Completed', value: bookings.filter(b => b.status === 'completed').length, color: '#10B981' },
    { name: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, color: '#EF4444' }
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-600 mt-1">Manage all photography bookings and appointments</p>
        </div>
        <NeomorphicButton onClick={handleAddBooking} className="flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          New Booking
        </NeomorphicButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <NeomorphicCard>
          <div className="flex items-center">
            <div className="bg-blue-500 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
            </div>
          </div>
        </NeomorphicCard>
        
        <NeomorphicCard>
          <div className="flex items-center">
            <div className="bg-emerald-500 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">{bookings.filter(b => b.status === 'confirmed').length}</p>
            </div>
          </div>
        </NeomorphicCard>

        <NeomorphicCard>
          <div className="flex items-center">
            <div className="bg-purple-500 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{bookings.filter(b => b.status === 'in_progress').length}</p>
            </div>
          </div>
        </NeomorphicCard>

        <NeomorphicCard>
          <div className="flex items-center">
            <div className="bg-amber-500 p-3 rounded-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {bookings.filter(b => {
                  const bookingDate = new Date(b.functionDetails.date);
                  const now = new Date();
                  return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </NeomorphicCard>
      </div>

      {/* Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NeomorphicCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </NeomorphicCard>

        <NeomorphicCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h3>
          <div className="space-y-3">
            {bookings.slice(0, 5).map((booking) => (
              <div key={booking._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{booking.client.name}</p>
                  <p className="text-sm text-gray-600">{booking.functionDetails.type}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(booking.status)}`}>
                  {booking.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </NeomorphicCard>
      </div>

      {/* Filters and Search */}
      <NeomorphicCard>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings by client, event type, or venue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </NeomorphicCard>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <NeomorphicCard>
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No bookings found</p>
            </div>
          </NeomorphicCard>
        ) : (
          filteredBookings.map((booking) => {
            const StatusIcon = getStatusIcon(booking.status);
            
            return (
              <NeomorphicCard key={booking._id} className="hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-3 rounded-lg mr-4">
                      <Camera className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{booking.client.name}</h3>
                      <p className="text-sm text-gray-600">{booking.functionDetails.type} • {booking.bookingNumber}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {booking.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Event Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(booking.functionDetails.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {booking.functionDetails.time.start} - {booking.functionDetails.time.end}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {booking.functionDetails.venue.name}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Client Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        {booking.client.name}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {booking.client.email}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {booking.client.phone}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Financial Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-medium text-gray-900">₹{booking.pricing.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Advance:</span>
                        <span className="font-medium text-gray-900">₹{booking.pricing.advanceAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Remaining:</span>
                        <span className="font-medium text-gray-900">₹{booking.pricing.remainingAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {booking.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">{booking.notes}</p>
                  </div>
                )}

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEditBooking(booking)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteBooking(booking._id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="text-sm text-gray-500">
                    Created by {booking.createdBy.name}
                  </div>
                </div>
              </NeomorphicCard>
            );
          })
        )}
      </div>

      {/* Add/Edit Booking Modal */}
      <NeomorphicModal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
        }}
        title={showEditModal ? 'Edit Booking' : 'Add New Booking'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client
              </label>
              <select
                value={formData.client}
                onChange={(e) => setFormData({...formData, client: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Client</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type
              </label>
              <input
                type="text"
                value={formData.functionDetails.type}
                onChange={(e) => setFormData({
                  ...formData,
                  functionDetails: { ...formData.functionDetails, type: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.functionDetails.date}
                onChange={(e) => setFormData({
                  ...formData,
                  functionDetails: { ...formData.functionDetails, date: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={formData.functionDetails.time.start}
                onChange={(e) => setFormData({
                  ...formData,
                  functionDetails: { 
                    ...formData.functionDetails, 
                    time: { ...formData.functionDetails.time, start: e.target.value }
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={formData.functionDetails.time.end}
                onChange={(e) => setFormData({
                  ...formData,
                  functionDetails: { 
                    ...formData.functionDetails, 
                    time: { ...formData.functionDetails.time, end: e.target.value }
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue Name
              </label>
              <input
                type="text"
                value={formData.functionDetails.venue.name}
                onChange={(e) => setFormData({
                  ...formData,
                  functionDetails: { 
                    ...formData.functionDetails, 
                    venue: { ...formData.functionDetails.venue, name: e.target.value }
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Amount (₹)
              </label>
              <input
                type="number"
                value={formData.pricing.totalAmount}
                onChange={(e) => setFormData({
                  ...formData,
                  pricing: { 
                    ...formData.pricing, 
                    totalAmount: Number(e.target.value),
                    remainingAmount: Number(e.target.value) - formData.pricing.advanceAmount
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Advance Amount (₹)
              </label>
              <input
                type="number"
                value={formData.pricing.advanceAmount}
                onChange={(e) => setFormData({
                  ...formData,
                  pricing: { 
                    ...formData.pricing, 
                    advanceAmount: Number(e.target.value),
                    remainingAmount: formData.pricing.totalAmount - Number(e.target.value)
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Venue Address
            </label>
            <textarea
              value={formData.functionDetails.venue.address}
              onChange={(e) => setFormData({
                ...formData,
                functionDetails: { 
                  ...formData.functionDetails, 
                  venue: { ...formData.functionDetails.venue, address: e.target.value }
                }
              })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                showEditModal ? 'Update Booking' : 'Create Booking'
              )}
            </button>
          </div>
        </form>
      </NeomorphicModal>
    </div>
  );
};

export default BookingManagement;