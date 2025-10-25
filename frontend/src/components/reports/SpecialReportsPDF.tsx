import { forwardRef } from 'react';
import logo from '../../images/logo.png';

interface LoanData {
  _id: string;
  type: string;
  bankName?: string;
  client?: { name: string };
  amount: number;
  dateReceived: string;
  interestRate: number;
  tenure: number;
  tenureUnit: string;
  remainingAmount: number;
  repayments?: Array<{
    amount: number;
    date: string;
  }>;
}

interface TaskData {
  _id: string;
  booking: {
    _id: string;
    bookingId?: string;
    client?: { name: string };
  };
  bookingService: string;
  assignedTo: Array<{
    staff: { name: string };
  }>;
  workStartDate?: string;
  workEndDate?: string;
  status: string;
  requirements?: {
    equipment?: Array<{
      equipment: { name: string };
    }>;
  };
}

interface AttendanceData {
  date: string;
  checkIn?: {
    time: string;
  };
  checkOut?: {
    time: string;
  };
  workingHours: number;
  tasks?: Array<{
    task: {
      booking?: {
        bookingId?: string;
      };
    };
  }>;
  status: string;
  notes?: string;
}

interface StaffStatementData {
  staff: {
    _id: string;
    name: string;
    employeeId?: string;
    email: string;
    designation: string;
    department?: string;
    gender?: string;
    salaryType?: string;
  };
  attendance: AttendanceData[];
  totalDetect: number;
  totalAllowance: number;
  totalPaid: number;
  outstandingSalary: number;
  overpayment: number;
}

interface PendingWorkData {
  _id: string;
  date: string;
  client?: { name: string };
  booking: {
    bookingId?: string;
  };
  bookingService: string;
  requirements?: {
    equipment?: Array<{
      equipment: { name: string };
    }>;
  };
  assignedTo: Array<{
    staff: { name: string };
  }>;
  notes?: string;
}

interface LoanStatementProps {
  loans: LoanData[];
  branch?: { name: string };
  startDate: string;
  endDate: string;
}

interface TaskStatementProps {
  tasks: TaskData[];
  branch?: { name: string };
  startDate: string;
  endDate: string;
}

interface PendingWorkProps {
  pendingTasks: PendingWorkData[];
  branch?: { name: string };
  startDate: string;
  endDate: string;
}

interface StaffStatementProps {
  data: StaffStatementData;
  branch?: { name: string };
  startDate: string;
  endDate: string;
}

