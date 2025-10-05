import { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  IndianRupee,
  Camera,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  Loader2,
  CheckSquare,
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
 
  const msPerDay = 24 * 60 * 60 * 1000;
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();
  const endOfWindow = startOfToday + 7 * msPerDay;

  const upcomingTasksFlat = bookingStats
    ? bookingStats
        .filter((b: any) => {
          const raw = b.functionDetails?.date || b.date || b.scheduledDate;
          const d = raw ? new Date(raw) : null;
          if (!d) return false;
          const dOnly = new Date(
            d.getFullYear(),
            d.getMonth(),
            d.getDate()
          ).getTime();
          return dOnly > startOfToday && dOnly <= endOfWindow;
        })
        .sort((a: any, b: any) => {
          const da = new Date(
            a.functionDetails?.date || a.date || a.scheduledDate
          ).getTime();
          const db = new Date(
            b.functionDetails?.date || b.date || b.scheduledDate
          ).getTime();
          return da - db;
        })
        .map((b: any) => ({
          id: b._id,
          title:
            (b.functionDetails?.type || b.serviceName || "Booking") +
            (b.client ? ` - ${b.client.name}` : ""),
          date: b.functionDetails?.date || b.date || b.scheduledDate,
          time: b.functionDetails?.time?.start || "",
          status: b.status,
          location: b.functionDetails?.venue?.name || "",
        }))
    : [];

  // Group upcoming tasks by date (only include dates that have tasks)
  const groupedUpcoming = (() => {
    if (!upcomingTasksFlat || upcomingTasksFlat.length === 0) return [];
    const map = new Map<string, { dateObj: Date; tasks: any[] }>();
    upcomingTasksFlat.forEach((t: any) => {
      const d = new Date(t.date);
      const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const key = dOnly.toDateString();
      if (!map.has(key)) map.set(key, { dateObj: dOnly, tasks: [] });
      map.get(key)!.tasks.push(t);
    });
    return Array.from(map.values()).sort(
      (a, b) => a.dateObj.getTime() - b.dateObj.getTime()
    );
  })();

  // If there are no bookings in the next 7 days, look ahead up to 14 days
  // and show the nearest non-empty day (so if days 1..13 are empty and day 14
  // has bookings, we'll show day 14).
  const groupedUpcomingDisplay = (() => {
    if (groupedUpcoming.length > 0) return groupedUpcoming;

    const endOfWindow14 = startOfToday + 14 * msPerDay;
    const future14 = bookingStats
      ? bookingStats
          .filter((b: any) => {
            const raw = b.functionDetails?.date || b.date || b.scheduledDate;
            const d = raw ? new Date(raw) : null;
            if (!d) return false;
            const dOnly = new Date(
              d.getFullYear(),
              d.getMonth(),
              d.getDate()
            ).getTime();
            return dOnly > startOfToday && dOnly <= endOfWindow14;
          })
          .sort((a: any, b: any) => {
            const da = new Date(
              a.functionDetails?.date || a.date || a.scheduledDate
            ).getTime();
            const db = new Date(
              b.functionDetails?.date || b.date || b.scheduledDate
            ).getTime();
            return da - db;
          })
          .map((b: any) => ({
            id: b._id,
            title:
              (b.functionDetails?.type || b.serviceName || "Booking") +
              (b.client ? ` - ${b.client.name}` : ""),
            date: b.functionDetails?.date || b.date || b.scheduledDate,
            time: b.functionDetails?.time?.start || "",
            status: b.status,
            location: b.functionDetails?.venue?.name || "",
          }))
      : [];

    if (!future14 || future14.length === 0) return [];

    const map = new Map<string, { dateObj: Date; tasks: any[] }>();
    future14.forEach((t: any) => {
      const d = new Date(t.date);
      const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const key = dOnly.toDateString();
      if (!map.has(key)) map.set(key, { dateObj: dOnly, tasks: [] });
      map.get(key)!.tasks.push(t);
    });
    const groups = Array.from(map.values()).sort(
      (a, b) => a.dateObj.getTime() - b.dateObj.getTime()
    );
    return groups.length > 0 ? [groups[0]] : [];
  })();
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

  // Helpers to determine assignment completeness
  const hasStaffAssigned = (b: any) => {
    if (!b) return false;
    if (Array.isArray(b.assignedStaff) && b.assignedStaff.length > 0)
      return true;
    if (Array.isArray(b.staffAssignment) && b.staffAssignment.length > 0)
      return true;
    // prefer functionDetailsList (per-service entries), then servicesSchedule, then services/items
    const svcArr =
      Array.isArray(b.functionDetailsList) && b.functionDetailsList.length
        ? b.functionDetailsList
        : b.servicesSchedule?.length
        ? b.servicesSchedule
        : b.services?.length
        ? b.services
        : b.items?.length
        ? b.items
        : [];
    if (
      Array.isArray(svcArr) &&
      svcArr.some(
        (s: any) => Array.isArray(s.assignedStaff) && s.assignedStaff.length > 0
      )
    )
      return true;
    if (
      Array.isArray(svcArr) &&
      svcArr.some(
        (s: any) =>
          Array.isArray(s.staffAssignment) && s.staffAssignment.length > 0
      )
    )
      return true;
    return false;
  };

  const hasInventoryAssigned = (b: any) => {
    if (!b) return false;
    if (
      Array.isArray(b.equipmentAssignment) &&
      b.equipmentAssignment.length > 0
    )
      return true;
    if (Array.isArray(b.inventorySelection) && b.inventorySelection.length > 0)
      return true;
    // check per-service inventory selection (functionDetailsList or servicesSchedule)
    const svcArrInv =
      Array.isArray(b.functionDetailsList) && b.functionDetailsList.length
        ? b.functionDetailsList
        : b.servicesSchedule?.length
        ? b.servicesSchedule
        : b.services?.length
        ? b.services
        : b.items?.length
        ? b.items
        : [];
    if (
      Array.isArray(svcArrInv) &&
      svcArrInv.some(
        (s: any) =>
          Array.isArray(s.inventorySelection) && s.inventorySelection.length > 0
      )
    )
      return true;
    return false;
  };

  const extractServiceNames = (b: any) => {
    const rawServices =
      Array.isArray(b.functionDetailsList) && b.functionDetailsList.length
        ? b.functionDetailsList
        : b.servicesSchedule?.length
        ? b.servicesSchedule
        : b.services?.length
        ? b.services
        : b.items?.length
        ? b.items
        : [];
    if (!rawServices || rawServices.length === 0) {
      const fallback = b.functionDetails?.type || b.serviceName;
      return [fallback];
    }
    return rawServices.map((s: any) => {
      const name =
        s.service ||
        s.serviceName ||
        s.name ||
        s.title ||
        (s.type ? `${s.type}` : "Service");
      const type = Array.isArray(s.serviceType)
        ? s.serviceType.join(", ")
        : s.serviceType || s.type || "";
      return type ? `${name} (${type})` : name;
    });
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
      </div>
      {/* Schedule Table: Date, Booking ID, Client, Services, Staff, Inventory, Status */}
      {/* Incomplete Assignments: bookings missing staff or inventory (shows only those) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            Incomplete Assignments
          </h2>
          <p className="text-sm text-gray-500">
            Bookings missing staff and/or inventory assignment
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full divide-y divide-gray-200 border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[360px]">
                  Services
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inventory
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookingStats && bookingStats.length > 0 ? (
                bookingStats
                  .filter((b: any) => {
                    const servicesArr =
                      Array.isArray(b.services) && b.services.length
                        ? b.services
                        : b.servicesSchedule?.length
                        ? b.servicesSchedule
                        : b.items?.length
                        ? b.items
                        : [];

                    const fdList = Array.isArray(b.functionDetailsList)
                      ? b.functionDetailsList
                      : [];

                    if (servicesArr.length) {
                      return servicesArr.some((svc: any, idx: number) => {
                        const fd = fdList[idx] || {};
                        const hasStaff =
                          (Array.isArray(fd.assignedStaff) &&
                            fd.assignedStaff.length > 0) ||
                          (Array.isArray(fd.staffAssignment) &&
                            fd.staffAssignment.length > 0) ||
                          (Array.isArray(svc.assignedStaff) &&
                            svc.assignedStaff.length > 0) ||
                          (Array.isArray(svc.staffAssignment) &&
                            svc.staffAssignment.length > 0);
                        const hasInv =
                          (Array.isArray(fd.inventorySelection) &&
                            fd.inventorySelection.length > 0) ||
                          (Array.isArray(fd.inventory) &&
                            fd.inventory.length > 0) ||
                          (Array.isArray(svc.inventorySelection) &&
                            svc.inventorySelection.length > 0) ||
                          (Array.isArray(svc.inventory) &&
                            svc.inventory.length > 0);
                        return !hasStaff || !hasInv;
                      });
                    }

                    const staffOk = hasStaffAssigned(b);
                    const invOk = hasInventoryAssigned(b);
                    return !staffOk || !invOk;
                  })
                  .map((b: any) => {
                    // Determine per-service source: prefer functionDetailsList, then servicesSchedule, then services, then items
                    const perServiceSource =
                      Array.isArray(b.functionDetailsList) &&
                      b.functionDetailsList.length
                        ? b.functionDetailsList
                        : b.servicesSchedule?.length
                        ? b.servicesSchedule
                        : b.services?.length
                        ? b.services
                        : b.items?.length
                        ? b.items
                        : [];

                    // If we have any per-service entries, use them to compute per-service names and flags.
                    // Only when no per-service source exists do we fallback to booking-level name list and flags.
                    const services = perServiceSource.length
                      ? perServiceSource.map((s: any) => {
                          const name =
                            s.service ||
                            s.serviceName ||
                            s.name ||
                            s.title ||
                            "Service";
                          const type = Array.isArray(s.serviceType)
                            ? s.serviceType.join(", ")
                            : s.serviceType || s.type || "";
                          return type ? `${name} (${type})` : name;
                        })
                      : extractServiceNames(b);

                    const perServiceFlags = perServiceSource.length
                      ? perServiceSource.map((svc: any) => {
                          const hasStaff =
                            (Array.isArray(svc.assignedStaff) &&
                              svc.assignedStaff.length > 0) ||
                            (Array.isArray(svc.staffAssignment) &&
                              svc.staffAssignment.length > 0);
                          const hasInv =
                            (Array.isArray(svc.inventorySelection) &&
                              svc.inventorySelection.length > 0) ||
                            (Array.isArray(svc.inventory) &&
                              svc.inventory.length > 0);
                          return { hasStaff: !!hasStaff, hasInv: !!hasInv };
                        })
                      : [];

                    // booking-level flags (used only when perServiceSource is empty)
                    const bookingStaffOk = hasStaffAssigned(b);
                    const bookingInvOk = hasInventoryAssigned(b);
                    return (
                      <tr key={b._id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {b.bookingNumber || b._id}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {b.client?.name || "Unknown"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 min-w-[360px]">
                          {services.map((s: string, i: number) => {
                            const flags = perServiceFlags[i];
                            // if no per-service flags, show booking-level icon instead
                            const staffOkDisplay = flags
                              ? flags.hasStaff
                              : bookingStaffOk;
                            const invOkDisplay = flags
                              ? flags.hasInv
                              : bookingInvOk;
                            return (
                              <div
                                key={i}
                                className="leading-snug flex items-center gap-3"
                              >
                                <div className="flex-1">{s}</div>
                                <div className="flex items-center gap-2">
                                  {staffOkDisplay ? (
                                    <span
                                      title="Staff assigned"
                                      aria-label="Staff assigned"
                                    >
                                      <CheckCircle className="text-green-600" />
                                    </span>
                                  ) : (
                                    <span
                                      title="No staff assigned"
                                      aria-label="No staff assigned"
                                    >
                                      <XCircle className="text-red-600" />
                                    </span>
                                  )}
                                  {invOkDisplay ? (
                                    <span
                                      title="Inventory assigned"
                                      aria-label="Inventory assigned"
                                    >
                                      <Package className="text-green-600" />
                                    </span>
                                  ) : (
                                    <span
                                      title="No inventory assigned"
                                      aria-label="No inventory assigned"
                                    >
                                      <XCircle className="text-red-600" />
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </td>
                      </tr>
                    );
                  })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No bookings to show
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Schedule</h2>
          <p className="text-sm text-gray-500">
            Shows upcoming bookings and assignments
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1400px] w-full divide-y divide-gray-200 border-collapse [&_th]:border [&_td]:border [&_th]:border-gray-200 [&_td]:border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[36px]">
                  Services
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[30px]">
                  Inventory
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 min-w-[1800px]">
              {bookingStats && bookingStats.length > 0 ? (
                // expand bookings into date-grouped rows and sort by date
                [...bookingStats]
                  .map((b: any) => {
                    const rawDate =
                      b.functionDetails?.date || b.date || b.scheduledDate;
                    const d = rawDate ? new Date(rawDate) : null;
                    const dateKey = d
                      ? new Date(d.getFullYear(), d.getMonth(), d.getDate())
                      : null;

                    const rawServices =
                      Array.isArray(b.functionDetailsList) &&
                      b.functionDetailsList.length
                        ? b.functionDetailsList
                        : b.servicesSchedule?.length
                        ? b.servicesSchedule
                        : b.services?.length
                        ? b.services
                        : b.items?.length
                        ? b.items
                        : [];

                    // Ensure we have an array of service objects to work with
                    const rawServicesArr = rawServices.length
                      ? rawServices
                      : [
                          {
                            serviceName:
                              b.functionDetails?.type || b.serviceName,
                            type: b.functionDetails?.type,
                          },
                        ];

                    const services = rawServicesArr.map((s: any) => {
                      const svcName =
                        s.service ||
                        s.serviceName ||
                        s.name ||
                        s.title ||
                        "Service";
                      const svcType = Array.isArray(s.serviceType)
                        ? s.serviceType.join(", ")
                        : s.serviceType || s.type || "";
                      return svcType ? `${svcName} (${svcType})` : svcName;
                    });

                    // Build per-service staff displays (staff assigned specifically to each service)
                    const serviceStaffDisplays: string[][] = rawServicesArr.map(
                      (svc: any) => {
                        const svcMap = new Map<
                          string,
                          { id: string; name?: string; positions: Set<string> }
                        >();

                        const pushSvcStaff = (
                          id: string | undefined,
                          name?: string,
                          pos?: string
                        ) => {
                          if (!id) return;
                          const sid = String(id);
                          if (!svcMap.has(sid)) {
                            svcMap.set(sid, {
                              id: sid,
                              name,
                              positions: new Set(),
                            });
                          }
                          const entry = svcMap.get(sid)!;
                          if (name) entry.name = entry.name || name;
                          if (pos) entry.positions.add(pos);
                        };

                        const extractSvc = (it: any, possiblePos?: string) => {
                          if (!it && it !== 0) return;
                          if (
                            typeof it === "string" ||
                            typeof it === "number"
                          ) {
                            pushSvcStaff(String(it), undefined, possiblePos);
                            return;
                          }
                          if (it._id) {
                            const name = it.name || it.user?.name || undefined;
                            const pos =
                              possiblePos ||
                              it.position ||
                              it.role ||
                              it.job ||
                              it.roleName;
                            pushSvcStaff(it._id, name, pos);
                            return;
                          }
                          if (it.staff) {
                            const st = it.staff;
                            if (
                              typeof st === "string" ||
                              typeof st === "number"
                            ) {
                              const pos =
                                possiblePos ||
                                it.designation ||
                                it.position ||
                                it.role;
                              pushSvcStaff(String(st), undefined, pos);
                            } else if (st._id) {
                              const name =
                                st.name || st.user?.name || undefined;
                              const pos =
                                possiblePos ||
                                it.designation ||
                                it.position ||
                                it.role ||
                                st.designation ||
                                st.position;
                              pushSvcStaff(st._id, name, pos);
                            }
                            return;
                          }
                          if (it.id) {
                            const name = it.name || undefined;
                            const pos =
                              possiblePos ||
                              it.designation ||
                              it.position ||
                              it.role;
                            pushSvcStaff(it.id, name, pos);
                            return;
                          }
                        };

                        // assigned staff on the service object
                        if (Array.isArray(svc.assignedStaff)) {
                          svc.assignedStaff.forEach((x: any) => {
                            const pos =
                              x.role ||
                              x.position ||
                              x.designation ||
                              svc.role ||
                              svc.position;
                            extractSvc(x, pos);
                          });
                        }

                        if (svc.staffAssignment) {
                          if (Array.isArray(svc.staffAssignment)) {
                            svc.staffAssignment.forEach((x: any) => {
                              const pos = x.role || x.position || svc.role;
                              extractSvc(x, pos);
                            });
                          } else {
                            const pos =
                              svc.staffAssignment.designation ||
                              svc.staffAssignment.role ||
                              svc.staffAssignment.position ||
                              svc.role;
                            extractSvc(svc.staffAssignment, pos);
                          }
                        }

                        // finally lookup names from global staffStats when missing
                        svcMap.forEach((entry) => {
                          if (!entry.name) {
                            const srec = staffStats.find(
                              (st: any) => st._id === entry.id
                            );
                            if (srec) entry.name = srec.name;
                          }
                        });

                        const svcEntries = Array.from(svcMap.values()).map(
                          (e) => ({
                            id: e.id,
                            name: e.name || e.id,
                            positions: Array.from(e.positions).filter(Boolean),
                          })
                        );

                        return svcEntries.map((e) => e.name);
                      }
                    );
                    const staffMap = new Map<
                      string,
                      { id: string; name?: string; positions: Set<string> }
                    >();

                    const pushStaff = (
                      id: string | undefined,
                      name?: string,
                      pos?: string
                    ) => {
                      if (!id) return;
                      const sid = String(id);
                      if (!staffMap.has(sid)) {
                        staffMap.set(sid, {
                          id: sid,
                          name,
                          positions: new Set(),
                        });
                      }
                      const entry = staffMap.get(sid)!;
                      if (name) entry.name = entry.name || name;
                      if (pos) entry.positions.add(pos);
                    };

                    const extractFromPossibleItem = (
                      it: any,
                      possiblePos?: string
                    ) => {
                      if (!it && it !== 0) return;
                      // string or number -> id only
                      if (typeof it === "string" || typeof it === "number") {
                        pushStaff(String(it), undefined, possiblePos);
                        return;
                      }
                      // direct staff object
                      if (it._id) {
                        const name = it.name || it.user?.name || undefined;
                        const pos =
                          possiblePos ||
                          it.designation ||
                          it.position ||
                          it.role ||
                          it.job ||
                          it.roleName;
                        pushStaff(it._id, name, pos);
                        return;
                      }
                      // nested staff property
                      if (it.staff) {
                        const st = it.staff;
                        if (typeof st === "string" || typeof st === "number") {
                          const pos =
                            possiblePos ||
                            it.designation ||
                            it.position ||
                            it.role;
                          pushStaff(String(st), undefined, pos);
                        } else if (st._id) {
                          const name = st.name || st.user?.name || undefined;
                          const pos =
                            possiblePos ||
                            it.designation ||
                            it.position ||
                            it.role ||
                            st.designation ||
                            st.position;
                          pushStaff(st._id, name, pos);
                        }
                        return;
                      }
                      // fallback: object representing staff id in another prop
                      if (it.id) {
                        const name = it.name || undefined;
                        const pos =
                          possiblePos ||
                          it.designation ||
                          it.position ||
                          it.role;
                        pushStaff(it.id, name, pos);
                        return;
                      }
                    };

                    // booking-level assignedStaff
                    if (Array.isArray(b.assignedStaff)) {
                      b.assignedStaff.forEach((as: any) => {
                        extractFromPossibleItem(as);
                      });
                    }

                    // staffAssignment (may be structured objects)
                    if (Array.isArray(b.staffAssignment)) {
                      b.staffAssignment.forEach((sa: any) => {
                        // common shapes: string id, { staff: id|obj, role/position/designation }
                        const pos =
                          sa.designation ||
                          sa.position ||
                          sa.role ||
                          sa.job ||
                          sa.roleName;
                        if (typeof sa === "string" || typeof sa === "number") {
                          pushStaff(String(sa), undefined, pos);
                        } else {
                          extractFromPossibleItem(sa, pos);
                        }
                      });
                    }

                    // per-service assigned staff in servicesSchedule or rawServices
                    if (Array.isArray(rawServices)) {
                      rawServices.forEach((svc: any) => {
                        // svc.assignedStaff could be array of ids or objects
                        if (Array.isArray(svc.assignedStaff)) {
                          svc.assignedStaff.forEach((x: any) => {
                            // some forms store assignment as { staff: id, role: 'Photographer' }
                            const pos =
                              x.role ||
                              x.position ||
                              x.designation ||
                              svc.role ||
                              svc.position;
                            extractFromPossibleItem(x, pos);
                          });
                        }
                      });
                    }

                    // finally, ensure we have a name for each staff by looking up staffStats
                    staffMap.forEach((entry) => {
                      if (!entry.name) {
                        const srec = staffStats.find(
                          (st: any) => st._id === entry.id
                        );
                        if (srec) entry.name = srec.name;
                      }
                    });

                    const staffEntries = Array.from(staffMap.values()).map(
                      (e) => ({
                        id: e.id,
                        name: e.name || e.id,
                        positions: Array.from(e.positions).filter(Boolean),
                      })
                    );

                    const staffDisplay = staffEntries.map((e) => e.name);

                    // equipment names (try structured equipmentAssignment first, fall back to inventorySelection items)
                    const equipmentNamesSet = new Set<string>();
                    if (Array.isArray(b.equipmentAssignment)) {
                      b.equipmentAssignment.forEach((ea: any) => {
                        if (!ea) return;
                        const eq = ea.equipment || ea.item || ea;
                        if (!eq) return;
                        if (typeof eq === "object") {
                          if (eq.name) equipmentNamesSet.add(eq.name);
                          // if eq is an object but has no name, do not add its raw _id to avoid showing DB ids
                        } else if (
                          typeof eq === "string" ||
                          typeof eq === "number"
                        ) {
                          // Skip raw-looking ObjectId strings (24 hex chars) so UI doesn't display DB ids
                          const s = String(eq);
                          const isObjectId = /^[0-9a-fA-F]{24}$/.test(s);
                          if (!isObjectId) equipmentNamesSet.add(s);
                        }
                      });
                    }
                    // include per-service inventorySelection (functionDetailsList or servicesSchedule)
                    const svcInventory =
                      Array.isArray(b.functionDetailsList) &&
                      b.functionDetailsList.length
                        ? b.functionDetailsList
                        : b.servicesSchedule?.length
                        ? b.servicesSchedule
                        : [];
                    if (Array.isArray(b.inventorySelection)) {
                      b.inventorySelection.forEach((it: any) => {
                        if (!it) return;
                        if (typeof it === "object") {
                          if (it.name) equipmentNamesSet.add(it.name);
                          // skip objects without a name to avoid exposing raw ids
                        } else if (
                          typeof it === "string" ||
                          typeof it === "number"
                        ) {
                          const s = String(it);
                          const isObjectId = /^[0-9a-fA-F]{24}$/.test(s);
                          if (!isObjectId) equipmentNamesSet.add(s);
                        }
                      });
                    }
                    if (Array.isArray(svcInventory)) {
                      svcInventory.forEach((svc: any) => {
                        if (!svc) return;
                        const inv =
                          svc.inventorySelection || svc.inventory || [];
                        if (!Array.isArray(inv)) return;
                        inv.forEach((it: any) => {
                          if (!it) return;
                          if (typeof it === "object") {
                            if (it.name) equipmentNamesSet.add(it.name);
                            // do not add raw _id when name isn't present
                          } else if (
                            typeof it === "string" ||
                            typeof it === "number"
                          ) {
                            const s = String(it);
                            const isObjectId = /^[0-9a-fA-F]{24}$/.test(s);
                            if (!isObjectId) equipmentNamesSet.add(s);
                          }
                        });
                      });
                    }
                    const equipmentNames = Array.from(equipmentNamesSet);

                    return {
                      booking: b,
                      dateKey,
                      dateObj: d,
                      services,
                      serviceStaffDisplays,
                      staffNames: staffDisplay,
                      equipmentNames,
                    };
                  })
                  .filter((row) => row.dateObj != null)
                  .sort((a, b) => {
                    // put today's bookings first
                    const aIsToday =
                      new Date(
                        a.dateObj!.getFullYear(),
                        a.dateObj!.getMonth(),
                        a.dateObj!.getDate()
                      ).getTime() ===
                      new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        today.getDate()
                      ).getTime();
                    const bIsToday =
                      new Date(
                        b.dateObj!.getFullYear(),
                        b.dateObj!.getMonth(),
                        b.dateObj!.getDate()
                      ).getTime() ===
                      new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        today.getDate()
                      ).getTime();
                    if (aIsToday !== bIsToday) return aIsToday ? -1 : 1;
                    return a.dateObj!.getTime() - b.dateObj!.getTime();
                  })
                  .map((row: any) => {
                    const isToday =
                      new Date(
                        row.dateObj.getFullYear(),
                        row.dateObj.getMonth(),
                        row.dateObj.getDate()
                      ).getTime() ===
                      new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        today.getDate()
                      ).getTime();
                    return (
                      <tr
                        key={row.booking._id}
                        className={`${isToday ? "bg-amber-50" : ""}`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {new Date(row.dateObj).toDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {row.booking.bookingNumber || row.booking._id}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-[220px] break-words">
                          {row.booking.client?.name || "Unknown"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 min-w-[360px] border border-gray-200">
                          {row.services && row.services.length > 0 ? (
                            row.services.map((s: string, i: number) => (
                              <div key={i} className="leading-snug">
                                {s}
                              </div>
                            ))
                          ) : (
                            <div className="text-neutral-400">—</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] border border-gray-200">
                          {/* Prefer per-service staff displays aligned with services; fallback to booking-level staffNames */}
                          {row.serviceStaffDisplays && row.serviceStaffDisplays.length > 0 ? (
                            row.serviceStaffDisplays.map((svcList: string[], idx: number) => (
                              <div key={idx} className="leading-snug">
                                {Array.isArray(svcList) && svcList.length > 0 ? (
                                  svcList.map((name: string, j: number) => (
                                    <div key={j}>{name}</div>
                                  ))
                                ) : (
                                  <div className="text-neutral-400">—</div>
                                )}
                              </div>
                            ))
                          ) : row.staffNames && row.staffNames.length > 0 ? (
                            row.staffNames.map((s: string, i: number) => (
                              <div key={i} className="leading-snug">
                                {s}
                              </div>
                            ))
                          ) : (
                            <div className="text-neutral-400">—</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-[220px]">
                          {row.equipmentNames &&
                          row.equipmentNames.length > 0 ? (
                            row.equipmentNames.map((e: string, i: number) => (
                              <div key={i} className="leading-snug">
                                {e}
                              </div>
                            ))
                          ) : (
                            <div className="text-neutral-400">—</div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span
                            className={`badge ${getStatusBadgeColor(
                              row.booking.status
                            )}`}
                          >
                            {(row.booking.status || "").replace("_", " ")}
                          </span>
                        </td>
                      </tr>
                    );
                  })
              ) : (
                <tr>
                  <td
                    colSpan={7}
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
