import React, { useEffect, useState } from "react";
import { useNotification } from "../../contexts/NotificationContext";
import { staffAPI, advanceAPI, bookingAPI, fixedExpenseAPI } from "../../services/api";
import { Loader2 } from "lucide-react";

const SalaryManagement = () => {
  const { addNotification } = useNotification();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [salaryRecords, setSalaryRecords] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [unpaidBookings, setUnpaidBookings] = useState<any[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<any | null>(null);
  const [bookingsAssigned, setBookingsAssigned] = useState<any[]>([]);
  const [currentSalarySummary, setCurrentSalarySummary] = useState<any | null>(
    null
  );
  const [monthlyFixedPaid, setMonthlyFixedPaid] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: 0,
    allowances: 0,
    deductions: { advance: 0, loan: 0, emi: 0, other: 0 },
    paymentStatus: "paid",
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: "bank_transfer",
    distributeAdvance: false,
    distributeMonths: 1,
    notes: "",
  });
  const [selectedTaskRows, setSelectedTaskRows] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await staffAPI.getStaff();
        const list = Array.isArray(res.data) ? res.data : res.data || [];
        setStaffList(list);
      } catch (err: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: err?.message || "Failed to load staff",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedStaffId) return;
    const loadSalary = async () => {
      setLoading(true);
      try {
        // fetch full history (no year filter) so history is complete
        const res = await staffAPI.getStaffSalary(selectedStaffId);
        // backend wrapper returns an object { success, count, data }
        // but some helpers might return the array directly; handle both
        let recs: any[] = [];
        if (Array.isArray(res)) recs = res;
        else if (Array.isArray(res.data)) recs = res.data;
        else if (Array.isArray(res.data?.data)) recs = res.data.data;
        else recs = res.data || res.data?.data || [];
        setSalaryRecords(recs);
        // load advances
        try {
          const advRes: any = await advanceAPI.listAdvancesForStaff(
            selectedStaffId
          );
          const advs = Array.isArray(advRes)
            ? advRes
            : advRes.data || advRes.data?.data || [];
          setAdvances(advs);
        } catch (e) {
          setAdvances([]);
        }
        // if staff is per_task, fetch bookings assigned to them
        try {
          const staff = staffList.find((s) => s._id === selectedStaffId);
          if (staff && (staff.staffType || "").toString() === "per_task") {
            await fetchAssignedBookings(selectedStaffId);
            // fetch unpaid bookings and payment summary
            try {
              const up: any = await staffAPI.getUnpaidBookings(selectedStaffId);
              const upList = Array.isArray(up) ? up : up.data || up.data?.data || [];
              setUnpaidBookings(upList);
            } catch (e) {
              setUnpaidBookings([]);
            }
            try {
              const sum: any = await staffAPI.getPaymentSummary(selectedStaffId);
              const sdata = sum?.data || sum || null;
              setPaymentSummary(sdata);
            } catch (e) {
              setPaymentSummary(null);
            }
          } else {
            setBookingsAssigned([]);
          }
        } catch (e) {
          setBookingsAssigned([]);
        }
        // fetch fixed-expense for staff (salary fixed) and merge monthly payments into salary records
        try {
          const fxRes: any = await fixedExpenseAPI.getFixedExpenses({ staff: selectedStaffId, source: 'salary' });
          const fxList = Array.isArray(fxRes) ? fxRes : fxRes.data || fxRes.data?.data || [];
          // ensure we only consider fixed-expenses that belong to the selected staff
          const fxFiltered = fxList.filter((f: any) => {
            if (!f) return false;
            const sid = f.staff ? (f.staff._id || f.staff) : undefined;
            return sid && sid.toString && sid.toString() === selectedStaffId.toString();
          });
          if (fxFiltered.length > 0) {
            const fx = fxFiltered[0];
            const payments = fx.payments || [];
            // for each payment, try to merge into recs
            payments.forEach((p: any) => {
              if (!p || !p.month) return;
              const dt = new Date(p.month);
              const month = dt.getMonth() + 1;
              const year = dt.getFullYear();
              const existsIdx = recs.findIndex((r: any) => Number(r.month) === month && Number(r.year) === year);
              const merged = {
                month,
                year,
                basicSalary: Number(p.amount || fx.amount || 0),
                allowances: 0,
                deductions: { ...(recs[existsIdx]?.deductions || {} ) },
                netSalary: Number(p.amount || fx.amount || 0),
                paymentStatus: p.paid ? 'paid' : 'pending',
                paymentDate: p.paidAt || (p.paid ? p.updatedAt || new Date().toISOString() : undefined),
                notes: `Fixed expense payment (${fx.title || 'Salary'})`
              };
              if (existsIdx >= 0) {
                // overlay paid status
                recs[existsIdx] = { ...recs[existsIdx], ...merged };
              } else {
                recs.push(merged as any);
              }
            });
          }
        } catch (e) {
          // ignore fixed-expense merge failures
        }

        // compute a quick summary (latest record or staff default salary)
        if (recs.length > 0) {
          const latest = recs[0];
          setCurrentSalarySummary({
            basic: latest.basicSalary,
            allowances: latest.allowances,
            net: latest.netSalary,
          });
        } else {
          // fallback: fetch staff data
          const s = staffList.find((s) => s._id === selectedStaffId);
          if (s) {
            const salaryObj =
              typeof s.salary === "object"
                ? s.salary
                : { basic: s.salary || 0, allowances: 0 };
            setCurrentSalarySummary({
              basic: salaryObj.basic,
              allowances: salaryObj.allowances,
              net: (salaryObj.basic || 0) + (salaryObj.allowances || 0),
            });
          } else setCurrentSalarySummary(null);
        }
        // determine if this staff has a salary fixed-expense marked paid for this month
        try {
          setMonthlyFixedPaid(false);
          const fxRes2: any = await fixedExpenseAPI.getFixedExpenses({ staff: selectedStaffId, source: 'salary' });
          const fxList2 = Array.isArray(fxRes2) ? fxRes2 : fxRes2.data || fxRes2.data?.data || [];
          const fxFiltered2 = fxList2.filter((f: any) => {
            if (!f) return false;
            const sid = f.staff ? (f.staff._id || f.staff) : undefined;
            return sid && sid.toString && sid.toString() === selectedStaffId.toString();
          });
          if (fxFiltered2.length > 0) {
            const fx = fxFiltered2[0];
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
            const payment = (fx.payments || []).find((p: any) => p.month && new Date(p.month).setDate(1) === monthStart && p.paid);
            if (payment) setMonthlyFixedPaid(true);
          }
        } catch (e) {
          setMonthlyFixedPaid(false);
        }
      } catch (err: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: err?.message || "Failed to load salary records",
        });
      } finally {
        setLoading(false);
      }
    };
    loadSalary();
  }, [selectedStaffId, staffList]);

  // helper to fetch bookings assigned to a staff and set state
  const fetchAssignedBookings = async (staffId: string) => {
    try {
      setLoading(true);
      const bRes: any = await bookingAPI.getBookingsForStaff(staffId);
      const bList = Array.isArray(bRes)
        ? bRes
        : bRes.data || bRes.data?.data || [];
      setBookingsAssigned(bList);
    } catch (err) {
      setBookingsAssigned([]);
    } finally {
      setLoading(false);
    }
  };

  // Small polling to pick up very recent booking assignment changes (runs while a per_task staff is selected)
  useEffect(() => {
  let timer: number | null = null;
    let attempts = 0;
    if (!selectedStaffId) return;
    const staff = staffList.find((s) => s._id === selectedStaffId);
    if (!staff || (staff.staffType || "").toString() !== "per_task") return;

    const poll = async () => {
      attempts += 1;
      try {
        await fetchAssignedBookings(selectedStaffId);
      } catch (e) {
        // ignore
      }
      if (attempts < 6) {
        timer = setTimeout(poll, 3000);
      }
    };
    poll();
    return () => {
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStaffId]);

  const perTaskSummary = React.useMemo(() => {
    if (!selectedStaffId) return { rows: [], totalTasks: 0, totalAmount: 0 };
    const staff = staffList.find((s) => s._id === selectedStaffId);
    let rate = 0;
    if (staff) {
      if (typeof staff.salary === 'number') rate = staff.salary;
      else if (typeof staff.salary === 'object' && staff.salary !== null) {
        rate = Number(staff.salary.basic || staff.salary.rate || 0) || 0;
      } else if (staff.salary) {
        rate = Number(staff.salary) || 0;
      } else if (staff.rate) {
        rate = Number(staff.rate) || 0;
      }
    }
    const rows: any[] = [];
    let totalTasks = 0;
    // use unpaidBookings as the source when per_task staff selected, otherwise fallback to bookingsAssigned
    const sourceBookings = (staff && (staff.staffType || '').toString() === 'per_task') ? unpaidBookings : bookingsAssigned;
    sourceBookings.forEach((b: any) => {
      // count assigned tasks: look into functionDetailsList assignedStaff arrays
      let count = 0;
      const tasks: string[] = [];
      const services: string[] = [];
      const types: string[] = [];
      const dates: string[] = [];
      if (Array.isArray(b.functionDetailsList)) {
        b.functionDetailsList.forEach((fd: any) => {
          if (Array.isArray(fd.assignedStaff)) {
            fd.assignedStaff.forEach((as: any) => {
              const id = as && (as._id || (as && as.toString && as.toString()));
              if (!id) return;
              if (id.toString() === selectedStaffId.toString()) {
                count += 1;
                // capture a human-friendly task name
                const taskName = fd.service || fd.event || 'Task';
                tasks.push(taskName);
                services.push(fd.service || fd.event || '');
                types.push(Array.isArray(fd.serviceType) ? fd.serviceType.join(', ') : (fd.serviceType || ''));
                dates.push(fd.date ? new Date(fd.date).toLocaleDateString() : (b.functionDetails?.date ? new Date(b.functionDetails.date).toLocaleDateString() : ''));
              }
            });
          }
        });
      }
      // fallback: check top-level staffAssignment
      if (count === 0 && Array.isArray(b.staffAssignment)) {
        b.staffAssignment.forEach((sa: any) => {
          if (sa.staff && sa.staff.toString() === selectedStaffId.toString())
            count += 1;
        });
      }
      if (count > 0) {
        const amt = count * rate;
        rows.push({
          bookingNumber: b.bookingNumber || b._id,
          count,
          rate,
          amount: amt,
          tasks,
          services,
          types,
          dates,
          bookingDate: b.functionDetails?.date || (b.functionDetailsList && b.functionDetailsList[0]?.date) || b.createdAt,
        });
        totalTasks += count;
      }
    });
    const totalAmount = rows.reduce((s, r) => s + (r.amount || 0), 0);
    return { rows, totalTasks, totalAmount };
  }, [bookingsAssigned, unpaidBookings, selectedStaffId, staffList]);

  const openPaymentModal = () => {
    if (!selectedStaffId) {
      addNotification({
        type: "error",
        title: "Select staff",
        message: "Please select a staff member first.",
      });
      return;
    }
    // prefill payment form from current summary
    setPaymentForm((pf) => ({
      ...pf,
      basicSalary: currentSalarySummary?.basic || 0,
      allowances: currentSalarySummary?.allowances || 0,
    }));
    // if selected staff is per_task, preselect per-task rows
    const staff = staffList.find((s) => s._id === selectedStaffId);
    if (staff && (staff.staffType || "").toString() === "per_task") {
      const init: Record<string, boolean> = {};
      perTaskSummary.rows.forEach((r: any, idx: number) => {
        const key = `${r.bookingNumber}::${idx}`;
        init[key] = true; // select by default
      });
      setSelectedTaskRows(init);
    } else {
      setSelectedTaskRows({});
    }
    setShowPaymentModal(true);
  };

  const openAdvanceModal = () => {
    if (!selectedStaffId) {
      addNotification({
        type: "error",
        title: "Select staff",
        message: "Please select a staff member first.",
      });
      return;
    }
    // simple prompt flow for advances (can be improved to a modal)
    const amtStr = window.prompt("Advance amount (numeric)");
    if (!amtStr) return;
    const amt = Number(amtStr);
    if (!amt || amt <= 0) {
      addNotification({
        type: "error",
        title: "Invalid",
        message: "Enter a valid amount",
      });
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const apply = window.confirm(
          "Apply this advance to the current month salary (reduce net salary)? Click Cancel to only record as standalone advance."
        );
        const targetMonth = new Date().getMonth() + 1;
        const targetYear = new Date().getFullYear();
        await advanceAPI.createAdvanceForStaff(selectedStaffId, {
          amount: amt,
          notes: "Advance recorded",
          applyToSalary: apply,
          targetMonth,
          targetYear,
        });
        addNotification({
          type: "success",
          title: "Saved",
          message: "Advance recorded",
        });
        // refresh advances list
        const advRes: any = await advanceAPI.listAdvancesForStaff(
          selectedStaffId
        );
        const advs = Array.isArray(advRes)
          ? advRes
          : advRes.data || advRes.data?.data || [];
        setAdvances(advs);
        // if applied to salary, refresh salary records too
        if (apply) {
          const refreshed: any = await staffAPI.getStaffSalary(selectedStaffId);
          let recs: any[] = [];
          if (Array.isArray(refreshed)) recs = refreshed;
          else if (Array.isArray(refreshed.data)) recs = refreshed.data;
          else if (Array.isArray(refreshed.data?.data))
            recs = refreshed.data.data;
          else recs = refreshed.data || refreshed.data?.data || [];
          setSalaryRecords(recs);
        }
      } catch (err: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: err?.message || "Failed to record advance",
        });
      } finally {
        setLoading(false);
      }
    })();
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const staff = staffList.find((s) => s._id === selectedStaffId);
      // If staff is per_task, build payload from selectedTaskRows
      let payload: any;
      if (staff && (staff.staffType || "").toString() === "per_task") {
        // compute selected rows and totals
        const selectedKeys = Object.keys(selectedTaskRows).filter(
          (k) => selectedTaskRows[k]
        );
        const rows = perTaskSummary.rows;
        const selectedRows = rows.filter((r: any, idx: number) =>
          selectedKeys.includes(`${r.bookingNumber}::${idx}`)
        );
        const basicTotal = selectedRows.reduce(
          (s: number, r: any) => s + (r.amount || 0),
          0
        );
        const notes = selectedRows
          .map((r: any) => `${r.bookingNumber}: ${r.tasks?.join(", ") || ""}`)
          .join("; ");
        payload = {
          month: Number(paymentForm.month),
          year: Number(paymentForm.year),
          basicSalary: Number(basicTotal),
          allowances: 0,
          deductions: paymentForm.deductions,
          paymentStatus: paymentForm.paymentStatus,
          paymentDate: paymentForm.paymentDate
            ? new Date(paymentForm.paymentDate).toISOString()
            : undefined,
          paymentMethod: paymentForm.paymentMethod,
          notes: paymentForm.notes ? paymentForm.notes + " | " + notes : notes,
        };
      } else {
        payload = {
          month: Number(paymentForm.month),
          year: Number(paymentForm.year),
          basicSalary: Number(paymentForm.basicSalary),
          allowances: Number(paymentForm.allowances),
          deductions: paymentForm.deductions,
          paymentStatus: paymentForm.paymentStatus,
          paymentDate: paymentForm.paymentDate
            ? new Date(paymentForm.paymentDate).toISOString()
            : undefined,
          paymentMethod: paymentForm.paymentMethod,
          notes: paymentForm.notes,
        };
      }

      // If advance is being distributed, attach schedule metadata
      const adv = Number(paymentForm.deductions?.advance || 0);
      if (paymentForm.distributeAdvance && adv > 0) {
        const months = Number(paymentForm.distributeMonths) || 1;
        const monthly = Math.round((adv / months) * 100) / 100;
        payload.advanceSchedule = { total: adv, months, monthly };
      }
      setLoading(true);
      try {
        await staffAPI.createStaffSalary(selectedStaffId, payload as any);
        addNotification({
          type: "success",
          title: "Saved",
          message: "Salary record saved",
        });
        setShowPaymentModal(false);
        // If per_task, consider marking tasks as paid in UI: we'll refresh bookings and salary records
        if (staff && (staff.staffType || "").toString() === "per_task") {
          // refresh assigned bookings and salary records
          const refreshedBookings: any = await bookingAPI.getBookingsForStaff(
            selectedStaffId
          );
          const bList = Array.isArray(refreshedBookings)
            ? refreshedBookings
            : refreshedBookings.data || refreshedBookings.data?.data || [];
          setBookingsAssigned(bList);
        }
      } catch (err: any) {
        // If server indicates salary already paid, offer to record as advance for next month
        const status = err?.response?.status;
        const data = err?.response?.data || {};
        if (status === 409 && data.code === "ALREADY_PAID") {
          const accept = window.confirm(
            "Salary already paid for this month. Do you want to record the entered advance for next month?"
          );
          if (accept) {
            // compute next month/year
            let nextMonth = Number(paymentForm.month) + 1;
            let nextYear = Number(paymentForm.year);
            if (nextMonth > 12) {
              nextMonth = 1;
              nextYear += 1;
            }
            const adv = Number(paymentForm.deductions?.advance || 0);
            const months = paymentForm.distributeAdvance
              ? Number(paymentForm.distributeMonths) || 1
              : 1;
            const monthly = Math.round((adv / months) * 100) / 100;
            const advancePayload = {
              ...payload,
              month: nextMonth,
              year: nextYear,
              paymentStatus: "partial",
              deductions: { ...(paymentForm.deductions || {}), advance: adv },
              advanceSchedule: { total: adv, months, monthly },
            };
            await staffAPI.createStaffSalary(
              selectedStaffId,
              advancePayload as any
            );
            addNotification({
              type: "success",
              title: "Saved",
              message: "Advance recorded for next month",
            });
            setShowPaymentModal(false);
          }
        } else if (status === 409 && data.code === "ALREADY_EXISTS") {
          addNotification({
            type: "warning",
            title: "Exists",
            message:
              "A salary record already exists for this month (pending/partial). Please update it instead.",
          });
          setShowPaymentModal(false);
        } else {
          throw err;
        }
      }

      // refresh
      // If an advance was provided in the salary form, record it as an Advance too so history shows
      const advAmount = Number(paymentForm.deductions?.advance || 0);
      if (advAmount > 0) {
        try {
          await advanceAPI.createAdvanceForStaff(selectedStaffId, {
            amount: advAmount,
            notes: "Recorded via salary",
            applyToSalary: true,
            targetMonth: paymentForm.month,
            targetYear: paymentForm.year,
          });
        } catch (e) {
          // non-fatal: log and continue
          console.warn("Failed to create advance record from salary form", e);
        }
      }

      const refreshed: any = await staffAPI.getStaffSalary(selectedStaffId);
      let recs: any[] = [];
      if (Array.isArray(refreshed)) recs = refreshed;
      else if (Array.isArray(refreshed.data)) recs = refreshed.data;
      else if (Array.isArray(refreshed.data?.data)) recs = refreshed.data.data;
      else recs = refreshed.data || refreshed.data?.data || [];
      setSalaryRecords(recs);
    } catch (err: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: err?.message || "Failed to save salary",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Payroll prompt visible on days 1-5 */}
      {(() => {
        const day = new Date().getDate();
        if (day >= 1 && day <= 5) {
          return (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Payroll reminder:</strong> It's the start of the
                  month. Mark salaries as given for staff if you have paid them.
                </div>
                <div>
                  {!(monthlyFixedPaid && (staffList.find(s => s._id === selectedStaffId)?.staffType || '').toString() === 'monthly') && (
                    <button
                      onClick={() => {
                        if (!selectedStaffId) {
                          addNotification({
                            type: "error",
                            title: "Select staff",
                            message:
                              "Select a staff member to mark salary given.",
                          });
                          return;
                        }
                        setPaymentForm((pf) => ({
                          ...pf,
                          month: new Date().getMonth() + 1,
                          year: new Date().getFullYear(),
                        }));
                        setShowPaymentModal(true);
                      }}
                      className="px-3 py-1 bg-green-600 text-white rounded"
                    >
                      Mark Salary Given
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Salary Management</h1>
        <div>
          {!(monthlyFixedPaid && (staffList.find(s => s._id === selectedStaffId)?.staffType || '').toString() === 'monthly') && (
            <button
              onClick={openPaymentModal}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Salary Given
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-600">Select Staff</label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">-- Select staff --</option>
              {staffList.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.designation})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Current Basic</label>
            <div className="text-lg font-medium">
              ₹
              {currentSalarySummary
                ? currentSalarySummary.basic.toLocaleString()
                : "-"}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600">Current Net</label>
            <div className="text-lg font-medium">
              ₹
              {currentSalarySummary
                ? currentSalarySummary.net.toLocaleString()
                : "-"}
            </div>
          </div>
        </div>
      </div>

      {/* Payment summary cards */}
      <div className="bg-white p-4 rounded shadow-sm mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-3 border rounded">
            <div className="text-sm text-gray-600">Total Assigned</div>
            <div className="text-xl font-semibold">₹{(paymentSummary?.totalAssigned ?? perTaskSummary.totalAmount ?? 0).toLocaleString()}</div>
          </div>
          <div className="p-3 border rounded">
            <div className="text-sm text-gray-600">Given</div>
            <div className="text-xl font-semibold">₹{(paymentSummary?.totalGiven ?? salaryRecords.reduce((s,r) => s + (r.netSalary||0),0)).toLocaleString()}</div>
          </div>
          <div className="p-3 border rounded">
            <div className="text-sm text-gray-600">Advance Taken</div>
            <div className="text-xl font-semibold">₹{(paymentSummary?.totalAdvanceTaken ?? advances.reduce((s,a) => s + (a.amount||0),0)).toLocaleString()}</div>
          </div>
          <div className="p-3 border rounded">
            <div className="text-sm text-gray-600">To Pay Now</div>
            <div className="text-xl font-semibold">₹{(paymentSummary?.toPayNow ?? Math.max(0, perTaskSummary.totalAmount - advances.reduce((s,a) => s + (a.remaining||0),0))).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-medium mb-3">Salary History</h3>
          <div>
            <button
              onClick={openAdvanceModal}
              className="px-3 py-1 bg-yellow-400 text-black rounded mr-2"
            >
              Record Advance
            </button>
          </div>
        </div>
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-600">
                  <th>Month</th>
                  <th>Basic</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Net</th>
                  <th>Status</th>
                  <th>Paid On</th>
                </tr>
              </thead>
              <tbody>
                {salaryRecords.map((r: any) => (
                  <tr key={`${r.year}-${r.month}`} className="border-t">
                    <td>
                      {r.month}/{r.year}
                    </td>
                    <td>₹{(r.basicSalary || 0).toLocaleString()}</td>
                    <td>₹{(r.allowances || 0).toLocaleString()}</td>
                    <td>₹{(r.deductions?.total || 0).toLocaleString()}</td>
                    <td>₹{(r.netSalary || 0).toLocaleString()}</td>
                    <td className="capitalize">{r.paymentStatus}</td>
                    <td>
                      {r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Per-task payable table */}
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Per-task Payments</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-600">
                  <th className="w-12">
                    {/* header checkbox placed as TD before Booking column */}
                    {(() => {
                      const unpaidKeys: string[] = [];
                      perTaskSummary.rows.forEach((r: any, idx: number) => {
                        const key = `${r.bookingNumber}::${idx}`;
                        const alreadyPaid = salaryRecords.some((sr: any) => (sr.notes || "").includes(r.bookingNumber));
                        if (!alreadyPaid) unpaidKeys.push(key);
                      });
                      const allSelected = unpaidKeys.length > 0 && unpaidKeys.every(k => !!selectedTaskRows[k]);
                      return (
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={() => {
                            const newSel: Record<string, boolean> = {};
                            unpaidKeys.forEach(k => { newSel[k] = !allSelected; });
                            setSelectedTaskRows((prev) => ({ ...prev, ...newSel }));
                          }}
                          title="Select/deselect unpaid rows"
                        />
                      );
                    })()}
                  </th>
                  <th>Booking</th>
                  <th>Tasks</th>
                  <th>Assigned</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {perTaskSummary.rows.map((r: any, idx: number) => {
                  const rowKey = `${r.bookingNumber}::${idx}`;
                  const alreadyPaid = salaryRecords.some((sr: any) => (sr.notes || "").includes(r.bookingNumber));
                  return (
                    <tr key={rowKey} className="border-t">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={!!selectedTaskRows[rowKey]}
                          onChange={(e) => setSelectedTaskRows((prev) => ({ ...prev, [rowKey]: e.target.checked }))}
                          disabled={alreadyPaid}
                        />
                      </td>
                      <td className="font-medium">{r.bookingNumber}</td>
                      <td>{(r.tasks || []).join(", ")}</td>
                      <td>{r.count}</td>
                      <td>₹{(r.rate || 0).toLocaleString()}</td>
                      <td>₹{(r.amount || 0).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Per-task staff table */}
      {(() => {
        const staff = staffList.find((s) => s._id === selectedStaffId);
        if (staff && (staff.staffType || "").toString() === "per_task") {
          return (
            <div className="bg-white p-4 rounded shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Per-Task Summary</h3>
                <div>
                  <button
                    onClick={async () => {
                      if (!selectedStaffId) return;
                      await fetchAssignedBookings(selectedStaffId);
                      addNotification({ type: 'success', title: 'Refreshed', message: 'Assigned bookings refreshed' });
                    }}
                    className="px-3 py-1 bg-gray-200 rounded text-sm"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-600">
                      <th>Booking</th>
                      <th>Tasks</th>
                      <th>Assigned</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    
                    <tr className="border-t font-medium">
                      <td>Total</td>
                      <td>{perTaskSummary.totalTasks}</td>
                      <td></td>
                      <td>₹{perTaskSummary.totalAmount.toLocaleString()}</td>
                    </tr>
                    {/* If user has selected rows, compute totals for selection; otherwise show overall advance and payable */}
                    {(() => {
                      const selectedKeys = Object.keys(selectedTaskRows).filter(k => selectedTaskRows[k]);
                      // if no selection, payable is 0 as requested
                      if (selectedKeys.length === 0) {
                        return (
                          <>
                            <tr className="border-t">
                              <td>Advance Deductions</td>
                              <td colSpan={2}></td>
                              <td>₹0</td>
                            </tr>
                            <tr className="border-t font-semibold">
                              <td>Payable</td>
                              <td colSpan={2}></td>
                              <td>₹0</td>
                            </tr>
                          </>
                        );
                      }
                      const selectedAmount = perTaskSummary.rows.reduce((s, r, idx) => {
                        const key = `${r.bookingNumber}::${idx}`;
                        return s + (selectedTaskRows[key] ? (r.amount || 0) : 0);
                      }, 0);
                      const totalAdvances = advances.reduce((s, a) => s + (a.amount || 0), 0);
                      const payable = Math.max(0, selectedAmount - totalAdvances);
                      return (
                        <>
                          <tr className="border-t">
                            <td>Advance Deductions</td>
                            <td colSpan={2}></td>
                            <td>₹{totalAdvances.toLocaleString()}</td>
                          </tr>
                          <tr className="border-t font-semibold">
                            <td>Payable (selected)</td>
                            <td colSpan={2}></td>
                            <td>₹{payable.toLocaleString()}</td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center justify-end space-x-2">
                <button
                  onClick={async () => {
                    // build selected bookings list
                    const selectedKeys = Object.keys(selectedTaskRows).filter(k => selectedTaskRows[k]);
                    if (selectedKeys.length === 0) return addNotification({ type: 'info', title: 'No selection', message: 'Select bookings to pay' });
                    const bookingIds: string[] = selectedKeys.map(k => k.split('::')[0]);
                    try {
                      setLoading(true);
                      const payload = {
                        bookings: Array.from(new Set(bookingIds)),
                        month: new Date().getMonth() + 1,
                        year: new Date().getFullYear(),
                        paymentMethod: 'cash'
                      };
                      const res: any = await staffAPI.payBookings(selectedStaffId, payload as any);
                      addNotification({ type: 'success', title: 'Paid', message: `Paid ${res.data?.salary ? 'and updated advances' : ''}` });
                      // refresh advances, salary records and bookings
                      const advRes: any = await advanceAPI.listAdvancesForStaff(selectedStaffId);
                      const advs = Array.isArray(advRes) ? advRes : advRes.data || advRes.data?.data || [];
                      setAdvances(advs);
                      const refreshed: any = await staffAPI.getStaffSalary(selectedStaffId);
                      let recs: any[] = [];
                      if (Array.isArray(refreshed)) recs = refreshed;
                      else if (Array.isArray(refreshed.data)) recs = refreshed.data;
                      else if (Array.isArray(refreshed.data?.data)) recs = refreshed.data.data;
                      else recs = refreshed.data || refreshed.data?.data || [];
                      setSalaryRecords(recs);
                      await fetchAssignedBookings(selectedStaffId);
                      setSelectedTaskRows({});
                    } catch (e: any) {
                      addNotification({ type: 'error', title: 'Error', message: e?.response?.data?.message || e?.message || 'Failed to pay bookings' });
                    } finally { setLoading(false); }
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded"
                >Pay Selected</button>
              </div>
            </div>
          );
        }
        return null;
      })()}

      <div className="bg-white p-4 rounded shadow-sm">
        <h3 className="font-medium mb-3">Advance History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-600">
                <th>Date</th>
                <th>Amount</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {advances.map((a: any) => (
                <tr key={a._id} className="border-t">
                  <td>
                    {new Date(a.date || a.createdAt).toLocaleDateString()}
                  </td>
                  <td>₹{(a.amount || 0).toLocaleString()}</td>
                  <td className="flex items-center justify-between">
                    <div>{a.notes || "-"}</div>
                    <div className="ml-4">
                      <select value={a.repaymentStatus || 'not_repaid'} onChange={async (e) => {
                        const status = e.target.value;
                        try {
                          setLoading(true);
                          await advanceAPI.updateAdvance(a._id, { repaymentStatus: status });
                          // refresh
                          const advRes: any = await advanceAPI.listAdvancesForStaff(selectedStaffId);
                          const advs = Array.isArray(advRes) ? advRes : advRes.data || advRes.data?.data || [];
                          setAdvances(advs);
                        } catch (err: any) {
                          addNotification({ type: 'error', title: 'Error', message: err?.response?.data?.message || err?.message || 'Failed to update advance' });
                        } finally { setLoading(false); }
                      }} className="px-2 py-1 border rounded text-sm">
                        <option value="not_repaid">Not Done</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Done</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6">
            <h3 className="text-lg font-medium mb-4">
              Record Salary Payment / Advance
            </h3>
            <form onSubmit={submitPayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Month</label>
                  <select
                    value={paymentForm.month}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        month: Number(e.target.value),
                      })
                    }
                    className="w-full px-2 py-1 border rounded"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>
                        {new Date(2020, m - 1).toLocaleString("default", {
                          month: "long",
                        })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Year</label>
                  <input
                    type="number"
                    value={paymentForm.year}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        year: Number(e.target.value),
                      })
                    }
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Basic Salary</label>
                  <input
                    type="number"
                    value={paymentForm.basicSalary}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        basicSalary: Number(e.target.value),
                      })
                    }
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Allowances</label>
                  <input
                    type="number"
                    value={paymentForm.allowances}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        allowances: Number(e.target.value),
                      })
                    }
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">
                    Advance Deduction
                  </label>
                  <input
                    type="number"
                    value={paymentForm.deductions.advance}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        deductions: {
                          ...paymentForm.deductions,
                          advance: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
              </div>

              <div className="mt-2 space-y-2">
                <label className="text-sm font-medium">
                  Advance Distribution
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={paymentForm.distributeAdvance}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          distributeAdvance: e.target.checked,
                        })
                      }
                    />
                    <span className="text-sm">
                      Distribute advance across months
                    </span>
                  </label>
                  {paymentForm.distributeAdvance && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={paymentForm.distributeMonths}
                        onChange={(e) =>
                          setPaymentForm({
                            ...paymentForm,
                            distributeMonths: Number(e.target.value) || 1,
                          })
                        }
                        className="w-20 px-2 py-1 border rounded"
                      />
                      <span className="text-sm">month(s)</span>
                    </div>
                  )}

                  {/* show computed monthly deduction and resulting net for this month */}
                  <div className="ml-auto text-sm">
                    {Number(paymentForm.deductions?.advance || 0) > 0 &&
                    paymentForm.distributeAdvance
                      ? (() => {
                          const adv = Number(
                            paymentForm.deductions.advance || 0
                          );
                          const months =
                            Number(paymentForm.distributeMonths) || 1;
                          const monthly =
                            Math.round((adv / months) * 100) / 100;
                          const gross =
                            Number(paymentForm.basicSalary || 0) +
                            Number(paymentForm.allowances || 0);
                          const otherDeductions =
                            Number(paymentForm.deductions.loan || 0) +
                            Number(paymentForm.deductions.emi || 0) +
                            Number(paymentForm.deductions.other || 0);
                          const netAfter =
                            Math.round(
                              (gross - monthly - otherDeductions) * 100
                            ) / 100;
                          return (
                            <div>
                              <div>
                                Monthly advance deduction:{" "}
                                <strong>₹{monthly.toLocaleString()}</strong>
                              </div>
                              <div>
                                Net this month after advance:{" "}
                                <strong>₹{netAfter.toLocaleString()}</strong>
                              </div>
                            </div>
                          );
                        })()
                      : null}
                  </div>
                </div>
              </div>

              {/* Per-task selection (for per_task staff) */}
              {(() => {
                const staff = staffList.find((s) => s._id === selectedStaffId);
                if (
                  staff &&
                  (staff.staffType || "").toString() === "per_task"
                ) {
                  return (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Select Tasks to pay</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-gray-600">
                              <th className="w-12">
                                {/* Header checkbox: selects/deselects unpaid rows */}
                                {(() => {
                                  const unpaidKeys: string[] = [];
                                  perTaskSummary.rows.forEach((r: any, idx: number) => {
                                    const key = `${r.bookingNumber}::${idx}`;
                                    const alreadyPaid = salaryRecords.some((sr: any) => (sr.notes || "").includes(r.bookingNumber));
                                    if (!alreadyPaid) unpaidKeys.push(key);
                                  });
                                  const allSelected = unpaidKeys.length > 0 && unpaidKeys.every(k => !!selectedTaskRows[k]);
                                  return (
                                    <input
                                      type="checkbox"
                                      checked={allSelected}
                                      onChange={() => {
                                        const newSel: Record<string, boolean> = {};
                                        unpaidKeys.forEach(k => { newSel[k] = !allSelected; });
                                        setSelectedTaskRows((prev) => ({ ...prev, ...newSel }));
                                      }}
                                      title="Select/deselect unpaid rows"
                                    />
                                  );
                                })()}
                              </th>
                              <th>Booking Number</th>
                              <th>Booking Service</th>
                              <th>Booking Type</th>
                              <th>Date</th>
                              <th>Assigned</th>
                              <th>Rate</th>
                              <th>Amount</th>
                              <th>Paid</th>
                            </tr>
                          </thead>
                          <tbody>
                            {perTaskSummary.rows.map((r: any, idx: number) => {
                              const key = `${r.bookingNumber}::${idx}`;
                              const alreadyPaid = salaryRecords.some((sr: any) => (sr.notes || "").includes(r.bookingNumber));
                              return (
                                <tr key={key} className="border-t">
                                  <td className="p-2">
                                    <input
                                      type="checkbox"
                                      checked={!!selectedTaskRows[key]}
                                      onChange={(e) =>
                                        setSelectedTaskRows((prev) => ({
                                          ...prev,
                                          [key]: e.target.checked,
                                        }))
                                      }
                                    />
                                  </td>
                                  <td className="font-medium">{r.bookingNumber}</td>
                                  <td>{(r.services || []).join(', ') || (r.tasks || []).join(', ')}</td>
                                  <td>{(r.types || []).join(', ') || '-'}</td>
                                  <td>{r.dates && r.dates.length ? r.dates[0] : (r.bookingDate ? new Date(r.bookingDate).toLocaleDateString() : '-')}</td>
                                  <td>{r.count}</td>
                                  <td>₹{(r.rate || 0).toLocaleString()}</td>
                                  <td>₹{(r.amount || 0).toLocaleString()}</td>
                                  <td className="text-sm">{alreadyPaid ? 'Paid' : 'Not'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {/* Toggle moved to table header */}
                    </div>
                  );
                }
                return null;
              })()}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-gray-600">
                    Payment Status
                  </label>
                  <select
                    value={paymentForm.paymentStatus}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        paymentStatus: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 border rounded"
                  >
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Payment Date</label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        paymentDate: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">
                    Payment Method
                  </label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        paymentMethod: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 border rounded"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryManagement;