// Loan Statement PDF Template
export const LoanStatementPDF = forwardRef<HTMLDivElement, LoanStatementProps>(
  ({ loans, branch, startDate, endDate }, ref) => {
    const totalLoanAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
    const totalInterest = loans.reduce((sum, loan) => {
      const interestAmount = (loan.amount * loan.interestRate * loan.tenure) / 100;
      return sum + interestAmount;
    }, 0);
    const totalPaying = totalLoanAmount + totalInterest;
    const totalOutstanding = loans.reduce((sum, loan) => sum + loan.remainingAmount, 0);

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '-';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const calculateEMI = (loan: LoanData) => {
      const monthlyRate = loan.interestRate / 100 / 12;
      const months = loan.tenureUnit === 'years' ? loan.tenure * 12 : loan.tenure;
      if (monthlyRate === 0) return loan.amount / months;
      const emi = (loan.amount * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                   (Math.pow(1 + monthlyRate, months) - 1);
      return emi;
    };

    return (
      <div ref={ref} className="bg-white p-8" style={{ width: '210mm', minHeight: '297mm' }}>
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b pb-4">
          <div className="flex items-center">
            <img src={logo} alt="Company Logo" className="h-16 w-16 mr-4" />
            <div>
              <h1 className="text-2xl font-bold">Abeer Motion Picture</h1>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">Prepared On: {formatDate(new Date().toISOString())}</p>
            <p>Statement Period: {formatDate(startDate)} to {formatDate(endDate)}</p>
            {branch && <p>Branch: {branch.name}</p>}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-center mb-6">Total Loan</h2>

        {/* Loan Table */}
        <table className="w-full border-collapse border border-gray-400 mb-8">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-sm">Date</th>
              <th className="border border-gray-400 p-2 text-sm">Name</th>
              <th className="border border-gray-400 p-2 text-sm">Amount</th>
              <th className="border border-gray-400 p-2 text-sm">Interest</th>
              <th className="border border-gray-400 p-2 text-sm">Total Month</th>
              <th className="border border-gray-400 p-2 text-sm">Outstanding month</th>
              <th className="border border-gray-400 p-2 text-sm">EMI monthly</th>
              <th className="border border-gray-400 p-2 text-sm">Paid EMI</th>
              <th className="border border-gray-400 p-2 text-sm">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => {
              const emi = calculateEMI(loan);
              const totalMonths = loan.tenureUnit === 'years' ? loan.tenure * 12 : loan.tenure;
              const paidAmount = loan.amount - loan.remainingAmount;
              const outstandingMonths = Math.ceil(loan.remainingAmount / emi);
              
              return (
                <tr key={loan._id}>
                  <td className="border border-gray-400 p-2 text-sm">{formatDate(loan.dateReceived)}</td>
                  <td className="border border-gray-400 p-2 text-sm">
                    {loan.type === 'bank' ? loan.bankName : loan.client?.name}
                  </td>
                  <td className="border border-gray-400 p-2 text-sm text-right">
                    {loan.amount.toLocaleString()}/-
                  </td>
                  <td className="border border-gray-400 p-2 text-sm text-center">
                    {loan.interestRate}%
                  </td>
                  <td className="border border-gray-400 p-2 text-sm text-center">{totalMonths}</td>
                  <td className="border border-gray-400 p-2 text-sm text-center">{outstandingMonths}</td>
                  <td className="border border-gray-400 p-2 text-sm text-right">
                    {emi.toLocaleString('en-IN', { maximumFractionDigits: 2 })}/-
                  </td>
                  <td className="border border-gray-400 p-2 text-sm text-right">
                    {paidAmount.toLocaleString()}/-
                  </td>
                  <td className="border border-gray-400 p-2 text-sm text-right">
                    {loan.remainingAmount.toLocaleString()}/-
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-gray-50">
              <td colSpan={2} className="border border-gray-400 p-2 text-sm">
                Total Loan Amount {totalLoanAmount.toLocaleString()}/-
              </td>
              <td colSpan={3} className="border border-gray-400 p-2 text-sm">
                Total Interest Amount: {totalInterest.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/-
              </td>
              <td colSpan={2} className="border border-gray-400 p-2 text-sm">
                Total paying Amount: {totalPaying.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/-
              </td>
              <td colSpan={2} className="border border-gray-400 p-2 text-sm">
                Total Outstanding Amount: {totalOutstanding.toLocaleString()}/-
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Watermark */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <img src={logo} alt="Watermark" className="w-96 h-96" />
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 right-8 text-right">
          <p className="text-sm italic">Authorized Signature</p>
        </div>
      </div>
    );
  }
);

LoanStatementPDF.displayName = 'LoanStatementPDF';

// Task Statement PDF Template (Work Schedule according to booking)
export const TaskStatementPDF = forwardRef<HTMLDivElement, TaskStatementProps>(
  ({ tasks, branch, startDate, endDate }, ref) => {
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '-';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
      <div ref={ref} className="bg-white p-8" style={{ width: '210mm', minHeight: '297mm' }}>
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b pb-4">
          <div className="flex items-center">
            <img src={logo} alt="Company Logo" className="h-16 w-16 mr-4" />
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">Prepared On: {formatDate(new Date().toISOString())}</p>
            <p>Statement Period: {formatDate(startDate)} to {formatDate(endDate)}</p>
            {branch && <p>Branch: {branch.name}</p>}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-center mb-6">Task Statement</h2>

        {/* Task Table */}
        <table className="w-full border-collapse border border-gray-400">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-sm">Date</th>
              <th className="border border-gray-400 p-2 text-sm">Booking</th>
              <th className="border border-gray-400 p-2 text-sm">Client</th>
              <th className="border border-gray-400 p-2 text-sm">Service</th>
              <th className="border border-gray-400 p-2 text-sm">Inventory</th>
              <th className="border border-gray-400 p-2 text-sm">Staff</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task._id}>
                <td className="border border-gray-400 p-2 text-sm">
                  {formatDate(task.workStartDate || '')}
                </td>
                <td className="border border-gray-400 p-2 text-sm">
                  {task.booking?.bookingId || task.booking?._id}
                </td>
                <td className="border border-gray-400 p-2 text-sm">
                  {task.booking?.client?.name || '-'}
                </td>
                <td className="border border-gray-400 p-2 text-sm">{task.bookingService}</td>
                <td className="border border-gray-400 p-2 text-sm">
                  {task.requirements?.equipment?.map((eq) => eq.equipment.name).join(', ') || '-'}
                </td>
                <td className="border border-gray-400 p-2 text-sm">
                  {task.assignedTo?.map((a) => a.staff.name).join(', ') || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Watermark */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <img src={logo} alt="Watermark" className="w-96 h-96" />
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 right-8 text-right">
          <p className="text-sm italic">Authorized Signature</p>
        </div>
      </div>
    );
  }
);

TaskStatementPDF.displayName = 'TaskStatementPDF';

// Pending Work PDF Template
export const PendingWorkPDF = forwardRef<HTMLDivElement, PendingWorkProps>(
  ({ pendingTasks, branch, startDate, endDate }, ref) => {
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '-';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
      <div ref={ref} className="bg-white p-8" style={{ width: '210mm', minHeight: '297mm' }}>
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b pb-4">
          <div className="flex items-center">
            <img src={logo} alt="Company Logo" className="h-16 w-16 mr-4" />
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">Prepared On: {formatDate(new Date().toISOString())}</p>
            <p>Statement Period: {formatDate(startDate)} to {formatDate(endDate)}</p>
            {branch && <p>Branch: {branch.name}</p>}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-center mb-6">Pending Work</h2>

        {/* Pending Work Table */}
        <table className="w-full border-collapse border border-gray-400">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-sm">Date</th>
              <th className="border border-gray-400 p-2 text-sm">note</th>
              <th className="border border-gray-400 p-2 text-sm">Service</th>
              <th className="border border-gray-400 p-2 text-sm">Inventory</th>
              <th className="border border-gray-400 p-2 text-sm">Staff</th>
              <th className="border border-gray-400 p-2 text-sm">Remark</th>
            </tr>
          </thead>
          <tbody>
            {pendingTasks.map((task) => (
              <tr key={task._id}>
                <td className="border border-gray-400 p-2 text-sm">{formatDate(task.date)}</td>
                <td className="border border-gray-400 p-2 text-sm">
                  {task.client?.name || '-'}<br />
                  Invoice No.: {task.booking?.bookingId || '-'}
                </td>
                <td className="border border-gray-400 p-2 text-sm">{task.bookingService}</td>
                <td className="border border-gray-400 p-2 text-sm">
                  {task.requirements?.equipment?.map((eq) => eq.equipment.name).join(', ') || '-'}
                </td>
                <td className="border border-gray-400 p-2 text-sm">
                  {task.assignedTo?.map((a) => a.staff.name).join(', ') || '-'}
                </td>
                <td className="border border-gray-400 p-2 text-sm">{task.notes || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Watermark */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <img src={logo} alt="Watermark" className="w-96 h-96" />
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 right-8 text-right">
          <p className="text-sm italic">Authorized Signature</p>
        </div>
      </div>
    );
  }
);

PendingWorkPDF.displayName = 'PendingWorkPDF';

// Staff Statement PDF Template
export const StaffStatementPDF = forwardRef<HTMLDivElement, StaffStatementProps>(
  ({ data, branch, startDate, endDate }, ref) => {
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '-';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (timeStr: string) => {
      if (!timeStr) return '-';
      const time = new Date(timeStr);
      return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return (
      <div ref={ref} className="bg-white p-8" style={{ width: '210mm', minHeight: '297mm' }}>
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b pb-4">
          <div className="flex items-center">
            <img src={logo} alt="Company Logo" className="h-16 w-16 mr-4" />
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">Prepared On: {formatDate(new Date().toISOString())}</p>
            <p>Statement Period: {formatDate(startDate)} to {formatDate(endDate)}</p>
            {branch && <p>Branch: {branch.name}</p>}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-center mb-6">Staff Statement</h2>

        {/* Staff Details */}
        <div className="mb-6 text-sm">
          <p><strong>Employ ID:</strong> {data.staff.employeeId || data.staff._id}</p>
          <p><strong>Name:</strong> {data.staff.name}</p>
          <p><strong>Department:</strong> {data.staff.department || 'Camera'}</p>
          <p><strong>Designation:</strong> {data.staff.designation}</p>
          <p><strong>Gender:</strong> {data.staff.gender || 'Male'}</p>
          <p><strong>Salary Type:</strong> {data.staff.salaryType || 'Per Day/Per Task/Monthly'}</p>
          <p><strong>Email:</strong> {data.staff.email || ''}</p>
        </div>

        {/* Attendance Table */}
        <table className="w-full border-collapse border border-gray-400 mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2 text-xs">Date</th>
              <th className="border border-gray-400 p-2 text-xs">Time In</th>
              <th className="border border-gray-400 p-2 text-xs">Time Out</th>
              <th className="border border-gray-400 p-2 text-xs">Work</th>
              <th className="border border-gray-400 p-2 text-xs">Assigned work</th>
              <th className="border border-gray-400 p-2 text-xs">Detect Amount</th>
              <th className="border border-gray-400 p-2 text-xs">Allowance</th>
              <th className="border border-gray-400 p-2 text-xs">Salary Paid</th>
              <th className="border border-gray-400 p-2 text-xs">Note</th>
            </tr>
          </thead>
          <tbody>
            {data.attendance.map((att, idx) => (
              <tr key={idx}>
                <td className="border border-gray-400 p-2 text-xs">{formatDate(att.date)}</td>
                <td className="border border-gray-400 p-2 text-xs">{formatTime(att.checkIn?.time || '')}</td>
                <td className="border border-gray-400 p-2 text-xs">{formatTime(att.checkOut?.time || '')}</td>
                <td className="border border-gray-400 p-2 text-xs">
                  {att.tasks?.map((t) => t.task?.booking?.bookingId).join(', ') || '-'}
                </td>
                <td className="border border-gray-400 p-2 text-xs">
                  {att.tasks?.map((t) => t.task?.booking?.bookingId).join(', ') || '-'}
                </td>
                <td className="border border-gray-400 p-2 text-xs text-right">
                  {att.status === 'absent' ? '1,200/-' : '-'}
                </td>
                <td className="border border-gray-400 p-2 text-xs text-right">-</td>
                <td className="border border-gray-400 p-2 text-xs text-right">-</td>
                <td className="border border-gray-400 p-2 text-xs">{att.notes || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Note about gross salary */}
        <div className="text-xs mb-4 p-2 border border-gray-400">
          <p className="italic">
            Agar monthaly hai to is me likha kar aa jaye Gross Salary jo bhi hai
          </p>
        </div>

        {/* Summary Table */}
        <table className="w-full border-collapse border border-gray-400 mb-6">
          <tbody>
            <tr className="font-bold">
              <td className="border border-gray-400 p-2 text-sm" colSpan={4}>
                Total Detect Salary & allowance: {data.totalDetect.toLocaleString()}/-
              </td>
              <td className="border border-gray-400 p-2 text-sm" colSpan={5}>
                Total Paid Salary: {data.totalPaid.toLocaleString()}/-
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 text-sm" colSpan={4}>
                Outstanding Salary & Allowance
              </td>
              <td className="border border-gray-400 p-2 text-sm" colSpan={5}>
                {data.outstandingSalary.toLocaleString()}/-
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 text-sm" colSpan={4}>
                Overpayment Salary & Allowance:
              </td>
              <td className="border border-gray-400 p-2 text-sm" colSpan={5}>
                {data.overpayment > 0 ? `${data.overpayment.toLocaleString()}/-` : '-'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Watermark */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <img src={logo} alt="Watermark" className="w-96 h-96" />
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 right-8 text-right">
          <p className="text-sm italic">Authorized Signature</p>
        </div>
      </div>
    );
  }
);

StaffStatementPDF.displayName = 'StaffStatementPDF';
