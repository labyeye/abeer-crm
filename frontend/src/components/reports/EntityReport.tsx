import React, { useEffect, useState } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { clientAPI, branchAPI, staffAPI, bookingAPI, inventoryAPI, expenseAPI } from '../../services/api';
import { 
  Users, 
  Package, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Badge,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Search,
  Download
} from 'lucide-react';

const EntityReport: React.FC = () => {
  const { addNotification } = useNotification();
  const { user } = useAuth();

  const [entityType, setEntityType] = useState<'client' | 'branch' | 'staff'>('branch');
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedEntityId, setSelectedEntityId] = useState('');

  const [entityDetails, setEntityDetails] = useState<any | null>(null);
  const [clientBookings, setClientBookings] = useState<any[] | null>(null);
  const [clientInvoices, setClientInvoices] = useState<any[] | null>(null);
  const [branchStaff, setBranchStaff] = useState<any[] | null>(null);
  const [branchInventory, setBranchInventory] = useState<any[] | null>(null);
  const [branchBookings, setBranchBookings] = useState<any[] | null>(null);
  const [branchClients, setBranchClients] = useState<any[] | null>(null);
  const [branchRevenue, setBranchRevenue] = useState<number | null>(null);
  const [branchExpense, setBranchExpense] = useState<number | null>(null);
  const [branchProfit, setBranchProfit] = useState<number | null>(null);
  const [staffBookings, setStaffBookings] = useState<any[] | null>(null);
  const [staffAttendance, setStaffAttendance] = useState<any[] | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadOptions = async () => {
      try {
        if (entityType === 'client') {
          const res = await clientAPI.getClients();
          const list = getArrayFromResponse(res);
          setOptions(list.map((c: any) => ({ value: c._id, label: `${c.name || c.email} (${c.phone || ''})` })));
        } else if (entityType === 'branch') {
          const res = await branchAPI.getBranches();
          const list = getArrayFromResponse(res);
          setOptions(list.map((b: any) => ({ value: b._id, label: `${b.name || b.code}` })));
        } else if (entityType === 'staff') {
          const res = await staffAPI.getStaff();
          const list = getArrayFromResponse(res);
          setOptions(list.map((s: any) => ({ value: s._id, label: `${s.name} — ${s.designation || ''}` })));
        }
      } catch (err: any) {
        addNotification({ type: 'error', title: 'Load failed', message: err.message || 'Could not load options' });
      }
    };

    loadOptions();
  }, [entityType]);

  const loadEntityDetails = async () => {
    if (!selectedEntityId) return;
    setLoadingDetails(true);
    setEntityDetails(null);
    setClientBookings(null);
    setClientInvoices(null);
    setBranchStaff(null);
    setBranchInventory(null);
    setBranchBookings(null);
    setStaffBookings(null);
    setStaffAttendance(null);

    try {
      if (entityType === 'client') {
        const detailsRes = await clientAPI.getClient(selectedEntityId);
        const details = getSingleFromResponse(detailsRes);
        setEntityDetails(details);
        const bookingsRes = await clientAPI.getClientBookings(selectedEntityId);
        setClientBookings(getArrayFromResponse(bookingsRes));
        const invoicesRes = await clientAPI.getClientInvoices(selectedEntityId);
        setClientInvoices(getArrayFromResponse(invoicesRes));
      } else if (entityType === 'branch') {
        const detailsRes = await branchAPI.getBranch(selectedEntityId);
        const details = getSingleFromResponse(detailsRes);
        setEntityDetails(details);
        const staffRes = await staffAPI.getStaff({ branch: selectedEntityId });
        setBranchStaff(getArrayFromResponse(staffRes));
        try {
          // First try with branch filter
          console.log('Fetching inventory for branch:', selectedEntityId);
          const inventoryRes = await inventoryAPI.getInventory({ branch: selectedEntityId });
          console.log('Inventory API Response:', inventoryRes);
          const inventoryData = getArrayFromResponse(inventoryRes);
          console.log('Processed Inventory Data:', inventoryData);
          console.log('Inventory Data Length:', inventoryData.length);
          
          // If no data with branch filter, try getting all inventory for debugging
          if (inventoryData.length === 0) {
            console.log('No inventory found with branch filter, trying to fetch all inventory...');
            const allInventoryRes = await inventoryAPI.getInventory({});
            console.log('All Inventory Response:', allInventoryRes);
            const allInventoryData = getArrayFromResponse(allInventoryRes);
            console.log('All Inventory Data:', allInventoryData);
            console.log('Total inventory items found:', allInventoryData.length);
            
            // Filter manually to see if any items match the branch
            const manuallyFiltered = allInventoryData.filter((item: any) => 
              item.branch === selectedEntityId || 
              (item.branch && typeof item.branch === 'object' && item.branch._id === selectedEntityId)
            );
            console.log('Manually filtered inventory:', manuallyFiltered);
            
            if (manuallyFiltered.length > 0) {
              setBranchInventory(manuallyFiltered);
              addNotification({ 
                type: 'info', 
                title: 'Inventory Found', 
                message: `Found ${manuallyFiltered.length} inventory items using manual filtering.` 
              });
            } else {
              setBranchInventory([]);
            }
            } else {
              setBranchInventory(inventoryData);
            }
            // compute and add inventory value to branch expense
            try {
              const invForCalc = (inventoryData || []).length ? inventoryData : [];
              const inventoryValue = invForCalc.reduce((sum: number, it: any) => {
                const unit = Number(it.purchasePrice ?? it.price ?? it.sellingPrice ?? 0) || 0;
                const qty = Number(it.quantity ?? 0) || 0;
                return sum + unit * qty;
              }, 0);
              if (inventoryValue > 0) {
                setBranchExpense(prev => (prev ?? 0) + inventoryValue);
              }
            } catch (e) {
              console.warn('Failed to compute inventory value:', e);
            }
        } catch (inventoryError) {
          console.error('Error fetching inventory:', inventoryError);
          setBranchInventory([]);
          addNotification({ 
            type: 'error', 
            title: 'Inventory Error', 
            message: 'Could not load inventory data. Please check your permissions and try again.' 
          });
        }
        const bookingsRes = await bookingAPI.getBookings({ branch: selectedEntityId });
        const bookingsList = getArrayFromResponse(bookingsRes);
        setBranchBookings(bookingsList);

        // fetch clients of this branch for counts
        try {
          const clientsRes = await clientAPI.getClients({ branch: selectedEntityId });
          const clientsList = getArrayFromResponse(clientsRes);
          setBranchClients(clientsList);
        } catch (cErr) {
          console.warn('Failed to fetch branch clients:', cErr);
          setBranchClients([]);
        }

        // Try to fetch branch financial summary from companyAPI -> branch stats
        try {
          const statsRes = await branchAPI.getBranchStats();
          const statsData = (statsRes && (statsRes.data || statsRes)) || null;
          // statsData may contain a list or a breakdown per branch — try to locate the branch
          if (statsData && statsData.data && Array.isArray(statsData.data.breakdowns)) {
            const found = statsData.data.breakdowns.find((d: any) => String(d.branchId) === String(selectedEntityId) || String(d._id) === String(selectedEntityId));
            if (found) {
              const r = found.totalRevenue || found.revenue || 0;
              const e = found.totalExpense || found.expense || 0;
              setBranchRevenue(r);
              setBranchExpense(e);
              setBranchProfit(r - e);
            }
          } else if (statsData && statsData.breakdown) {
            const rd = statsData.breakdown;
            const r = rd.totalRevenue || rd.revenue || rd.revenueTotal || 0;
            const e = rd.totalExpense || rd.expense || rd.expenses || 0;
            setBranchRevenue(r);
            setBranchExpense(e);
            setBranchProfit(r - e);
          } else if (statsData && statsData.overview && statsData.overview.totalRevenue) {
            const r = statsData.overview.totalRevenue || 0;
            setBranchRevenue(r);
            setBranchExpense(null);
            setBranchProfit(null);
          }
        } catch (err) {
          // fallback: compute revenue from bookings and expense from expense APIs
          try {
            const allBookings = bookingsList || [];
            const revenueFromBookings = allBookings.reduce((sum: number, b: any) => sum + (Number(b.amount || b.paid || 0) || 0), 0);
            setBranchRevenue(revenueFromBookings);

            const expRes = await expenseAPI.getExpenses({ branch: selectedEntityId });
            const expList = getArrayFromResponse(expRes) || [];
            const expenseSum = expList.reduce((sum: number, ex: any) => sum + (Number(ex.amount || ex.value || 0) || 0), 0);
            setBranchExpense(expenseSum);
            setBranchProfit(revenueFromBookings - expenseSum);
          } catch (err2) {
            console.warn('Failed to compute branch financials:', err2);
          }
        }
      } else if (entityType === 'staff') {
        const detailsRes = await staffAPI.getStaffMember(selectedEntityId);
        const details = getSingleFromResponse(detailsRes);
        setEntityDetails(details);
        const bookingsRes = await bookingAPI.getBookingsForStaff(selectedEntityId);
        setStaffBookings(getArrayFromResponse(bookingsRes));
        const attendanceRes = await staffAPI.getStaffAttendance(selectedEntityId);
        setStaffAttendance(getArrayFromResponse(attendanceRes));
      }
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Failed', message: err.message || 'Could not load details' });
    } finally {
      setLoadingDetails(false);
    }
  };

  function getArrayFromResponse(res: any) {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.items)) return res.items;
    if (Array.isArray(res.docs)) return res.docs;
    // Handle paginated responses
    if (res.data && Array.isArray(res.data.docs)) return res.data.docs;
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    if (res.data && Array.isArray(res.data.items)) return res.data.items;
    const val = Object.values(res).find((v: any) => Array.isArray(v));
    return Array.isArray(val) ? val : [];
  }

  function getSingleFromResponse(res: any) {
    if (!res) return null;
    if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) return res.data;
    return res;
  }

  const mergedClientHistory = (() => {
    if (!clientBookings && !clientInvoices) return [];
    const bookings = (clientBookings || []).map((b: any) => ({
      type: 'booking',
      id: b._id,
      date: b.date || b.createdAt,
      title: b.serviceName || b.title || `Booking ${b._id}`,
      amount: b.amount || 0,
      status: b.status,
      raw: b
    }));

    const invoices = (clientInvoices || []).map((inv: any) => ({
      type: 'invoice',
      id: inv._id,
      date: inv.paidAt || inv.createdAt || inv.date,
      title: `Invoice ${inv._id}`,
      amount: inv.total || inv.paid || 0,
      status: inv.status || 'invoice',
      raw: inv
    }));

    return [...bookings, ...invoices].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  })();

  const clientTotalSpent = clientInvoices?.reduce((sum, inv) => sum + (Number(inv.paid || inv.total || 0)), 0) ?? 0;
  const clientBookingsCount = clientBookings?.length ?? 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'completed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-red-100 text-red-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-purple-100 text-purple-800',
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                Entity Report Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Comprehensive overview of staff, inventory, and bookings</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <Download className="h-4 w-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          {user?.role === 'chairman' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    onChange={(e) => { setSelectedEntityId(''); setEntityType(e.target.value as 'client' | 'branch' | 'staff'); }}
                    value={entityType}
                  >
                    <option value="client">👤 Client</option>
                    <option value="branch">🏢 Branch</option>
                    <option value="staff">👥 Staff</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
                  </label>
                  <div className="flex gap-3">
                    <select 
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" 
                      value={selectedEntityId} 
                      onChange={(e) => setSelectedEntityId(e.target.value)}
                    >
                      <option value="">-- Select {entityType} --</option>
                      {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <button 
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center gap-2" 
                      onClick={async () => await loadEntityDetails()} 
                      disabled={!selectedEntityId || loadingDetails}
                    >
                      {loadingDetails ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          Load Data
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search across tables..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">🔒 Only chairman can view full entity history and reports.</p>
              </div>
            </div>
          )}
        </div>

        {/* Entity Details Header */}
        {entityDetails && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                {entityType === 'branch' && entityDetails.name?.charAt(0)}
                {entityType === 'client' && entityDetails.name?.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                {entityType === 'staff' && entityDetails.name?.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {entityDetails.name}
                  {entityType === 'staff' && entityDetails.designation && (
                    <span className="ml-3 text-lg font-normal text-gray-600">• {entityDetails.designation}</span>
                  )}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  {entityDetails.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {entityDetails.email}
                    </div>
                  )}
                  {entityDetails.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {entityDetails.phone}
                    </div>
                  )}
                  {entityDetails.code && (
                    <div className="flex items-center gap-1">
                      <Badge className="h-4 w-4" />
                      Code: {entityDetails.code}
                    </div>
                  )}
                  {entityType === 'staff' && entityDetails.branch && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {entityDetails.branch?.name || entityDetails.branch}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Branch Tables */}
        {entityDetails && entityType === 'branch' && (
          <div className="space-y-8">
            {/* Branch Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Revenue</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{branchRevenue !== null ? formatCurrency(branchRevenue) : 'N/A'}</dd>
                  </dl>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Profit</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{(branchProfit !== null ? branchProfit : (branchRevenue !== null && branchExpense !== null ? branchRevenue - branchExpense : null)) !== null ? formatCurrency((branchProfit !== null ? branchProfit : (branchRevenue !== null && branchExpense !== null ? branchRevenue - branchExpense : 0))) : 'N/A'}</dd>
                  </dl>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center">
                <div className="flex-shrink-0">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Expense</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{branchExpense !== null ? formatCurrency(branchExpense) : 'N/A'}</dd>
                  </dl>
                </div>
              </div>
            </div>
            {/* Branch Totals: staff / clients / inventory */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Total Staff</div>
                  <div className="text-2xl font-bold text-gray-900">{branchStaff ? branchStaff.length : 'N/A'}</div>
                </div>
                <div className="text-blue-500 font-bold text-xl">👥</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Total Clients</div>
                  <div className="text-2xl font-bold text-gray-900">{branchClients ? branchClients.length : 'N/A'}</div>
                </div>
                <div className="text-green-500 font-bold text-xl">👤</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Total Inventory</div>
                  <div className="text-2xl font-bold text-gray-900">{branchInventory ? branchInventory.length : 'N/A'}</div>
                </div>
                <div className="text-yellow-500 font-bold text-xl">📦</div>
              </div>
            </div>

            {/* Staff Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Staff Members ({branchStaff?.length || 0})
                  </h3>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
                </div>
              </div>
              
              {branchStaff && branchStaff.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {branchStaff.map((staff: any, index: number) => (
                        <tr key={staff._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-medium text-white">
                                {staff.name?.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                                <div className="text-sm text-gray-500">{staff.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {staff.designation || 'Not specified'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {staff.phone || 'Not provided'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(staff.status || 'active')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {staff.createdAt ? formatDate(staff.createdAt) : 'Unknown'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-12 text-center">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members</h3>
                  <p className="mt-1 text-sm text-gray-500">No staff members assigned to this branch yet.</p>
                </div>
              )}
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="h-5 w-5 text-green-600" />
                    Inventory Items ({branchInventory?.length || 0})
                  </h3>
                  <div className="flex items-center gap-2">
                    {branchInventory && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Debug: {JSON.stringify(branchInventory.slice(0, 1)).length > 100 ? 'Data Found' : 'No Data'}
                      </span>
                    )}
                    <button className="text-green-600 hover:text-green-700 text-sm font-medium">View All</button>
                  </div>
                </div>
              </div>
              
              {branchInventory && branchInventory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {branchInventory.map((item: any, index: number) => (
                        <tr key={item._id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.name || 'Unnamed Item'}</div>
                            <div className="text-sm text-gray-500">{item.description || item.brand || 'No description'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                              {item.sku || 'No SKU'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.category || 'Uncategorized'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`font-medium ${(item.quantity || 0) < (item.minQuantity || 10) ? 'text-red-600' : 'text-gray-900'}`}>
                              {item.quantity !== undefined ? item.quantity : 0}
                            </span>
                            {item.unit && <span className="text-gray-500 ml-1">{item.unit}</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.purchasePrice ? formatCurrency(item.purchasePrice) : (item.price ? formatCurrency(item.price) : 'Not set')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {(item.purchasePrice || item.price) ? formatCurrency((item.purchasePrice || item.price) * (item.quantity || 0)) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {(item.quantity || 0) < (item.minQuantity || 10) ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Low Stock</span>
                            ) : item.status === 'Inactive' ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Inactive</span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">In Stock</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-12 text-center">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory items</h3>
                  <p className="mt-1 text-sm text-gray-500">No inventory items assigned to this branch yet.</p>
                </div>
              )}
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    Bookings ({branchBookings?.length || 0})
                  </h3>
                  <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">View All</button>
                </div>
              </div>
              
              {branchBookings && branchBookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {branchBookings.map((booking: any, index: number) => (
                        <tr key={booking._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-sm font-medium text-white">
                                {(booking.client?.name || booking.clientName || 'U')?.charAt(0)}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {booking.client?.name || booking.clientName || 'Unknown Client'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {booking.client?.phone || booking.clientPhone || 'No phone'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {booking.serviceName || booking.service || 'Service'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.serviceCategory || 'General'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {booking.date ? formatDate(booking.date) : 'Not set'}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {booking.time || 'Not set'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.duration || 'Not specified'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {booking.amount ? formatCurrency(booking.amount) : 'Not set'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(booking.status || 'pending')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings</h3>
                  <p className="mt-1 text-sm text-gray-500">No bookings found for this branch yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Client View */}
        {entityDetails && entityType === 'client' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Bookings</dt>
                      <dd className="text-2xl font-semibold text-gray-900">{clientBookingsCount}</dd>
                    </dl>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Spent</dt>
                      <dd className="text-2xl font-semibold text-gray-900">{formatCurrency(clientTotalSpent)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Avg. Booking Value</dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {clientBookingsCount > 0 ? formatCurrency(clientTotalSpent / clientBookingsCount) : formatCurrency(0)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-6">
                {mergedClientHistory.length ? (
                  <div className="space-y-4">
                    {mergedClientHistory.map((item: any) => (
                      <div key={item.type + '-' + item.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            item.type === 'booking' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {item.type === 'booking' ? <Calendar className="h-5 w-5" /> : <DollarSign className="h-5 w-5" />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">{item.title}</p>
                            <p className="text-sm text-gray-500">{formatDate(item.date)}</p>
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            <p className="text-sm text-gray-500">{item.type.toUpperCase()}</p>
                            <div className="flex items-center space-x-2">
                              {item.amount > 0 && (
                                <span className="text-sm font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                              )}
                              {getStatusBadge(item.status)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No activity</h3>
                    <p className="mt-1 text-sm text-gray-500">No activity records found for this client.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Staff View */}
        {entityDetails && entityType === 'staff' && (
          <div className="space-y-8">
            {/* Staff Bookings */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Assigned Bookings ({staffBookings?.length || 0})
                </h3>
              </div>
              
              {staffBookings && staffBookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {staffBookings.map((booking: any, index: number) => (
                        <tr key={booking._id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-sm font-medium text-white">
                                {(booking.client?.name || booking.clientName || 'U')?.charAt(0)}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{booking.client?.name || booking.clientName || 'Unknown'}</div>
                                <div className="text-sm text-gray-500">{booking.client?.phone || booking.clientPhone || ''}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.serviceName || booking.service || 'Service'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.date ? formatDate(booking.date) : formatDate(booking.createdAt)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.duration || '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.amount ? formatCurrency(booking.amount) : '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(booking.status || 'pending')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings assigned</h3>
                  <p className="mt-1 text-sm text-gray-500">No bookings have been assigned to this staff member yet.</p>
                </div>
              )}
            </div>

            {/* Attendance Records */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  Attendance Records ({staffAttendance?.length || 0})
                </h3>
              </div>
              
              {staffAttendance && staffAttendance.length > 0 ? (
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {staffAttendance.map((attendance: any) => (
                      <div key={attendance._id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatDate(attendance.date)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {attendance.checkIn} - {attendance.checkOut || 'Not checked out'}
                            </p>
                          </div>
                          {getStatusBadge(attendance.status || attendance.type || 'present')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="px-6 py-12 text-center">
                  <Clock className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
                  <p className="mt-1 text-sm text-gray-500">No attendance records found for this staff member.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityReport;
