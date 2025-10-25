import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import {
  FileText,
  Download,
  Calendar,
  Building2,
  Users,
  ClipboardList,
  Briefcase,
  IndianRupee,
  Printer,
} from 'lucide-react';
import { 
  LoanStatementPDF, 
  TaskStatementPDF, 
  PendingWorkPDF, 
  StaffStatementPDF 
} from '../components/reports/SpecialReportsPDF';
import { generateDocumentPDF } from '../utils/pdfGenerator';
import { 
  loanAPI, 
  branchAPI, 
  staffAPI, 
  taskAPI,
  attendanceAPI 
} from '../services/api';

type ReportType = 'loan' | 'task' | 'pending' | 'staff';

const SpecialReports = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();

  const [activeReport, setActiveReport] = useState<ReportType>('task');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');

  const [loanData, setLoanData] = useState<any[]>([]);
  const [taskData, setTaskData] = useState<any[]>([]);
  const [pendingData, setPendingData] = useState<any[]>([]);
  const [staffData, setStaffData] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const loanPdfRef = useRef<HTMLDivElement>(null);
  const taskPdfRef = useRef<HTMLDivElement>(null);
  const pendingPdfRef = useRef<HTMLDivElement>(null);
  const staffPdfRef = useRef<HTMLDivElement>(null);

  // Load branches on mount
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await branchAPI.getBranches();
        const list = Array.isArray(res) ? res : res?.data || res?.branches || [];
        setBranches(list);
        
        // Auto-select user's branch if they have one
        if (user?.branchId && user?.role !== 'chairman') {
          setSelectedBranchId(user.branchId);
        }
      } catch (err: any) {
        console.error('Failed to load branches:', err);
      }
    };
    loadBranches();
  }, [user]);

  // Load staff when branch changes (for staff statement)
  useEffect(() => {
    if (activeReport === 'staff' && selectedBranchId) {
      const loadStaff = async () => {
        try {
          const res = await staffAPI.getStaff({ branch: selectedBranchId });
          const list = Array.isArray(res) ? res : res?.data || res?.staff || [];
          setStaffList(list);
        } catch (err: any) {
          console.error('Failed to load staff:', err);
        }
      };
      loadStaff();
    }
  }, [activeReport, selectedBranchId]);

  // Update selected branch object
  useEffect(() => {
    if (selectedBranchId) {
      const branch = branches.find((b) => b._id === selectedBranchId);
      setSelectedBranch(branch || null);
    } else {
      setSelectedBranch(null);
    }
  }, [selectedBranchId, branches]);

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      addNotification({
        type: 'error',
        title: 'Missing Dates',
        message: 'Please select start and end dates',
      });
      return;
    }

    if (!selectedBranchId) {
      addNotification({
        type: 'error',
        title: 'Missing Branch',
        message: 'Please select a branch',
      });
      return;
    }

    if (activeReport === 'staff' && !selectedStaffId) {
      addNotification({
        type: 'error',
        title: 'Missing Staff',
        message: 'Please select a staff member',
      });
      return;
    }

    setLoading(true);
    setShowPreview(false);

    try {
      const params: any = {
        startDate,
        endDate,
      };
      if (selectedBranchId) {
        params.branch = selectedBranchId;
      }

      switch (activeReport) {
        case 'loan': {
          const res = await loanAPI.listLoans(params);
          const loans = Array.isArray(res) ? res : res?.data || res?.loans || [];
          setLoanData(loans);
          break;
        }

        case 'task': {
          const res = await taskAPI.getTasks(params);
          const tasks = Array.isArray(res) ? res : res?.data || res?.tasks || [];
          setTaskData(tasks);
          break;
        }

        case 'pending': {
          const res = await taskAPI.getTasks({ 
            ...params, 
            status: 'pending,assigned' 
          });
          const tasks = Array.isArray(res) ? res : res?.data || res?.tasks || [];
          setPendingData(tasks);
          break;
        }

        case 'staff': {
          // Get staff details
          const staffRes = await staffAPI.getStaffMember(selectedStaffId);
          const staff = staffRes?.data || staffRes;

          // Get attendance for date range
          const attRes = await attendanceAPI.getAttendance({
            staff: selectedStaffId,
            startDate,
            endDate,
          });
          const attendance = Array.isArray(attRes) ? attRes : attRes?.data || attRes?.attendance || [];

          // Calculate totals (simplified - you may need to adjust based on your salary logic)
          const totalDetect = attendance.reduce((sum: number, att: any) => {
            return sum + (att.status === 'absent' ? 1200 : 0);
          }, 0);

          const totalPaid = 3000; // This should come from actual payment records
          const outstandingSalary = 600;
          const overpayment = 0;

          setStaffData({
            staff,
            attendance,
            totalDetect,
            totalAllowance: 0,
            totalPaid,
            outstandingSalary,
            overpayment,
          });
          break;
        }
      }

      setShowPreview(true);
      addNotification({
        type: 'success',
        title: 'Report Generated',
        message: 'Report has been generated successfully',
      });
    } catch (err: any) {
      console.error('Failed to generate report:', err);
      addNotification({
        type: 'error',
        title: 'Generation Failed',
        message: err.message || 'Failed to generate report',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      let ref = null;
      let filename = '';

      switch (activeReport) {
        case 'loan':
          ref = loanPdfRef;
          filename = `loan-statement-${startDate}-to-${endDate}.pdf`;
          break;
        case 'task':
          ref = taskPdfRef;
          filename = `task-statement-${startDate}-to-${endDate}.pdf`;
          break;
        case 'pending':
          ref = pendingPdfRef;
          filename = `pending-work-${startDate}-to-${endDate}.pdf`;
          break;
        case 'staff':
          ref = staffPdfRef;
          filename = `staff-statement-${selectedStaffId}-${startDate}-to-${endDate}.pdf`;
          break;
      }

      if (ref && ref.current) {
        await generateDocumentPDF(ref, filename);
        addNotification({
          type: 'success',
          title: 'PDF Downloaded',
          message: 'Report has been downloaded successfully',
        });
      }
    } catch (err: any) {
      console.error('Failed to download PDF:', err);
      addNotification({
        type: 'error',
        title: 'Download Failed',
        message: err.message || 'Failed to download PDF',
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const reportTypes = [
    { id: 'task', label: 'Task Statement', icon: ClipboardList },
    { id: 'staff', label: 'Staff Statement', icon: Users },
    { id: 'pending', label: 'Pending Work', icon: Briefcase },
    { id: 'loan', label: 'Loan Statement', icon: IndianRupee },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-7 w-7 text-blue-600" />
                Special Reports
              </h1>
              <p className="text-gray-600 mt-1">
                Generate detailed reports for loans, tasks, staff, and pending work
              </p>
            </div>
          </div>
        </div>

        {/* Branch Selection - Show first for Chairman */}
        {user?.role === 'chairman' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Step 1: Select Branch</h3>
            </div>
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => {
                  setSelectedBranchId(e.target.value);
                  setShowPreview(false);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Branch</option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Report Type Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">
              {user?.role === 'chairman' ? 'Step 2: Select Report Type' : 'Select Report Type'}
            </h3>
          </div>
          {user?.role === 'chairman' && !selectedBranchId && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                Please select a branch first to continue
              </p>
            </div>
          )}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${
            user?.role === 'chairman' && !selectedBranchId ? 'opacity-50 pointer-events-none' : ''
          }`}>
            {reportTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setActiveReport(type.id as ReportType);
                  setShowPreview(false);
                }}
                disabled={user?.role === 'chairman' && !selectedBranchId}
                className={`p-4 rounded-lg border-2 transition-all ${
                  activeReport === type.id
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <type.icon className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm font-medium text-center">{type.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">
              {user?.role === 'chairman' ? 'Step 3: Set Date Range & Filters' : 'Set Date Range & Filters'}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Branch Selection for non-chairman users */}
            {user?.role !== 'chairman' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="inline h-4 w-4 mr-1" />
                  Branch
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => {
                    setSelectedBranchId(e.target.value);
                    setShowPreview(false);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={user?.branchId ? true : false}
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name || branch.code}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Staff Selection (only for staff statement) */}
            {activeReport === 'staff' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline h-4 w-4 mr-1" />
                  Staff Member *
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Staff</option>
                  {staffList.map((staff) => (
                    <option key={staff._id} value={staff._id}>
                      {staff.name} - {staff.designation}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              {user?.role === 'chairman' ? 'Step 4: Generate Report' : 'Generate Report'}
            </h4>
            <div className="flex gap-4">
              <button
                onClick={handleGenerateReport}
                disabled={loading || !selectedBranchId}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FileText className="h-5 w-5" />
                {loading ? 'Generating...' : 'Generate Report'}
              </button>

              {showPreview && (
                <>
                  <button
                    onClick={handleDownloadPDF}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Download className="h-5 w-5" />
                    Download PDF
                  </button>

                  <button
                    onClick={handlePrint}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  >
                    <Printer className="h-5 w-5" />
                    Print
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Report Preview</h3>
            
            <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-100 p-4">
              {/* Loan Statement */}
              {activeReport === 'loan' && loanData.length > 0 && (
                <LoanStatementPDF
                  ref={loanPdfRef}
                  loans={loanData}
                  branch={selectedBranch}
                  startDate={startDate}
                  endDate={endDate}
                />
              )}

              {/* Task Statement */}
              {activeReport === 'task' && taskData.length > 0 && (
                <TaskStatementPDF
                  ref={taskPdfRef}
                  tasks={taskData}
                  branch={selectedBranch}
                  startDate={startDate}
                  endDate={endDate}
                />
              )}

              {/* Pending Work */}
              {activeReport === 'pending' && pendingData.length > 0 && (
                <PendingWorkPDF
                  ref={pendingPdfRef}
                  pendingTasks={pendingData}
                  branch={selectedBranch}
                  startDate={startDate}
                  endDate={endDate}
                />
              )}

              {/* Staff Statement */}
              {activeReport === 'staff' && staffData && (
                <StaffStatementPDF
                  ref={staffPdfRef}
                  data={staffData}
                  branch={selectedBranch}
                  startDate={startDate}
                  endDate={endDate}
                />
              )}

              {/* No Data Message */}
              {((activeReport === 'loan' && loanData.length === 0) ||
                (activeReport === 'task' && taskData.length === 0) ||
                (activeReport === 'pending' && pendingData.length === 0) ||
                (activeReport === 'staff' && !staffData)) && (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>No data available for the selected criteria</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecialReports;
