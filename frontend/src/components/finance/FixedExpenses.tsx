import { useEffect, useState, useMemo } from 'react';
import { fixedExpenseAPI, inventoryAPI, staffAPI } from '../../services/api';
import { Plus, Trash } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

const FixedExpenses = ({ onClose }: { onClose?: () => void }) => {
  const { addNotification } = useNotification();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({ title: '', amount: '', recurrence: 'monthly', startDate: '' });
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);

  const staffById = useMemo(() => {
    const m: Record<string, any> = {};
    staffList.forEach((s: any) => {
      const id = s._id || s.id;
      if (id) m[id] = s;
    });
    return m;
  }, [staffList]);

  const formatStaffType = (t?: string) => {
    if (!t) return '';
    return t.replace('_', ' ').replace(/(^|\s)\S/g, (l) => l.toUpperCase());
  };

  useEffect(() => {
    fetchList();
    fetchInventory();
    fetchStaff();
  }, []);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fixedExpenseAPI.getFixedExpenses();
      const data = res.data || res || [];
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to load fixed expenses' });
    } finally { setLoading(false); }
  };

  const fetchInventory = async () => {
    try {
      const res = await inventoryAPI.getInventory({ limit: 100 });
      let inv = res.data || res || [];
      if (inv && typeof inv === 'object' && Array.isArray(inv.docs)) inv = inv.docs;
      if (!Array.isArray(inv)) inv = [];
      const filtered = inv.filter((i: any) => {
        try {
          const bm = (i.buyingMethod || '').toString().toLowerCase();
          const monthly = Number(i.emiDetails?.monthlyAmount || i.emiDetails?.monthly || 0);
          return bm === 'emi' && monthly > 0;
        } catch (e) {
          return false;
        }
      });
      setInventoryList(filtered);
    } catch (err) {
      console.warn('Failed to fetch inventory for FixedExpenses', err);
      // non-fatal, but show subtle notification so user knows
      addNotification({ type: 'warning', title: 'Inventory', message: 'Could not load inventory for EMI scan' });
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await staffAPI.getStaff();
      const list = (res && (res.data || res)) || [];
      setStaffList(Array.isArray(list) ? list : []);
    } catch (err) {
      // non-fatal
    }
  };

  const handleCreate = async () => {
    try {
      const payload: any = {
        title: form.title,
        amount: Number(form.amount),
        recurrence: form.recurrence,
        startDate: form.startDate || new Date().toISOString(),
      };
      const res = await fixedExpenseAPI.createFixedExpense(payload);
      const created = res.data || res || res;
      setList((p) => [created, ...p]);
      addNotification({ type: 'success', title: 'Created', message: 'Fixed expense added' });
      setShowForm(false);
      setForm({ title: '', amount: '', recurrence: 'monthly', startDate: '' });
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to create fixed expense' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this fixed expense?')) return;
    try {
      await fixedExpenseAPI.deleteFixedExpense(id);
      setList((p) => p.filter((x) => x._id !== id));
      addNotification({ type: 'success', title: 'Deleted', message: 'Fixed expense removed' });
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to delete' });
    }
  };

  const handleTogglePayment = async (fxId: string, paid: boolean) => {
    try {
      // use current month start
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      // include amount where possible (send fx amount to help backend record exact value)
      const fx = list.find(l => l._id === fxId) || {};
      const amountToSend = Number(fx.amount || fx.emiDetails?.monthlyAmount || 0) || undefined;
      await fixedExpenseAPI.markPayment(fxId, { month: monthStart, paid, amount: amountToSend });
      addNotification({ type: 'success', title: 'Updated', message: `Marked as ${paid ? 'paid' : 'unpaid'}` });
      await fetchList();
    } catch (rawErr) {
      const err: any = rawErr || {};
      const msg = (err.response && err.response.data && err.response.data.message) || err.message || 'Failed to update payment status';
      addNotification({ type: 'error', title: 'Error', message: msg });
    }
  };

  const isPaidThisMonth = (f: any) => {
    try {
      const now = new Date();
      const month = now.getMonth();
      const p = (f.payments || []).find((pp: any) => {
        if (!pp || !pp.month) return false;
        return new Date(pp.month).getMonth() === month;
      });
      return !!(p && p.paid);
    } catch (e) {
      return false;
    }
  };

  

  return (
    <div className="p-4 bg-white rounded">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Fixed Expenses</h3>
        <div className="flex items-center space-x-2">
          <button onClick={() => setShowForm(s => !s)} className="px-3 py-1 bg-blue-600 text-white rounded flex items-center"><Plus className="w-4 h-4 mr-2"/>Add</button>
          <button onClick={() => onClose && onClose()} className="px-3 py-1 border rounded">Close</button>
        </div>
      </div>

      {showForm && (
        <div className="mb-4">
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="p-2 border rounded w-full mb-2" />
          <input placeholder="Amount" type="number" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} className="p-2 border rounded w-full mb-2" />
          <select value={form.recurrence} onChange={(e) => setForm({...form, recurrence: e.target.value})} className="p-2 border rounded w-full mb-2">
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="one-time">One-time</option>
          </select>
          <input type="date" value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} className="p-2 border rounded w-full mb-2" />
          <div className="flex justify-end">
            <button onClick={handleCreate} className="px-3 py-1 bg-emerald-600 text-white rounded">Save</button>
          </div>
        </div>
      )}

      <div>
        <div className="mb-2 text-sm text-gray-600">Inventory EMI items</div>
        <div className="grid grid-cols-1 gap-2 mb-4">
          {inventoryList.map((i) => (
            <div key={i._id} className="p-2 border rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{i.name}</div>
                <div className="text-xs text-gray-500">Monthly EMI: ₹{i.emiDetails?.monthlyAmount}</div>
              </div>
                <div className="flex items-center space-x-2">
                <button onClick={async () => {
                    try {
                      await fixedExpenseAPI.createFromInventory(i._id);
                      await fetchList();
                      addNotification({ type: 'success', title: 'Added', message: 'Fixed expense created from inventory EMI' });
                    } catch (err) {
                      addNotification({ type: 'error', title: 'Error', message: 'Failed to create fixed expense from inventory' });
                    }
                  }} className="px-2 py-1 border rounded text-sm">Add EMI</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-2 text-sm text-gray-600">Staff Salaries (Monthly)</div>
        <div className="grid grid-cols-1 gap-2 mb-4">
          {staffList.filter(s => (s.staffType || '').toString() === 'monthly').map((s) => (
            <div key={s._id} className="p-2 border rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-gray-500">Salary: ₹{typeof s.salary === 'object' ? s.salary.basic || 0 : s.salary || 0} {s.staffType ? `· ${formatStaffType(s.staffType)}` : ''}</div>
              </div>
              
            </div>
          ))}
        </div>

        <div>
          <h4 className="font-medium mb-2">Active Fixed Expenses</h4>
          {loading ? <div>Loading...</div> : (
            <div className="space-y-2">
              {list.map((f) => (
                <div key={f._id} className="p-2 border rounded flex justify-between items-center">
                  <div>
                    <div className="font-medium">{f.title}</div>
                    <div className="text-xs text-gray-500">₹{f.amount} · {f.recurrence} · {f.source}{f.source === 'salary' ? ` (${formatStaffType(staffById[f.staff]?.staffType) || 'Salary'})` : ''}</div>
                  </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleDelete(f._id)} className="text-red-600 p-1"><Trash className="w-4 h-4"/></button>
                      {f.isActive ? <span className="text-green-600 text-sm">Active</span> : <span className="text-gray-500 text-sm">Inactive</span>}
                    </div>
                    <div className="ml-4 flex items-center space-x-2">
                      {/* current month payment status */}
                      <select value={isPaidThisMonth(f) ? 'paid' : 'unpaid'} onChange={(e) => {
                        const val = e.target.value === 'paid';
                        handleTogglePayment(f._id, val);
                      }} className="p-1 border rounded text-sm">
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FixedExpenses;
