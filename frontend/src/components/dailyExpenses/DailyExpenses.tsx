import { useEffect, useState } from "react";
import { Plus, Edit, Trash, DollarSign } from "lucide-react";
import { dailyExpensesAPI, branchAPI } from "../../services/api";
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
  });
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [showFixedExpenses, setShowFixedExpenses] = useState(false);
  const [purposes, setPurposes] = useState<any[]>([]);
  const [showAddPurpose, setShowAddPurpose] = useState(false);
  const [newPurposeName, setNewPurposeName] = useState("");
  const [editingPurposeId, setEditingPurposeId] = useState<string | null>(null);
  const [editingPurposeName, setEditingPurposeName] = useState("");
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
      setFormData({ date: "", purpose: "", amount: "", notes: "" });
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center">
          <DollarSign className="w-5 h-5 mr-2" /> Daily Expenses
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1 bg-green-600 text-white rounded flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Expense
          </button>
          <button
            onClick={() => setShowFixedExpenses((s) => !s)}
            className="px-3 py-1 bg-blue-600 text-white rounded flex items-center"
            title="Fixed Expenses"
          >
            Fixed Expenses
          </button>
        </div>
      </div>

      {showForm && (
        <div className="p-4 border rounded bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="p-2 border rounded"
            />
            <div className="ml-2 text-sm text-gray-600">
              {formData.date ? formatDateDMY(formData.date) : ""}
            </div>
            <div className="flex items-center space-x-2 w-full">
              <div className="flex-1">
                <select
                  value={formData.purpose}
                  onChange={(e) =>
                    setFormData({ ...formData, purpose: e.target.value })
                  }
                  className="p-2 border rounded w-full"
                >
                  <option value="">-- Select purpose --</option>
                  {purposes.map((p) => (
                    <option key={p._id || p.id || p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-shrink-0 flex items-center space-x-1">
                <button
                  onClick={() => setShowAddPurpose(true)}
                  className="px-2 py-1 border rounded bg-gray-50"
                  title="Add purpose"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    // open edit for currently selected purpose
                    const selected = purposes.find(
                      (p) => p.name === formData.purpose
                    );
                    if (!selected) return setEditingPurposeId(null);
                    setEditingPurposeId(selected._id || selected.id || null);
                    setEditingPurposeName(selected.name || "");
                  }}
                  className="px-2 py-1 border rounded bg-gray-50"
                  title="Edit purpose"
                >
                  Edit
                </button>
              </div>
            </div>
            <input
              placeholder="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="p-2 border rounded"
            />
          </div>

          {showAddPurpose && (
            <div className="mt-2 flex items-center space-x-2">
              <input
                placeholder="New purpose"
                value={newPurposeName}
                onChange={(e) => setNewPurposeName(e.target.value)}
                className="p-2 border rounded w-full"
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
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowAddPurpose(false);
                  setNewPurposeName("");
                }}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>
            </div>
          )}

          {editingPurposeId && (
            <div className="mt-2 flex items-center space-x-2">
              <input
                placeholder="Edit purpose"
                value={editingPurposeName}
                onChange={(e) => setEditingPurposeName(e.target.value)}
                className="p-2 border rounded w-full"
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
                    // if currently selected purpose name changed, update formData
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
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingPurposeId(null);
                  setEditingPurposeName("");
                }}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>
            </div>
          )}

          {}
          {user && user.role === "chairman" ? (
            <div className="mt-2">
              <label className="block text-sm text-gray-700 mb-1">Branch</label>
              <select
                value={selectedBranch || ""}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="p-2 border rounded w-full"
              >
                <option value="">-- Select branch --</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._1d || b._id}>
                    {b.name || b.companyName || b.code}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            user?.branchId && (
              <div className="mt-2">
                <label className="block text-sm text-gray-700 mb-1">
                  Branch
                </label>
                <div className="p-2 border rounded bg-gray-50">
                  {user.branchId}
                </div>
              </div>
            )
          )}

          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            className="w-full mt-2 p-2 border rounded"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1 mr-2 border rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-3 py-1 bg-blue-600 text-white rounded"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {showFixedExpenses && (
        <div className="mt-4">
          <FixedExpenses onClose={() => setShowFixedExpenses(false)} />
        </div>
      )}

      
      <div className="bg-white p-4 rounded">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left text-sm text-gray-600">
                <th>Date</th>
                <th>Purpose</th>
                <th>Amount</th>
                <th>Paid By</th>
                {user && user.role === "chairman" && <th>Branch</th>}
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp._id} className="border-t">
                  <td>{formatDateDMY(exp.date || exp.createdAt)}</td>
                  <td>{exp.purpose}</td>
                  <td>₹{exp.amount}</td>
                  <td>{exp.paidBy?.name || "-"}</td>
                  {user && user.role === "chairman" && (
                    <td>{getBranchName(exp.branch)}</td>
                  )}
                  <td>{exp.notes}</td>
                  <td>
                    <button className="p-1 mr-2 text-blue-600">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(exp._id)}
                      className="p-1 text-red-600"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DailyExpenses;
