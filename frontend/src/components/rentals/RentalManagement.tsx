import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  ArrowRight,
  ArrowLeft,
  Calendar,
  User,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Phone,
  MoreVertical,
  Building,
  Camera,
  Truck,
  Plus,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { rentalAPI, inventoryAPI } from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import NeomorphicModal from '../ui/NeomorphicModal';

interface Rental {
  _id: string;
  rentalNumber: string;
  rentalType: 'outgoing' | 'incoming';
  equipment: {
    _id: string;
    name: string;
    type: string;
  };
  equipmentName: string;
  equipmentType: string;
  startDate: string;
  endDate: string;
  actualReturnDate?: string;
  dailyRate: number;
  totalAmount: number;
  securityDeposit: number;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  renter?: {
    name: string;
    email: string;
    phone: string;
    company: string;
    address: string;
  };
  vendor?: {
    name: string;
    email: string;
    phone: string;
    company: string;
    address: string;
  };
  projectName?: string;
  clientName?: string;
  status: 'pending' | 'confirmed' | 'active' | 'returned' | 'overdue' | 'cancelled';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  returnCondition?: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
  branch: {
    _id: string;
    name: string;
    code: string;
  };
  createdBy: {
    _id: string;
    name: string;
  };
}

const RentalManagement = () => {
  const [activeTab, setActiveTab] = useState('outgoing');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [formData, setFormData] = useState({
    rentalType: 'outgoing',
    equipment: '',
    equipmentName: '',
    equipmentType: '',
    startDate: '',
    endDate: '',
    dailyRate: 0,
    securityDeposit: 0,
    renter: {
      name: '',
      email: '',
      phone: '',
      company: '',
      address: ''
    },
    vendor: {
      name: '',
      email: '',
      phone: '',
      company: '',
      address: ''
    },
    projectName: '',
    clientName: '',
    condition: 'excellent',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  
  const { addNotification } = useNotification();
  const { user } = useAuth();

  useEffect(() => {
    fetchRentals();
    fetchInventory();
  }, []);

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const response = await rentalAPI.getRentals();
      setRentals(response.data);
    } catch (error) {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to fetch rentals' });
    } finally {
      setLoading(false);
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

  const handleAddRental = (type: string) => {
    setFormData({
      ...formData,
      rentalType: type === 'Incoming' ? 'incoming' : 'outgoing',
      equipment: '',
      equipmentName: '',
      equipmentType: '',
      startDate: '',
      endDate: '',
      dailyRate: 0,
      securityDeposit: 0,
      renter: { name: '', email: '', phone: '', company: '', address: '' },
      vendor: { name: '', email: '', phone: '', company: '', address: '' },
      projectName: '',
      clientName: '',
      condition: 'excellent',
      notes: ''
    });
    setShowAddModal(true);
  };

  const handleEditRental = (rental: Rental) => {
    setSelectedRental(rental);
    setFormData({
      rentalType: rental.rentalType,
      equipment: rental.equipment._id,
      equipmentName: rental.equipmentName,
      equipmentType: rental.equipmentType,
      startDate: rental.startDate.split('T')[0],
      endDate: rental.endDate.split('T')[0],
      dailyRate: rental.dailyRate,
      securityDeposit: rental.securityDeposit,
      renter: rental.renter || { name: '', email: '', phone: '', company: '', address: '' },
      vendor: rental.vendor || { name: '', email: '', phone: '', company: '', address: '' },
      projectName: rental.projectName || '',
      clientName: rental.clientName || '',
      condition: rental.condition,
      notes: rental.notes || ''
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (showEditModal && selectedRental) {
        await rentalAPI.updateRental(selectedRental._id, formData);
        addNotification({ type: 'success', title: 'Success', message: 'Rental updated successfully' });
        setShowEditModal(false);
      } else {
        await rentalAPI.createRental(formData);
        addNotification({ type: 'success', title: 'Success', message: 'Rental created successfully' });
        setShowAddModal(false);
      }
      fetchRentals();
      setFormData({
        rentalType: 'outgoing',
        equipment: '',
        equipmentName: '',
        equipmentType: '',
        startDate: '',
        endDate: '',
        dailyRate: 0,
        securityDeposit: 0,
        renter: { name: '', email: '', phone: '', company: '', address: '' },
        vendor: { name: '', email: '', phone: '', company: '', address: '' },
        projectName: '',
        clientName: '',
        condition: 'excellent',
        notes: ''
      });
    } catch (error: any) {
      addNotification({ 
        type: 'error', 
        title: 'Error', 
        message: error.response?.data?.message || 'Failed to save rental' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRental = async (rentalId: string) => {
    if (window.confirm('Are you sure you want to delete this rental?')) {
      try {
        await rentalAPI.deleteRental(rentalId);
        addNotification({ type: 'success', title: 'Success', message: 'Rental deleted successfully' });
        fetchRentals();
      } catch (error: any) {
        addNotification({ 
          type: 'error', 
          title: 'Error', 
          message: error.response?.data?.message || 'Failed to delete rental' 
        });
      }
    }
  };

  const handleEquipmentChange = (equipmentId: string) => {
    const selectedEquipment = inventory.find(item => item._id === equipmentId);
    if (selectedEquipment) {
      setFormData({
        ...formData,
        equipment: equipmentId,
        equipmentName: selectedEquipment.name,
        equipmentType: selectedEquipment.type
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'confirmed': return Calendar;
      case 'returned': return CheckCircle;
      case 'overdue': return AlertTriangle;
      case 'cancelled': return XCircle;
      case 'pending': return Clock;
      default: return Package;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-50 text-blue-700';
      case 'confirmed': return 'bg-emerald-50 text-emerald-700';
      case 'returned': return 'bg-gray-50 text-gray-700';
      case 'overdue': return 'bg-red-50 text-red-700';
      case 'cancelled': return 'bg-red-50 text-red-700';
      case 'pending': return 'bg-amber-50 text-amber-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-50 text-emerald-700';
      case 'partial': return 'bg-amber-50 text-amber-700';
      case 'pending': return 'bg-red-50 text-red-700';
      case 'overdue': return 'bg-red-50 text-red-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const filteredRentals = rentals.filter(rental => {
    const matchesSearch = rental.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (rental.renter?.name || rental.vendor?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || rental.status === filterStatus;
    const matchesTab = activeTab === 'outgoing' ? rental.rentalType === 'outgoing' : 
                      activeTab === 'incoming' ? rental.rentalType === 'incoming' : true;
    return matchesSearch && matchesFilter && matchesTab;
  });

  // Calculate stats
  const outgoingStats = {
    total: rentals.filter(r => r.rentalType === 'outgoing').length,
    active: rentals.filter(r => r.rentalType === 'outgoing' && r.status === 'active').length,
    overdue: rentals.filter(r => r.rentalType === 'outgoing' && r.status === 'overdue').length,
    revenue: rentals.filter(r => r.rentalType === 'outgoing').reduce((sum, r) => sum + r.totalAmount, 0)
  };

  const incomingStats = {
    total: rentals.filter(r => r.rentalType === 'incoming').length,
    active: rentals.filter(r => r.rentalType === 'incoming' && r.status === 'active').length,
    overdue: rentals.filter(r => r.rentalType === 'incoming' && r.status === 'overdue').length,
    cost: rentals.filter(r => r.rentalType === 'incoming').reduce((sum, r) => sum + r.totalAmount, 0)
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rental Management</h1>
          <p className="text-gray-600 mt-1">Manage equipment rentals - both incoming and outgoing</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => handleAddRental('Incoming')}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all duration-200 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Rent In
          </button>
          <button
            onClick={() => handleAddRental('Outgoing')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Rent Out
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 p-3 rounded-lg">
              <ArrowRight className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Outgoing Rentals</p>
              <p className="text-2xl font-bold text-gray-900">{outgoingStats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-emerald-500 p-3 rounded-lg">
              <ArrowLeft className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Incoming Rentals</p>
              <p className="text-2xl font-bold text-gray-900">{incomingStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rental Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{outgoingStats.revenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-amber-500 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue Items</p>
              <p className="text-2xl font-bold text-gray-900">{outgoingStats.overdue + incomingStats.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'outgoing', name: 'Rent Out (Our Equipment)', icon: ArrowRight },
              { id: 'incoming', name: 'Rent In (From Others)', icon: ArrowLeft }
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
                placeholder={`Search ${activeTab} rentals...`}
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
                <option value="active">Active</option>
                <option value="confirmed">Confirmed</option>
                <option value="returned">Returned</option>
                <option value="overdue">Overdue</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          {filteredRentals.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No rentals found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRentals.map((rental) => {
                const StatusIcon = getStatusIcon(rental.status);
                
                return (
                  <div key={rental._id} className="bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`${rental.rentalType === 'outgoing' ? 'bg-blue-100' : 'bg-emerald-100'} p-3 rounded-lg mr-4`}>
                          {rental.rentalType === 'outgoing' ? (
                            <Camera className="w-6 h-6 text-blue-600" />
                          ) : (
                            <Truck className="w-6 h-6 text-emerald-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{rental.equipmentName}</h3>
                          <p className="text-sm text-gray-600">{rental.equipmentType} • {rental.rentalNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(rental.paymentStatus)}`}>
                          {rental.paymentStatus}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(rental.status)}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {rental.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">
                          {rental.rentalType === 'outgoing' ? 'Renter Details' : 'Vendor Details'}
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600">
                            <User className="w-4 h-4 mr-2" />
                            {rental.rentalType === 'outgoing' ? rental.renter?.name : rental.vendor?.name}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Phone className="w-4 h-4 mr-2" />
                            {rental.rentalType === 'outgoing' ? rental.renter?.phone : rental.vendor?.phone}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            {rental.branch.name}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Rental Period</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            {new Date(rental.startDate).toLocaleDateString()} to {new Date(rental.endDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <DollarSign className="w-4 h-4 mr-2" />
                            ₹{rental.dailyRate}/day
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Package className="w-4 h-4 mr-2" />
                            Condition: {rental.condition}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Financial Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Amount:</span>
                            <span className="font-medium text-gray-900">₹{rental.totalAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Security Deposit:</span>
                            <span className="font-medium text-gray-900">₹{rental.securityDeposit.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Payment Status:</span>
                            <span className={`font-medium ${rental.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-red-600'}`}>
                              {rental.paymentStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {rental.notes && (
                      <div className="mt-4 p-3 bg-white rounded-lg">
                        <p className="text-sm text-gray-600">{rental.notes}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditRental(rental)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          Edit
                        </button>
                        {rental.status === 'active' && (
                          <button 
                            onClick={() => handleEditRental({...rental, status: 'returned'})}
                            className="px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                          >
                            Mark Returned
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteRental(rental._id)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Rental Modal */}
      <NeomorphicModal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
        }}
        title={showEditModal ? 'Edit Rental' : 'Add New Rental'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rental Type
              </label>
              <select
                value={formData.rentalType}
                onChange={(e) => setFormData({...formData, rentalType: e.target.value as 'outgoing' | 'incoming'})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={showEditModal}
              >
                <option value="outgoing">Outgoing (Rent Out)</option>
                <option value="incoming">Incoming (Rent In)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Equipment
              </label>
              <select
                value={formData.equipment}
                onChange={(e) => handleEquipmentChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={showEditModal}
              >
                <option value="">Select Equipment</option>
                {inventory.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name} ({item.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Rate (₹)
              </label>
              <input
                type="number"
                value={formData.dailyRate}
                onChange={(e) => setFormData({...formData, dailyRate: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Security Deposit (₹)
              </label>
              <input
                type="number"
                value={formData.securityDeposit}
                onChange={(e) => setFormData({...formData, securityDeposit: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.rentalType === 'outgoing' ? 'Renter Name' : 'Vendor Name'}
              </label>
              <input
                type="text"
                value={formData.rentalType === 'outgoing' ? formData.renter.name : formData.vendor.name}
                onChange={(e) => setFormData({
                  ...formData,
                  [formData.rentalType === 'outgoing' ? 'renter' : 'vendor']: {
                    ...formData[formData.rentalType === 'outgoing' ? 'renter' : 'vendor'],
                    name: e.target.value
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.rentalType === 'outgoing' ? 'Renter Phone' : 'Vendor Phone'}
              </label>
              <input
                type="tel"
                value={formData.rentalType === 'outgoing' ? formData.renter.phone : formData.vendor.phone}
                onChange={(e) => setFormData({
                  ...formData,
                  [formData.rentalType === 'outgoing' ? 'renter' : 'vendor']: {
                    ...formData[formData.rentalType === 'outgoing' ? 'renter' : 'vendor'],
                    phone: e.target.value
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
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
                showEditModal ? 'Update Rental' : 'Create Rental'
              )}
            </button>
          </div>
        </form>
      </NeomorphicModal>
    </div>
  );
};

export default RentalManagement;