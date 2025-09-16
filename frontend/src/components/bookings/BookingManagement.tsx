import React, { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Search,
  Clock,
  Camera,
  CheckCircle,
  Edit,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import { useNotification } from "../../contexts/NotificationContext";
import { useAuth } from "../../contexts/AuthContext";

import {
  bookingAPI,
  clientAPI,
  staffAPI,
  inventoryAPI,
  branchAPI,
} from "../../services/api";

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
    startDate: string;
    endDate: string;
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
  serviceNeeded: string;
  inventorySelection: Array<{
    _id: string;
    name: string;
    type: string;
  }>;
  assignedStaff: Array<{
    _id: string;
    name: string;
    designation: string;
  }>;
  bookingBranch: {
    _id: string;
    name: string;
    code: string;
  };
  services: string[];
  pricing: {
  subtotal?: number;
  gstAmount?: number;
  totalAmount: number;
  advanceAmount: number;
  remainingAmount?: number;
  };
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  createdAt: string;
}

interface Client {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

interface Staff {
  _id: string;
  name: string;
  designation: string;
  employeeId: string;
}

interface InventoryItem {
  _id: string;
  name: string;
  category: string;
  quantity: number;
}

interface Branch {
  _id: string;
  name: string;
  code: string;
}

const BookingManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  // Inventory can be an array or a paginated object with docs
  type PaginatedInventory = { docs: InventoryItem[]; [key: string]: any };
  const [inventory, setInventory] = useState<InventoryItem[] | PaginatedInventory>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [formData, setFormData] = useState({
    clientId: "",
    functionType: "",
    functionStartDate: "",
    functionEndDate: "",
    functionDate: "",
    functionStartTime: "",
    functionEndTime: "",
    venueName: "",
    venueAddress: "",
    serviceNeeded: "",
    inventorySelection: [] as string[],
    assignedStaff: [] as string[],
    bookingBranch: "",
    services: [] as string[],
    totalAmount: 0,
    advanceAmount: 0,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const { addNotification } = useNotification();

  const { user } = useAuth();
  const fetchData = async () => {
    try {
      setLoading(true);
      let bookingsRes;
      if (user?.role === 'staff') {
        console.log('🔍 Fetching bookings for staff user:', user);
        console.log('📱 Staff user ID:', user.id);
        bookingsRes = await bookingAPI.getBookingsForStaff(user.id);
        console.log('📊 Staff bookings response:', bookingsRes);
      } else {
        bookingsRes = await bookingAPI.getBookings();
      }
      const [clientsRes, staffRes, branchesRes] = await Promise.all([
        clientAPI.getClients(),
        staffAPI.getStaff(),
        branchAPI.getBranches(),
      ]);
      
      // Try to fetch inventory separately (might fail for staff users)
      let inventoryRes: any = { data: { data: [] } };
      try {
        inventoryRes = await inventoryAPI.getInventory();
        console.log('✅ Inventory fetched successfully');
      } catch (error) {
        console.log('⚠️ Could not fetch inventory (might be permission issue):', error);
        // Set empty inventory for staff users or when permission denied
        inventoryRes = { data: { data: [] } };
      }
      setBookings(
        Array.isArray(bookingsRes.data)
          ? bookingsRes.data
          : bookingsRes.data.data || []
      );
      setClients(
        Array.isArray(clientsRes.data)
          ? clientsRes.data
          : clientsRes.data.data || []
      );
      setStaff(
        Array.isArray(staffRes.data) ? staffRes.data : staffRes.data.data || []
      );
      setInventory(
        Array.isArray(inventoryRes.data.data?.docs)
          ? inventoryRes.data.data.docs
          : Array.isArray(inventoryRes.data.data)
          ? inventoryRes.data.data
          : inventoryRes.data || []
      );
      setBranches(
        Array.isArray(branchesRes.data)
          ? branchesRes.data
          : branchesRes.data.data || []
      );
    } catch (error: unknown) {
      addNotification({
        type: "error",
        title: "Error",
        message:
          error instanceof Error ? error.message : "Failed to fetch data",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      clientId: "",
      functionType: "",
      functionStartDate: "",
      functionEndDate: "",
      functionDate: "",
      functionStartTime: "",
      functionEndTime: "",
      venueName: "",
      venueAddress: "",
      serviceNeeded: "",
      inventorySelection: [],
      assignedStaff: [],
      bookingBranch: "",
      services: [],
      totalAmount: 0,
      advanceAmount: 0,
      notes: "",
    });
  };

  // Helper to compute remaining amount from various possible pricing shapes
  const getRemainingAmount = (b: Booking | null | undefined) => {
    if (!b || !b.pricing) return 0;
    const p: any = b.pricing as any;
    // Prefer explicit remainingAmount when provided
    if (p.remainingAmount != null) return p.remainingAmount;
    // If we have numeric totalAmount, compute remaining from advance (arithmetic never yields null/undefined)
    if (typeof p.totalAmount === 'number') return p.totalAmount - (p.advanceAmount || 0);
    // Fallback to legacy balanceAmount if present
    if (p.balanceAmount != null) return p.balanceAmount;
    return 0;
  };

  const handleAddBooking = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setFormData({
      clientId: booking.client._id,
      functionType: booking.functionDetails.type,
      functionStartDate: booking.functionDetails.startDate ? booking.functionDetails.startDate.split("T")[0] : "",
      functionEndDate: booking.functionDetails.endDate ? booking.functionDetails.endDate.split("T")[0] : "",
      functionDate: booking.functionDetails.date.split("T")[0],
      functionStartTime: booking.functionDetails.time.start,
      functionEndTime: booking.functionDetails.time.end,
      venueName: booking.functionDetails.venue.name,
      venueAddress: booking.functionDetails.venue.address,
      serviceNeeded: booking.serviceNeeded || "",
      inventorySelection:
        booking.inventorySelection?.map((item) => item._id) || [],
      assignedStaff: booking.assignedStaff?.map((staff) => staff._id) || [],
      bookingBranch: booking.bookingBranch?._id || "",
      services: booking.services || [],
      totalAmount: booking.pricing.totalAmount,
      advanceAmount: booking.pricing.advanceAmount,
      notes: "",
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Generate booking number
      const bookingNumber = `BK-${Date.now()}`;
      
      // Calculate pricing fields
      const subtotal = formData.totalAmount;
      const remainingAmount = formData.totalAmount - formData.advanceAmount;
      
      const bookingData = {
        bookingNumber,
        client: formData.clientId,
        branch: formData.bookingBranch,
        functionDetails: {
          type: formData.functionType,
          startDate: formData.functionStartDate,
          endDate: formData.functionEndDate,
          date: formData.functionStartDate || formData.functionDate || new Date().toISOString(),
          time: {
            start: formData.functionStartTime,
            end: formData.functionEndTime,
          },
          venue: {
            name: formData.venueName,
            address: formData.venueAddress,
          },
        },
        serviceNeeded: formData.serviceNeeded,
        inventorySelection: formData.inventorySelection,
        assignedStaff: formData.assignedStaff,
        bookingBranch: formData.bookingBranch,
        services: formData.services,
        pricing: {
          subtotal,
          totalAmount: formData.totalAmount,
          advanceAmount: formData.advanceAmount,
          remainingAmount,
        },
      };

      if (selectedBooking) {
        await bookingAPI.updateBooking(selectedBooking._id, bookingData);
        addNotification({
          type: "success",
          title: "Success",
          message: "Booking updated successfully",
        });
      } else {
        await bookingAPI.createBooking(bookingData);
        addNotification({
          type: "success",
          title: "Success",
          message: "Booking created successfully",
        });
      }

      fetchData();
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedBooking(null);
      resetForm();
    } catch (error: unknown) {
      addNotification({
        type: "error",
        title: "Error",
        message:
          error instanceof Error ? error.message : "Failed to save booking",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBooking = async (id: string, bookingNumber: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete booking ${bookingNumber}?`
      )
    ) {
      try {
        await bookingAPI.deleteBooking(id);
        addNotification({
          type: "success",
          title: "Success",
          message: "Booking deleted successfully",
        });
        fetchData();
      } catch (error: unknown) {
        addNotification({
          type: "error",
          title: "Error",
          message:
            error instanceof Error ? error.message : "Failed to delete booking",
        });
      }
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      // Use the new status update endpoint for staff users
      await bookingAPI.updateBookingStatus(bookingId, newStatus);
      addNotification({
        type: "success",
        title: "Success",
        message: `Booking status updated to ${newStatus}`,
      });
      fetchData(); // Refresh the data
    } catch (error: unknown) {
      addNotification({
        type: "error",
        title: "Error",
        message:
          error instanceof Error ? error.message : "Failed to update booking status",
      });
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.functionDetails.type
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || booking.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

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
          <h1 className="text-2xl font-bold text-gray-900">
            Booking Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage client bookings and events
          </p>
        </div>
        {user?.role !== 'staff' && (
          <button
            onClick={handleAddBooking}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Booking
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Bookings
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-yellow-500 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.pending}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-green-500 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.confirmed}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 p-3 rounded-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.completed}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service & Staff
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking._id || booking.bookingNumber}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {booking.bookingNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        ₹{booking.pricing.totalAmount.toLocaleString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {booking.client.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.client.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {booking.functionDetails.type}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(
                          booking.functionDetails.date
                        ).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.functionDetails.venue.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {booking.serviceNeeded}
                      </div>
                      <div className="text-sm text-gray-500">
                        Staff: {booking.assignedStaff?.length || 0}
                      </div>
                      <div className="text-sm text-gray-500">
                        Equipment: {booking.inventorySelection?.length || 0}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        booking.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : booking.status === "confirmed"
                          ? "bg-blue-100 text-blue-800"
                          : booking.status === "in_progress"
                          ? "bg-yellow-100 text-yellow-800"
                          : booking.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {user?.role === 'staff' ? (
                        // Staff users can only update status
                        <select
                          value={booking.status}
                          onChange={(e) => handleStatusUpdate(booking._id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      ) : (
                        // Admin/Manager users can edit and delete
                        <>
                          <button
                            onClick={() => handleEditBooking(booking)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Booking"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteBooking(
                                booking._id,
                                booking.bookingNumber
                              )
                            }
                            className="text-red-600 hover:text-red-900"
                            title="Delete Booking"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No bookings found
          </h3>
          <p className="text-gray-600">
            Get started by creating your first booking.
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedBooking ? "Edit Booking" : "Add New Booking"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setSelectedBooking(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Client Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Client Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client *
                    </label>
                    <select
                      required
                      value={formData.clientId}
                      onChange={(e) =>
                        setFormData({ ...formData, clientId: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a client</option>
                      {clients.map((client) => (
                        <option key={client._id} value={client._id}>
                          {client.name} - {client.phone}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Booking Branch *
                    </label>
                    <select
                      required
                      value={formData.bookingBranch}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bookingBranch: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select branch</option>
                      {branches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name} ({branch.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Function Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Function Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Function Type *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.functionType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          functionType: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Wedding, Birthday, Corporate Event"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.functionStartDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          functionStartDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.functionEndDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          functionEndDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.functionStartTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          functionStartTime: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.functionEndTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          functionEndTime: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Venue Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.venueName}
                      onChange={(e) =>
                        setFormData({ ...formData, venueName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Venue Address
                    </label>
                    <input
                      type="text"
                      value={formData.venueAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          venueAddress: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Service Requirements
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Needed *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.serviceNeeded}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          serviceNeeded: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Photography, Videography, Photography + Videography"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned Staff
                    </label>
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                              Assign
                            </th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                              Name
                            </th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                              Designation
                            </th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                              Employee ID
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {staff.map((staffMember) => (
                            <tr key={staffMember._id}>
                              <td className="px-2 py-2">
                                <input
                                  type="checkbox"
                                  checked={formData.assignedStaff.includes(
                                    staffMember._id
                                  )}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        assignedStaff: [
                                          ...formData.assignedStaff,
                                          staffMember._id,
                                        ],
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        assignedStaff:
                                          formData.assignedStaff.filter(
                                            (id) => id !== staffMember._id
                                          ),
                                      });
                                    }
                                  }}
                                />
                              </td>
                              <td className="px-2 py-2">{staffMember.name}</td>
                              <td className="px-2 py-2">
                                {staffMember.designation}
                              </td>
                              <td className="px-2 py-2">
                                {staffMember.employeeId}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Equipment Selection
                    </label>
                    <div className="overflow-x-auto border rounded-lg">
                      {(() => {
                        let inventoryList: InventoryItem[] = [];
                        if (
                          inventory &&
                          typeof inventory === "object" &&
                          "docs" in inventory &&
                          Array.isArray((inventory as PaginatedInventory).docs)
                        ) {
                          inventoryList = (inventory as PaginatedInventory).docs;
                        } else if (Array.isArray(inventory)) {
                          inventoryList = inventory;
                        }
                        return (
                          <>
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Assign</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Brand</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Model</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Condition</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {inventoryList.map((item: any) => (
                                  <tr key={item._id}>
                                    <td className="px-2 py-2">
                                      <input
                                        type="checkbox"
                                        checked={formData.inventorySelection.includes(item._id)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setFormData({
                                              ...formData,
                                              inventorySelection: [
                                                ...formData.inventorySelection,
                                                item._id,
                                              ],
                                            });
                                          } else {
                                            setFormData({
                                              ...formData,
                                              inventorySelection: formData.inventorySelection.filter((id) => id !== item._id),
                                            });
                                          }
                                        }}
                                      />
                                    </td>
                                    <td className="px-2 py-2">{item.name}</td>
                                    <td className="px-2 py-2">{item.category}</td>
                                    <td className="px-2 py-2">{item.brand || '-'}</td>
                                    <td className="px-2 py-2">{item.model || '-'}</td>
                                    <td className="px-2 py-2">{item.condition || '-'}</td>
                                    <td className="px-2 py-2">{item.status || '-'}</td>
                                    <td className="px-2 py-2">{item.quantity}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {inventoryList.length === 0 && (
                              <div className="text-center py-4 text-red-600 text-sm">
                                Inventory is empty or not accessible. Please check your permissions or contact your administrator.
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Pricing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Amount *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.totalAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalAmount: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Advance Amount
                    </label>
                    <input
                      type="number"
                      value={formData.advanceAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          advanceAmount: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Balance Amount: ₹
                    {(
                      formData.totalAmount - formData.advanceAmount
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Summary Section */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-md font-semibold mb-2 text-gray-900">
                  Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Client</div>
                    <div className="text-sm text-gray-900 font-medium">
                      {clients.find((c) => c._id === formData.clientId)?.name ||
                        "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Assigned Staff</div>
                    <div className="text-sm text-gray-900 font-medium">
                      {formData.assignedStaff.length > 0
                        ? staff
                            .filter((s) =>
                              formData.assignedStaff.includes(s._id)
                            )
                            .map((s) => s.name)
                            .join(", ")
                        : "None"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Equipment</div>
                    <div className="text-sm text-gray-900 font-medium">
                      {formData.inventorySelection.length > 0
                        ? (Array.isArray(inventory)
                            ? inventory
                            : 'docs' in inventory && Array.isArray((inventory as any).docs)
                            ? (inventory as any).docs
                            : []
                          )
                            .filter((i: InventoryItem) =>
                              formData.inventorySelection.includes(i._id)
                            )
                            .map((i: InventoryItem) => i.name)
                            .join(", ")
                        : "None"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                {selectedBooking && getRemainingAmount(selectedBooking) > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!selectedBooking) return;
                      if (!window.confirm('Mark this booking as paid? This will set remaining amount to 0 and mark payment as completed.')) return;
                      try {
                        setSubmitting(true);
                        const currentTotal = selectedBooking.pricing?.totalAmount ?? formData.totalAmount;
                        const currentAdvance = selectedBooking.pricing?.advanceAmount ?? formData.advanceAmount ?? 0;
                        const updatedPricing = {
                          subtotal: selectedBooking.pricing?.subtotal ?? currentTotal,
                          totalAmount: currentTotal,
                          advanceAmount: Math.max(currentAdvance, currentTotal),
                          remainingAmount: 0,
                        };
                        await bookingAPI.updateBooking(selectedBooking._id, { paymentStatus: 'completed', pricing: updatedPricing });
                        addNotification({ type: 'success', title: 'Payment', message: 'Marked booking as paid' });
                        await fetchData();
                        setShowEditModal(false);
                        setSelectedBooking(null);
                        resetForm();
                      } catch (error: unknown) {
                        addNotification({ type: 'error', title: 'Error', message: error instanceof Error ? error.message : 'Failed to mark as paid' });
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Mark as Paid
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedBooking(null);
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
                  {submitting && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {selectedBooking ? "Update Booking" : "Create Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
