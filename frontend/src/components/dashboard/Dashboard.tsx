import { useState, useEffect, useMemo } from "react";
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
import {
  inventoryAPI,
  bookingAPI,
  staffAPI,
  paymentAPI,
  expenseAPI,
  dailyExpensesAPI,
  fixedExpenseAPI,
  attendanceAPI,
} from "../../services/api";
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
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expensesAnalytics, setExpensesAnalytics] = useState<any>(null);
  const [dailyExpenses, setDailyExpenses] = useState<any[]>([]);
  const [fixedExpenseTotal, setFixedExpenseTotal] = useState<number>(0);
  const [fixedPaidTotal, setFixedPaidTotal] = useState<number>(0);
  const [fixedUnpaidTotal, setFixedUnpaidTotal] = useState<number>(0);
  const [myAttendanceHistory, setMyAttendanceHistory] = useState<any[]>([]);
  const [myAssignedBookingsCount, setMyAssignedBookingsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // today's date helpers: declare early so functions that run on mount can use them
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const monthStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      ).toISOString();
      const monthEnd = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
        23,
        59,
        59
      ).toISOString();

      const [
        inventoryRes,
        bookingRes,
        staffRes,
        paymentsRes,
        expensesRes,
        expensesAnalyticsRes,
        dailyExpensesRes,
        fixedExpenseRes,
        fixedExpenseStatusRes,
      ] = await Promise.all([
        inventoryAPI.getInventoryStats(),
        bookingAPI.getBookings({ limit: 100 }),
        staffAPI.getStaff(),
        paymentAPI.getPayments({ limit: 50 }),
        // fetch expenses for current month
        expenseAPI.getExpenses({ startDate: monthStart, endDate: monthEnd }),
        // analytics aggregated by branch for current month (useful for chairman)
        expenseAPI.getFinanceAnalytics({
          startDate: monthStart,
          endDate: monthEnd,
        }),
        // fetch daily expenses for current month
        dailyExpensesAPI.getExpenses({
          startDate: monthStart,
          endDate: monthEnd,
        }),
        // fetch this month's fixed expense total
        fixedExpenseAPI.getMonthlyTotal(),
        // fetch this month's paid/unpaid status totals
        fixedExpenseAPI.getMonthlyStatus(),
      ]);
      // If current user is staff, fetch their attendance records so we can display working hours
      if (user?.role === "staff") {
        try {
          const attRes: any = await attendanceAPI.getMyAttendance({
            limit: 100,
          });
          const attData = attRes?.data ?? attRes ?? [];
          setMyAttendanceHistory(Array.isArray(attData) ? attData : []);
        } catch (e) {
          console.debug("[Dashboard] failed to fetch my attendance", e);
          setMyAttendanceHistory([]);
        }
        // fetch assigned bookings count for staff
        try {
          const bRes: any = await bookingAPI.getBookingsForStaff(user.id, { limit: 100 });
          const bData = bRes?.data ?? bRes ?? [];
          const arr = Array.isArray(bData) ? bData : bData.data || [];
          setMyAssignedBookingsCount(Array.isArray(arr) ? arr.length : 0);
        } catch (e) {
          console.debug('[Dashboard] failed to fetch assigned bookings', e);
          setMyAssignedBookingsCount(0);
        }
      }
      setInventoryStats(inventoryRes.data);
      setBookingStats(bookingRes.data);
      setStaffStats(staffRes.data);
      // normalize payments response (some APIs return { data: [...] }, some return [...] )
      const paymentsData = paymentsRes?.data ?? paymentsRes ?? [];
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      const expensesData = expensesRes?.data ?? expensesRes ?? [];
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      const analyticsData =
        expensesAnalyticsRes?.data ?? expensesAnalyticsRes ?? null;
      setExpensesAnalytics(analyticsData);
      const dailyData = dailyExpensesRes?.data ?? dailyExpensesRes ?? [];
      setDailyExpenses(Array.isArray(dailyData) ? dailyData : []);
      // set fixed expense total (normalize response shape)
      try {
        const fixedData = fixedExpenseRes?.data ??
          fixedExpenseRes ?? { total: 0 };
        setFixedExpenseTotal(
          Number((fixedData && (fixedData.total ?? fixedData)) || 0)
        );
      } catch (e) {
        console.debug("[Dashboard] failed to parse fixed expense total", e);
      }

      try {
        const statusData = fixedExpenseStatusRes?.data ??
          fixedExpenseStatusRes ?? { paidTotal: 0, unpaidTotal: 0 };
        setFixedPaidTotal(Number(statusData.paidTotal || 0));
        setFixedUnpaidTotal(Number(statusData.unpaidTotal || 0));
      } catch (e) {
        console.debug("[Dashboard] failed to parse fixed expense status", e);
      }
      // Debug: log counts and sums so it's easy to verify in browser console
      try {
        const expCount = Array.isArray(expensesData) ? expensesData.length : 0;
        const dailyCount = Array.isArray(dailyData) ? dailyData.length : 0;
        const expSum = (Array.isArray(expensesData) ? expensesData : []).reduce(
          (s: number, x: any) => s + (Number(x.amount) || 0),
          0
        );
        const dailySumVal = (Array.isArray(dailyData) ? dailyData : []).reduce(
          (s: number, x: any) => s + (Number(x.amount) || 0),
          0
        );
        console.debug("[Dashboard] fetched expenses:", {
          expCount,
          expSum,
          dailyCount,
          dailySumVal,
          monthStart,
          monthEnd,
        });
      } catch (e) {
        console.debug("[Dashboard] debug log failed", e);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatsByRole = () => {
    if (user?.role === "staff") {
      // compute today's working hours and status from attendance records
      const todayStr = new Date().toISOString().split("T")[0];
      const todaysRecords = myAttendanceHistory.filter((r: any) => {
        const d = r.date
          ? typeof r.date === "string"
            ? r.date.split("T")[0]
            : new Date(r.date).toISOString().split("T")[0]
          : null;
        return d === todayStr;
      });

      const todaysHours = todaysRecords.reduce(
        (sum: number, r: any) => sum + (parseFloat(r.workingHours || "0") || 0),
        0
      );
      // derive today's attendance status: prefer explicit status, else absent when no record
      const todaysStatusRaw =
        todaysRecords.length > 0
          ? todaysRecords[0].status || "present"
          : "absent";
      const todaysStatus = (() => {
        switch ((todaysStatusRaw || "").toString()) {
          case "present":
            return "Present";
          case "late":
            return "Late";
          case "leave":
            return "On Leave";
          case "absent":
          default:
            return "Absent";
        }
      })();

      return [
        {
          title: "Assigned Bookings",
          value: myAssignedBookingsCount ? myAssignedBookingsCount.toString() : "0",
          change: "Bookings assigned to you",
          changeType: "neutral" as const,
          icon: Calendar,
          color: "secondary" as const,
        },
        {
          title: "Attendance",
          value: todaysStatus,
          change: "Today's status",
          changeType: "increase" as const,
          icon: Clock,
          color:
            todaysStatus === "Present" || todaysStatus === "Late"
              ? ("success" as const)
              : ("error" as const),
        },
        {
          title: "Working Hours",
          value: `${todaysHours.toFixed(1)}h`,
          change: "Today's hours",
          changeType: "neutral" as const,
          icon: TrendingUp,
          color: "secondary" as const,
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

  // compute monthly income (current month) from received payments
  const monthlyIncome = useMemo(() => {
    if (!payments || payments.length === 0) return 0;
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return payments.reduce((sum: number, p: any) => {
      const d = p.date ? new Date(p.date) : null;
      if (!d) return sum;
      if (d.getMonth() === month && d.getFullYear() === year)
        return sum + (Number(p.amount) || 0);
      return sum;
    }, 0);
  }, [payments]);

  // if user is management, show monthly income card
  const statsWithPayments = useMemo(() => {
    const base = stats.slice();
    if (
      ["chairman", "company_admin", "branch_head"].includes(user?.role || "")
    ) {
      base.splice(2, 0, {
        title: "Monthly Income",
        value: `₹${monthlyIncome.toLocaleString()}`,
        icon: IndianRupee,
        color: "secondary" as const,
      });
    }
    return base;
  }, [stats, monthlyIncome, user?.role]);

  // Expense computations
  const monthlyExpenseTotal = useMemo(() => {
    const expSum = (Array.isArray(expenses) ? expenses : []).reduce(
      (sum: number, e: any) => sum + (Number(e.amount) || 0),
      0
    );
    const dailySum = (Array.isArray(dailyExpenses) ? dailyExpenses : []).reduce(
      (sum: number, d: any) => sum + (Number(d.amount) || 0),
      0
    );
    // include only paid fixed expenses for the month (unpaid obligations shouldn't count as realized expense)
    const fixedTotal = Number(fixedPaidTotal || 0) || 0;
    return expSum + dailySum + fixedTotal;
  }, [expenses, dailyExpenses, fixedPaidTotal, fixedUnpaidTotal]);

  const inventoryPurchasesThisMonth = useMemo(() => {
    if (!expenses || expenses.length === 0) return 0;
    const categories = ["equipment", "office_supplies"];
    return expenses
      .filter((e: any) => categories.includes((e.category || "").toLowerCase()))
      .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  // todaysExpenses memo removed (unused)

  const totalExpensesAcrossBranches = useMemo(() => {
    if (!expensesAnalytics) return 0;
    // expensesAnalytics may be returned as { expenses: [...], revenue: [...] } or wrapped differently
    const arr =
      expensesAnalytics?.expenses ||
      expensesAnalytics?.data?.expenses ||
      expensesAnalytics?.data ||
      expensesAnalytics ||
      [];
    if (!Array.isArray(arr)) return 0;
    return arr.reduce(
      (s: number, x: any) => s + (Number(x.totalExpenses || x.total || 0) || 0),
      0
    );
  }, [expensesAnalytics]);

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

  // Build a fast lookup map from inventory id -> friendly name using the already-fetched inventoryStats
  const inventoryIdToName = useMemo(() => {
    if (!inventoryStats) return new Map<string, string>();
    const arr: any[] =
      inventoryStats.items || inventoryStats.list || inventoryStats.data || [];
    const map = new Map<string, string>();
    arr.forEach((it: any) => {
      if (!it) return;
      const id = it._id || it.id || it.inventoryId || it.itemId;
      const name = it.name || it.itemName || it.inventoryName || it.title;
      if (id && name) map.set(String(id), name);
    });
    return map;
  }, [inventoryStats]);

  // (today and startOfToday are declared earlier)
  // week window helper removed — not used

  // upcoming tasks flattened helper removed — not used

  // upcoming tasks grouping removed — not used in current dashboard UI
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
        {/* Today's Expenses */}
      </div>

      {/* Business Stats Grid */}
      <div className="dashboard-grid">
        {statsWithPayments.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
        {/* Fixed expense paid/unpaid summary */}
        {["chairman", "company_admin", "branch_head"].includes(
          user?.role || ""
        ) && (
          <>
            <StatCard
              title="Fixed Paid (This Month)"
              value={`₹${fixedPaidTotal.toLocaleString()}`}
              icon={CheckCircle}
              color="success"
            />
            <StatCard
              title="Fixed Unpaid (This Month)"
              value={`₹${fixedUnpaidTotal.toLocaleString()}`}
              icon={XCircle}
              color="warning"
            />
          </>
        )}
        {/* Combined Expense + Inventory card for management */}
        {["chairman", "company_admin", "branch_head"].includes(
          user?.role || ""
        ) && (
          <StatCard
            title={
              user?.role === "chairman"
                ? "Monthly Expenses"
                : "Monthly Expenses"
            }
            value={`₹${(
              (user?.role === "chairman"
                ? totalExpensesAcrossBranches
                : monthlyExpenseTotal) + Number(fixedPaidTotal || 0)
            ).toLocaleString()}`}
            icon={TrendingUp}
            color="error"
            change={
              inventoryPurchasesThisMonth > 0
                ? `Inventory: ₹${inventoryPurchasesThisMonth.toLocaleString()}`
                : undefined
            }
            changeType="neutral"
          />
        )}
        {/* This Month Fixed Expenses */}
        {["chairman", "company_admin", "branch_head"].includes(
          user?.role || ""
        ) && (
          <StatCard
            title={"This Month Fixed"}
            value={`₹${fixedExpenseTotal.toLocaleString()}`}
            icon={IndianRupee}
            color="warning"
          />
        )}
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
      {user?.role !== 'staff' && (
        <>
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
                // expand bookings into per-service rows - each service gets its own row with its specific date
                [...bookingStats]
                  .flatMap((b: any) => {
                    // Get per-service entries (functionDetailsList is authoritative)
                    const perServiceEntries =
                      Array.isArray(b.functionDetailsList) &&
                      b.functionDetailsList.length
                        ? b.functionDetailsList
                        : b.servicesSchedule?.length
                        ? b.servicesSchedule
                        : b.services?.length
                        ? b.services.map((svc: any) => ({
                            // fallback: use functionDetails date for services without individual dates
                            date:
                              b.functionDetails?.date ||
                              b.date ||
                              b.scheduledDate,
                            time: b.functionDetails?.time || {},
                            venue: b.functionDetails?.venue || {},
                            service:
                              svc.service || svc.serviceName || "Service",
                            serviceType: svc.serviceType || svc.type || [],
                            event: svc.event || b.event || "",
                            assignedStaff: [],
                            inventorySelection: [],
                          }))
                        : [
                            {
                              date:
                                b.functionDetails?.date ||
                                b.date ||
                                b.scheduledDate,
                              time: b.functionDetails?.time || {},
                              venue: b.functionDetails?.venue || {},
                              service:
                                b.functionDetails?.type ||
                                b.serviceName ||
                                "Service",
                              serviceType: [],
                              event: b.event || "",
                              assignedStaff: [],
                              inventorySelection: [],
                            },
                          ];

                    // Create one row per service entry
                    return perServiceEntries.map((serviceEntry: any) => {
                      const rawDate = serviceEntry.date;
                      const d = rawDate ? new Date(rawDate) : null;

                      // Service name for this specific entry
                      const serviceName =
                        serviceEntry.service ||
                        serviceEntry.serviceName ||
                        serviceEntry.name ||
                        serviceEntry.title ||
                        "Service";
                      const serviceType = Array.isArray(
                        serviceEntry.serviceType
                      )
                        ? serviceEntry.serviceType.join(", ")
                        : serviceEntry.serviceType || serviceEntry.type || "";
                      const displayService = serviceType
                        ? `${serviceName} (${serviceType})`
                        : serviceName;

                      // Staff for this specific service entry
                      const serviceStaffNames: string[] = [];
                      if (Array.isArray(serviceEntry.assignedStaff)) {
                        serviceEntry.assignedStaff.forEach((staffId: any) => {
                          const staff = staffStats.find(
                            (s: any) => s._id === (staffId._id || staffId)
                          );
                          if (staff) serviceStaffNames.push(staff.name);
                        });
                      }

                      // Equipment names for this specific service entry
                      const equipmentNames: string[] = [];
                      if (Array.isArray(serviceEntry.inventorySelection)) {
                        serviceEntry.inventorySelection.forEach((inv: any) => {
                          if (typeof inv === "object" && inv.name) {
                            equipmentNames.push(inv.name);
                          } else if (typeof inv === "string") {
                            const resolved = inventoryIdToName.get(inv);
                            if (resolved) equipmentNames.push(resolved);
                          }
                        });
                      }

                      return {
                        booking: b,
                        dateObj: d,
                        service: displayService,
                        serviceStaffNames,
                        equipmentNames,
                      };
                    });
                  })
                  .filter((row) => {
                    if (!row.dateObj) return false;
                    // exclude bookings dated before today (past bookings) from the Schedule
                    const dOnly = new Date(
                      row.dateObj.getFullYear(),
                      row.dateObj.getMonth(),
                      row.dateObj.getDate()
                    ).getTime();
                    if (dOnly < startOfToday) return false;
                    // exclude enquiry bookings from schedule display
                    if ((row.booking?.status || "").toLowerCase() === "enquiry")
                      return false;
                    return true;
                  })
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
                        key={`${row.booking._id}-${row.service}`}
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
                          <div className="leading-snug">
                            {row.service || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] border border-gray-200">
                          {row.serviceStaffNames &&
                          row.serviceStaffNames.length > 0 ? (
                            row.serviceStaffNames.map(
                              (name: string, i: number) => (
                                <div key={i} className="leading-snug">
                                  {name}
                                </div>
                              )
                            )
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
      {/* Payments Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Recent Payments</h2>
          <p className="text-sm text-gray-500">
            Payments received (latest {payments ? payments.length : 0})
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[800px] w-full divide-y divide-gray-200 border-collapse [&_th]:border [&_td]:border [&_th]:border-gray-200 [&_td]:border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments && payments.length > 0 ? (
                payments
                  .slice()
                  .sort(
                    (a: any, b: any) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  .map((p: any) => (
                    <tr key={p._id || `${p.date}-${p.amount}`}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {p.date ? new Date(p.date).toDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {p.client?.name || p.clientName || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {p.booking?.bookingNumber ||
                          p.booking ||
                          (p.bookings && p.bookings.length === 1
                            ? p.bookings[0]
                            : p.bookings
                            ? `${p.bookings.length} bookings`
                            : "—")}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        ₹{(Number(p.amount) || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No payments recorded
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
