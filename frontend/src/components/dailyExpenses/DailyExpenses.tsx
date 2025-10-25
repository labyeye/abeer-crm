import { useEffect, useState } from "react";
import { Plus, Edit, Trash, IndianRupee } from "lucide-react";
import { dailyExpensesAPI, branchAPI, clientAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import FixedExpenses from "../finance/FixedExpenses";

const DailyExpenses = () => {
  const { addNotification } = useNotification();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>({
    date: "",
    purpose: "",
    amount: "",
    notes: "",
    client: "",
  });
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [showFixedExpenses, setShowFixedExpenses] = useState(false);
  const [purposes, setPurposes] = useState<any[]>([]);
  const [showAddPurpose, setShowAddPurpose] = useState(false);
  const [newPurposeName, setNewPurposeName] = useState("");
  const [editingPurposeId, setEditingPurposeId] = useState<string | null>(null);
  const [editingPurposeName, setEditingPurposeName] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const { user } = useAuth();

  const getBranchName = (branch: any) => {
    if (!branch) return "-";

    if (typeof branch === "object")
      return branch.name || branch.companyName || branch.code || "-";

    const found = branches.find((b) => b._id === branch || b.id === branch);
    return found
      ? found.name || found.companyName || found.code || branch
      : branch;
  };

  const formatDateDMY = (d: any) => {
    if (!d) return "";
    const dateObj = d instanceof Date ? d : new Date(d);
    if (isNaN(dateObj.getTime())) return "";
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const yyyy = String(dateObj.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  };

  useEffect(() => {
    fetchExpenses();
    fetchPurposes();
    fetchClients();

    if (user) {
      if (user.role === "chairman") {
        fetchBranches();
      } else if (user.branchId) {
        setSelectedBranch(user.branchId);
      }
    }
  }, [user]);

  const fetchPurposes = async () => {
    try {
      const res = await dailyExpensesAPI.getPurposes();
      const list = (res && (res.data || res)) || [];
      setPurposes(list);
    } catch (err) {
      // ignore
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await dailyExpensesAPI.getExpenses();
      const list = (res && (res.data || res)) || [];
      setExpenses(list);
    } catch (err) {
      addNotification({ type: "error", title: "Error", message: "Failed to load expenses" });
    } finally {
      setLoading(false);
    }
  };


  const fetchBranches = async () => {
    try {
      const bRes = await branchAPI.getBranches();
      const list = (bRes && (bRes.data || bRes)) || [];
      setBranches(list);

      if (list.length > 0 && !selectedBranch) setSelectedBranch(list[0]._id);
    } catch (error) {}
  };

  const fetchClients = async () => {
    try {
      const cRes = await clientAPI.getClients();
      const list = (cRes && (cRes.data || cRes)) || [];
      setClients(list);
    } catch (error) {
      console.error("Failed to fetch clients", error);
    }
  };

  const handleCreate = async () => {
    try {
      const branchToSend =
        user && user.role === "chairman" ? selectedBranch : user?.branchId;

      const payload: any = {
        date: formData.date || new Date().toISOString(),
        purpose: formData.purpose,
        amount: Number(formData.amount),
        notes: formData.notes,
      };

      if (branchToSend) payload.branch = branchToSend;
      if (formData.client) payload.client = formData.client;

      const result = await dailyExpensesAPI.createExpense(payload);

      if (result && (result.data || result)) {
        const newItem = result.data || result;
        setExpenses((prev) => [newItem, ...prev]);
      }
      addNotification({
        type: "success",
        title: "Created",
        message: "Expense added",
      });
      setShowForm(false);
      setFormData({ date: "", purpose: "", amount: "", notes: "", client: "" });
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to add expense",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    try {
      await dailyExpensesAPI.deleteExpense(id);
      addNotification({
        type: "success",
        title: "Deleted",
        message: "Expense deleted",
      });
      fetchExpenses();
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to delete expense",
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <IndianRupee className="w-8 h-8 mr-3" /> Daily Expenses
            </h2>
            <p className="text-blue-100 mt-1 text-sm">
              Track and manage your daily business expenses
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2.5 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center shadow-md"
            >
              <Plus className="w-5 h-5 mr-2" /> Add Expense
            </button>
            <button
              onClick={() => setShowFixedExpenses((s) => !s)}
              className="px-4 py-2.5 bg-blue-800 text-white rounded-lg font-semibold hover:bg-blue-900 transition shadow-md"
              title="Fixed Expenses"
            >
              Fixed Expenses
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Add New Expense</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {formData.date && (
                <p className="mt-1 text-xs text-gray-500">
                  {formatDateDMY(formData.date)}
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="Enter amount"
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-2">
                <select
                  value={formData.purpose}
                  onChange={(e) =>
                    setFormData({ ...formData, purpose: e.target.value })
                  }
                  className="flex-1 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Select purpose --</option>
                  {purposes.map((p) => (
                    <option key={p._id || p.id || p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowAddPurpose(true)}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition text-sm"
                  title="Add purpose"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const selected = purposes.find(
                      (p) => p.name === formData.purpose
                    );
                    if (!selected) return setEditingPurposeId(null);
                    setEditingPurposeId(selected._id || selected.id || null);
                    setEditingPurposeName(selected.name || "");
                  }}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition text-sm"
                  title="Edit purpose"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Client */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client (Optional)
              </label>
              <select
                value={formData.client}
                onChange={(e) =>
                  setFormData({ ...formData, client: e.target.value })
                }
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Select client --</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.email ? `(${c.email})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Add Purpose Modal */}
          {showAddPurpose && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Add New Purpose</h4>
              <div className="flex items-center space-x-2">
                <input
                  placeholder="Enter purpose name"
                  value={newPurposeName}
                  onChange={(e) => setNewPurposeName(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={async () => {
                    if (!newPurposeName || !newPurposeName.trim()) return;
                    try {
                      const res = await dailyExpensesAPI.createPurpose({
                        name: newPurposeName.trim(),
                      });
                      const created = (res && (res.data || res)) || res;
                      setPurposes((prev) => [created, ...prev]);
                      setFormData({
                        ...formData,
                        purpose: created.name || created,
                      });
                      setNewPurposeName("");
                      setShowAddPurpose(false);
                      addNotification({
                        type: "success",
                        title: "Added",
                        message: "Purpose added",
                      });
                    } catch (err: any) {
                      addNotification({
                        type: "error",
                        title: "Error",
                        message:
                          err?.response?.data?.message || "Failed to add purpose",
                      });
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowAddPurpose(false);
                    setNewPurposeName("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Edit Purpose Modal */}
          {editingPurposeId && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Edit Purpose</h4>
              <div className="flex items-center space-x-2">
                <input
                  placeholder="Edit purpose name"
                  value={editingPurposeName}
                  onChange={(e) => setEditingPurposeName(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                />
                <button
                  onClick={async () => {
                    if (!editingPurposeName || !editingPurposeName.trim()) return;
                    try {
                      const res = await dailyExpensesAPI.updatePurpose(
                        editingPurposeId as string,
                        { name: editingPurposeName.trim() }
                      );
                      const updated = (res && (res.data || res)) || res;
                      setPurposes((prev) =>
                        prev.map((p) => (p._id === updated._id ? updated : p))
                      );
                      if (
                        formData.purpose &&
                        formData.purpose ===
                          purposes.find((p) => p._id === updated._id)?.name
                      ) {
                        setFormData({ ...formData, purpose: updated.name });
                      }
                      setEditingPurposeId(null);
                      setEditingPurposeName("");
                      addNotification({
                        type: "success",
                        title: "Updated",
                        message: "Purpose updated",
                      });
                    } catch (err: any) {
                      addNotification({
                        type: "error",
                        title: "Error",
                        message:
                          err?.response?.data?.message ||
                          "Failed to update purpose",
                      });
                    }
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingPurposeId(null);
                    setEditingPurposeName("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Branch Selection */}
          {user && user.role === "chairman" ? (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedBranch || ""}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Select branch --</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name || b.companyName || b.code}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            user?.branchId && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch
                </label>
                <div className="p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                  {getBranchName(user.branchId)}
                </div>
              </div>
            )
          )}

          {/* Notes */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              placeholder="Enter any additional notes..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowForm(false);
                setFormData({ date: "", purpose: "", amount: "", notes: "", client: "" });
              }}
              className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Save Expense
            </button>
          </div>
        </div>
      )}

      {showFixedExpenses && (
        <div className="mt-4">
          <FixedExpenses onClose={() => setShowFixedExpenses(false)} />
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12">
            <IndianRupee className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-lg">No expenses recorded yet</p>
            <p className="text-gray-400 text-sm mt-1">Click "Add Expense" to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Paid By
                  </th>
                  {user && user.role === "chairman" && (
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Branch
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateDMY(exp.date || exp.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {exp.purpose}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      ₹{exp.amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {exp.client ? (
                        <div>
                          <div className="font-medium">{exp.client.name}</div>
                          {exp.client.email && (
                            <div className="text-xs text-gray-500">{exp.client.email}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {exp.paidBy?.name || "-"}
                    </td>
                    {user && user.role === "chairman" && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {getBranchName(exp.branch)}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                      {exp.notes || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyExpenses;
