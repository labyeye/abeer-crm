import React, { useEffect, useState } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { staffAPI, advanceAPI } from '../../services/api';
import { Loader2 } from 'lucide-react';

const SalaryManagement = () => {
  const { addNotification } = useNotification();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [salaryRecords, setSalaryRecords] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [currentSalarySummary, setCurrentSalarySummary] = useState<any | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: 0,
    allowances: 0,
    deductions: { advance: 0, loan: 0, emi: 0, other: 0 },
    paymentStatus: 'paid',
    paymentDate: new Date().toISOString().slice(0,10),
    paymentMethod: 'bank_transfer',
    distributeAdvance: false,
    distributeMonths: 1,
    notes: ''
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await staffAPI.getStaff();
        const list = Array.isArray(res.data) ? res.data : res.data || [];
        setStaffList(list);
      } catch (err: any) {
        addNotification({ type: 'error', title: 'Error', message: err?.message || 'Failed to load staff' });
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
          const advRes: any = await advanceAPI.listAdvancesForStaff(selectedStaffId);
          const advs = Array.isArray(advRes) ? advRes : advRes.data || advRes.data?.data || [];
          setAdvances(advs);
        } catch (e) {
          setAdvances([]);
        }
        // compute a quick summary (latest record or staff default salary)
        if (recs.length > 0) {
          const latest = recs[0];
          setCurrentSalarySummary({ basic: latest.basicSalary, allowances: latest.allowances, net: latest.netSalary });
        } else {
          // fallback: fetch staff data
          const s = staffList.find(s => s._id === selectedStaffId);
          if (s) {
            const salaryObj = typeof s.salary === 'object' ? s.salary : { basic: s.salary || 0, allowances: 0 };
            setCurrentSalarySummary({ basic: salaryObj.basic, allowances: salaryObj.allowances, net: (salaryObj.basic || 0) + (salaryObj.allowances || 0) });
          } else setCurrentSalarySummary(null);
        }
      } catch (err: any) {
        addNotification({ type: 'error', title: 'Error', message: err?.message || 'Failed to load salary records' });
      } finally {
        setLoading(false);
      }
    };
    loadSalary();
  }, [selectedStaffId, staffList]);

  const openPaymentModal = () => {
    if (!selectedStaffId) {
      addNotification({ type: 'error', title: 'Select staff', message: 'Please select a staff member first.' });
      return;
    }
    // prefill payment form from current summary
    setPaymentForm((pf) => ({
      ...pf,
      basicSalary: currentSalarySummary?.basic || 0,
      allowances: currentSalarySummary?.allowances || 0
    }));
    setShowPaymentModal(true);
  };

  const openAdvanceModal = () => {
    if (!selectedStaffId) {
      addNotification({ type: 'error', title: 'Select staff', message: 'Please select a staff member first.' });
      return;
    }
    // simple prompt flow for advances (can be improved to a modal)
    const amtStr = window.prompt('Advance amount (numeric)');
    if (!amtStr) return;
    const amt = Number(amtStr);
    if (!amt || amt <= 0) { addNotification({ type: 'error', title: 'Invalid', message: 'Enter a valid amount' }); return; }
    (async () => {
      try {
        setLoading(true);
        const apply = window.confirm('Apply this advance to the current month salary (reduce net salary)? Click Cancel to only record as standalone advance.');
        const targetMonth = new Date().getMonth() + 1;
        const targetYear = new Date().getFullYear();
  await advanceAPI.createAdvanceForStaff(selectedStaffId, { amount: amt, notes: 'Advance recorded', applyToSalary: apply, targetMonth, targetYear });
        addNotification({ type: 'success', title: 'Saved', message: 'Advance recorded' });
        // refresh advances list
        const advRes: any = await advanceAPI.listAdvancesForStaff(selectedStaffId);
        const advs = Array.isArray(advRes) ? advRes : advRes.data || advRes.data?.data || [];
        setAdvances(advs);
        // if applied to salary, refresh salary records too
        if (apply) {
          const refreshed: any = await staffAPI.getStaffSalary(selectedStaffId);
          let recs: any[] = [];
          if (Array.isArray(refreshed)) recs = refreshed;
          else if (Array.isArray(refreshed.data)) recs = refreshed.data;
          else if (Array.isArray(refreshed.data?.data)) recs = refreshed.data.data;
          else recs = refreshed.data || refreshed.data?.data || [];
          setSalaryRecords(recs);
        }
      } catch (err: any) {
        addNotification({ type: 'error', title: 'Error', message: err?.message || 'Failed to record advance' });
      } finally { setLoading(false); }
    })();
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        month: Number(paymentForm.month),
        year: Number(paymentForm.year),
        basicSalary: Number(paymentForm.basicSalary),
        allowances: Number(paymentForm.allowances),
        deductions: paymentForm.deductions,
        paymentStatus: paymentForm.paymentStatus,
        paymentDate: paymentForm.paymentDate ? new Date(paymentForm.paymentDate).toISOString() : undefined,
        paymentMethod: paymentForm.paymentMethod,
        notes: paymentForm.notes
      };

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
        addNotification({ type: 'success', title: 'Saved', message: 'Salary record saved' });
        setShowPaymentModal(false);
      } catch (err: any) {
        // If server indicates salary already paid, offer to record as advance for next month
        const status = err?.response?.status;
        const data = err?.response?.data || {};
        if (status === 409 && data.code === 'ALREADY_PAID') {
          const accept = window.confirm('Salary already paid for this month. Do you want to record the entered advance for next month?');
          if (accept) {
            // compute next month/year
            let nextMonth = Number(paymentForm.month) + 1;
            let nextYear = Number(paymentForm.year);
            if (nextMonth > 12) { nextMonth = 1; nextYear += 1; }
            const adv = Number(paymentForm.deductions?.advance || 0);
            const months = paymentForm.distributeAdvance ? Number(paymentForm.distributeMonths) || 1 : 1;
            const monthly = Math.round((adv / months) * 100) / 100;
            const advancePayload = {
              ...payload,
              month: nextMonth,
              year: nextYear,
              paymentStatus: 'partial',
              deductions: { ...(paymentForm.deductions || {}), advance: adv },
              advanceSchedule: { total: adv, months, monthly }
            };
            await staffAPI.createStaffSalary(selectedStaffId, advancePayload as any);
            addNotification({ type: 'success', title: 'Saved', message: 'Advance recorded for next month' });
            setShowPaymentModal(false);
          }
        } else if (status === 409 && data.code === 'ALREADY_EXISTS') {
          addNotification({ type: 'warning', title: 'Exists', message: 'A salary record already exists for this month (pending/partial). Please update it instead.' });
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
          await advanceAPI.createAdvanceForStaff(selectedStaffId, { amount: advAmount, notes: 'Recorded via salary', applyToSalary: true, targetMonth: paymentForm.month, targetYear: paymentForm.year });
        } catch (e) {
          // non-fatal: log and continue
          console.warn('Failed to create advance record from salary form', e);
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
      addNotification({ type: 'error', title: 'Error', message: err?.message || 'Failed to save salary' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Payroll prompt visible on days 1-5 */}
      {(() => {
        const day = new Date().getDate();
        if (day >=1 && day <=5) {
          return (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Payroll reminder:</strong> It's the start of the month. Mark salaries as given for staff if you have paid them.
                </div>
                <div>
                  <button onClick={() => { if (!selectedStaffId) { addNotification({ type: 'error', title: 'Select staff', message: 'Select a staff member to mark salary given.' }); return; } setPaymentForm(pf => ({ ...pf, month: new Date().getMonth() + 1, year: new Date().getFullYear() })); setShowPaymentModal(true); }} className="px-3 py-1 bg-green-600 text-white rounded">Mark Salary Given</button>
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
          <button onClick={openPaymentModal} className="px-4 py-2 bg-blue-600 text-white rounded">Salary Given</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-600">Select Staff</label>
            <select value={selectedStaffId} onChange={(e) => setSelectedStaffId(e.target.value)} className="w-full px-3 py-2 border rounded">
              <option value="">-- Select staff --</option>
              {staffList.map(s => (
                <option key={s._id} value={s._id}>{s.name} ({s.designation})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Current Basic</label>
            <div className="text-lg font-medium">₹{currentSalarySummary ? currentSalarySummary.basic.toLocaleString() : '-'}</div>
          </div>

          <div>
            <label className="text-sm text-gray-600">Current Net</label>
            <div className="text-lg font-medium">₹{currentSalarySummary ? currentSalarySummary.net.toLocaleString() : '-'}</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-medium mb-3">Salary History</h3>
          <div>
            <button onClick={openAdvanceModal} className="px-3 py-1 bg-yellow-400 text-black rounded mr-2">Record Advance</button>
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
                    <td>{r.month}/{r.year}</td>
                    <td>₹{(r.basicSalary || 0).toLocaleString()}</td>
                    <td>₹{(r.allowances || 0).toLocaleString()}</td>
                    <td>₹{(r.deductions?.total || 0).toLocaleString()}</td>
                    <td>₹{(r.netSalary || 0).toLocaleString()}</td>
                    <td className="capitalize">{r.paymentStatus}</td>
                    <td>{r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                  <td>{new Date(a.date || a.createdAt).toLocaleDateString()}</td>
                  <td>₹{(a.amount || 0).toLocaleString()}</td>
                  <td>{a.notes || '-'}</td>
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
            <h3 className="text-lg font-medium mb-4">Record Salary Payment / Advance</h3>
            <form onSubmit={submitPayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Month</label>
                  <select value={paymentForm.month} onChange={(e) => setPaymentForm({ ...paymentForm, month: Number(e.target.value) })} className="w-full px-2 py-1 border rounded">
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                      <option key={m} value={m}>{new Date(2020, m-1).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Year</label>
                  <input type="number" value={paymentForm.year} onChange={(e) => setPaymentForm({ ...paymentForm, year: Number(e.target.value) })} className="w-full px-2 py-1 border rounded" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Basic Salary</label>
                  <input type="number" value={paymentForm.basicSalary} onChange={(e) => setPaymentForm({ ...paymentForm, basicSalary: Number(e.target.value) })} className="w-full px-2 py-1 border rounded" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Allowances</label>
                  <input type="number" value={paymentForm.allowances} onChange={(e) => setPaymentForm({ ...paymentForm, allowances: Number(e.target.value) })} className="w-full px-2 py-1 border rounded" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Advance Deduction</label>
                  <input type="number" value={paymentForm.deductions.advance} onChange={(e) => setPaymentForm({ ...paymentForm, deductions: { ...paymentForm.deductions, advance: Number(e.target.value) } })} className="w-full px-2 py-1 border rounded" />
                </div>
              </div>

              <div className="mt-2 space-y-2">
                <label className="text-sm font-medium">Advance Distribution</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={paymentForm.distributeAdvance} onChange={(e) => setPaymentForm({ ...paymentForm, distributeAdvance: e.target.checked })} />
                    <span className="text-sm">Distribute advance across months</span>
                  </label>
                  {paymentForm.distributeAdvance && (
                    <div className="flex items-center gap-2">
                      <input type="number" min={1} value={paymentForm.distributeMonths} onChange={(e) => setPaymentForm({ ...paymentForm, distributeMonths: Number(e.target.value) || 1 })} className="w-20 px-2 py-1 border rounded" />
                      <span className="text-sm">month(s)</span>
                    </div>
                  )}

                  {/* show computed monthly deduction and resulting net for this month */}
                  <div className="ml-auto text-sm">
                    {Number(paymentForm.deductions?.advance || 0) > 0 && paymentForm.distributeAdvance ? (
                      (() => {
                        const adv = Number(paymentForm.deductions.advance || 0);
                        const months = Number(paymentForm.distributeMonths) || 1;
                        const monthly = Math.round((adv / months) * 100) / 100;
                        const gross = Number(paymentForm.basicSalary || 0) + Number(paymentForm.allowances || 0);
                        const otherDeductions = Number(paymentForm.deductions.loan || 0) + Number(paymentForm.deductions.emi || 0) + Number(paymentForm.deductions.other || 0);
                        const netAfter = Math.round((gross - monthly - otherDeductions) * 100) / 100;
                        return (<div>
                          <div>Monthly advance deduction: <strong>₹{monthly.toLocaleString()}</strong></div>
                          <div>Net this month after advance: <strong>₹{netAfter.toLocaleString()}</strong></div>
                        </div>);
                      })()
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Payment Status</label>
                  <select value={paymentForm.paymentStatus} onChange={(e) => setPaymentForm({ ...paymentForm, paymentStatus: e.target.value })} className="w-full px-2 py-1 border rounded">
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Payment Date</label>
                  <input type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} className="w-full px-2 py-1 border rounded" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Payment Method</label>
                  <select value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })} className="w-full px-2 py-1 border rounded">
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryManagement;
