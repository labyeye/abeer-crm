import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Camera,
  Monitor,
  Mic,
  Lightbulb,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  X,
  Loader2,
  CreditCard,
  Banknote
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { inventoryAPI, branchAPI } from '../../services/api';

interface InventoryItem {
  _id: string;
  name: string;
  sku: string;
  category: string;
  subcategory?: string;
  brand: string;
  model?: string;
  description?: string;
  condition: string;
  location: {
    warehouse: string;
    shelf?: string;
    bin?: string;
  };
  branch: {
    _id: string;
    name: string;
    code: string;
  };
  buyingMethod: 'cash' | 'emi';
  emiDetails?: {
    months: number;
    downPayment: number;
    monthlyAmount: number;
  };
  quantity: number;
  minQuantity: number;
  maxQuantity?: number;
  unit: string;
  purchasePrice: number;
  sellingPrice?: number;
  supplier: {
    name: string;
    contact?: string;
    email?: string;
    phone?: string;
  };
  purchaseDate: string;
  warrantyExpiry?: string;
  status: string;
  tags?: string[];
  notes?: string;
  createdAt: string;
}

interface Branch {
  _id: string;
  name: string;
  code: string;
}

const InventoryManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Camera',
    subcategory: '',
    brand: '',
    model: '',
    description: '',
    condition: 'New',
    location: {
      warehouse: '',
      shelf: '',
      bin: ''
    },
    branch: '',
    buyingMethod: 'cash' as 'cash' | 'emi',
    emiDetails: {
      months: 0,
      downPayment: 0,
      monthlyAmount: 0
    },
    quantity: '',
    minQuantity: '',
    maxQuantity: '',
    unit: 'Piece',
    purchasePrice: '',
    sellingPrice: '',
    supplier: {
      name: '',
      contact: '',
      email: '',
      phone: ''
    },
    warrantyExpiry: '',
    status: 'Active',
    tags: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { addNotification } = useNotification();
  const { user } = useAuth();

  
  const hasAccess = user && ['chairman', 'admin', 'manager'].includes(user.role);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (user && user.role !== 'chairman') {
        if (user.branchId) params.branch = user.branchId;
      } else {
        if (filterBranch && filterBranch !== 'all') params.branch = filterBranch;
      }

      const [inventoryRes, branchesRes] = await Promise.all([
        inventoryAPI.getInventory(Object.keys(params).length ? params : undefined),
        branchAPI.getBranches()
      ]);
      
      setInventory(inventoryRes.data.docs || inventoryRes.data.data || []);
      setBranches(branchesRes.data.data || branchesRes.data || []);
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to fetch data'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      fetchData();
    }
  }, [hasAccess]);

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      category: 'Camera',
      subcategory: '',
      brand: '',
      model: '',
      description: '',
      condition: 'New',
      location: {
        warehouse: '',
        shelf: '',
        bin: ''
      },
      branch: '',
      buyingMethod: 'cash',
      emiDetails: {
        months: 0,
        downPayment: 0,
        monthlyAmount: 0
      },
      quantity: '',
      minQuantity: '',
      maxQuantity: '',
      unit: 'Piece',
      purchasePrice: '',
      sellingPrice: '',
      supplier: {
        name: '',
        contact: '',
        email: '',
        phone: ''
      },
      warrantyExpiry: '',
      status: 'Active',
      tags: '',
      notes: ''
    });
  };

  const handleCreateItem = () => {
    resetForm();
    // Pre-fill branch for non-chairman users
    if (user && user.role !== 'chairman') {
      setFormData((fd) => ({ ...fd, branch: user.branchId || '' }));
    }
    setShowCreateModal(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      sku: item.sku,
      category: item.category,
      subcategory: item.subcategory || '',
      brand: item.brand,
      model: item.model || '',
      description: item.description || '',
      condition: item.condition,
      location: {
        warehouse: item.location.warehouse,
        shelf: item.location.shelf || '',
        bin: item.location.bin || ''
      },
      branch: item.branch?._id || '',
      buyingMethod: item.buyingMethod,
      emiDetails: {
        months: item.emiDetails?.months || 0,
        downPayment: item.emiDetails?.downPayment || 0,
        monthlyAmount: item.emiDetails?.monthlyAmount || 0
      },
      quantity: item.quantity.toString(),
      minQuantity: item.minQuantity.toString(),
      maxQuantity: item.maxQuantity?.toString() || '',
      unit: item.unit,
      purchasePrice: item.purchasePrice.toString(),
      sellingPrice: item.sellingPrice?.toString() || '',
      supplier: {
        name: item.supplier.name,
        contact: item.supplier.contact || '',
        email: item.supplier.email || '',
        phone: item.supplier.phone || ''
      },
      warrantyExpiry: item.warrantyExpiry ? item.warrantyExpiry.split('T')[0] : '',
      status: item.status,
      tags: item.tags?.join(', ') || '',
      notes: item.notes || ''
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const itemData = {
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        brand: formData.brand,
        model: formData.model || undefined,
        description: formData.description || undefined,
        condition: formData.condition,
        location: {
          warehouse: formData.location.warehouse,
          shelf: formData.location.shelf || undefined,
          bin: formData.location.bin || undefined
        },
        branch: formData.branch,
        buyingMethod: formData.buyingMethod,
        emiDetails: formData.buyingMethod === 'emi' ? {
          months: Number(formData.emiDetails.months),
          downPayment: Number(formData.emiDetails.downPayment),
          monthlyAmount: Number(formData.emiDetails.monthlyAmount)
        } : undefined,
        quantity: Number(formData.quantity),
        minQuantity: Number(formData.minQuantity),
        maxQuantity: formData.maxQuantity ? Number(formData.maxQuantity) : undefined,
        unit: formData.unit,
        purchasePrice: Number(formData.purchasePrice),
        sellingPrice: formData.sellingPrice ? Number(formData.sellingPrice) : undefined,
        supplier: {
          name: formData.supplier.name,
          contact: formData.supplier.contact || undefined,
          email: formData.supplier.email || undefined,
          phone: formData.supplier.phone || undefined
        },
        warrantyExpiry: formData.warrantyExpiry || undefined,
        status: formData.status,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : undefined,
        notes: formData.notes || undefined
      };

      if (selectedItem) {
        await inventoryAPI.updateInventoryItem(selectedItem._id, itemData as any);
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Inventory item updated successfully'
        });
      } else {
        await inventoryAPI.createInventoryItem(itemData as any);
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Inventory item created successfully'
        });
      }
      
      fetchData();
      setShowCreateModal(false);
      setShowEditModal(false);
      setSelectedItem(null);
      resetForm();
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to save inventory item'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await inventoryAPI.deleteInventoryItem(id);
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Inventory item deleted successfully'
        });
        fetchData();
      } catch (error: unknown) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: error instanceof Error ? error.message : 'Failed to delete inventory item'
        });
      }
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesBranch = filterBranch === 'all' || item.branch?._id === filterBranch;
    return matchesSearch && matchesCategory && matchesStatus && matchesBranch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Camera': return <Camera className="w-5 h-5" />;
      case 'Lens': return <Camera className="w-5 h-5" />;
      case 'Lighting': return <Lightbulb className="w-5 h-5" />;
      case 'Audio': return <Mic className="w-5 h-5" />;
      case 'Tripod': return <Monitor className="w-5 h-5" />;
      case 'Accessories': return <HardDrive className="w-5 h-5" />;
      case 'Props': return <Package className="w-5 h-5" />;
      case 'Software': return <HardDrive className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return { status: 'Out of Stock', color: 'text-red-600 bg-red-100' };
    } else if (item.quantity <= item.minQuantity) {
      return { status: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
    } else {
      return { status: 'In Stock', color: 'text-green-600 bg-green-100' };
    }
  };

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to access inventory management.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Manage equipment and supplies with branch tracking and EMI details</p>
        </div>
        <button
          onClick={handleCreateItem}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Item
        </button>
      </div>

      {/* Viewing badge: shows which branch is being viewed */}
      {(() => {
        const viewingBranchId = user && user.role !== 'chairman' ? user.branchId : (filterBranch && filterBranch !== 'all' ? filterBranch : null);
        const viewingBranch = viewingBranchId ? branches.find(b => b._id === viewingBranchId) : null;
        return viewingBranch ? (
          <div className="text-sm text-gray-600">
            Viewing: <span className="font-medium text-gray-900">{viewingBranch.name} ({viewingBranch.code || ''})</span>
          </div>
        ) : null;
      })()}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 p-3 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-green-500 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {inventory.filter(item => item.quantity > item.minQuantity).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-yellow-500 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {inventory.filter(item => item.quantity > 0 && item.quantity <= item.minQuantity).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-red-500 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {inventory.filter(item => item.quantity === 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Categories</option>
          <option value="Camera">Camera</option>
          <option value="Lens">Lens</option>
          <option value="Lighting">Lighting</option>
          <option value="Audio">Audio</option>
          <option value="Tripod">Tripod</option>
          <option value="Accessories">Accessories</option>
          <option value="Props">Props</option>
          <option value="Software">Software</option>
          <option value="Other">Other</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Under Maintenance">Under Maintenance</option>
          <option value="Discontinued">Discontinued</option>
        </select>

        <select
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Branches</option>
          {branches.map((branch) => (
            <option key={branch._id} value={branch._id}>
              {branch.name} ({branch.code || ''})
            </option>
          ))}
        </select>
      </div>

      {/* Inventory List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch & Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock & Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EMI Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item);
                return (
                  <tr key={item._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            {getCategoryIcon(item.category)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.brand} {item.model}
                          </div>
                          <div className="text-xs text-gray-400">
                            SKU: {item.sku}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.branch ? `${item.branch.name} (${item.branch.code || ''})` : 'No Branch'}
                        </div>
                        <div className="text-sm text-gray-500">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {item.location.warehouse}
                        </div>
                        {item.location.shelf && (
                          <div className="text-xs text-gray-400">
                            Shelf: {item.location.shelf}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.quantity} {item.unit}
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                          {stockStatus.status}
                        </span>
                        <div className="text-xs text-gray-400 mt-1">
                          Min: {item.minQuantity}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          ₹{item.purchasePrice.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.supplier.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(item.purchaseDate).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center text-sm font-medium text-gray-900">
                          {item.buyingMethod === 'emi' ? (
                            <CreditCard className="w-4 h-4 mr-1 text-blue-500" />
                          ) : (
                            <Banknote className="w-4 h-4 mr-1 text-green-500" />
                          )}
                          {item.buyingMethod.toUpperCase()}
                        </div>
                        {item.buyingMethod === 'emi' && item.emiDetails && (
                          <div className="text-xs text-gray-500">
                            <div>{item.emiDetails.months} months</div>
                            <div>₹{item.emiDetails.monthlyAmount}/month</div>
                            <div>Down: ₹{item.emiDetails.downPayment}</div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item._id, item.name)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredInventory.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-600">Get started by adding your first inventory item.</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedItem(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Show assigned branch when editing an existing item */}
            {selectedItem && (
              <div className="px-6 pt-4 pb-2 text-sm text-gray-700">
                Assigned Branch:{' '}
                <span className="font-medium text-gray-900">
                  {selectedItem.branch?.name
                    ? `${selectedItem.branch.name} (${selectedItem.branch.code || ''})`
                    : (branches.find(b => b._id === formData.branch)?.name
                        ? `${branches.find(b => b._id === formData.branch)?.name} (${branches.find(b => b._id === formData.branch)?.code || ''})`
                        : 'Unassigned')}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SKU *</label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Camera">Camera</option>
                      <option value="Lens">Lens</option>
                      <option value="Lighting">Lighting</option>
                      <option value="Audio">Audio</option>
                      <option value="Tripod">Tripod</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Props">Props</option>
                      <option value="Software">Software</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brand *</label>
                    <input
                      type="text"
                      required
                      value={formData.brand}
                      onChange={(e) => setFormData({...formData, brand: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({...formData, model: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Condition *</label>
                    <select
                      required
                      value={formData.condition}
                      onChange={(e) => setFormData({...formData, condition: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="New">New</option>
                      <option value="Like New">Like New</option>
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Location & Branch */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location & Branch</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Warehouse *</label>
                    <input
                      type="text"
                      required
                      value={formData.location.warehouse}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: {...formData.location, warehouse: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Shelf</label>
                    <input
                      type="text"
                      value={formData.location.shelf}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: {...formData.location, shelf: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bin</label>
                    <input
                      type="text"
                      value={formData.location.bin}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: {...formData.location, bin: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                    {user && user.role === 'chairman' ? (
                      <select
                        required
                        value={formData.branch}
                        onChange={e => setFormData({ ...formData, branch: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Branch</option>
                        {branches.map(branch => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name} ({branch.code || ''})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        readOnly
                        value={(branches.find(b => b._id === formData.branch)?.name ? `${branches.find(b => b._id === formData.branch)?.name} (${branches.find(b => b._id === formData.branch)?.code || ''})` : '')}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                        placeholder="Your branch"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Purchase Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Buying Method *</label>
                    <select
                      required
                      value={formData.buyingMethod}
                      onChange={(e) => setFormData({...formData, buyingMethod: e.target.value as 'cash' | 'emi'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="cash">Cash</option>
                      <option value="emi">EMI</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Price *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {formData.buyingMethod === 'emi' && (
                  <div className="mt-4">
                    <h4 className="text-md font-medium text-gray-800 mb-3">EMI Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Number of Months *</label>
                        <input
                          type="number"
                          required={formData.buyingMethod === 'emi'}
                          min="1"
                          value={formData.emiDetails.months}
                          onChange={(e) => setFormData({
                            ...formData,
                            emiDetails: {...formData.emiDetails, months: Number(e.target.value)}
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Down Payment *</label>
                        <input
                          type="number"
                          required={formData.buyingMethod === 'emi'}
                          min="0"
                          step="0.01"
                          value={formData.emiDetails.downPayment}
                          onChange={(e) => setFormData({
                            ...formData,
                            emiDetails: {...formData.emiDetails, downPayment: Number(e.target.value)}
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Amount *</label>
                        <input
                          type="number"
                          required={formData.buyingMethod === 'emi'}
                          min="0"
                          step="0.01"
                          value={formData.emiDetails.monthlyAmount}
                          onChange={(e) => setFormData({
                            ...formData,
                            emiDetails: {...formData.emiDetails, monthlyAmount: Number(e.target.value)}
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stock Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Quantity *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.minQuantity}
                      onChange={(e) => setFormData({...formData, minQuantity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxQuantity}
                      onChange={(e) => setFormData({...formData, maxQuantity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                    <select
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Piece">Piece</option>
                      <option value="Set">Set</option>
                      <option value="Box">Box</option>
                      <option value="Case">Case</option>
                      <option value="Roll">Roll</option>
                      <option value="Meter">Meter</option>
                      <option value="Foot">Foot</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Supplier Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.supplier.name}
                      onChange={(e) => setFormData({
                        ...formData,
                        supplier: {...formData.supplier, name: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Phone</label>
                    <input
                      type="tel"
                      value={formData.supplier.phone}
                      onChange={(e) => setFormData({
                        ...formData,
                        supplier: {...formData.supplier, phone: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Email</label>
                    <input
                      type="email"
                      value={formData.supplier.email}
                      onChange={(e) => setFormData({
                        ...formData,
                        supplier: {...formData.supplier, email: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Under Maintenance">Under Maintenance</option>
                      <option value="Discontinued">Discontinued</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({...formData, tags: e.target.value})}
                      placeholder="e.g., professional, rental, fragile"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedItem(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {selectedItem ? 'Update Item' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
