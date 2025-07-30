import React, { useState } from 'react';
import { 
  DollarSign, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  Wallet,
  PieChart,
  Calendar,
  Filter,
  Download,
  Receipt,
  Building,
  Users
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

const FinanceManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [filterPeriod, setFilterPeriod] = useState('month');
  const { addNotification } = useNotification();

  const financialStats = {
    totalRevenue: 156750,
    totalExpenses: 89420,
    netProfit: 67330,
    pendingPayments: 23500,
    monthlyGrowth: 18.5
  };

  const recentTransactions = [
    {
      id: 1,
      type: 'income',
      description: 'Wedding Photography - Johnson Family',
      amount: 2500,
      date: '2024-01-15',
      status: 'completed',
      client: 'Sarah Johnson',
      method: 'Bank Transfer'
    },
    {
      id: 2,
      type: 'expense',
      description: 'Equipment Purchase - Canon EOS R5',
      amount: 3899,
      date: '2024-01-14',
      status: 'completed',
      vendor: 'Camera Store Inc.',
      method: 'Credit Card'
    },
    {
      id: 3,
      type: 'income',
      description: 'Corporate Headshots - Tech Innovations',
      amount: 800,
      date: '2024-01-13',
      status: 'pending',
      client: 'Tech Innovations Inc.',
      method: 'Invoice'
    },
    {
      id: 4,
      type: 'expense',
      description: 'Studio Rent - January',
      amount: 2200,
      date: '2024-01-01',
      status: 'completed',
      vendor: 'Property Management Co.',
      method: 'Auto Debit'
    },
    {
      id: 5,
      type: 'income',
      description: 'Family Portrait - Wilson Family',
      amount: 450,
      date: '2024-01-12',
      status: 'completed',
      client: 'Emma Wilson',
      method: 'Cash'
    }
  ];

  const monthlyData = [
    { month: 'Jul', income: 45000, expenses: 28000 },
    { month: 'Aug', income: 52000, expenses: 31000 },
    { month: 'Sep', income: 48000, expenses: 29000 },
    { month: 'Oct', income: 61000, expenses: 35000 },
    { month: 'Nov', income: 55000, expenses: 32000 },
    { month: 'Dec', income: 67000, expenses: 38000 }
  ];

  const expenseCategories = [
    { category: 'Office Stationery Expenses', amount: 1200, percentage: 5, color: 'bg-blue-500' },
    { category: 'Tea & Refreshments', amount: 800, percentage: 3, color: 'bg-green-500' },
    { category: 'Office Furniture', amount: 2500, percentage: 8, color: 'bg-yellow-500' },
    { category: 'Renovation & Repairs', amount: 1800, percentage: 6, color: 'bg-orange-500' },
    { category: 'Cleaning & Housekeeping Expenses', amount: 900, percentage: 3, color: 'bg-pink-500' },
    { category: 'Utilities – Water Charges', amount: 700, percentage: 2, color: 'bg-cyan-500' },
    { category: 'Communication Expenses', amount: 1100, percentage: 4, color: 'bg-indigo-500' },
    { category: 'Office Equipment / Computer Accessories', amount: 3200, percentage: 10, color: 'bg-purple-500' },
    { category: 'Fixed Asset', amount: 4000, percentage: 13, color: 'bg-red-500' },
    { category: 'Office Maintenance / Miscellaneous Exp', amount: 1500, percentage: 5, color: 'bg-gray-500' },
    { category: 'Documents & Legal Expense', amount: 600, percentage: 2, color: 'bg-teal-500' },
    { category: 'Raw Material', amount: 2000, percentage: 7, color: 'bg-lime-500' },
    { category: 'Administrative & Compliance Expense', amount: 1000, percentage: 3, color: 'bg-fuchsia-500' },
    { category: 'Loan/EMI (Asset/Fixed Asset)', amount: 3500, percentage: 11, color: 'bg-amber-500' },
    { category: 'Loan/EMI (Other)', amount: 1200, percentage: 4, color: 'bg-violet-500' },
    { category: 'Vendor Payment', amount: 2200, percentage: 7, color: 'bg-rose-500' },
    { category: 'Service Expense', amount: 1700, percentage: 6, color: 'bg-sky-500' },
    { category: 'Assets', amount: 3000, percentage: 10, color: 'bg-neutral-500' }
  ];

  const pendingInvoices = [
    {
      id: 'INV-001',
      client: 'Global Marketing Agency',
      amount: 5200,
      dueDate: '2024-01-25',
      overdue: false,
      service: 'Product Photography Campaign'
    },
    {
      id: 'INV-002',
      client: 'Startup Tech Co.',
      amount: 1800,
      dueDate: '2024-01-20',
      overdue: true,
      service: 'Corporate Event Coverage'
    },
    {
      id: 'INV-003',
      client: 'Fashion Brand LLC',
      amount: 3400,
      dueDate: '2024-01-30',
      overdue: false,
      service: 'Fashion Shoot & Editing'
    }
  ];

  const getTransactionIcon = (type: string) => {
    return type === 'income' ? TrendingUp : TrendingDown;
  };

  const getTransactionColor = (type: string) => {
    return type === 'income' ? 'text-emerald-600' : 'text-red-600';
  };

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

  const handleGenerateReport = () => {
    addNotification({
      type: 'success',
      title: 'Report Generated',
      message: 'Financial report has been generated and is ready for download'
    });
  };

  const maxAmount = Math.max(...monthlyData.map(d => Math.max(d.income, d.expenses)));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Management</h1>
          <p className="text-gray-600 mt-1">Track revenue, expenses, and financial performance</p>
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
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue vs Expenses Chart */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Expenses (6 Months)</h3>
                <div className="space-y-4">
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
                {recentTransactions.map((transaction) => {
                  const Icon = getTransactionIcon(transaction.type);
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-4 ${transaction.type === 'income' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                          <Icon className={`w-5 h-5 ${getTransactionColor(transaction.type)}`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{transaction.description}</h4>
                          <p className="text-sm text-gray-600">
                            {transaction.client || transaction.vendor} • {transaction.method}
                          </p>
                          <p className="text-xs text-gray-500">{transaction.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${getTransactionColor(transaction.type)}`}>
                          {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
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