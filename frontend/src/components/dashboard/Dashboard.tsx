import { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  IndianRupee,
  Camera,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Package,
  Loader2,
  CheckSquare,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { inventoryAPI, bookingAPI, staffAPI } from "../../services/api";
import StatCard from "../ui/StatCard";

interface BookingStat {
  _id: string;
  bookingNumber?: string;
  createdAt: string;
  status: string;
  pricing?: {
    totalAmount: number;
  };
  assignedStaff?: any[];
  inventorySelection?: any[];
  items?: any[];
  client?: any;
  functionDetails?: any;
}

interface StaffStat {
  _id: string;
  name: string;
  status?: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [inventoryStats, setInventoryStats] = useState<any>(null);
  const [bookingStats, setBookingStats] = useState<BookingStat[]>([]);
  const [staffStats, setStaffStats] = useState<StaffStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const [inventoryRes, bookingRes, staffRes] = await Promise.all([
        inventoryAPI.getInventoryStats(),
        bookingAPI.getBookings({ limit: 100 }),
        staffAPI.getStaff(),
      ]);
      setInventoryStats(inventoryRes.data);
      setBookingStats(bookingRes.data);
      setStaffStats(staffRes.data);
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatsByRole = () => {
    if (user?.role === "staff") {
      return [
        {
          title: "My Tasks",
          value: "0",
          change: "Tasks assigned to you",
          changeType: "neutral" as const,
          icon: CheckCircle,
          color: "primary" as const,
        },
        {
          title: "Attendance",
          value: "Present",
          change: "Today's status",
          changeType: "increase" as const,
          icon: Clock,
          color: "success" as const,
        },
        {
          title: "Working Hours",
          value: "8h",
          change: "Today's hours",
          changeType: "neutral" as const,
          icon: TrendingUp,
          color: "secondary" as const,
        },
        {
          title: "Performance",
          value: "Good",
          change: "This month",
          changeType: "increase" as const,
          icon: Users,
          color: "purple" as const,
        },
      ];
    }

    return [
      {
        title: "Total Bookings",
        value: bookingStats ? bookingStats.length.toString() : "0",
        icon: Calendar,
        color: "secondary" as const,
      },
      {
        title: "Active Projects",
        value: bookingStats
          ? bookingStats
              .filter(
                (b: BookingStat) =>
                  b.status === "in_progress" || b.status === "confirmed"
              )
              .length.toString()
          : "0",
        icon: Camera,
        color: "success" as const,
      },
      {
        title: "Monthly Revenue",
        value: bookingStats
          ? `₹${bookingStats
              .reduce(
                (sum: number, b: BookingStat) =>
                  sum + (b.pricing?.totalAmount || 0),
                0
              )
              .toLocaleString()}`
          : "₹0",
        changeType: "increase" as const,
        icon: IndianRupee,
        color: "warning" as const,
      },
      {
        title: "Team Members",
        value: staffStats ? staffStats.length.toString() : "0",
        changeType: "increase" as const,
        icon: Users,
        color: "teal" as const,
      },
    ];
  };

  const stats = getStatsByRole();

  const inventoryStatsCards = inventoryStats
    ? [
        {
          title: "Total Inventory Items",
          value: inventoryStats.overview.totalItems.toString(),
          icon: Package,
          color: "indigo" as const,
        },
        {
          title: "Total Quantity",
          value: inventoryStats.overview.totalQuantity.toString(),
          icon: Package,
          color: "purple" as const,
        },
        {
          title: "Inventory Value",
          value: `₹${
            inventoryStats.overview.totalValue
              ? inventoryStats.overview.totalValue.toLocaleString()
              : "0"
          }`,
          icon: IndianRupee,
          color: "secondary" as const,
        },
        {
          title: "Low Stock Alert",
          value: inventoryStats.overview.lowStockItems.toString(),
          icon: AlertTriangle,
          color: "error" as const,
        },
      ]
    : [];

  const today = new Date();
  const todayTasks = bookingStats
    ? bookingStats
        .filter((b: any) => {
          const d = new Date(b.functionDetails?.date);
          return d.toDateString() === today.toDateString();
        })
        .map((b: any) => ({
          id: b._id,
          title:
            b.functionDetails?.type + (b.client ? ` - ${b.client.name}` : ""),
          time: b.functionDetails?.time?.start || "",
          status: b.status,
          location: b.functionDetails?.venue?.name || "",
        }))
    : [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return CheckCircle;
      case "in_progress":
        return Clock;
      case "confirmed":
        return TrendingUp;
      case "scheduled":
        return Calendar;
      default:
        return AlertTriangle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-emerald-600 bg-emerald-50";
      case "in_progress":
        return "text-blue-600 bg-blue-50";
      case "confirmed":
        return "text-indigo-600 bg-indigo-50";
      case "scheduled":
        return "text-amber-600 bg-amber-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "badge-success";
      case "in_progress":
        return "badge-primary";
      case "confirmed":
        return "badge-secondary";
      case "scheduled":
        return "badge-warning";
      default:
        return "badge-neutral";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="card-gradient-primary text-white p-8 rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display text-white">
              {user?.role === "staff"
                ? `Welcome back, ${user?.name?.split(" ")[0]}!`
                : `Welcome back, ${user?.name?.split(" ")[0]}!`}
            </h1>
            <p className="text-primary-100 mt-2 text-lg">
              {user?.role === "staff"
                ? "Here's your personal dashboard with tasks and attendance information."
                : "Here's what's happening with your photography business today."}
            </p>
          </div>
        </div>
      </div>

      {/* Business Stats Grid */}
      <div className="dashboard-grid">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Inventory Overview - Only show for management roles */}
      {inventoryStats &&
        ["chairman", "company_admin", "branch_head"].includes(
          user?.role || ""
        ) && (
          <>
            <div className="border-t border-neutral-200 pt-6">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
                Inventory Overview
              </h2>
            </div>
            <div className="dashboard-grid">
              {inventoryStatsCards.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </div>
          </>
        )}

      {}
      {user?.role === "staff" && (
        <>
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">My Tasks</h2>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center py-8">
              <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tasks assigned
              </h3>
              <p className="text-gray-600">
                You don't have any tasks assigned to you at the moment.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule/Tasks Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {user?.role === "staff" ? "My Tasks" : "Today's Schedule"}
              </h2>
              <button className="text-primary hover:text-opacity-90 font-medium text-sm">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {user?.role === "staff" ? (
                <div className="text-center py-8">
                  <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No tasks assigned
                  </h3>
                  <p className="text-gray-600">
                    You don't have any tasks assigned to you at the moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayTasks.length === 0 && (
                    <div className="text-neutral-500 text-center py-8">
                      <Calendar className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                      <p>No bookings scheduled for today.</p>
                    </div>
                  )}
                  {todayTasks.map((task: any) => {
                    const StatusIcon = getStatusIcon(task.status);
                    return (
                      <div
                        key={task.id}
                        className="flex items-center p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                      >
                        <div
                          className={`p-2 rounded-lg mr-4 ${getStatusColor(
                            task.status
                          )}`}
                        >
                          <StatusIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-neutral-900">
                            {task.title}
                          </h3>
                          <p className="text-sm text-neutral-600">
                            {task.location}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-neutral-900">
                            {task.time}
                          </p>
                          <span
                            className={`badge ${getStatusBadgeColor(
                              task.status
                            )}`}
                          >
                            {task.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Bookings Assignment Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            Recent Bookings - Assignments
          </h2>
          <p className="text-sm text-gray-500">
            Shows whether staff and inventory have been assigned
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Services (staff / inventory)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookingStats && bookingStats.length > 0 ? (
                [...bookingStats]
                  .map((b) => {
                    const rawServices = (b as any).servicesSchedule?.length
                      ? (b as any).servicesSchedule
                      : (b as any).services?.length
                      ? (b as any).services
                      : (b as any).items?.length
                      ? (b as any).items
                      : [];

                    const services = (
                      rawServices.length
                        ? rawServices
                        : [
                            {
                              serviceName:
                                (b as any).functionDetails?.type ||
                                (b as any).serviceName ||
                                "Service",
                            },
                          ]
                    ).map((s: any) => {
                      const name =
                        s.serviceName ||
                        s.name ||
                        s.service ||
                        s.title ||
                        "Service";

                      // helper to normalize possible arrays of objects or ids to id array
                      const normalizeIds = (arr: any) => {
                        if (!Array.isArray(arr)) return [];
                        return arr
                          .map((it: any) => {
                            if (!it && it !== 0) return it;
                            if (typeof it === "string") return it;
                            if (typeof it === "number") return String(it);
                            // common shapes: {_id: '...'}, {staff: {_id:'...'}}, {equipment: {_id:'...'}}
                            if (it._id) return it._id;
                            if (
                              it.staff &&
                              (it.staff._id || typeof it.staff === "string")
                            )
                              return it.staff._id || it.staff;
                            if (
                              it.equipment &&
                              (it.equipment._id ||
                                typeof it.equipment === "string")
                            )
                              return it.equipment._id || it.equipment;
                            return it;
                          })
                          .filter(Boolean);
                      };

                      // derive assigned staff ids from multiple possible places
                      const assignedFromS = normalizeIds(
                        s.assignedStaff || s.assignedStaff || []
                      );
                      const assignedFromSAssign = normalizeIds(
                        s.staffAssignment || []
                      );
                      const assignedFromB = normalizeIds(
                        (b as any).assignedStaff || []
                      );
                      const assignedFromBAssign = normalizeIds(
                        (b as any).staffAssignment || []
                      );
                      const assignedStaff = Array.from(
                        new Set([
                          ...(assignedFromS || []),
                          ...(assignedFromSAssign || []),
                          ...(assignedFromB || []),
                          ...(assignedFromBAssign || []),
                        ])
                      );

                      // derive inventory ids from multiple shapes
                      const invFromS = normalizeIds(
                        s.inventorySelection || s.items || []
                      );
                      const invFromSEquip = normalizeIds(
                        s.equipmentAssignment || []
                      );
                      const invFromB = normalizeIds(
                        (b as any).inventorySelection || (b as any).items || []
                      );
                      const invFromBEquip = normalizeIds(
                        (b as any).equipmentAssignment || []
                      );
                      const inventory = Array.from(
                        new Set([
                          ...(invFromS || []),
                          ...(invFromSEquip || []),
                          ...(invFromB || []),
                          ...(invFromBEquip || []),
                        ])
                      );

                      return { name, assignedStaff, inventory };
                    });

                    return { booking: b, services };
                  })
                  // keep only bookings where at least one service misses staff or inventory
                  .filter(({ services }) =>
                    services.some(
                      (svc: any) =>
                        !(
                          Array.isArray(svc.assignedStaff) &&
                          svc.assignedStaff.length > 0
                        ) ||
                        !(
                          Array.isArray(svc.inventory) &&
                          svc.inventory.length > 0
                        )
                    )
                  )
                  // prioritize bookings where any service is missing both
                  .sort((a, b) => {
                    const aBoth = a.services.some(
                      (s: any) =>
                        !(
                          Array.isArray(s.assignedStaff) &&
                          s.assignedStaff.length > 0
                        ) &&
                        !(Array.isArray(s.inventory) && s.inventory.length > 0)
                    );
                    const bBoth = b.services.some(
                      (s: any) =>
                        !(
                          Array.isArray(s.assignedStaff) &&
                          s.assignedStaff.length > 0
                        ) &&
                        !(Array.isArray(s.inventory) && s.inventory.length > 0)
                    );
                    if (aBoth === bBoth) return 0;
                    return aBoth ? -1 : 1;
                  })
                  .slice(0, 10)
                  .map(({ booking: b, services }) => {
                    const bookingPriority = services.some(
                      (s: any) =>
                        !(
                          Array.isArray(s.assignedStaff) &&
                          s.assignedStaff.length > 0
                        ) &&
                        !(Array.isArray(s.inventory) && s.inventory.length > 0)
                    );

                    return (
                      <tr
                        key={b._id}
                        className={`hover:bg-gray-50 ${
                          bookingPriority ? "bg-amber-50" : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {b.bookingNumber || b._id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {b.client?.name || "Unknown"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="space-y-2">
                            {services.map((svc: any, idx: number) => {
                              const hasStaff =
                                Array.isArray(svc.assignedStaff) &&
                                svc.assignedStaff.length > 0;
                              const hasInv =
                                Array.isArray(svc.inventory) &&
                                svc.inventory.length > 0;
                              const svcPriority = !hasStaff && !hasInv;
                              return (
                                <div
                                  key={idx}
                                  className={`flex items-center text-sm ${
                                    svcPriority ? "text-red-600" : "text-red"
                                  }`}
                                >
                                  <div className="w-56 truncate">
                                    {svc.name}
                                  </div>
                                  <div className="ml-2 flex items-center space-x-6">
                                    <div
                                      className="flex items-center"
                                      title={
                                        hasStaff ? "Staff assigned" : "No staff"
                                      }
                                    >
                                      {hasStaff ? (
                                        <CheckCircle className="w-4 h-4 text-red" />
                                      ) : (
                                        <XCircle className="w-4 h-4 text-red" />
                                      )}
                                    </div>
                                    <div
                                      className="flex items-center"
                                      title={
                                        hasInv
                                          ? "Inventory assigned"
                                          : "No inventory"
                                      }
                                    >
                                      {hasInv ? (
                                        <CheckCircle className="w-4 h-4 text-red" />
                                      ) : (
                                        <XCircle className="w-4 h-4 text-red" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No bookings available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
