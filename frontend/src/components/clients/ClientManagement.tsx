import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Plus, 
  Search,
  Loader2,
  X,
  Edit,
  Trash2,
  UserCheck,
  TicketIcon,
  User
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { clientAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { branchAPI } from '../../services/api';
import StatCard from '../ui/StatCard';

interface Branch {
  _id: string;
  name: string;
  companyName: string;
}

interface Client {
  _id: string;
  name: string;
  email: string;  // Primary identifier for the client
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  reference: {
    name: string;
    phone: string;
    relationship: string;
  };
  category: 'individual' | 'professional';
  status: 'active' | 'inactive' | 'lead';
  totalBookings: number;
  totalSpent: number;
  lastBooking: string;
  rating: number;
  notes: string;
  branch: {
    _id: string;
    name: string;
  };
  createdBy: {
    _id: string;
    name: string;
  };
  aadharNumber?: string;
  panNumber?: string;
}

const ClientManagement = () => {
  const { user } = useAuth();
  const isChairman = user?.role === 'chairman';
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    },
    reference: {
      name: '',
      phone: '',
      relationship: ''
    },
    category: 'individual' as 'individual' | 'professional',
    password: '',
    status: 'active' as 'active' | 'inactive' | 'lead',
    notes: '',
    aadharNumber: '',
    panNumber: '',
    branch: ''
  });
  const [submitting, setSubmitting] = useState(false);
  
  const { addNotification } = useNotification();

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (isChairman) {
        // chairman can filter by branch; empty means all
        if (selectedBranchFilter) params.branch = selectedBranchFilter;
      } else {
        // be explicit for branch users: include their branch id
        if (user?.branchId) params.branch = user.branchId;
      }
      const response = await clientAPI.getClients(Object.keys(params).length ? params : undefined);
      
      const clientData = response.data?.data || response.data || response;
      if (Array.isArray(clientData)) {
        setClients(clientData);
      } else if (clientData && Array.isArray(clientData.data)) {
        setClients(clientData.data);
      } else {
        setClients([]);
      }
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to fetch clients'
      });
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [addNotification, selectedBranchFilter, isChairman]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const fetchBranches = useCallback(async () => {
    try {
      const branchResponse = await branchAPI.getBranches();
      const branchesFetched = branchResponse?.data?.data || branchResponse?.data || [];
      setBranches(branchesFetched);
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to fetch branches',
      });
    }
  }, [addNotification]);

  useEffect(() => {
    if (isChairman) {
      fetchBranches();
    }
  }, [isChairman, fetchBranches]);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        pincode: ''
      },
      reference: {
        name: '',
        phone: '',
        relationship: ''
      },
      category: 'individual',
      password: '',
      status: 'active',
      notes: '',
      aadharNumber: '',
      panNumber: '',
      branch: ''
    });
  };

  const handleAddClient = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      reference: client.reference,
      category: client.category,
      password: '', 
      status: client.status,
      notes: client.notes || '',
      aadharNumber: client.aadharNumber || '',
      panNumber: client.panNumber || '',
      branch: client.branch?._id || ''
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = { ...formData };
    if (!isChairman) {
      payload.branch = user?.branchId || '';
    }
    
    if ('company' in payload) {
      delete payload.company;
    }
    try {
      if (selectedClient) {
        await clientAPI.updateClient(selectedClient._id, payload);
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Client updated successfully'
        });
      } else {
        await clientAPI.createClient(payload);
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Client created successfully'
        });
      }
      fetchClients();
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedClient(null);
      resetForm();
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to save client'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await clientAPI.deleteClient(id);
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Client deleted successfully'
        });
        fetchClients();
      } catch (error: unknown) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: error instanceof Error ? error.message : 'Failed to delete client'
        });
      }
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone.includes(searchTerm) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  
  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    leads: clients.filter(c => c.status === 'lead').length,
    individual: clients.filter(c => c.category === 'individual').length,
    professional: clients.filter(c => c.category === 'professional').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-animate">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Client Management</h1>
            <p className="text-gray-500 mt-1 text-sm">Manage your client relationships and information</p>
          </div>
          <button
            onClick={handleAddClient}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md font-medium"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Client
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard
          title="Total Clients"
          value={stats.total}
          icon={Users}
        />

        <StatCard
          title="Active Clients"
          value={stats.active}
          icon={UserCheck}
        />

        <StatCard
          title="Leads"
          value={stats.leads}
          icon={TicketIcon}
        />

        <StatCard
          title="Individual Clients"
          value={stats.individual}
          icon={User}
        />
        <StatCard
          title="Professional Clients"
          value={stats.professional}
          icon={User}
        />
        
      </div>

      {}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {isChairman && (
          <select
            value={selectedBranchFilter}
            onChange={(e) => setSelectedBranchFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Branches</option>
            {branches.map(b => (
              <option key={b._id} value={b._id}>{b.companyName}</option>
            ))}
          </select>
        )}

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="lead">Lead</option>
        </select>
      </div>

      {}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow-sm border border-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Phone</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Category</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Branch</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">City</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-8 text-gray-500">No clients found</td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client._id} className="border-b">
                  <td className="px-4 py-2 text-sm">{client.name}</td>
                  <td className="px-4 py-2 text-sm">{client.phone}</td>
                  <td className="px-4 py-2 text-sm">{client.email}</td>
                  <td className="px-4 py-2 text-sm">{client.category}</td>
                  <td className="px-4 py-2 text-sm">{client.status}</td>
                  <td className="px-4 py-2 text-sm">{client.branch?.name || '-'}</td>
                  <td className="px-4 py-2 text-sm">{client.address.city}</td>                  
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleEditClient(client)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors mr-2"
                      title="Edit Client"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client._id, client.name)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete Client"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedClient ? 'Edit Client' : 'Add New Client'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setSelectedClient(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value as 'individual' | 'professional'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="individual">Individual</option>
                      <option value="professional">Professional</option>
                    </select>
                  </div>

                  {isChairman && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Branch *</label>
                      <select
                        required
                        value={formData.branch}
                        onChange={e => setFormData({ ...formData, branch: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Branch</option>
                        {branches.map((branch) => (
                          <option key={branch._id} value={branch._id}>{branch.companyName}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                    <input
                      type="text"
                      value={formData.address.street}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: {...formData.address, street: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: {...formData.address, city: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      value={formData.address.state}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: {...formData.address, state: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">PIN Code</label>
                    <input
                      type="text"
                      value={formData.address.pincode}
                      onChange={(e) => setFormData({
                        ...formData, 
                        address: {...formData.address, pincode: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Login Credentials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">User ID *</label>
                    {}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password {selectedClient ? '' : '*'}
                    </label>
                    <input
                      type="password"
                      required={!selectedClient}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={selectedClient ? "Leave blank to keep current password" : ""}
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              {}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Government IDs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Aadhar Number</label>
                    <input
                      type="text"
                      value={formData.aadharNumber}
                      onChange={(e) => setFormData({...formData, aadharNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number</label>
                    <input
                      type="text"
                      value={formData.panNumber}
                      onChange={(e) => setFormData({...formData, panNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reference (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reference Name</label>
                    <input
                      type="text"
                      value={formData.reference.name}
                      onChange={(e) => setFormData({
                        ...formData, 
                        reference: {...formData.reference, name: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reference Phone</label>
                    <input
                      type="tel"
                      value={formData.reference.phone}
                      onChange={(e) => setFormData({
                        ...formData, 
                        reference: {...formData.reference, phone: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                    <input
                      type="text"
                      value={formData.reference.relationship}
                      onChange={(e) => setFormData({
                        ...formData, 
                        reference: {...formData.reference, relationship: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive' | 'lead'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="lead">Lead</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Additional notes about the client..."
                    />
                  </div>
                </div>
              </div>

              {}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedClient(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {selectedClient ? 'Update Client' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;
