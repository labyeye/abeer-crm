import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, 
  Search, 
  MapPin,
  Phone,
  Mail,
  Edit,
  Trash2,
  X,
  CheckCircle,
  AlertTriangle,
  Globe
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { branchAPI } from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';

interface BranchAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface Branch {
  _id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: BranchAddress;
  website?: string;
  industry: string;
  foundedYear?: number;
  employeeCount?: number;
  revenue?: number | { total: number; invoices?: number; bookings?: number; quotations?: number };
  status: 'active' | 'inactive' | 'suspended';
  description?: string;
  createdAt: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
}

interface StatsOverview {
  totalBranches: number;
  activeBranches: number;
  inactiveBranches: number;
  avgEmployeeCount: number;
  totalRevenue: number;
}

interface Stats {
  overview: StatsOverview;
  industryBreakdown: any[];
}

const BranchManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    } as BranchAddress,
    website: '',
    industry: 'Photography',
    foundedYear: '',
    employeeCount: '',
    revenue: '',
    description: '',
    gstNumber: '',
    password: ''
  });
  
  const { addNotification } = useNotification();
  const { user } = useAuth();

  const hasAccess = user && ['chairman', 'admin'].includes(user.role);

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await branchAPI.getBranches();
      // branchAPI often returns the axios response.data already, but different
      // controllers sometimes wrap data as { success, data } or { data }
      const list = (response && (response.data?.data || response.data || response)) || [];
      // normalize to array of branches when wrapped
      const branchesFetched = Array.isArray(list) ? list : (Array.isArray((list as any).data) ? (list as any).data : []);
      setBranches(branchesFetched as Branch[]);
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to fetch branches'
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await branchAPI.getBranchStats();
      const data = (response && (response.data || response)) || null;
      if (data && data.overview) {
        const ov = data.overview;
        const normalized: Stats = {
          overview: {
            totalBranches: ov.totalBranches ?? 0,
            activeBranches: ov.activeBranches ?? 0,
            inactiveBranches: ov.inactiveBranches ?? 0,
            avgEmployeeCount: ov.avgEmployeeCount ?? 0,
            totalRevenue: ov.totalRevenue ?? 0,
          },
          industryBreakdown: data.industryBreakdown || data.industryStats || [],
        };
        setStats(normalized);
      } else {
        setStats(data || null);
      }
    } catch (error: unknown) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    if (hasAccess) {
      fetchBranches();
      fetchStats();
    }
  }, [hasAccess, fetchBranches, fetchStats]);

  useEffect(() => {
    const handler = () => {
      if (hasAccess) {
        fetchBranches();
        fetchStats();
      }
    };
    window.addEventListener('branchesUpdated', handler);
    return () => window.removeEventListener('branchesUpdated', handler);
  }, [hasAccess, fetchBranches, fetchStats]);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const branchData = {
        ...formData,
        foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : undefined,
        employeeCount: formData.employeeCount ? parseInt(formData.employeeCount) : undefined,
        revenue: formData.revenue ? parseFloat(formData.revenue) : undefined
      };

      await branchAPI.createBranch(branchData);
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Branch created successfully'
      });
      setShowCreateModal(false);
      resetForm();
      fetchBranches();
      fetchStats();
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create branch'
      });
    }
  };

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return;

    try {
      const branchData = {
        ...formData,
        foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : undefined,
        employeeCount: formData.employeeCount ? parseInt(formData.employeeCount) : undefined,
        revenue: formData.revenue ? parseFloat(formData.revenue) : undefined
      };

      await branchAPI.updateBranch(selectedBranch._id, branchData);
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Branch updated successfully'
      });
      setShowEditModal(false);
      resetForm();
      fetchBranches();
      fetchStats();
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update branch'
      });
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    try {
      await branchAPI.deleteBranch(branchId);
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Branch deleted successfully'
      });
      fetchBranches();
      fetchStats();
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete branch'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India'
      },
      website: '',
      industry: 'Photography',
      foundedYear: '',
      employeeCount: '',
      revenue: '',
      description: '',
      gstNumber: '',
      password: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    if (name.startsWith('address.')) {
      const key = name.split('.')[1];
      setFormData(prev => ({ ...prev, address: { ...prev.address, [key]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const openEditModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
      email: branch.email,
      phone: branch.phone,
      address: branch.address,
      website: branch.website || '',
      industry: branch.industry,
      foundedYear: branch.foundedYear?.toString() || '',
      employeeCount: branch.employeeCount?.toString() || '',
      revenue: branch.revenue ? (typeof branch.revenue === 'number' ? branch.revenue.toString() : branch.revenue.total.toString()) : '',
      description: branch.description || '',
      gstNumber: '',
      password: ''
    });
    setShowEditModal(true);
  };

  const filteredBranches = branches.filter(branch => {
    const matchesSearch = branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.phone.includes(searchTerm);
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && branch.status === filterStatus;
  });

  if (loading) return <LoadingSpinner />;

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p className="font-bold">Access Denied</p>
          <p>You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        {/* Header section */}
        <div className="flex justify-between items-center"> 
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-primary-dark"
          >
            <Plus className="w-4 h-4" />
            Add Branch
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm">Total Branches</h3>
              <p className="text-2xl font-semibold">{stats.overview.totalBranches}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm">Active Branches</h3>
              <p className="text-2xl font-semibold text-green-600">{stats.overview.activeBranches}</p>
            </div>
            
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search branches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* Branch Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBranches.map((branch) => (
            <div key={branch._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold">{branch.name}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(branch)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBranch(branch._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {typeof branch.address === 'string' ? branch.address : `${branch.address.city}, ${branch.address.state}`}
                  </p>
                  <p className="text-sm flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {branch.phone}
                  </p>
                  <p className="text-sm flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {branch.email}
                  </p>
                  {branch.website && (
                    <p className="text-sm flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      {branch.website}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Industry</p>
                      <p className="text-sm font-medium">{branch.industry}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Founded</p>
                      <p className="text-sm font-medium">{branch.foundedYear || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <span className={`inline-flex items-center gap-1 text-sm ${
                        branch.status === 'active' ? 'text-green-600' :
                        branch.status === 'inactive' ? 'text-gray-600' :
                        'text-orange-600'
                      }`}>
                        {branch.status === 'active' && <CheckCircle className="w-3 h-3" />}
                        {branch.status === 'inactive' && <X className="w-3 h-3" />}
                        {branch.status === 'suspended' && <AlertTriangle className="w-3 h-3" />}
                        {branch.status.charAt(0).toUpperCase() + branch.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                
              </div>
            </div>
          ))}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Add New Branch</h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateBranch} className="space-y-6">
                  {/* Form fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm">Name</label>
                      <input name="name" value={formData.name} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                      <label className="text-sm">Code</label>
                      <input name="code" value={formData.code} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                      <label className="text-sm">Email</label>
                      <input name="email" type="email" value={formData.email} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                      <label className="text-sm">Phone</label>
                      <input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                      <label className="text-sm">Website</label>
                      <input name="website" value={formData.website} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                      <label className="text-sm">Industry</label>
                      <select name="industry" value={formData.industry} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded">
                        <option>Photography</option>
                        <option>Events</option>
                        <option>Catering</option>
                        <option>Hospitality</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm">Founded Year</label>
                      <input name="foundedYear" value={formData.foundedYear} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                      <label className="text-sm">Employee Count</label>
                      <input name="employeeCount" value={formData.employeeCount} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm">Street</label>
                      <input name="address.street" value={formData.address?.street || ''} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                      <label className="text-sm">City</label>
                      <input name="address.city" value={formData.address?.city || ''} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                      <label className="text-sm">State</label>
                      <input name="address.state" value={formData.address?.state || ''} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                      <label className="text-sm">Zip Code</label>
                      <input name="address.zipCode" value={formData.address?.zipCode || ''} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                      <label className="text-sm">Country</label>
                      <input name="address.country" value={formData.address?.country || ''} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                      <label className="text-sm">GST Number</label>
                      <input name="gstNumber" value={formData.gstNumber} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm">Password (for branch admin)</label>
                      <input name="password" type="password" value={formData.password} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                      <label className="text-sm">Revenue (optional)</label>
                      <input name="revenue" value={formData.revenue} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                      }}
                      className="flex-1 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark"
                    >
                      Create Branch
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedBranch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Edit Branch</h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleUpdateBranch} className="space-y-6">
                  {/* Form fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm">Name</label>
                      <input name="name" value={formData.name} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                      <label className="text-sm">Code</label>
                      <input name="code" value={formData.code} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                      <label className="text-sm">Email</label>
                      <input name="email" type="email" value={formData.email} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                      <label className="text-sm">Phone</label>
                      <input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                      <label className="text-sm">Website</label>
                      <input name="website" value={formData.website} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                      <label className="text-sm">Industry</label>
                      <select name="industry" value={formData.industry} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded">
                        <option>Photography</option>
                        <option>Events</option>
                        <option>Catering</option>
                        <option>Hospitality</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm">Founded Year</label>
                      <input name="foundedYear" value={formData.foundedYear} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                      <label className="text-sm">Employee Count</label>
                      <input name="employeeCount" value={formData.employeeCount} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm">Street</label>
                      <input name="address.street" value={formData.address?.street || ''} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                      <label className="text-sm">City</label>
                      <input name="address.city" value={formData.address?.city || ''} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                      <label className="text-sm">State</label>
                      <input name="address.state" value={formData.address?.state || ''} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                      <label className="text-sm">Zip Code</label>
                      <input name="address.zipCode" value={formData.address?.zipCode || ''} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                      <label className="text-sm">Country</label>
                      <input name="address.country" value={formData.address?.country || ''} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                      <label className="text-sm">GST Number</label>
                      <input name="gstNumber" value={formData.gstNumber} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm">Password (only change to reset)</label>
                      <input name="password" type="password" value={formData.password} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                      <label className="text-sm">Revenue (optional)</label>
                      <input name="revenue" value={formData.revenue} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        resetForm();
                      }}
                      className="flex-1 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark"
                    >
                      Update Branch
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchManagement;