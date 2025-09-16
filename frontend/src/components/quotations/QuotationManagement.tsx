import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Plus,
  Search,
  Eye,
  Edit,
  Download,
  Send,
  Calendar,
  User,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  Camera,
  Copy,
} from "lucide-react";
import { useNotification } from "../../contexts/NotificationContext";
import { quotationAPI, branchAPI, clientAPI } from "../../services/api";
import QuotationPDFTemplate from "./QuotationPDFTemplate";
import { generateQuotationPDF } from "../../utils/pdfGenerator";

const QuotationManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("quotations");
  const { addNotification } = useNotification();

  const [quotations, setQuotations] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [selectedQuotationForPDF, setSelectedQuotationForPDF] = useState<any>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [createData, setCreateData] = useState<any>({
    client: "",
    branch: "",
    services: [{ name: "", quantity: 1, price: 0 }],
    gstPct: 0,
    notes: "",
    functionDetails: { date: "", type: "", venue: { name: "", address: "" } },
  });

  const templates = [
    {
      id: 1,
      name: "Wedding Premium",
      category: "Wedding",
      description: "Comprehensive wedding photography package",
      services: ["Photography", "Videography", "Album", "Editing"],
      basePrice: 2500,
      gstIncluded: true,
      lastUsed: "2024-01-15",
    },
    {
      id: 2,
      name: "Corporate Standard",
      category: "Corporate",
      description: "Professional corporate photography services",
      services: ["Headshots", "Event Coverage", "Basic Editing"],
      basePrice: 800,
      gstIncluded: true,
      lastUsed: "2024-01-16",
    },
    {
      id: 3,
      name: "Family Basic",
      category: "Portrait",
      description: "Family portrait session package",
      services: ["Portrait Session", "Basic Editing", "Digital Delivery"],
      basePrice: 450,
      gstIncluded: false,
      lastUsed: "2024-01-18",
    },
    {
      id: 4,
      name: "Commercial Premium",
      category: "Commercial",
      description: "High-end commercial photography",
      services: ["Product Photography", "Advanced Editing", "Rush Service"],
      basePrice: 1200,
      gstIncluded: true,
      lastUsed: "2024-01-20",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return Edit;
      case "sent":
        return Send;
      case "pending":
        return Clock;
      case "approved":
        return CheckCircle;
      case "rejected":
        return XCircle;
      case "expired":
        return AlertTriangle;
      default:
        return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-50 text-gray-700";
      case "sent":
        return "bg-blue-50 text-blue-700";
      case "pending":
        return "bg-amber-50 text-amber-700";
      case "approved":
        return "bg-emerald-50 text-emerald-700";
      case "rejected":
        return "bg-red-50 text-red-700";
      case "expired":
        return "bg-red-50 text-red-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  const handleCreateQuotation = () => {
    setShowCreateModal(true);
    addNotification({
      type: "info",
      title: "Create Quotation",
      message: "Quotation creation form opened",
    });
  };

  const handleQuotationAction = (action: string, quotationId: string) => {
    if (action === "Download") {
      // Find quotation data
      const quotation = quotations.find(q => q.id === quotationId);
      if (quotation) {
        handleDownloadPDF(quotation);
      } else {
        addNotification({
          type: "error",
          title: "Error",
          message: "Quotation not found",
        });
      }
    } else {
      addNotification({
        type: "info",
        title: `${action} Quotation`,
        message: `${action} action for quotation ${quotationId}`,
      });
    }
  };

  const handleDownloadPDF = async (quotation: any) => {
    try {
      // Convert quotation data to PDF format
      const pdfData = {
        quotationNumber: quotation.id,
        date: quotation.quotationDate,
        client: {
          name: quotation.clientName,
          address: quotation.eventLocation || 'Address not provided',
          contact: quotation.clientPhone,
          gstin: quotation.clientGSTIN || '',
        },
        items: [
          {
            description: 'Cinematography',
            dates: ['03 Feb. 2025', '21 Feb. 2025'],
            rate: 0,
            amount: Math.round(quotation.totalAmount * 0.4)
          },
          {
            description: 'Mixing (Traditional)',
            dates: ['Sakshi & Sanket - 11 Nov. 2024'],
            rate: 0,
            amount: Math.round(quotation.totalAmount * 0.2)
          },
          {
            description: 'Editing (Cinematic)',
            dates: ['Sakshi & Sanket - 11 Nov. 2024', '03 Feb. 2025', 'Rajeev & Saloni', '21 Feb. 2025'],
            rate: 0,
            amount: Math.round(quotation.totalAmount * 0.3)
          },
          {
            description: 'Invitation Video',
            dates: ['Dimpi & Abhijeet'],
            rate: 0,
            amount: Math.round(quotation.totalAmount * 0.1)
          }
        ],
        total: quotation.totalAmount,
        receivedAmount: quotation.advanceAmount || 0,
        backDues: 0,
        currentDues: quotation.totalAmount - (quotation.advanceAmount || 0),
        totalDues: quotation.totalAmount - (quotation.advanceAmount || 0),
      };

      // Set data and show PDF modal for preview
      setSelectedQuotationForPDF(pdfData);
      setShowPDFModal(true);

    } catch (error) {
      console.error('Download error:', error);
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to prepare quotation for download",
      });
    }
  };

  const handleCreateSubmit = async () => {
    try {
      // normalize services into schema shape {service, description, quantity, rate, amount}
      const services = Array.isArray(createData.services) ? createData.services : [];
      const normalizedServices = services.map((s: any) => {
        const qty = Number(s.quantity || 1);
        const rate = Number(s.price ?? s.rate ?? 0);
        const amount = +(qty * rate);
        return {
          service: s.name || s.service || '',
          description: s.description || '',
          quantity: qty,
          rate,
          amount,
        };
      });

      const subtotal = normalizedServices.reduce((sum: number, s: any) => sum + Number(s.amount || 0), 0);
      const gstPct = Number(createData.gstPct || 0);
      const gstAmount = +(subtotal * (gstPct / 100));
      const finalAmount = +(subtotal + gstAmount);

      const payload = {
        client: createData.client,
        branch: createData.branch,
        services: normalizedServices,
        pricing: { subtotal, gstAmount, totalAmount: finalAmount, finalAmount },
        functionDetails: {
          type: createData.functionDetails?.type || createData.functionDetails?.eventType || '',
          date: createData.functionDetails?.date || null,
          time: {
            start: createData.functionDetails?.startTime || '',
            end: createData.functionDetails?.endTime || ''
          },
          venue: createData.functionDetails?.venue || {}
        },
        notes: createData.notes,
        status: 'pending'
      };

      const res = await quotationAPI.createQuotation(payload);
      // determine created id from response
      const created = (res && (res.data || res)) || null;
      const createdId =
        created &&
        (created._id || created.id || created._doc?.id || created._doc?._id);

      addNotification({
        type: "success",
        title: "Created",
        message: "Quotation created",
      });
      setShowCreateModal(false);

      // reload list
      const qRes = await quotationAPI.getQuotations();
      setQuotations((qRes && qRes.data) || qRes || []);

      // attempt to download generated PDF for the newly created quotation
      if (createdId) {
        try {
          const blob = await quotationAPI.downloadQuotationPdf(
            String(createdId)
          );
          const url = window.URL.createObjectURL(
            new Blob([blob], { type: "application/pdf" })
          );
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `${createdId}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.parentNode?.removeChild(link);
          window.URL.revokeObjectURL(url);
          addNotification({
            type: "success",
            title: "Downloaded",
            message: "Quotation PDF downloaded",
          });
        } catch (err) {
          addNotification({
            type: "error",
            title: "PDF Error",
            message: "Quotation created but failed to download PDF",
          });
        }
      }
    } catch (err) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to create quotation",
      });
    }
  };

  // load branches and clients for modal selects
  useEffect(() => {
    const load = async () => {
      try {
        const [bRes, cRes, qRes] = await Promise.all([
          branchAPI.getBranches(),
          clientAPI.getClients(),
          quotationAPI.getQuotations(),
        ]);
        setBranches((bRes && bRes.data) || bRes || []);
        setClients((cRes && cRes.data) || cRes || []);
        setQuotations((qRes && qRes.data) || qRes || []);
      } catch (err) {
        addNotification({ type: "error", title: "Error", message: "Failed to load branches/clients" });
      }
    };
    load();
  }, []);

  // helper functions for service lines & totals used in modal
  const updateServiceLine = (index: number, field: string, value: any) => {
    setCreateData((prev: any) => {
      const services = Array.isArray(prev.services) ? [...prev.services] : [];
      services[index] = { ...services[index], [field]: value };
      return { ...prev, services };
    });
  };

  const addServiceLine = () => {
    setCreateData((prev: any) => ({
      ...prev,
      services: [...(prev.services || []), { name: "", quantity: 1, price: 0 }],
    }));
  };

  const removeServiceLine = (index: number) => {
    setCreateData((prev: any) => {
      const services = [...(prev.services || [])];
      services.splice(index, 1);
      return { ...prev, services };
    });
  };

  const computedSubtotal = () => {
    const services = Array.isArray(createData.services)
      ? createData.services
      : [];
    return services.reduce(
      (sum: number, s: any) =>
        sum + Number(s.quantity || 0) * Number(s.price || 0),
      0
    );
  };

  const handleTemplateAction = (action: string, templateName: string) => {
    addNotification({
      type: "info",
      title: `Template ${action}`,
      message: `${action} for ${templateName} template`,
    });
  };

  const filteredQuotations = quotations.filter((quotation) => {
    const matchesSearch =
      quotation.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.eventType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || quotation.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const quotationStats = {
    total: quotations.length,
    sent: quotations.filter((q) => q.status === "sent").length,
    approved: quotations.filter((q) => q.status === "approved").length,
    pending: quotations.filter((q) => q.status === "pending").length,
    totalValue: quotations.reduce((sum, q) => sum + q.totalAmount, 0),
    approvalRate: Math.round(
      (quotations.filter((q) => q.status === "approved").length /
        quotations.length) *
        100
    ),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quotation Management
          </h1>
          <p className="text-gray-600 mt-1">
            Create, manage, and track quotations and proposals
          </p>
        </div>
        <button
          onClick={handleCreateQuotation}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Quotation
        </button>
      </div>

        {/* Top-level Create Quotation Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Create Quotation</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">Close</button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleCreateSubmit(); }} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Client *</label>
                    <select required value={createData.client} onChange={(e) => setCreateData({ ...createData, client: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select client</option>
                      {clients.map((c: any) => <option key={c._id} value={c._id}>{c.name} - {c.phone}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Branch *</label>
                    <select required value={createData.branch} onChange={(e) => setCreateData({ ...createData, branch: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select branch</option>
                      {branches.map((b: any) => <option key={b._id} value={b._id}>{b.name} ({b.code})</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Function Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Event / Function Type</label>
                    <input type="text" value={createData.functionDetails?.type || ''} onChange={(e) => setCreateData({ ...createData, functionDetails: { ...createData.functionDetails, type: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                      <input required type="date" value={createData.functionDetails.date ? createData.functionDetails.date.split('T')[0] : ''} onChange={(e) => setCreateData({ ...createData, functionDetails: { ...createData.functionDetails, date: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                      <input type="time" value={createData.functionDetails.startTime || ''} onChange={(e) => setCreateData({ ...createData, functionDetails: { ...createData.functionDetails, startTime: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                      <input type="time" value={createData.functionDetails.endTime || ''} onChange={(e) => setCreateData({ ...createData, functionDetails: { ...createData.functionDetails, endTime: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Venue Name</label>
                      <input type="text" value={createData.functionDetails.venue?.name || ''} onChange={(e) => setCreateData({ ...createData, functionDetails: { ...createData.functionDetails, venue: { ...createData.functionDetails.venue, name: e.target.value } } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Venue Address</label>
                      <input type="text" value={createData.functionDetails.venue?.address || ''} onChange={(e) => setCreateData({ ...createData, functionDetails: { ...createData.functionDetails, venue: { ...createData.functionDetails.venue, address: e.target.value } } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Services & Pricing</h3>
                  <div className="space-y-2">
                    {createData.services.map((s: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-6 gap-2 items-center">
                        <input type="text" placeholder="Service name" value={s.name} onChange={(e) => updateServiceLine(idx, 'name', e.target.value)} className="col-span-3 border px-2 py-1 rounded" />
                        <input type="number" min={1} value={s.quantity} onChange={(e) => updateServiceLine(idx, 'quantity', Number(e.target.value))} className="col-span-1 border px-2 py-1 rounded" />
                        <input type="number" min={0} value={s.price} onChange={(e) => updateServiceLine(idx, 'price', Number(e.target.value))} className="col-span-1 border px-2 py-1 rounded" />
                        <button type="button" onClick={() => removeServiceLine(idx)} className="col-span-1 text-red-600">Remove</button>
                      </div>
                    ))}
                    <div>
                      <button type="button" onClick={addServiceLine} className="px-3 py-1 bg-gray-100 rounded">Add service</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Advance Amount</label>
                      <input type="number" min={0} value={createData.advanceAmount || 0} onChange={(e) => setCreateData({ ...createData, advanceAmount: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Subtotal: <span className="font-medium">₹{computedSubtotal().toLocaleString()}</span></div>
                      <div className="text-sm text-gray-600">GST: <span className="font-medium">₹{(computedSubtotal() * (Number(createData.gstPct || 0) / 100)).toLocaleString()}</span></div>
                      <div className="text-lg font-bold">Total: <span>₹{(computedSubtotal() + (computedSubtotal() * (Number(createData.gstPct || 0) / 100))).toLocaleString()}</span></div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea value={createData.notes} onChange={(e) => setCreateData({ ...createData, notes: e.target.value })} className="w-full border rounded px-3 py-2" />
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg">Create & Download PDF</button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-blue-500 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">
                {quotationStats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-indigo-500 p-2 rounded-lg">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Sent</p>
              <p className="text-xl font-bold text-gray-900">
                {quotationStats.sent}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-emerald-500 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Approved</p>
              <p className="text-xl font-bold text-gray-900">
                {quotationStats.approved}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-amber-500 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Pending</p>
              <p className="text-xl font-bold text-gray-900">
                {quotationStats.pending}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-purple-500 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Total Value</p>
              <p className="text-xl font-bold text-gray-900">
                ${quotationStats.totalValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-green-500 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Approval Rate</p>
              <p className="text-xl font-bold text-gray-900">
                {quotationStats.approvalRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: "quotations", name: "Quotations", icon: FileText },
              { id: "templates", name: "Templates", icon: Copy },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search quotations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          {activeTab === "quotations" && (
            <div className="space-y-4">
              {filteredQuotations.map((quotation) => {
                const StatusIcon = getStatusIcon(quotation.status);

                return (
                  <div
                    key={quotation.id}
                    className="bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-200 p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-3 rounded-lg mr-4">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {quotation.id}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {quotation.eventType}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          quotation.status
                        )}`}
                      >
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {quotation.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">
                          Client Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600">
                            <User className="w-4 h-4 mr-2" />
                            {quotation.clientName}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Mail className="w-4 h-4 mr-2" />
                            {quotation.clientEmail}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Phone className="w-4 h-4 mr-2" />
                            {quotation.clientPhone}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">
                          Event Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            {quotation.eventDate}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            {quotation.eventLocation}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Camera className="w-4 h-4 mr-2" />
                            {quotation.photographer}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">
                          Financial Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium text-gray-900">
                              ${quotation.totalAmount - quotation.gstAmount}
                            </span>
                          </div>
                          {quotation.gstIncluded && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">GST:</span>
                              <span className="font-medium text-gray-900">
                                ${quotation.gstAmount}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-bold text-gray-900">
                              ${quotation.totalAmount}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Valid Until:</span>
                            <span className="font-medium text-gray-900">
                              {quotation.validUntil}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-white rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">
                        Services Included:
                      </h5>
                      <div className="space-y-1">
                        {quotation.services.map(
                          (service: any, index: number) => (
                            <div
                              key={index}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-gray-600">
                                {service.name} (x{service.quantity})
                              </span>
                              <span className="font-medium text-gray-900">
                                ${service.price}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {quotation.notes && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          {quotation.notes}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Created: {quotation.quotationDate}
                        {quotation.followUpDate && (
                          <span className="ml-4">
                            Follow-up: {quotation.followUpDate}
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            handleQuotationAction("View", quotation.id)
                          }
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Quotation"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleQuotationAction("Edit", quotation.id)
                          }
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Edit Quotation"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleQuotationAction("Download", quotation.id)
                          }
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleQuotationAction("Send", quotation.id)
                          }
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Send to Client"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );

              })}
            </div>
          )}

          {activeTab === "templates" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-200 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {template.category}
                      </p>
                    </div>
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                      {template.category}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">
                    {template.description}
                  </p>

                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">
                        Included Services:
                      </h5>
                      <div className="flex flex-wrap gap-1">
                        {template.services.map((service, index) => (
                          <span
                            key={index}
                            className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm text-gray-600">
                          Base Price:
                        </span>
                        <span className="font-bold text-gray-900 ml-2">
                          ${template.basePrice}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {template.gstIncluded ? "GST Included" : "GST Extra"}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      Last used: {template.lastUsed}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          handleTemplateAction("Use", template.name)
                        }
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        Use Template
                      </button>
                      <button
                        onClick={() =>
                          handleTemplateAction("Edit", template.name)
                        }
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                    <button
                      onClick={() =>
                        handleTemplateAction("Duplicate", template.name)
                      }
                      className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
                      title="Duplicate Template"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PDF Modal */}
      {showPDFModal && selectedQuotationForPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">PDF Preview</h3>
              <button
                onClick={() => setShowPDFModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div ref={pdfRef} className="bg-white">
              <QuotationPDFTemplate data={selectedQuotationForPDF} />
            </div>
            
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowPDFModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  try {
                    await generateQuotationPDF(
                      pdfRef,
                      `quotation-${selectedQuotationForPDF.quotationNumber}.pdf`
                    );
                    addNotification({
                      type: "success",
                      title: "Downloaded",
                      message: "Quotation PDF downloaded successfully",
                    });
                    setShowPDFModal(false);
                  } catch (error) {
                    console.error('PDF generation error:', error);
                    addNotification({
                      type: "error", 
                      title: "Error",
                      message: "Failed to generate PDF",
                    });
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationManagement;