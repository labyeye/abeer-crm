import { useState, useEffect } from 'react';
import { branchAPI, expenseAPI, bookingAPI, dailyExpensesAPI, companyAPI } from '../../services/api';
import { 
  DollarSign, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  Wallet,
  PieChart,
  Download,
  Receipt
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

const FinanceManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [filterPeriod, setFilterPeriod] = useState('month');
  const { addNotification } = useNotification();

  const [branches, setBranches] = useState<any[]>([]);
  // simple cache map for quick lookup of branch id -> branch object
  const [branchCache, setBranchCache] = useState<Record<string, any>>({});
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  // expenses array is represented via mergedTransactions and expenseCategories
  const [bookings, setBookings] = useState<any[]>([]);
  const [revenueByBranch, setRevenueByBranch] = useState<any[]>([]);
  const [expensesByBranch, setExpensesByBranch] = useState<any[]>([]);
  const [totals, setTotals] = useState({ revenue: 0, expenses: 0, net: 0 });
  const [loadingFinance, setLoadingFinance] = useState(false);
  const [monthlyData, setMonthlyData] = useState<Array<{month:string,income:number,expenses:number}>>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
  const [mergedTransactions, setMergedTransactions] = useState<any[]>([]);
  const [dailyByBranchState, setDailyByBranchState] = useState<Record<string, number>>({});

  const financialStats = {
    totalRevenue: totals.revenue || 0,
    totalExpenses: totals.expenses || 0,
    netProfit: totals.net || 0,
    pendingPayments: pendingInvoices.reduce((s, p) => s + (p.amount || 0), 0),
    monthlyGrowth: 0
  };

  // helpers (icons/colors handled inline)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-700';
      case 'pending': return 'bg-amber-50 text-amber-700';
      case 'failed': return 'bg-red-50 text-red-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const handleAddTransaction = () => {
    addNotification({
      type: 'info',
      title: 'Add Transaction',
      message: 'Transaction form opened'
    });
  };

  // Fetch branches and finance data
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingFinance(true);
        const branchesRes = await branchAPI.getBranches();
        setBranches(branchesRes.data || branchesRes || []);

        const analyticsRes = await expenseAPI.getFinanceAnalytics();
        const { data } = analyticsRes;
        setRevenueByBranch(data.revenue || []);
        setExpensesByBranch(data.expenses || []);

  // calculate totals: revenue from analytics, expenses computed from merged expense list (including daily expenses)
  const totalRevenue = (data.revenue || []).reduce((s: number, r: any) => s + (r.totalRevenue || 0), 0);
  // We'll compute totalExpenses from expData after merging daily expenses

        const expList = await expenseAPI.getExpenses();
        let expData = expList.data || expList || [];
        // also fetch daily expenses and merge so daily expenses appear in finance
        try {
          const dailyList = await dailyExpensesAPI.getExpenses();
          const dailyData = dailyList.data || dailyList || [];
          // tag daily expenses so we can treat them separately (exclude from categories)
          const taggedDaily = (dailyData || []).map((d: any) => ({ ...d, isDailyExpense: true }));
          expData = [...(expData || []), ...taggedDaily];
        } catch (err) {
          // non-fatal: if daily expenses endpoint fails, proceed with regular expenses
          console.warn('Failed to fetch daily expenses for finance view', err);
        }
        // Normalize expenses: attach branchName (resolve branch id -> name) and
        // accept daily-expense shaped objects (use `purpose` as fallback for title/category)
        const ensureBranchCached = async (branchId: string) => {
          if (!branchId) return;
          if (branchCache[branchId]) return;
          try {
            const res = await companyAPI.getCompany(branchId);
            const b = res.data || res;
            setBranchCache((prev) => ({ ...prev, [branchId]: b }));
            setBranches((prev) => (prev.find((x: any) => x._id === branchId) ? prev : [...prev, b]));
          } catch (err) {
            console.warn('Failed to fetch branch', branchId, err);
          }
        };

        const resolveBranchName = (branch: any) => {
          if (!branch) return '';
          if (typeof branch === 'string') {
            const b = branchCache[branch] || (branches || []).find((br) => br._id === branch);
            return b?.name || branch;
          }
          if (typeof branch === 'object') return branch.name || branch._id || '';
          return String(branch);
        };
        // pre-fetch any missing branches referenced by expenses
        await Promise.all((expData || []).map(async (ex: any) => {
          const bid = typeof ex.branch === 'string' ? ex.branch : ex.branch?._id;
          if (bid && !((branches || []).find(b => b._id === bid) || branchCache[bid])) {
            await ensureBranchCached(bid);
          }
        }));
        expData = (expData || []).map((ex: any) => ({
          ...ex,
          branchName: resolveBranchName(ex.branch),
        }));

        // fetch bookings to compute revenue/time series and pending invoices
        const bookingsRes = await bookingAPI.getBookings();
        const bookingsData = bookingsRes.data || bookingsRes || [];
        setBookings(bookingsData);

        // compute monthly data for last 6 months
        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({ date: d, label: d.toLocaleString('default', { month: 'short' }) });
        }
        const md = months.map((m) => {
          const income = bookingsData.reduce((sum: number, b: any) => {
            const bd = b.functionDetails?.date ? new Date(b.functionDetails.date) : new Date(b.createdAt || b.pricing?.createdAt);
            return (bd.getFullYear() === m.date.getFullYear() && bd.getMonth() === m.date.getMonth()) ? sum + (b.pricing?.totalAmount || 0) : sum;
          }, 0);
          const exp = expData.reduce((sum: number, ex: any) => {
            const ed = ex.expenseDate ? new Date(ex.expenseDate) : new Date(ex.createdAt);
            return (ed.getFullYear() === m.date.getFullYear() && ed.getMonth() === m.date.getMonth()) ? sum + (ex.amount || 0) : sum;
          }, 0);
          return { month: m.label, income, expenses: exp };
        });
        setMonthlyData(md);

        // compute expense categories
        // compute categories but exclude daily expenses from category map
        const catMap: Record<string, number> = {};
        expData.filter((ex: any) => !ex.isDailyExpense).forEach((ex: any) => { const c = ex.category || ex.purpose || 'other'; catMap[c] = (catMap[c] || 0) + (ex.amount || 0); });
        // compute daily expense sums per branch and store in state
        const dailyByBranch: Record<string, number> = {};
        expData.filter((ex: any) => ex.isDailyExpense).forEach((ex: any) => {
          const bid = (typeof ex.branch === 'string') ? ex.branch : ex.branch?._id;
          if (!bid) return;
          dailyByBranch[bid] = (dailyByBranch[bid] || 0) + (ex.amount || 0);
        });
        setDailyByBranchState(dailyByBranch);
        const totalExp = Object.values(catMap).reduce((s: number, v: any) => s + v, 0) || 1;
        const cats = Object.keys(catMap).map((k) => ({ category: k, amount: catMap[k], percentage: Math.round((catMap[k] / totalExp) * 100) }));
        setExpenseCategories(cats);

        // pending invoices from bookings with remaining amount > 0
        const pending = bookingsData.filter((b: any) => (b.pricing?.remainingAmount || 0) > 0 || (b.paymentStatus && b.paymentStatus !== 'completed')).map((b: any) => ({ id: b._id, client: b.client?.name || '', amount: b.pricing?.remainingAmount || (b.pricing?.totalAmount - b.pricing?.advanceAmount) || 0, dueDate: b.functionDetails?.date }));
        setPendingInvoices(pending);

        // merged transactions: expenses + bookings as income
        const txs = [
          ...expData.map((ex: any) => ({ _id: ex._id, type: 'expense', title: ex.title || ex.purpose || ex.category, amount: ex.amount, date: ex.expenseDate || ex.createdAt, status: ex.status, vendor: ex.vendor, branchName: ex.branchName })),
          ...bookingsData.map((b: any) => ({ _id: b._id, type: 'income', title: b.serviceNeeded || b.bookingNumber, amount: b.pricing?.totalAmount || 0, date: b.functionDetails?.date || b.createdAt, status: b.status, client: b.client?.name }))
        ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  setMergedTransactions(txs);
  // compute total expenses from merged expense list
  const computedTotalExpenses = (expData || []).reduce((s: number, ex: any) => s + (ex.amount || 0), 0);
  setTotals({ revenue: totalRevenue, expenses: computedTotalExpenses, net: totalRevenue - computedTotalExpenses });
      } catch (err) {
        console.error(err);
        addNotification({ type: 'error', title: 'Error', message: 'Failed to load finance data' });
      } finally {
        setLoadingFinance(false);
      }
    };
    load();
  }, []);

  const onBranchChange = async (branchId: string) => {
    setSelectedBranch(branchId);
    try {
      setLoadingFinance(true);
      const params = branchId ? { branch: branchId } : {};
      const analyticsRes = await expenseAPI.getFinanceAnalytics(params);
      const { data } = analyticsRes;
      setRevenueByBranch(data.revenue || []);
      setExpensesByBranch(data.expenses || []);
  const totalRevenue = (data.revenue || []).reduce((s: number, r: any) => s + (r.totalRevenue || 0), 0);
      const expList = await expenseAPI.getExpenses(params);
      let expData = expList.data || expList || [];
      // also include daily expenses for selected branch
      try {
        const dailyList = await dailyExpensesAPI.getExpenses(params);
        const dailyData = dailyList.data || dailyList || [];
        const taggedDaily = (dailyData || []).map((d: any) => ({ ...d, isDailyExpense: true }));
        expData = [...(expData || []), ...taggedDaily];
      } catch (err) {
        console.warn('Failed to fetch daily expenses for filtered finance view', err);
      }
      // Normalize expenses same as initial load
      const resolveBranchName = (branch: any) => {
        if (!branch) return '';
        if (typeof branch === 'string') {
          const b = (branches || []).find((br) => br._id === branch);
          return b?.name || branch;
        }
        if (typeof branch === 'object') return branch.name || branch._id || '';
        return String(branch);
      };
      expData = (expData || []).map((ex: any) => ({
        ...ex,
        branchName: resolveBranchName(ex.branch),
      }));

      // refresh bookings for branch
      const bookingsRes = await bookingAPI.getBookings(params);
      const bookingsData = bookingsRes.data || bookingsRes || [];
      setBookings(bookingsData);

      // recompute monthlyData, categories, pending, merged
      const now = new Date();
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ date: d, label: d.toLocaleString('default', { month: 'short' }) });
      }
      const md = months.map((m) => {
        const income = bookingsData.reduce((sum: number, b: any) => {
          const bd = b.functionDetails?.date ? new Date(b.functionDetails.date) : new Date(b.createdAt || b.pricing?.createdAt);
          return (bd.getFullYear() === m.date.getFullYear() && bd.getMonth() === m.date.getMonth()) ? sum + (b.pricing?.totalAmount || 0) : sum;
        }, 0);
        const exp = expData.reduce((sum: number, ex: any) => {
          const ed = ex.expenseDate ? new Date(ex.expenseDate) : new Date(ex.createdAt);
          return (ed.getFullYear() === m.date.getFullYear() && ed.getMonth() === m.date.getMonth()) ? sum + (ex.amount || 0) : sum;
        }, 0);
        return { month: m.label, income, expenses: exp };
      });
      setMonthlyData(md);

  const catMap: Record<string, number> = {};
  expData.forEach((ex: any) => { const c = ex.category || ex.purpose || 'other'; catMap[c] = (catMap[c] || 0) + (ex.amount || 0); });
      const totalExp = Object.values(catMap).reduce((s: number, v: any) => s + v, 0) || 1;
      const cats = Object.keys(catMap).map((k) => ({ category: k, amount: catMap[k], percentage: Math.round((catMap[k] / totalExp) * 100) }));
      setExpenseCategories(cats);

      const pending = bookingsData.filter((b: any) => (b.pricing?.remainingAmount || 0) > 0 || (b.paymentStatus && b.paymentStatus !== 'completed')).map((b: any) => ({ id: b._id, client: b.client?.name || '', amount: b.pricing?.remainingAmount || (b.pricing?.totalAmount - b.pricing?.advanceAmount) || 0, dueDate: b.functionDetails?.date }));
      setPendingInvoices(pending);

      const txs = [
        ...expData.map((ex: any) => ({ _id: ex._id, type: 'expense', title: ex.title || ex.purpose || ex.category, amount: ex.amount, date: ex.expenseDate || ex.createdAt, status: ex.status, vendor: ex.vendor, branchName: ex.branchName })),
        ...bookingsData.map((b: any) => ({ _id: b._id, type: 'income', title: b.serviceNeeded || b.bookingNumber, amount: b.pricing?.totalAmount || 0, date: b.functionDetails?.date || b.createdAt, status: b.status, client: b.client?.name }))
      ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  setMergedTransactions(txs);
  const computedTotalExpenses = (expData || []).reduce((s: number, ex: any) => s + (ex.amount || 0), 0);
  setTotals({ revenue: totalRevenue, expenses: computedTotalExpenses, net: totalRevenue - computedTotalExpenses });
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to filter by branch' });
    } finally {
      setLoadingFinance(false);
    }
  };

  const handleGenerateReport = () => {
    addNotification({
      type: 'success',
      title: 'Report Generated',
      message: 'Financial report has been generated and is ready for download'
    });
  };

  const maxAmount = Math.max(...monthlyData.map(d => Math.max(d.income, d.expenses)));

  // prepare branch keys to show in Branch Breakdown: union of revenue, expenses, daily expenses and known branches
  const branchKeysSet = new Set<string>();
  (revenueByBranch || []).forEach((r: any) => branchKeysSet.add(r._id || r.branch));
  (expensesByBranch || []).forEach((e: any) => branchKeysSet.add(e._id || e.branch));
  Object.keys(dailyByBranchState || {}).forEach((k) => branchKeysSet.add(k));
  (branches || []).forEach((b: any) => branchKeysSet.add(b._id));
  const branchKeys = Array.from(branchKeysSet);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Management</h1>
          <p className="text-gray-600 mt-1">Track revenue, expenses, and financial performance</p>
          <div className="text-sm text-gray-500 mt-1">Total Bookings: <span className="font-medium text-gray-700">{bookings.length}</span></div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleGenerateReport}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all duration-200 flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
          <button
            onClick={handleAddTransaction}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-emerald-500 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{financialStats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-red-500 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">₹{financialStats.totalExpenses.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Profit</p>
              <p className="text-2xl font-bold text-gray-900">₹{financialStats.netProfit.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-amber-500 p-3 rounded-lg">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900">₹{financialStats.pendingPayments.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Growth Rate</p>
              <p className="text-2xl font-bold text-gray-900">+{financialStats.monthlyGrowth}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: PieChart },
              { id: 'transactions', name: 'Transactions', icon: Receipt },
              { id: 'invoices', name: 'Pending Invoices', icon: CreditCard },
              { id: 'expenses', name: 'Expense Analysis', icon: TrendingDown }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {loadingFinance && (
            <div className="py-4 text-center text-sm text-gray-500">Loading finance data...</div>
          )}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue vs Expenses Chart */}
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Expenses</h3>
                  <select
                    value={selectedBranch}
                    onChange={(e) => onBranchChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All Branches</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-4">
                  <div className="mb-4">
                    <div className="flex items-center space-x-6">
                      <div className="text-sm text-gray-600">Total Revenue</div>
                      <div className="text-xl font-bold">₹{totals.revenue.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Total Expenses</div>
                      <div className="text-xl font-bold text-red-600">₹{totals.expenses.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Net</div>
                      <div className="text-xl font-bold text-blue-600">₹{totals.net.toLocaleString()}</div>
                    </div>
                  </div>
                  {monthlyData.map((data) => (
                    <div key={data.month} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{data.month}</span>
                        <div className="flex space-x-4">
                          <span className="text-emerald-600">${(data.income / 1000).toFixed(0)}k</span>
                          <span className="text-red-600">${(data.expenses / 1000).toFixed(0)}k</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-emerald-500 h-3 rounded-full"
                            style={{ width: `${(data.income / maxAmount) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-red-500 h-3 rounded-full"
                            style={{ width: `${(data.expenses / maxAmount) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expense Categories */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Categories</h3>
                <div className="space-y-3">
                  {expenseCategories.map((category) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full ${category.color} mr-3`}></div>
                        <span className="text-sm font-medium text-gray-900">{category.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">${category.amount.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{category.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Branch breakdown - simple list using analytics data */}
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">Branch Breakdown</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    {branchKeys.map((key: any) => {
                      const rb = (revenueByBranch || []).find((r: any) => (r._id || r.branch) === key) || {};
                      const expObj = (expensesByBranch || []).find((e: any) => (e._id || e.branch) === key) || {};
                      const expVal = expObj ? (expObj.totalExpenses || expObj.expenses || 0) : 0;
                      const dailyVal = dailyByBranchState[key] || 0;
                      const totalExpForBranch = expVal + dailyVal;
                      return (
                        <div key={key} className="flex justify-between">
                          <div>{(branches.find(b => b._id === key)?.name) || (rb.name) || key}</div>
                          <div>Revenue: ₹{(rb.totalRevenue || rb.revenue || 0).toLocaleString()} • Expenses: ₹{totalExpForBranch.toLocaleString()}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>
              
              <div className="space-y-4">
                {/* Render merged transactions: expenses + booking incomes */}
                {mergedTransactions.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No transactions found</div>
                ) : (
                  mergedTransactions.map((tx) => (
                    <div key={tx._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-4 ${tx.type === 'income' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                          {(tx.type === 'income' ? TrendingUp : TrendingDown)({ className: `w-5 h-5 ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}` })}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{tx.title || tx.description || tx.category}</h4>
                          <p className="text-sm text-gray-600">{tx.vendor || tx.client || ''} • {tx.paymentMethod || tx.method || ''}</p>
                          <p className="text-xs text-gray-500">{new Date(tx.date || tx.expenseDate || tx.createdAt).toLocaleDateString()}</p>
                          {tx.branchName && <p className="text-xs text-gray-400">Branch: {tx.branchName}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {tx.type === 'income' ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString()}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(tx.status || 'completed')}`}>
                          {tx.status || 'completed'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Pending Invoices</h3>
              <div className="space-y-4">
                {pendingInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-lg mr-4">
                        <Receipt className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{invoice.id}</h4>
                        <p className="text-sm text-gray-600">{invoice.client}</p>
                        <p className="text-xs text-gray-500">{invoice.service}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">${invoice.amount.toLocaleString()}</p>
                      <p className={`text-sm ${invoice.overdue ? 'text-red-600' : 'text-gray-600'}`}>
                        Due: {invoice.dueDate}
                      </p>
                      {invoice.overdue && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-50 text-red-700">
                          Overdue
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Expense Analysis</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Monthly Breakdown</h4>
                  {expenseCategories.map((category) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">{category.category}</span>
                        <span className="text-sm font-medium text-gray-900">${category.amount.toLocaleString()}</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className={`${category.color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Expense Insights</h4>
                  <div className="space-y-3 text-sm">
                    <p className="text-gray-600">• Equipment purchases account for 35% of total expenses</p>
                    <p className="text-gray-600">• Staff costs have increased by 12% this quarter</p>
                    <p className="text-gray-600">• Marketing spend is below industry average</p>
                    <p className="text-gray-600">• Consider bulk equipment purchases for better rates</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceManagement;