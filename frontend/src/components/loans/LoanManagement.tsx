import React, { useEffect, useState } from "react";
import { loanAPI, branchAPI, clientAPI } from "../../services/api";
import { useNotification } from "../../contexts/NotificationContext";

const LoanManagement: React.FC = () => {
  const { addNotification } = useNotification();
  const [branches, setBranches] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    count: 0,
    totalTaken: 0,
    totalRemaining: 0,
    totalPaid: 0,
  });
  const [modalLoan, setModalLoan] = useState<any | null>(null);
  const [repayAmount, setRepayAmount] = useState<number | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    type: "bank",
    branch: "",
    amount: 0,
    dateReceived: new Date().toISOString().slice(0, 10),
    interestRate: 0,
    interestPeriodUnit: "monthly",
    tenure: 0,
    tenureUnit: "months",
    purpose: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const b: any = await branchAPI.getBranches();
        setBranches(b.data || b || []);
      } catch (e) {}
      try {
        const c: any = await clientAPI.getClients();
        setClients(c.data || c || []);
      } catch (e) {}
      fetchLoans();
    })();
  }, []);

  const fetchLoans = async () => {
    try {
      const res: any = await loanAPI.listLoans();
      const loansList = res.data || res || [];
      setLoans(loansList);
      // compute richer summary client-side: totalTaken, totalPaid (sum repayments), totalRemaining (principal), totalRemainingWithInterest (principal + accrued interest)
      try {
        let totalTaken = 0,
          totalPaid = 0,
          totalRemaining = 0,
          totalRemainingWithInterest = 0;
        const now = new Date();
        loansList.forEach((ln: any) => {
          totalTaken += Number(ln.amount || 0);
          const paid = (ln.repayments || []).reduce(
            (s: number, r: any) => s + Number(r.amount || 0),
            0
          );
          totalPaid += paid;
          const principalRemaining = Number(ln.remainingAmount || 0);
          totalRemaining += principalRemaining;
          // accrued interest on the remaining principal from dateReceived to now (simple prorated)
          const msDiff = now.getTime() - new Date(ln.dateReceived).getTime();
          const daysSince = Math.floor(msDiff / (1000 * 60 * 60 * 24));
          let accrued = 0;
          if (daysSince > 5 && principalRemaining > 0) {
            const rate = Number(ln.interestRate || 0) / 100;
            accrued = principalRemaining * rate * (daysSince / 365);
            accrued = Math.round(accrued * 100) / 100;
          }
          totalRemainingWithInterest += principalRemaining + accrued;
        });
        setSummary({
          count: loansList.length,
          totalTaken: Math.round(totalTaken * 100) / 100,
          totalRemaining: Math.round(totalRemaining * 100) / 100,
          totalPaid: Math.round(totalPaid * 100) / 100,
          totalRemainingWithInterest:
            Math.round(totalRemainingWithInterest * 100) / 100,
        });
      } catch (err) {
        // ignore
      }
    } catch (e: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: e?.message || "Failed to load loans",
      });
    }
  };

  const openRepayModal = (loan: any) => {
    setModalLoan(loan);
    setRepayAmount(null);
    setShowSchedule(false);
    setSchedule([]);
  };

  const openEditModal = (loan: any) => {
    setModalLoan({ ...loan, _editing: true });
    setForm({
      type: loan.type,
      branch: loan.branch?._id || loan.branch,
      bankName: loan.bankName || "",
      bankAccountNumber: loan.bankAccountNumber || "",
      bankBranch: loan.bankBranch || "",
      client: loan.client?._id || loan.client,
      amount: loan.amount || 0,
      dateReceived: new Date(loan.dateReceived).toISOString().slice(0, 10),
      interestRate: loan.interestRate || 0,
      interestPeriodUnit: loan.interestPeriodUnit || "monthly",
      tenure: loan.tenure || 0,
      tenureUnit: loan.tenureUnit || "months",
      purpose: loan.purpose || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!modalLoan) return;
    try {
      const payload = { ...form };
      await loanAPI.updateLoan(modalLoan._id, payload);
      addNotification({
        type: "success",
        title: "Saved",
        message: "Loan updated",
      });
      fetchLoans();
      closeModal();
    } catch (e: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: e?.response?.data?.message || e?.message || "Failed to update",
      });
    }
  };

  const handleDelete = async (loan: any) => {
    if (!window.confirm("Delete this loan? This is a soft delete.")) return;
    try {
      await loanAPI.deleteLoan(loan._id);
      addNotification({
        type: "success",
        title: "Deleted",
        message: "Loan deleted",
      });
      fetchLoans();
    } catch (e: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: e?.response?.data?.message || e?.message || "Failed to delete",
      });
    }
  };

  const closeModal = () => {
    setModalLoan(null);
    setRepayAmount(null);
    setShowSchedule(false);
    setSchedule([]);
  };

  const computeFullPayPreview = (loan: any) => {
    const paidAt = new Date();
    const msDiff = paidAt.getTime() - new Date(loan.dateReceived).getTime();
    const daysSince = Math.floor(msDiff / (1000 * 60 * 60 * 24));
    let appliedInterest = 0;
    const principal = Number(loan.remainingAmount || loan.amount || 0);
    if (daysSince <= 5) appliedInterest = 0;
    else {
      const rate = Number(loan.interestRate || 0) / 100;
      appliedInterest =
        Math.round(principal * rate * (daysSince / 365) * 100) / 100;
    }
    const total = Math.round((principal + appliedInterest) * 100) / 100;
    return { appliedInterest, total, daysSince };
  };

  const handleFullPay = async (loan: any) => {
    try {
      const confirmMsg = window.confirm("Confirm full payment for this loan?");
      if (!confirmMsg) return;
      const res: any = await loanAPI.repayLoan(loan._id, { full: true });
      addNotification({
        type: "success",
        title: "Paid",
        message: `Paid ₹${res.paidAmount} (interest ₹${res.appliedInterest})`,
      });
      fetchLoans();
      closeModal();
    } catch (e: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: e?.response?.data?.message || e?.message || "Failed to repay",
      });
    }
  };

  const handleCustomPay = async (loan: any) => {
    try {
      if (!repayAmount || repayAmount <= 0)
        return addNotification({
          type: "error",
          title: "Invalid",
          message: "Enter a positive amount",
        });
      await loanAPI.repayLoan(loan._id, { amount: repayAmount });
      addNotification({
        type: "success",
        title: "Paid",
        message: `Paid ₹${repayAmount}`,
      });
      fetchLoans();
      closeModal();
    } catch (e: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: e?.response?.data?.message || e?.message || "Failed to repay",
      });
    }
  };

  // EMI schedule generator (equal principal+interest installments)
  const generateEMISchedule = (loan: any) => {
    const principal = Number(loan.amount || 0);
    let months = Number(loan.tenure || 0);
    if (loan.tenureUnit === "years") months = months * 12;
    if (!months || months <= 0) return [];
    // Interpret interestRate depending on interestPeriodUnit
    // If interestPeriodUnit === 'monthly' then interestRate is percent per month
    // If 'yearly' then interestRate is percent per year and we convert to monthly
    const rawRate = Number(loan.interestRate || 0);
    const monthlyRate =
      loan.interestPeriodUnit === "monthly"
        ? rawRate / 100
        : rawRate / 100 / 12;
    // EMI formula
    const r = monthlyRate;
    const n = months;
    const emi =
      r === 0
        ? principal / n
        : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const scheduleArr: any[] = [];
    let outstanding = principal;
    let installmentDate = new Date(loan.dateReceived);
    for (let i = 1; i <= n; i++) {
      const interest = Math.round(outstanding * r * 100) / 100;
      const principalPart = Math.round((emi - interest) * 100) / 100;
      const amount = Math.round((principalPart + interest) * 100) / 100;
      outstanding = Math.round((outstanding - principalPart) * 100) / 100;
      installmentDate = new Date(
        installmentDate.setMonth(installmentDate.getMonth() + 1)
      );
      scheduleArr.push({
        instalment: i,
        date: new Date(installmentDate),
        principalPart,
        interest,
        amount,
        outstanding,
      });
    }
    return scheduleArr;
  };

  // compute totals for a generated schedule: total principal, total interest, final payable
  const computeScheduleTotals = (scheduleArr: any[]) => {
    const totalPrincipal = scheduleArr.reduce(
      (s, it) => s + (it.principalPart || 0),
      0
    );
    const totalInterest = scheduleArr.reduce(
      (s, it) => s + (it.interest || 0),
      0
    );
    const totalPayable = scheduleArr.reduce((s, it) => s + (it.amount || 0), 0);
    return {
      totalPrincipal: Math.round(totalPrincipal * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalPayable: Math.round(totalPayable * 100) / 100,
    };
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loanAPI.createLoan(form);
      addNotification({
        type: "success",
        title: "Saved",
        message: "Loan recorded",
      });
      fetchLoans();
    } catch (e: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: e?.response?.data?.message || e?.message || "Failed",
      });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Loans</h2>
      <div className="bg-white p-4 rounded shadow-sm">
        <form
          onSubmit={submit}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          <div>
            <label className="text-sm">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border px-2 py-1 rounded"
            >
              <option value="bank">Bank</option>
              <option value="third_party">Third Party</option>
            </select>
          </div>
          <div>
            <label className="text-sm">Branch</label>
            <select
              value={form.branch}
              onChange={(e) => setForm({ ...form, branch: e.target.value })}
              className="w-full border px-2 py-1 rounded"
            >
              <option value="">-- Select --</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          {form.type === "bank" ? (
            <>
              <div>
                <label className="text-sm">Bank Name</label>
                <input
                  value={form.bankName || ""}
                  onChange={(e) =>
                    setForm({ ...form, bankName: e.target.value })
                  }
                  className="w-full border px-2 py-1 rounded"
                />
              </div>
              <div>
                <label className="text-sm">Account No</label>
                <input
                  value={form.bankAccountNumber || ""}
                  onChange={(e) =>
                    setForm({ ...form, bankAccountNumber: e.target.value })
                  }
                  className="w-full border px-2 py-1 rounded"
                />
              </div>
              <div>
                <label className="text-sm">Bank Branch</label>
                <input
                  value={form.bankBranch || ""}
                  onChange={(e) =>
                    setForm({ ...form, bankBranch: e.target.value })
                  }
                  className="w-full border px-2 py-1 rounded"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="text-sm">Client</label>
              <select
                value={form.client || ""}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                className="w-full border px-2 py-1 rounded"
              >
                <option value="">-- Select Client --</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm">Amount</label>
            <input
              type="number"
              value={form.amount || 0}
              onChange={(e) =>
                setForm({ ...form, amount: Number(e.target.value) })
              }
              className="w-full border px-2 py-1 rounded"
            />
          </div>

          <div>
            <label className="text-sm">Date Received</label>
            <input
              type="date"
              value={form.dateReceived}
              onChange={(e) =>
                setForm({ ...form, dateReceived: e.target.value })
              }
              className="w-full border px-2 py-1 rounded"
            />
          </div>

          <div>
            <label className="text-sm">Interest Rate (%)</label>
            <input
              type="number"
              value={form.interestRate || 0}
              onChange={(e) =>
                setForm({ ...form, interestRate: Number(e.target.value) })
              }
              className="w-full border px-2 py-1 rounded"
            />
          </div>

          <div>
            <label className="text-sm">Interest Period</label>
            <select
              value={form.interestPeriodUnit}
              onChange={(e) =>
                setForm({ ...form, interestPeriodUnit: e.target.value })
              }
              className="w-full border px-2 py-1 rounded"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label className="text-sm">Tenure</label>
            <input
              type="number"
              value={form.tenure || 0}
              onChange={(e) =>
                setForm({ ...form, tenure: Number(e.target.value) })
              }
              className="w-full border px-2 py-1 rounded"
            />
          </div>

          <div>
            <label className="text-sm">Tenure Unit</label>
            <select
              value={form.tenureUnit}
              onChange={(e) => setForm({ ...form, tenureUnit: e.target.value })}
              className="w-full border px-2 py-1 rounded"
            >
              <option value="months">Months</option>
              <option value="years">Years</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="text-sm">Purpose</label>
            <input
              value={form.purpose || ""}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              className="w-full border px-2 py-1 rounded"
            />
          </div>

          <div className="md:col-span-3 text-right">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Save Loan
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded shadow-sm">
          <div className="text-sm text-gray-500">Loans</div>
          <div className="text-xl font-semibold">{summary.count}</div>
        </div>
        <div className="bg-white p-4 rounded shadow-sm">
          <div className="text-sm text-gray-500">Total Taken</div>
          <div className="text-xl font-semibold">
            ₹{(summary.totalTaken || 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow-sm">
          <div className="text-sm text-gray-500">Total Paid</div>
          <div className="text-xl font-semibold">
            ₹{(summary.totalPaid || 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow-sm">
          <div className="text-sm text-gray-500">
            Left to Pay (incl. accrued)
          </div>
          <div className="text-xl font-semibold">
            ₹
            {(
              (summary.totalRemainingWithInterest ?? summary.totalRemaining) ||
              0
            ).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow-sm mt-3">
        <h3 className="font-medium mb-2">Loans</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-600">
                <th>Date</th>
                <th>Branch</th>
                <th>Type</th>
                <th>Counterparty</th>
                <th>Amount</th>
                <th>Remaining</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((l) => (
                <tr key={l._id} className="border-t">
                  <td>{new Date(l.dateReceived).toLocaleDateString()}</td>
                  <td>{l.branch?.name || "-"}</td>
                  <td>{l.type}</td>
                  <td>{l.type === "bank" ? l.bankName : l.client?.name}</td>
                  <td>₹{(l.amount || 0).toLocaleString()}</td>
                  <td>₹{(l.remainingAmount || 0).toLocaleString()}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openRepayModal(l)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                      >
                        Repay
                      </button>
                      <button
                        onClick={() => openEditModal(l)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(l)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Repay modal */}
      {modalLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6">
            <h3 className="text-lg font-medium mb-2">
              Repay Loan -{" "}
              {modalLoan.type === "bank"
                ? modalLoan.bankName
                : modalLoan.client?.name}
            </h3>
            {modalLoan && modalLoan._editing ? (
              <div className="grid grid-cols-1 gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm">Type</label>
                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm({ ...form, type: e.target.value })
                      }
                      className="w-full border px-2 py-1 rounded"
                    >
                      <option value="bank">Bank</option>
                      <option value="third_party">Third Party</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm">Branch</label>
                    <select
                      value={form.branch}
                      onChange={(e) =>
                        setForm({ ...form, branch: e.target.value })
                      }
                      className="w-full border px-2 py-1 rounded"
                    >
                      <option value="">-- Select --</option>
                      {branches.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {form.type === "bank" ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm">Bank Name</label>
                      <input
                        value={form.bankName || ""}
                        onChange={(e) =>
                          setForm({ ...form, bankName: e.target.value })
                        }
                        className="w-full border px-2 py-1 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-sm">Account No</label>
                      <input
                        value={form.bankAccountNumber || ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            bankAccountNumber: e.target.value,
                          })
                        }
                        className="w-full border px-2 py-1 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-sm">Bank Branch</label>
                      <input
                        value={form.bankBranch || ""}
                        onChange={(e) =>
                          setForm({ ...form, bankBranch: e.target.value })
                        }
                        className="w-full border px-2 py-1 rounded"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm">Client</label>
                    <select
                      value={form.client || ""}
                      onChange={(e) =>
                        setForm({ ...form, client: e.target.value })
                      }
                      className="w-full border px-2 py-1 rounded"
                    >
                      <option value="">-- Select Client --</option>
                      {clients.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm">Amount</label>
                    <input
                      type="number"
                      value={form.amount || 0}
                      onChange={(e) =>
                        setForm({ ...form, amount: Number(e.target.value) })
                      }
                      className="w-full border px-2 py-1 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-sm">Date Received</label>
                    <input
                      type="date"
                      value={form.dateReceived}
                      onChange={(e) =>
                        setForm({ ...form, dateReceived: e.target.value })
                      }
                      className="w-full border px-2 py-1 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-sm">Interest Rate (%)</label>
                    <input
                      type="number"
                      value={form.interestRate || 0}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          interestRate: Number(e.target.value),
                        })
                      }
                      className="w-full border px-2 py-1 rounded"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm">Interest Period</label>
                    <select
                      value={form.interestPeriodUnit}
                      onChange={(e) =>
                        setForm({ ...form, interestPeriodUnit: e.target.value })
                      }
                      className="w-full border px-2 py-1 rounded"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm">Tenure</label>
                    <input
                      type="number"
                      value={form.tenure || 0}
                      onChange={(e) =>
                        setForm({ ...form, tenure: Number(e.target.value) })
                      }
                      className="w-full border px-2 py-1 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-sm">Tenure Unit</label>
                    <select
                      value={form.tenureUnit}
                      onChange={(e) =>
                        setForm({ ...form, tenureUnit: e.target.value })
                      }
                      className="w-full border px-2 py-1 rounded"
                    >
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm">Purpose</label>
                  <input
                    value={form.purpose || ""}
                    onChange={(e) =>
                      setForm({ ...form, purpose: e.target.value })
                    }
                    className="w-full border px-2 py-1 rounded"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    Principal:{" "}
                    <strong>
                      ₹
                      {(
                        modalLoan.remainingAmount ||
                        modalLoan.amount ||
                        0
                      ).toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    Date received:{" "}
                    {new Date(modalLoan.dateReceived).toLocaleDateString()}
                  </div>
                  <div>
                    Interest rate: {modalLoan.interestRate || 0}% (
                    {modalLoan.interestPeriodUnit})
                  </div>
                  <div>
                    Tenure: {modalLoan.tenure} {modalLoan.tenureUnit}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium">Full payoff preview</h4>
                  {(() => {
                    const preview = computeFullPayPreview(modalLoan);
                    return (
                      <div className="flex items-center justify-between p-3 border rounded mt-2">
                        <div>Days since taken: {preview.daysSince}</div>
                        <div>
                          Interest:{" "}
                          <strong>
                            ₹{preview.appliedInterest.toLocaleString()}
                          </strong>
                        </div>
                        <div>
                          Total to pay:{" "}
                          <strong>₹{preview.total.toLocaleString()}</strong>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="mb-4">
                  <button
                    onClick={() => handleFullPay(modalLoan)}
                    className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
                  >
                    Pay Full
                  </button>
                  <span className="ml-2 text-sm text-gray-600">
                    or pay custom amount
                  </span>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      value={repayAmount ?? ""}
                      onChange={(e) => setRepayAmount(Number(e.target.value))}
                      className="px-2 py-1 border rounded w-48"
                      placeholder="Amount"
                    />
                    <button
                      onClick={() => handleCustomPay(modalLoan)}
                      className="px-3 py-1 bg-green-600 text-white rounded"
                    >
                      Pay Custom
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showSchedule}
                  onChange={(e) => {
                    setShowSchedule(e.target.checked);
                    if (e.target.checked)
                      setSchedule(generateEMISchedule(modalLoan));
                    else setSchedule([]);
                  }}
                />{" "}
                Show EMI schedule
              </label>
              {showSchedule && schedule.length > 0 && (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-600">
                        <th>#</th>
                        <th>Date</th>
                        <th>Principal</th>
                        <th>Interest</th>
                        <th>Amount</th>
                        <th>Outstanding</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((s) => (
                        <tr key={s.instalment} className="border-t">
                          <td>{s.instalment}</td>
                          <td>{new Date(s.date).toLocaleDateString()}</td>
                          <td>₹{(s.principalPart || 0).toLocaleString()}</td>
                          <td>₹{(s.interest || 0).toLocaleString()}</td>
                          <td>₹{(s.amount || 0).toLocaleString()}</td>
                          <td>₹{(s.outstanding || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                      {/* schedule totals row */}
                      {(() => {
                        const totals = computeScheduleTotals(schedule);
                        return (
                          <tr className="border-t font-semibold">
                            <td colSpan={2}>Totals</td>
                            <td>
                              ₹{(totals.totalPrincipal || 0).toLocaleString()}
                            </td>
                            <td>
                              ₹{(totals.totalInterest || 0).toLocaleString()}
                            </td>
                            <td>
                              ₹{(totals.totalPayable || 0).toLocaleString()}
                            </td>
                            <td></td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Repayment history */}
            {modalLoan &&
              modalLoan.repayments &&
              modalLoan.repayments.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium">Repayment History</h4>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-600">
                          <th>Date</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalLoan.repayments.map((r: any, idx: number) => (
                          <tr key={idx} className="border-t">
                            <td>{new Date(r.date).toLocaleDateString()}</td>
                            <td>₹{(r.amount || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            <div className="flex items-center justify-end gap-2">
              {modalLoan && modalLoan._editing ? (
                <>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={closeModal}
                    className="px-3 py-1 border rounded"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={closeModal}
                  className="px-3 py-1 border rounded"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanManagement;
