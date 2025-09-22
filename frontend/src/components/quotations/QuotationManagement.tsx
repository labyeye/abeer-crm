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
  IndianRupee,
} from "lucide-react";
import { useNotification } from "../../contexts/NotificationContext";
import { quotationAPI, branchAPI, clientAPI } from "../../services/api";
import QuotationPDFTemplate from "./QuotationPDFTemplate";
import { generateQuotationPDF } from "../../utils/pdfGenerator";

const QuotationManagement = () => {
  const [editMode, setEditMode] = useState(false);
  const [editQuotationId, setEditQuotationId] = useState<string | null>(null);
  const handleDeleteQuotation = async (quotationId: string) => {
    try {
      await quotationAPI.deleteQuotation(quotationId);
      addNotification({
        type: "success",
        title: "Deleted",
        message: "Quotation deleted successfully",
      });
      
      const qRes = await quotationAPI.getQuotations();
      setQuotations((qRes && qRes.data) || qRes || []);
    } catch (err) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to delete quotation",
      });
    }
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("quotations");
  const { addNotification } = useNotification();

  const [quotations, setQuotations] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [selectedQuotationForPDF, setSelectedQuotationForPDF] =
    useState<any>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const emptyScheduleEntry = () => ({
    type: "",
    
    serviceGiven: "",
    
    quantity: 1,
    price: 0,
    amount: 0,
    serviceType: "",
    date: "",
    startTime: "",
    endTime: "",
    venue: { name: "", address: "" },
    assignedStaff: [],
    inventorySelection: [],
  });

  const [createData, setCreateData] = useState<any>({
    client: "",
    branch: "",
    
    services: [{ name: "", serviceType: "", quantity: 1, price: 0, amount: 0 }],
    gstPct: 0,
    notes: "",
    
    servicesSchedule: [emptyScheduleEntry()],
    videoOutput: "",
    photoOutput: "",
    rawOutput: "",
    advanceAmount: 0,
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
    setEditMode(false);
    setEditQuotationId(null);
    setCreateData({
      client: "",
      branch: "",
      services: [{ name: "", serviceType: "", quantity: 1, price: 0, amount: 0 }],
      gstPct: 0,
      notes: "",
      servicesSchedule: [emptyScheduleEntry()],
      videoOutput: "",
      photoOutput: "",
      rawOutput: "",
      advanceAmount: 0,
    });
    setShowCreateModal(true);
    addNotification({
      type: "info",
      title: "Create Quotation",
      message: "Quotation creation form opened",
    });
  };

  const handleQuotationAction = (action: string, quotationId: string) => {
    if (action === "Edit") {
      const quotation = quotations.find(
        (q) =>
          q._id === quotationId ||
          q.quotationNumber === quotationId ||
          q.id === quotationId
      );
      if (quotation) {
        setEditMode(true);
        setEditQuotationId(quotation._id || quotation.quotationNumber);
        
        const scheduleFromQuote =
          quotation.functionDetailsList &&
          quotation.functionDetailsList.length > 0
            ? quotation.functionDetailsList.map((fd: any) => ({
                type: fd.type || fd.functionType || "",
                date: fd.date ? fd.date.split?.("T")?.[0] || fd.date : "",
                startTime: fd.time?.start || fd.startTime || "",
                endTime: fd.time?.end || fd.endTime || "",
                venue: fd.venue || { name: "", address: "" },
                assignedStaff: fd.assignedStaff || [],
                inventorySelection: fd.inventorySelection || [],
              }))
            : [
                {
                  type: quotation.functionDetails?.type || "",
                  date: quotation.functionDetails?.date
                    ? quotation.functionDetails.date.split?.("T")?.[0] ||
                      quotation.functionDetails.date
                    : "",
                  startTime:
                    quotation.functionDetails?.time?.start ||
                    quotation.functionDetails?.startTime ||
                    "",
                  endTime:
                    quotation.functionDetails?.time?.end ||
                    quotation.functionDetails?.endTime ||
                    "",
                  venue: quotation.functionDetails?.venue || {
                    name: "",
                    address: "",
                  },
                  assignedStaff: quotation.assignedStaff || [],
                  inventorySelection: quotation.inventorySelection || [],
                },
              ];

        setCreateData({
          client: quotation.client?._id || quotation.client || "",
          branch: quotation.branch?._id || quotation.branch || "",
          
          services:
              (quotation.services && Array.isArray(quotation.services)
              ? quotation.services.map((s: any) => ({
                  name: s.service || s.name || "",
                  serviceType: s.serviceType || s.type || s.category || "",
                  quantity: s.quantity ?? s.qty ?? 1,
                  price: s.rate ?? s.price ?? 0,
                  amount:
                    (s.amount ??
                      ((s.quantity ?? s.qty ?? 1) * (s.rate ?? s.price ?? 0))) ||
                    0,
                  description: s.description || "",
                }))
              : [{ name: "", serviceType: "", quantity: 1, price: 0, amount: 0 }]),
          gstPct: quotation.gstPct || quotation.pricing?.gstPct || 0,
          notes: quotation.notes || "",
          servicesSchedule:
            scheduleFromQuote.length > 0
              ? scheduleFromQuote
              : [emptyScheduleEntry()],
          videoOutput: quotation.videoOutput || "",
          photoOutput: quotation.photoOutput || "",
          rawOutput: quotation.rawOutput || "",
          advanceAmount: quotation.advanceAmount || 0,
        });
        setShowCreateModal(true);
      } else {
        addNotification({
          type: "error",
          title: "Error",
          message: "Quotation not found for edit",
        });
      }
      return;
    }
    if (action === "Download") {
      
      const quotation = quotations.find(
        (q) =>
          q._id === quotationId ||
          q.quotationNumber === quotationId ||
          q.id === quotationId
      );
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
      
      const totalAmount = Number(
        quotation.pricing?.totalAmount ?? quotation.totalAmount ?? 0
      );
      const advanceAmount = Number(quotation.advanceAmount ?? 0);
      
      const functionDetailsList =
        quotation.functionDetailsList &&
        quotation.functionDetailsList.length > 0
          ? quotation.functionDetailsList
          : quotation.functionDetails
          ? [quotation.functionDetails]
          : [];

      const pdfData = {
        quotationNumber:
          quotation.quotationNumber || quotation.id || quotation._id || "",
        date:
          quotation.quotationDate ||
          quotation.date ||
          new Date().toLocaleDateString(),
        client: {
          name: quotation.client?.name || quotation.clientName || "N/A",
          address:
            quotation.client?.address ||
            quotation.functionDetails?.venue?.address ||
            quotation.eventLocation ||
            "Address not provided",
          contact: quotation.client?.phone || quotation.clientPhone || "N/A",
          gstin: quotation.client?.gstin || quotation.clientGSTIN || "",
        },
        videoOutput: quotation.videoOutput || "",
        photoOutput: quotation.photoOutput || "",
        rawOutput: quotation.rawOutput || "",
        
        schedule: (functionDetailsList || []).map((fd: any) => ({
          type: fd.type || fd.functionType || "",
          serviceGiven: fd.serviceGiven || "",
          serviceType: fd.serviceType || "",
          quantity: fd.quantity ?? fd.qty ?? 0,
          price: Number(fd.price ?? fd.rate ?? 0),
          amount: Number(fd.amount ?? (Number(fd.quantity ?? 0) * Number(fd.price ?? fd.rate ?? 0))),
          date: fd.date ? fd.date.split?.("T")?.[0] || fd.date : "",
          startTime: fd.time?.start || fd.startTime || "",
          endTime: fd.time?.end || fd.endTime || "",
          venue: fd.venue || {},
        })),
        
        
        items:
          (quotation.services && quotation.services.length > 0
            ? (quotation.services || []).map((service: any) => ({
                description:
                  service.service || service.name || service.description || "",
                rate: Number(service.rate ?? service.price ?? 0),
                amount: Number(
                  service.amount ??
                    (service.quantity ?? 1) * (service.rate ?? service.price ?? 0)
                ),
                serviceType: service.serviceType || service.type || "",
                dates:
                  service.dates && service.dates.length > 0
                    ? service.dates
                    : (functionDetailsList || []).map((fd: any) =>
                        fd.date ? fd.date.split?.("T")?.[0] || fd.date : ""
                      ),
              }))
            : (functionDetailsList || []).map((fd: any) => ({
                description: fd.serviceGiven || fd.serviceType || fd.type || "",
                rate: Number(fd.price ?? fd.rate ?? 0),
                amount: Number(fd.amount ?? (Number(fd.quantity ?? 0) * Number(fd.price ?? fd.rate ?? 0))),
                serviceType: fd.serviceType || "",
                dates: fd.date ? [fd.date.split?.("T")?.[0] || fd.date] : [],
              }))),
        total: isNaN(totalAmount) ? 0 : totalAmount,
        receivedAmount: isNaN(advanceAmount) ? 0 : advanceAmount,
        backDues: Number(quotation.backDues ?? 0),
        currentDues: Number(
          quotation.currentDues ??
            (isNaN(totalAmount - advanceAmount)
              ? 0
              : totalAmount - advanceAmount)
        ),
        totalDues: Number(
          quotation.totalDues ??
            (isNaN(totalAmount - advanceAmount)
              ? 0
              : totalAmount - advanceAmount)
        ),
      };

      setSelectedQuotationForPDF(pdfData);
      setShowPDFModal(true);
    } catch (error) {
      console.error("Download error:", error);
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to prepare quotation for download",
      });
    }
  };

  const handleCreateSubmit = async () => {
    try {
      
      const scheduleEntries = Array.isArray(createData.servicesSchedule)
        ? createData.servicesSchedule
        : [];
      const normalizedServices = scheduleEntries
        .filter((s: any) => s && (s.serviceGiven || s.serviceType))
        .map((s: any) => ({
          service: s.serviceGiven || s.serviceType || "",
          serviceType: s.serviceType || "",
          description: s.description || "",
          quantity: Number(s.quantity ?? 1),
          rate: Number(s.price ?? s.rate ?? 0),
          amount: Number(s.amount ?? (Number(s.quantity ?? 1) * Number(s.price ?? s.rate ?? 0))),
        }));

      const subtotal = normalizedServices.reduce(
        (sum: number, s: any) => sum + Number(s.amount || 0),
        0
      );
      const gstPct = Number(createData.gstPct || 0);
      const gstAmount = +(subtotal * (gstPct / 100));
      const finalAmount = +(subtotal + gstAmount);

      
      const schedule = Array.isArray(createData.servicesSchedule)
        ? createData.servicesSchedule
        : [];
      const functionDetailsList = schedule
        .filter((s: any) => s && (s.type || s.date))
        .map((s: any) => ({
          type: s.type || "",
          serviceGiven: s.serviceGiven || "",
          date: s.date || null,
          time: { start: s.startTime || "", end: s.endTime || "" },
          venue: s.venue || {},
          assignedStaff: s.assignedStaff || [],
          inventorySelection: s.inventorySelection || [],
        }));

      const payload = {
        client: createData.client,
        branch: createData.branch,
        services: normalizedServices,
        pricing: { subtotal, gstAmount, totalAmount: finalAmount, finalAmount },
        
        functionDetailsList: functionDetailsList,
        functionDetails:
          functionDetailsList.length > 0
            ? {
                type: functionDetailsList[0].type || "",
                date: functionDetailsList[0].date || null,
                time: functionDetailsList[0].time || { start: "", end: "" },
                venue: functionDetailsList[0].venue || {},
              }
            : {
                type: "",
                date: null,
                time: { start: "", end: "" },
                venue: {},
              },
        videoOutput: createData.videoOutput,
        photoOutput: createData.photoOutput,
        rawOutput: createData.rawOutput,
        notes: createData.notes,
        advanceAmount: createData.advanceAmount,
        status: "pending",
      };

      if (editMode && editQuotationId) {
        
        await quotationAPI.updateQuotation(editQuotationId, payload);
        addNotification({
          type: "success",
          title: "Updated",
          message: "Quotation updated",
        });
      } else {
        
        await quotationAPI.createQuotation(payload);
        addNotification({
          type: "success",
          title: "Created",
          message: "Quotation created",
        });
      }
      setShowCreateModal(false);

      
      const qRes = await quotationAPI.getQuotations();
      setQuotations((qRes && qRes.data) || qRes || []);
    } catch (err) {
      addNotification({
        type: "error",
        title: "Error",
        message: editMode
          ? "Failed to update quotation"
          : "Failed to create quotation",
      });
    }
  };

  
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
        addNotification({
          type: "error",
          title: "Error",
          message: "Failed to load branches/clients",
        });
      }
    };
    load();
  }, []);

  

  
  const updateScheduleEntry = (index: number, field: string, value: any) => {
    setCreateData((prev: any) => {
      const schedule = Array.isArray(prev.servicesSchedule)
        ? [...prev.servicesSchedule]
        : [];
      const entry = { ...(schedule[index] || {}) };
      if (field.startsWith("venue.")) {
        const venueField = field.split(".")[1];
        entry.venue = { ...(entry.venue || {}), [venueField]: value };
      } else {
        entry[field] = value;
      }
      schedule[index] = entry;
      return { ...prev, servicesSchedule: schedule };
    });
  };

  const addScheduleEntry = () => {
    setCreateData((prev: any) => ({
      ...prev,
      servicesSchedule: [
        ...(prev.servicesSchedule || []),
        emptyScheduleEntry(),
      ],
    }));
  };

  const removeScheduleEntry = (index: number) => {
    setCreateData((prev: any) => {
      const schedule = [...(prev.servicesSchedule || [])];
      schedule.splice(index, 1);
      return {
        ...prev,
        servicesSchedule: schedule.length ? schedule : [emptyScheduleEntry()],
      };
    });
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
      (quotation.client?.name?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (quotation.quotationNumber?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (quotation.functionDetails?.type?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      );
    const matchesFilter =
      filterStatus === "all" || quotation.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const quotationStats = {
    total: quotations.length,
    sent: quotations.filter((q) => q.status === "sent").length,
    approved: quotations.filter((q) => q.status === "approved").length,
    pending: quotations.filter((q) => q.status === "pending").length,
    totalValue: quotations.reduce((sum, q) => {
      
      const val = Number(q.pricing?.totalAmount ?? q.totalAmount ?? 0);
      return sum + (isNaN(val) ? 0 : val);
    }, 0),
    approvalRate:
      quotations.length === 0
        ? 0
        : Math.round(
            (quotations.filter((q) => q.status === "approved").length /
              quotations.length) *
              100
          ),
  };

  return (
    <div className="space-y-6">
      {}
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
          className="btn-primary px-6 py-2 rounded-lg transition-all duration-200 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Quotation
        </button>
      </div>

      {}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editMode ? "Edit Quotation" : "Create Quotation"}
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateSubmit();
              }}
              className="p-6 space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client *
                  </label>
                  <select
                    required
                    value={createData.client}
                    onChange={(e) =>
                      setCreateData({ ...createData, client: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select client</option>
                    {clients.map((c: any) => (
                      <option key={c._id} value={c._id}>
                        {c.name} - {c.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch *
                  </label>
                  <select
                    required
                    value={createData.branch}
                    onChange={(e) =>
                      setCreateData({ ...createData, branch: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select branch</option>
                    {branches.map((b: any) => (
                      <option key={b._id} value={b._id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Service Schedule
                </h3>
                <div className="space-y-4">
                  {(createData.servicesSchedule || []).map(
                    (entry: any, idx: number) => (
                      <div key={idx} className="p-3 border rounded-lg bg-white">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">Service #{idx + 1}</div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => removeScheduleEntry(idx)}
                              className="text-red-600"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Event / Function Type
                            </label>
                            <input
                              type="text"
                              value={entry.type || ""}
                              onChange={(e) =>
                                updateScheduleEntry(idx, "type", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Service Given
                            </label>
                            <input
                              type="text"
                              value={entry.serviceGiven || ""}
                              onChange={(e) =>
                                updateScheduleEntry(idx, "serviceGiven", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Type
                            </label>
                            <input
                              type="text"
                              value={entry.serviceType || ""}
                              onChange={(e) =>
                                updateScheduleEntry(idx, "serviceType", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Qty</label>
                              <input
                                type="number"
                                min={0}
                                value={entry.quantity ?? 0}
                                onChange={(e) => {
                                  const val = Number(e.target.value || 0);
                                  updateScheduleEntry(idx, "quantity", val);
                                  const price = Number(entry.price || 0);
                                  updateScheduleEntry(idx, "amount", +(val * price));
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                              <input
                                type="number"
                                min={0}
                                value={entry.price ?? 0}
                                onChange={(e) => {
                                  const val = Number(e.target.value || 0);
                                  updateScheduleEntry(idx, "price", val);
                                  const qty = Number(entry.quantity || 0);
                                  updateScheduleEntry(idx, "amount", +(qty * val));
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                              <input
                                type="number"
                                min={0}
                                value={entry.amount ?? 0}
                                onChange={(e) => updateScheduleEntry(idx, "amount", Number(e.target.value || 0))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Venue Name
                            </label>
                            <input
                              type="text"
                              value={entry.venue?.name || ""}
                              onChange={(e) =>
                                updateScheduleEntry(
                                  idx,
                                  "venue.name",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Date *
                            </label>
                            <input
                              required
                              type="date"
                              value={
                                entry.date
                                  ? entry.date.split?.("T")?.[0] || entry.date
                                  : ""
                              }
                              onChange={(e) =>
                                updateScheduleEntry(idx, "date", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Start Time
                            </label>
                            <input
                              type="time"
                              value={entry.startTime || ""}
                              onChange={(e) =>
                                updateScheduleEntry(
                                  idx,
                                  "startTime",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              End Time
                            </label>
                            <input
                              type="time"
                              value={entry.endTime || ""}
                              onChange={(e) =>
                                updateScheduleEntry(
                                  idx,
                                  "endTime",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Venue Address
                          </label>
                          <input
                            type="text"
                            value={entry.venue?.address || ""}
                            onChange={(e) =>
                              updateScheduleEntry(
                                idx,
                                "venue.address",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                    )
                  )}

                  <div>
                    <button
                      type="button"
                      onClick={addScheduleEntry}
                      className="px-3 py-1 bg-gray-100 rounded"
                    >
                      Add Service Date
                    </button>
                  </div>
                </div>
              </div>

                {}

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Output
                </label>
                <input
                  type="text"
                  value={createData.videoOutput || ""}
                  onChange={(e) =>
                    setCreateData({
                      ...createData,
                      videoOutput: e.target.value,
                    })
                  }
                  className="w-full border rounded px-3 py-2 mb-2"
                  placeholder="e.g. Raw Data in Party Storage Device"
                />
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo Output
                </label>
                <input
                  type="text"
                  value={createData.photoOutput || ""}
                  onChange={(e) =>
                    setCreateData({
                      ...createData,
                      photoOutput: e.target.value,
                    })
                  }
                  className="w-full border rounded px-3 py-2 mb-2"
                  placeholder="e.g. Raw Data in Party Storage Device"
                />
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raw Output
                </label>
                <input
                  type="text"
                  value={createData.rawOutput || ""}
                  onChange={(e) =>
                    setCreateData({ ...createData, rawOutput: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 mb-2"
                  placeholder="e.g. Raw Data in Party HDD/Storage Device"
                />
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={createData.notes}
                  onChange={(e) =>
                    setCreateData({ ...createData, notes: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg"
                >
                  {editMode ? "Update Quotation" : "Create & Download PDF"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
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
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Total Value</p>
              <p className="text-xl font-bold text-gray-900">
                ₹{quotationStats.totalValue.toLocaleString()}
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

      {}
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

        {}
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
                    key={quotation._id || quotation.quotationNumber}
                    className="bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-200 p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-3 rounded-lg mr-4">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {quotation.quotationNumber || quotation._id}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {quotation.functionDetails?.type || "Event"}
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
                            {quotation.client?.name || "N/A"}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Mail className="w-4 h-4 mr-2" />
                            {quotation.client?.email || "N/A"}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Phone className="w-4 h-4 mr-2" />
                            {quotation.client?.phone || "N/A"}
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
                            {quotation.functionDetails?.date
                              ? new Date(
                                  quotation.functionDetails.date
                                ).toLocaleDateString()
                              : "N/A"}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            {quotation.functionDetails?.venue?.address || "N/A"}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Camera className="w-4 h-4 mr-2" />
                            {quotation.photographer || "N/A"}
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
                              ₹{quotation.pricing?.subtotal || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">GST:</span>
                            <span className="font-medium text-gray-900">
                              ₹{quotation.pricing?.gstAmount || 0}
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-bold text-gray-900">
                              ₹{quotation.pricing?.totalAmount || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Valid Until:</span>
                            <span className="font-medium text-gray-900">
                              {quotation.terms?.validity
                                ? `${quotation.terms.validity} days`
                                : "N/A"}
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
                                {service.service || service.name || "Service"}{" "}
                                (x{service.quantity || 1})
                              </span>
                              <span className="font-medium text-gray-900">
                                ₹{service.rate || service.price || 0}
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
                        Created:{" "}
                        {quotation.createdAt
                          ? new Date(quotation.createdAt).toLocaleString()
                          : "N/A"}
                        {quotation.followUp?.nextFollowUp && (
                          <span className="ml-4">
                            Follow-up:{" "}
                            {new Date(
                              quotation.followUp.nextFollowUp
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            handleQuotationAction(
                              "View",
                              quotation._id || quotation.quotationNumber
                            )
                          }
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Quotation"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleQuotationAction(
                              "Edit",
                              quotation._id || quotation.quotationNumber
                            )
                          }
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Edit Quotation"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleQuotationAction(
                              "Download",
                              quotation._id || quotation.quotationNumber
                            )
                          }
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleQuotationAction(
                              "Send",
                              quotation._id || quotation.quotationNumber
                            )
                          }
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Send to Client"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteQuotation(
                              quotation._id || quotation.quotationNumber
                            )
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Quotation"
                        >
                          <XCircle className="w-4 h-4" />
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

      {}
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
                    console.error("PDF generation error:", error);
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
