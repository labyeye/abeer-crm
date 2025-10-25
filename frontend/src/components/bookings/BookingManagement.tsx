import React, { useState, useEffect, useRef } from "react";
import DateInputDDMMYYYY from "../common/DateInputDDMMYYYY";
import {
  Calendar,
  Plus,
  Search,
  Clock,
  Camera,
  CheckCircle,
  Edit,
  Trash2,
  Loader2,
  X,
  FileText,
  Download,
  IndianRupee,
  AlertCircle,
  ReceiptIndianRupee,
} from "lucide-react";
import { useNotification } from "../../contexts/NotificationContext";
import BookingPDFTemplate from "./BookingPDFTemplate";
import { useReactToPrint } from "react-to-print";
import { useAuth } from "../../contexts/AuthContext";

import {
  bookingAPI,
  clientAPI,
  staffAPI,
  inventoryAPI,
  branchAPI,
  serviceCategoryAPI,
} from "../../services/api";
import StatCard from "../ui/StatCard";

interface Booking {
  _id: string;
  bookingNumber: string;
  client: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  functionDetails: {
    type: string;
    startDate: string;
    endDate: string;
    date: string;
    time: {
      start: string;
      end: string;
    };
    venue: {
      name: string;
      address: string;
    };
  };
  serviceNeeded: string;
  inventorySelection: Array<{
    _id: string;
    name: string;
    type: string;
  }>;
  assignedStaff: Array<{
    _id: string;
    name: string;
    // designation removed
  }>;
  bookingBranch: {
    _id: string;
    name: string;
    code: string;
  };
  services: string[];
  pricing: {
    subtotal?: number;
    gstAmount?: number;
    totalAmount: number;
    advanceAmount: number;
    remainingAmount?: number;
  };
  status:
    | "enquiry"
    | "pending"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled";
  videoOutput?: string;
  photoOutput?: string;
  rawOutput?: string;
  notes?: string;
  createdAt: string;
}

interface Client {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

interface Staff {
  _id: string;
  name: string;
  employeeId: string;
}

interface InventoryItem {
  _id: string;
  name: string;
  category: string;
  quantity: number;
}

interface Branch {
  _id: string;
  name: string;
  code: string;
}

const BookingManagement = () => {
  // DateInputDDMMYYYY keeps native picker but shows DD/MM/YYYY preview

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterClient, setFilterClient] = useState("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  // Inventory can be an array or a paginated object with docs
  type PaginatedInventory = { docs: InventoryItem[]; [key: string]: any };
  const [inventory, setInventory] = useState<
    InventoryItem[] | PaginatedInventory
  >([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [professionalClients, setProfessionalClients] = useState<Client[]>([]);
  const [inventoryCategories, setInventoryCategories] = useState<string[]>([]);
  const [inventoryCategoryFilters, setInventoryCategoryFilters] = useState<{
    [key: number]: string;
  }>({});
  const [cachedInventoryByCategory, setCachedInventoryByCategory] = useState<{
    [category: string]: InventoryItem[];
  }>({});
  const [staffDropdownStates, setStaffDropdownStates] = useState<{
    [key: number]: boolean;
  }>({});
  const [equipDropdownStates, setEquipDropdownStates] = useState<{
    [key: number]: boolean;
  }>({});
  const [staffOutsourceStates, setStaffOutsourceStates] = useState<{
    [key: number]: boolean;
  }>({});
  const [equipOutsourceStates, setEquipOutsourceStates] = useState<{
    [key: number]: boolean;
  }>({});
  const [outsourceStaff, setOutsourceStaff] = useState<{
    [key: number]: string[];
  }>({});
  const [outsourceEquipment, setOutsourceEquipment] = useState<{
    [key: number]: any[];
  }>({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [pdfBookingData, setPdfBookingData] = useState<any>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    clientId: "",
    // servicesSchedule allows multiple service entries (date/time/staff/equipment per entry)
    servicesSchedule: [
      {
        serviceCategoryId: "",
        serviceType: [] as string[],
        serviceName: "",
        event: "",
        date: "",
        startTime: "",
        endTime: "",
        venueName: "",
        venueAddress: "",
        assignedStaff: [] as string[],
        inventorySelection: [] as string[],
        quantity: 1,
        price: undefined,
        amount: undefined,
      },
    ] as Array<{
      serviceName?: string;
      serviceCategoryId?: string;
      serviceType?: string[];
      event?: string;
      date: string;
      startTime: string;
      endTime: string;
      venueName?: string;
      venueAddress?: string;
      assignedStaff: string[];
      inventorySelection: string[];
      quantity?: number;
      price?: number;
      amount?: number;
    }>,
    functionType: "",
    venueName: "",
    venueAddress: "",
    serviceNeeded: "",
    inventorySelection: [] as string[],
    assignedStaff: [] as string[],
    bookingBranch: "",
    services: [] as any[],
    totalAmount: 0,
    applyGST: false,
    gstIncluded: true,
    gstRate: 18,
    gstAmount: 0,
    discountAmount: 0,
    manualTotal: false,
    advanceAmount: 0,
    status: "enquiry",
    notes: "",
    event: "",
    videoOutput: "",
    photoOutput: "",
    rawOutput: "",
    audioOutput: "",
    videoOutputEnabled: false,
    photoOutputEnabled: false,
    rawOutputEnabled: false,
    audioOutputEnabled: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const { addNotification } = useNotification();

  const { user } = useAuth();
  // If the authenticated user belongs to a branch, auto-select that branch
  // for list filtering and for the booking form where appropriate.
  useEffect(() => {
    try {
      if (user?.branchId) {
        // set branch filter in header to user's branch so they see their branch bookings by default
        setFilterBranch(user.branchId);
        // prefill booking form branch (keeps any existing bookingBranch value if present)
  setFormData((prev) => ({ ...prev, bookingBranch: prev.bookingBranch || user.branchId || "" }));
      }
    } catch (err) {
      // no-op
    }
  }, [user]);
  const fetchData = async () => {
    try {
      setLoading(true);
      let bookingsRes;
      if (user?.role === "staff") {
        console.log("🔍 Fetching bookings for staff user:", user);
        console.log("📱 Staff user ID:", user.id);
        bookingsRes = await bookingAPI.getBookingsForStaff(user.id);
        console.log("📊 Staff bookings response:", bookingsRes);
      } else {
        bookingsRes = await bookingAPI.getBookings();
      }
      const [clientsRes, staffRes, branchesRes] = await Promise.all([
        clientAPI.getClients(),
        staffAPI.getStaff(),
        branchAPI.getBranches(),
      ]);

      // Try to fetch inventory separately (might fail for staff users)
      let inventoryRes: any = { data: { data: [] } };
      try {
        inventoryRes = await inventoryAPI.getInventory();
        console.log("✅ Inventory fetched successfully");
      } catch (error) {
        console.log(
          "⚠️ Could not fetch inventory (might be permission issue):",
          error
        );
        // Set empty inventory for staff users or when permission denied
        inventoryRes = { data: { data: [] } };
      }
      setBookings(
        Array.isArray(bookingsRes.data)
          ? bookingsRes.data
          : bookingsRes.data.data || []
      );
      const allClients = Array.isArray(clientsRes.data)
        ? clientsRes.data
        : clientsRes.data.data || [];
      setClients(allClients);
      // Filter professional clients for outsource staff
      setProfessionalClients(
        allClients.filter(
          (client: any) =>
            client.category && client.category.toLowerCase() === "professional"
        )
      );
      setStaff(
        Array.isArray(staffRes.data) ? staffRes.data : staffRes.data.data || []
      );
      setInventory(
        Array.isArray(inventoryRes.data.data?.docs)
          ? inventoryRes.data.data.docs
          : Array.isArray(inventoryRes.data.data)
          ? inventoryRes.data.data
          : inventoryRes.data || []
      );
      setBranches(
        Array.isArray(branchesRes.data)
          ? branchesRes.data
          : branchesRes.data.data || []
      );
      // fetch inventory category breakdown to use as equipment category filters
      try {
        const statsRes: any = await inventoryAPI.getInventoryStats();
        const statsData = statsRes.data || statsRes;
        const catBreakdown =
          statsData?.data?.categoryBreakdown ||
          statsData?.categoryBreakdown ||
          [];
        const cats = Array.isArray(catBreakdown)
          ? catBreakdown.map((c: any) => c._id).filter(Boolean)
          : [];
        // sort categories alphabetically (case-insensitive)
        cats.sort((a: string, b: string) =>
          String(a).toLowerCase().localeCompare(String(b).toLowerCase())
        );
        setInventoryCategories(cats);
      } catch (err) {
        console.warn("Could not fetch inventory categories", err);
        setInventoryCategories([]);
      }
      // load service categories for picker
      try {
        const catsRes: any = await serviceCategoryAPI.getCategories();
        // serviceCategoryAPI returns response.data in api wrapper; accommodate both shapes
        const resolvedCats = (catsRes && (catsRes.data || catsRes)) || [];
        setCategories(
          Array.isArray(resolvedCats) ? resolvedCats : resolvedCats?.data || []
        );
      } catch (err) {
        console.warn("Could not load service categories", err);
        setCategories([]);
      }
    } catch (error: unknown) {
      addNotification({
        type: "error",
        title: "Error",
        message:
          error instanceof Error ? error.message : "Failed to fetch data",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const onCats = () => {
      // re-fetch categories only to update dropdowns
      (async () => {
        try {
          const catsRes: any = await serviceCategoryAPI.getCategories();
          const resolvedCats = (catsRes && (catsRes.data || catsRes)) || [];
          setCategories(
            Array.isArray(resolvedCats)
              ? resolvedCats
              : resolvedCats?.data || []
          );
        } catch (e) {
          console.warn("Could not refresh categories", e);
        }
      })();
    };
    window.addEventListener(
      "serviceCategoriesUpdated",
      onCats as EventListener
    );
    return () => {
      window.removeEventListener(
        "serviceCategoriesUpdated",
        onCats as EventListener
      );
    };
  }, []);

  const resetForm = () => {
    setFormData({
      clientId: "",
      // start with one service schedule entry with default date set to today
      servicesSchedule: [
        {
          serviceCategoryId: "",
          serviceType: [] as string[],
          event: "",
          date: new Date().toISOString().split("T")[0], // Default to today's date
          startTime: "",
          endTime: "",
          venueName: "",
          venueAddress: "",
          assignedStaff: [],
          inventorySelection: [],
          quantity: 1,
          price: undefined,
          amount: undefined,
        },
      ],
      functionType: "",
      venueName: "",
      venueAddress: "",
      serviceNeeded: "",
      inventorySelection: [],
      assignedStaff: [],
  bookingBranch: user?.branchId || "",
      services: [],
      totalAmount: 0,
      applyGST: false,
      gstIncluded: true,
      gstRate: 18,
      gstAmount: 0,
      discountAmount: 0,
      manualTotal: false,
      advanceAmount: 0,
      status: "enquiry",
      notes: "",
      event: "",
      videoOutput: "",
      photoOutput: "",
      rawOutput: "",
      audioOutput: "",
      videoOutputEnabled: false,
      photoOutputEnabled: false,
      rawOutputEnabled: false,
      audioOutputEnabled: false,
    });
  };

  // Helper to compute remaining amount from various possible pricing shapes
  const getRemainingAmount = (b: Booking | null | undefined) => {
    if (!b || !b.pricing) return 0;
    const p: any = b.pricing as any;
    // Prefer explicit remainingAmount when provided
    if (p.remainingAmount != null) return p.remainingAmount;
    // If we have numeric totalAmount, compute remaining from advance (arithmetic never yields null/undefined)
    if (typeof p.totalAmount === "number")
      return p.totalAmount - (p.advanceAmount || 0);
    // Fallback to legacy balanceAmount if present
    if (p.balanceAmount != null) return p.balanceAmount;
    return 0;
  };

  // compute subtotal from current formData servicesSchedule
  const computeSubtotalFromForm = (fd = formData) =>
    (fd.servicesSchedule || []).reduce((sum: number, s: any) => {
      const amount = Number(s.amount);
      if (!isNaN(amount) && amount > 0) return sum + amount;
      // fallback to price * quantity if amount not provided
      const price = Number(s.price) || 0;
      const qty = Number(s.quantity) || 1;
      return sum + price * qty;
    }, 0);

  // Derive a reliable base amount excluding GST from previous form state or subtotal.
  // This treats an existing gstAmount as authoritative when present, otherwise falls back
  // to dividing a GST-included total by (1 + rate/100). Finally falls back to subtotal.
  const computeBaseExcludingGST = (
    prev: any,
    subtotalFallback: number,
    gstRate: number
  ) => {
    const ta = Number(prev.totalAmount) || 0;
    const ga = Number(prev.gstAmount) || 0;
    const rate = gstRate || 18;
    if (ta > 0) {
      if (ga > 0) {
        // If we have a known gstAmount, subtract it to get base
        return Number((ta - ga).toFixed(2));
      }
      // If no gstAmount but GST is applied, try dividing to extract base
      if (prev.applyGST) {
        return Number((ta / (1 + rate / 100)).toFixed(2));
      }
      // otherwise treat totalAmount as base (manual override without GST)
      return Number(ta.toFixed(2));
    }
    // no manual total: fallback to computed subtotal (which is amount excluding GST)
    return Number(subtotalFallback || 0);
  };
  const handleAddBooking = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Recompute gstAmount and totalAmount when schedule or GST settings change, unless user has provided a manual totalAmount (>0)
  useEffect(() => {
    try {
      const subtotal = computeSubtotalFromForm();
      const gstRate = formData.gstRate ?? 18;
      const apply = !!formData.applyGST;
      const included = !!formData.gstIncluded;
      const computed = apply
        ? included
          ? Number(((subtotal * gstRate) / (100 + gstRate)).toFixed(2))
          : Number((subtotal * (gstRate / 100)).toFixed(2))
        : 0;
      // If user hasn't entered an override (<= 0), update total automatically
      if (!formData.totalAmount || Number(formData.totalAmount) <= 0) {
        const total =
          apply && !included
            ? Number((subtotal + computed).toFixed(2))
            : Number(subtotal.toFixed(2));
        setFormData((prev) => ({
          ...prev,
          gstAmount: computed,
          totalAmount: total,
        }));
      } else {
        setFormData((prev) => ({ ...prev, gstAmount: computed }));
      }
    } catch (err) {
      // ignore
    }
  }, [
    formData.servicesSchedule,
    formData.gstRate,
    formData.gstIncluded,
    formData.applyGST,
  ]);

  const handleEditBooking = async (booking: Booking) => {
    setSelectedBooking(booking);
    let scheduleEntries: any[] = [];
    const b: any = booking as any;
    if (
      Array.isArray(b.functionDetailsList) &&
      b.functionDetailsList.length > 0
    ) {
      scheduleEntries = b.functionDetailsList.map((fd: any, i: number) => {
        const svc = Array.isArray(b.services) ? b.services[i] : null;
        return {
          serviceName:
            svc?.service ||
            svc?.serviceName ||
            fd.type ||
            b.serviceNeeded ||
            "",
          date: fd.date
            ? typeof fd.date === "string"
              ? fd.date.split("T")[0]
              : new Date(fd.date).toISOString().split("T")[0]
            : b.functionDetails?.date
            ? b.functionDetails.date.split("T")[0]
            : "",
          startTime:
            (fd.time && fd.time.start) || b.functionDetails?.time?.start || "",
          endTime:
            (fd.time && fd.time.end) || b.functionDetails?.time?.end || "",
          venueName:
            (fd.venue && fd.venue.name) || b.functionDetails?.venue?.name || "",
          venueAddress:
            (fd.venue && fd.venue.address) ||
            b.functionDetails?.venue?.address ||
            "",
          assignedStaff:
            Array.isArray(fd.assignedStaff) && fd.assignedStaff.length
              ? fd.assignedStaff.map((s: any) => (s._id ? s._id : s))
              : b.assignedStaff?.map((s: any) => s._id) || [],
          inventorySelection:
            Array.isArray(fd.inventorySelection) && fd.inventorySelection.length
              ? fd.inventorySelection.map((it: any) => (it._id ? it._id : it))
              : b.inventorySelection?.map((i: any) => i._id) || [],
          quantity: svc?.quantity ?? svc?.qty ?? 1,
          price: svc?.rate ?? svc?.price ?? 0,
          amount:
            svc?.amount ??
            svc?.total ??
            (svc?.quantity ?? svc?.qty ?? 1) * (svc?.rate ?? svc?.price ?? 0),
          serviceCategoryId:
            svc?.serviceCategory || svc?.serviceCategoryId || "",
          serviceType: svc?.serviceType || svc?.type || [],
          // carry through any per-service event present on the service object as fallback; fall back to booking.event
          event: fd.event || svc?.event || svc?.eventName || b.event || "",
        };
      });
    } else if (Array.isArray(booking.services) && booking.services.length > 0) {
      // Fallback: map services to a single-date (functionDetails) when functionDetailsList is absent
      scheduleEntries = b.services.map((svc: any) => ({
        serviceName:
          svc.service ||
          svc.serviceName ||
          b.serviceNeeded ||
          b.functionDetails?.type ||
          "",
        date: b.functionDetails?.date
          ? b.functionDetails.date.split("T")[0]
          : "",
        startTime: b.functionDetails?.time?.start || "",
        endTime: b.functionDetails?.time?.end || "",
        venueName: b.functionDetails?.venue?.name || "",
        venueAddress: b.functionDetails?.venue?.address || "",
        assignedStaff: b.assignedStaff?.map((s: any) => s._id) || [],
        inventorySelection: b.inventorySelection?.map((i: any) => i._id) || [],
        quantity: svc.quantity ?? svc.qty ?? 1,
        price: svc.rate ?? svc.price ?? 0,
        amount:
          svc.amount ??
          svc.total ??
          (svc.quantity ?? svc.qty ?? 1) * (svc.rate ?? svc.price ?? 0),
        serviceCategoryId: svc.serviceCategory || svc.serviceCategoryId || "",
        serviceType: svc.serviceType || svc.type || [],
        // preserve any per-service event if the service object contains it, else fall back to booking.event
        event: svc.event || svc.eventName || b.event || "",
      }));
    } else {
      scheduleEntries = [
        {
          serviceName: b.serviceNeeded || b.functionDetails?.type || "",
          // preserve booking-level event if present
          event:
            b.event ||
            (b.functionDetails && (b.functionDetails.event || "")) ||
            "",
          date: b.functionDetails?.date
            ? b.functionDetails.date.split("T")[0]
            : "",
          startTime: b.functionDetails?.time?.start || "",
          endTime: b.functionDetails?.time?.end || "",
          venueName: b.functionDetails?.venue?.name || "",
          venueAddress: b.functionDetails?.venue?.address || "",
          assignedStaff: b.assignedStaff?.map((s: any) => s._id) || [],
          inventorySelection:
            b.inventorySelection?.map((i: any) => i._id) || [],
          quantity: 1,
          price: 0,
          amount: 0,
          serviceCategoryId: "",
          serviceType: [],
        },
      ];
    }

    // Prepopulate inventory category filters and cache so equipment and categories show up in edit
    try {
      const initialFilters: { [key: number]: string } = {};
      const initialCache: { [key: string]: any[] } = {};
      const branchId =
        (booking as any).branch?._id ||
        booking.bookingBranch?._id ||
        (user && user.branchId) ||
        undefined;
      // booking.inventorySelection may contain objects; build a map
      const invObjects = Array.isArray(booking.inventorySelection)
        ? booking.inventorySelection
        : [];
      for (let i = 0; i < scheduleEntries.length; i++) {
        const entry = scheduleEntries[i];
        const ids = entry.inventorySelection || [];
        if (ids && ids.length) {
          // find category of first matched inventory object
          let foundCat: string | null = null;
          for (const id of ids) {
            const found = invObjects.find(
              (it: any) => String(it._id || it) === String(id)
            );
            if (found && ((found as any).category || (found as any).type)) {
              foundCat = (found as any).category || (found as any).type || null;
              break;
            }
          }
          if (foundCat) {
            initialFilters[i] = foundCat;
            if (!cachedInventoryByCategory[foundCat]) {
              try {
                const params: any = { category: foundCat };
                if (branchId) params.branch = branchId;
                const res: any = await inventoryAPI.getInventory(params);
                const invData = res.data || res;
                const docs =
                  invData.docs ||
                  invData.data ||
                  invData.items ||
                  invData ||
                  [];
                initialCache[foundCat] = Array.isArray(docs) ? docs : [];
              } catch (err) {
                console.warn(
                  "Failed to prefetch inventory for category",
                  foundCat,
                  err
                );
              }
            }
          }
        }
      }
      if (Object.keys(initialFilters).length)
        setInventoryCategoryFilters((prev) => ({ ...prev, ...initialFilters }));
      if (Object.keys(initialCache).length)
        setCachedInventoryByCategory((prev) => ({ ...prev, ...initialCache }));
    } catch (err) {
      console.warn(
        "Error preparing edit prefill for inventory categories",
        err
      );
    }

    setFormData({
      clientId: booking.client._id,
      servicesSchedule: scheduleEntries.map((s) => ({
        ...s,
        serviceCategoryId: s.serviceCategoryId || s.serviceCategory || "",
        serviceType: s.serviceType || s.type || "",
      })),
      functionType: booking.functionDetails.type || "",
      venueName: booking.functionDetails.venue?.name || "",
      venueAddress: booking.functionDetails.venue?.address || "",
      serviceNeeded: booking.serviceNeeded || "",
      inventorySelection:
        booking.inventorySelection?.map((item) => item._id) || [],
      assignedStaff: booking.assignedStaff?.map((staff) => staff._id) || [],
      bookingBranch:
        (booking as any).branch?._id || booking.bookingBranch?._id || "",
      services: booking.services || [],
      totalAmount: booking.pricing.totalAmount,
      applyGST:
        (booking.pricing as any)?.applyGST ??
        !!((booking.pricing && (booking.pricing as any).gstAmount) || false),
      gstIncluded: (booking.pricing as any)?.gstIncluded ?? true,
      gstRate: (booking.pricing as any)?.gstRate || 18,
      gstAmount: (booking.pricing as any)?.gstAmount ?? 0,
      discountAmount: (booking.pricing as any)?.discountAmount ?? 0,
      manualTotal: !!(booking.pricing as any)?.manualTotal || false,
      advanceAmount: booking.pricing.advanceAmount,
      status: booking.status || "enquiry",
      notes: (booking as any).notes || "",
      event: (booking as any).event || "",
      videoOutput: (booking as any).videoOutput || "",
      photoOutput: (booking as any).photoOutput || "",
      rawOutput: (booking as any).rawOutput || "",
      audioOutput: (booking as any).audioOutput || "",
      videoOutputEnabled:
        (booking as any).videoOutputEnabled ?? !!(booking as any).videoOutput,
      photoOutputEnabled:
        (booking as any).photoOutputEnabled ?? !!(booking as any).photoOutput,
      rawOutputEnabled:
        (booking as any).rawOutputEnabled ?? !!(booking as any).rawOutput,
      audioOutputEnabled:
        (booking as any).audioOutputEnabled ?? !!(booking as any).audioOutput,
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Build schedule list and calculate pricing fields from servicesSchedule amounts
      const scheduleList =
        formData.servicesSchedule && formData.servicesSchedule.length > 0
          ? formData.servicesSchedule
          : [
              {
                serviceCategoryId: "",
                serviceType: [] as string[],
                date: new Date().toISOString(),
                startTime: "",
                endTime: "",
                venueName: formData.venueName,
                venueAddress: formData.venueAddress,
                assignedStaff: formData.assignedStaff || [],
                inventorySelection: formData.inventorySelection || [],
                quantity: 1,
                price: undefined,
                amount: undefined,
              },
            ];
      // Calculate subtotal using same logic as the form (amount if provided, otherwise price * qty)
      const subtotal = computeSubtotalFromForm({
        servicesSchedule: scheduleList,
      } as any);

      // Build functionDetailsList from servicesSchedule, and keep functionDetails as the first entry for compatibility
      const functionDetailsList = scheduleList.map((s: any, idx: number) => ({
        type:
          formData.functionType ||
          categories.find((c: any) => c._id === s.serviceCategoryId)?.name ||
          s.serviceName ||
          formData.serviceNeeded ||
          "General Service",
        date: s.date
          ? new Date(s.date).toISOString()
          : new Date().toISOString(),
        // include precise startDate/endDate ISO fields only when both date and times are provided
        startDate:
          s.date && s.startTime
            ? new Date(`${s.date}T${s.startTime}`).toISOString()
            : null,
        endDate:
          s.date && s.endTime
            ? new Date(`${s.date}T${s.endTime}`).toISOString()
            : null,
        time: {
          start: s.startTime || "",
          end: s.endTime || "",
        },
        venue: {
          name: s.venueName || formData.venueName || "",
          address: s.venueAddress || formData.venueAddress || "",
        },
        // preserve any per-service event (falls back to the global form event)
        event: s.event || formData.event || "",
        // include service metadata so backend can persist per-service info
        service:
          s.serviceName ||
          categories.find((c: any) => c._id === s.serviceCategoryId)?.name ||
          formData.serviceNeeded ||
          "",
        serviceType: Array.isArray(s.serviceType)
          ? s.serviceType
          : s.serviceType
          ? [s.serviceType]
          : [],
        serviceCategory: s.serviceCategoryId || s.serviceCategory || "",
        // carry price/quantity/amount into per-service details as well
        quantity: s.quantity ?? 1,
        rate: s.price ?? s.rate ?? 0,
        amount: s.amount ?? (s.quantity ?? 1) * (s.price ?? s.rate ?? 0),
        // Add outsource data (optional)
        outsourceStaff: outsourceStaff[idx] || [],
        outsourceEquipment: outsourceEquipment[idx] || [],
        // preserve per-service assignments explicitly so they don't get merged across services
        assignedStaff: Array.isArray(s.assignedStaff) ? s.assignedStaff : [],
        inventorySelection: Array.isArray(s.inventorySelection)
          ? s.inventorySelection
          : [],
      }));
      // We persist per-service assignedStaff and inventorySelection inside functionDetailsList only.
      // Do not send or maintain top-level `assignedStaff` or `inventorySelection` to avoid duplication/confusion.

      // Optional validation - only validate if service category is provided
      const invalidEntry = (scheduleList || []).find(
        (s: any) =>
          s.serviceCategoryId &&
          !(Array.isArray(s.serviceType) && s.serviceType.length > 0)
      );
      if (invalidEntry) {
        addNotification({
          type: "error",
          title: "Validation",
          message:
            "If you select a Service, please also select at least one Type.",
        });
        setSubmitting(false);
        return;
      }

      // Build services array from schedule entries for backend compatibility
      const servicesFromSchedule = scheduleList.map((s: any) => {
        const cat = (categories || []).find(
          (c: any) => c._id === s.serviceCategoryId
        );
        return {
          service: cat?.name || "General Service",
          serviceType:
            Array.isArray(s.serviceType) && s.serviceType.length > 0
              ? s.serviceType
              : [],
          serviceCategory: s.serviceCategoryId || "",
          // carry per-service event into services array for compatibility
          event: s.event || formData.event || "",
          quantity: s.quantity ?? 1,
          rate: s.price ?? 0,
          amount: s.amount ?? (s.quantity ?? 1) * (s.price ?? 0),
          description: "",
        };
      });

      // If there's only one schedule entry, include its startDate/endDate in top-level functionDetails for compatibility
      const primaryFunction =
        functionDetailsList.length === 1 ? functionDetailsList[0] : null;

      // compute GST and final totals respecting user override
      const gstRateForCalc = formData.gstRate ?? 18;
      const computedGstAmount = formData.applyGST
        ? formData.gstIncluded
          ? // GST already included in subtotal: extract portion
            Number(
              ((subtotal * gstRateForCalc) / (100 + gstRateForCalc)).toFixed(2)
            )
          : // GST not included: compute on top of subtotal
            Number((subtotal * (gstRateForCalc / 100)).toFixed(2))
        : 0;

      // determine final total: if user provided a non-zero totalAmount, prefer it; otherwise compute
      const rawFinal =
        Number(formData.totalAmount) > 0
          ? Number(formData.totalAmount)
          : formData.applyGST && !formData.gstIncluded
          ? Number((subtotal + computedGstAmount).toFixed(2))
          : Number(subtotal.toFixed(2));
      const finalTotalAmount = Math.max(
        0,
        rawFinal - (formData.discountAmount || 0)
      );

      const remainingAmount = Math.max(
        0,
        finalTotalAmount - (formData.advanceAmount || 0)
      );

      const bookingData = {
        client: formData.clientId,
        branch: formData.bookingBranch,
        functionDetails: primaryFunction
          ? {
              ...primaryFunction,
              // ensure event is present on top-level functionDetails for compatibility
              event: primaryFunction.event || formData.event || "",
              // ensure date, time, startDate, endDate exist on top-level functionDetails
              date: primaryFunction.date,
              time: primaryFunction.time,
              startDate: primaryFunction.startDate,
              endDate: primaryFunction.endDate,
            }
          : functionDetailsList[0] || functionDetailsList,
        functionDetailsList,
        serviceNeeded:
          formData.serviceNeeded ||
          (scheduleList[0] &&
            (categories.find(
              (c: any) => c._id === scheduleList[0].serviceCategoryId
            )?.name ||
              (Array.isArray(scheduleList[0].serviceType)
                ? scheduleList[0].serviceType.join(", ")
                : (scheduleList[0].serviceName as string) || ""))) ||
          "",
        // per-service assignedStaff and inventorySelection live inside functionDetailsList
        bookingBranch: formData.bookingBranch,
        status: formData.status,
        services: servicesFromSchedule,
        pricing: {
          subtotal,
          applyGST: !!formData.applyGST,
          gstRate: formData.applyGST ? formData.gstRate : 0,
          gstIncluded: !!formData.applyGST && !!formData.gstIncluded,
          gstAmount: computedGstAmount,
          discountAmount: formData.discountAmount || 0,
          manualTotal: !!formData.manualTotal,
          totalAmount: finalTotalAmount,
          advanceAmount: formData.advanceAmount,
          remainingAmount,
        },
        notes: formData.notes,
        event: formData.event,
        videoOutput: formData.videoOutputEnabled ? formData.videoOutput : "",
        photoOutput: formData.photoOutputEnabled ? formData.photoOutput : "",
        rawOutput: formData.rawOutputEnabled ? formData.rawOutput : "",
        audioOutput: formData.audioOutputEnabled ? formData.audioOutput : "",
        videoOutputEnabled: formData.videoOutputEnabled,
        photoOutputEnabled: formData.photoOutputEnabled,
        rawOutputEnabled: formData.rawOutputEnabled,
        audioOutputEnabled: formData.audioOutputEnabled,
      };

      if (selectedBooking) {
        await bookingAPI.updateBooking(selectedBooking._id, bookingData);
        addNotification({
          type: "success",
          title: "Success",
          message: "Booking updated successfully",
        });
      } else {
        await bookingAPI.createBooking(bookingData);
        addNotification({
          type: "success",
          title: "Success",
          message: "Booking created successfully",
        });
      }

      // Notify other parts of the app (e.g., CompanyManagement) that branches may have updated
      try {
        window.dispatchEvent(new CustomEvent("branchesUpdated"));
      } catch (e) {
        console.warn("Could not dispatch branchesUpdated event", e);
      }

      fetchData();
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedBooking(null);
      resetForm();
    } catch (error: unknown) {
      addNotification({
        type: "error",
        title: "Error",
        message:
          error instanceof Error ? error.message : "Failed to save booking",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Helpers for servicesSchedule entries
  const addScheduleEntry = () => {
    setFormData((prev: any) => ({
      ...prev,
      servicesSchedule: [
        ...(prev.servicesSchedule || []),
        {
          serviceCategoryId: "",
          serviceType: [] as string[],
          event: "",
          date: new Date().toISOString().split("T")[0], // Default to today's date
          startTime: "",
          endTime: "",
          venueName: "",
          venueAddress: "",
          assignedStaff: [],
          inventorySelection: [],
          quantity: 1,
          price: undefined,
          amount: undefined,
        },
      ],
    }));
  };

  const removeScheduleEntry = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      servicesSchedule: (prev.servicesSchedule || []).filter(
        (_: any, i: number) => i !== index
      ),
    }));
  };

  const updateScheduleEntry = (index: number, field: string, value: any) => {
    setFormData((prev: any) => {
      const ss = [...(prev.servicesSchedule || [])];
      ss[index] = { ...ss[index], [field]: value };
      // if selecting a service category, set serviceName and clear serviceType when category defines types
      if (field === "serviceCategoryId") {
        const cat = (categories || []).find((c: any) => c._id === value);
        if (cat) {
          ss[index].serviceName = cat.name;
          // if category has types, clear serviceType to force user selection
          if (Array.isArray(cat.types) && cat.types.length > 0) {
            ss[index].serviceType = Array.isArray(ss[index].serviceType)
              ? ss[index].serviceType
              : [];
          } else {
            // otherwise fallback to legacy cat.type if present (store as single-element array)
            ss[index].serviceType = cat.type
              ? [cat.type]
              : Array.isArray(ss[index].serviceType)
              ? ss[index].serviceType
              : [];
          }
        } else {
          ss[index].serviceName = "";
          ss[index].serviceType = [];
        }
      }
      // auto-calc amount when quantity or price changes
      if (field === "quantity" || field === "price") {
        const q = Number(ss[index].quantity ?? 0);
        const p = Number(ss[index].price ?? 0);
        ss[index].amount = q * p;
      }
      return { ...prev, servicesSchedule: ss };
    });
  };

  const handleDeleteBooking = async (id: string, bookingNumber: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete booking ${bookingNumber}?`
      )
    ) {
      try {
        // Request permanent deletion from backend (hard delete)
        await bookingAPI.deleteBooking(id, true);
        addNotification({
          type: "success",
          title: "Success",
          message: "Booking deleted successfully",
        });
        fetchData();
      } catch (error: unknown) {
        addNotification({
          type: "error",
          title: "Error",
          message:
            error instanceof Error ? error.message : "Failed to delete booking",
        });
      }
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      // Use the new status update endpoint for staff users
      const res: any = await bookingAPI.updateBookingStatus(
        bookingId,
        newStatus
      );
      const updatedBooking = res?.data;
      addNotification({
        type: "success",
        title: "Success",
        message: `Booking status updated to ${newStatus}`,
      });
      if (updatedBooking) {
        // Replace booking in local state so UI updates immediately without waiting for full fetch
        setBookings((prev) =>
          (prev || []).map((b) =>
            b._id === updatedBooking._id ? updatedBooking : b
          )
        );
      } else {
        fetchData(); // Fallback
      }
    } catch (error: unknown) {
      addNotification({
        type: "error",
        title: "Error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to update booking status",
      });
    }
  };

  // PDF Generation Functions
  const generatePDF = (booking: Booking) => {
    // Build a list of function detail entries (supports multiple event dates)
    const b: any = booking as any;
    const functionEntries =
      b.functionDetailsList && b.functionDetailsList.length > 0
        ? b.functionDetailsList
        : b.functionDetails
        ? [b.functionDetails]
        : [];

    // Map services to invoice items and schedule rows. If multiple function entries exist,
    // we'll attach the first available function entry to each service (or try to match by index).
    const services = b.services || [];
    const items = services.map((s: any) => ({
      description: s.description || s.service || b.serviceNeeded || "Service",
      rate: s.rate ?? 0,
      amount: s.amount ?? (s.rate ?? 0) * (s.quantity ?? 1),
      quantity: s.quantity ?? 1,
    }));

    const schedule = services.map((s: any, idx: number) => {
      const func: any = functionEntries[idx] || functionEntries[0] || {};
      return {
        serviceGiven: s.service || b.serviceNeeded || "-",
        serviceType: Array.isArray(s.serviceType)
          ? s.serviceType.join(", ")
          : s.serviceType || func.type || "-",
        event: s.event || func.event || "-",
        date: func.date || func.startDate || b.functionDetails?.date || "-",
        startTime: func.time?.start || b.functionDetails?.time?.start || "-",
        endTime: func.time?.end || b.functionDetails?.time?.end || "-",
        quantity: s.quantity ?? 1,
        price: s.rate ?? 0,
        amount: s.amount ?? (s.rate ?? 0) * (s.quantity ?? 1),
        venue: {
          name: func.venue?.name || b.functionDetails?.venue?.name,
          address: func.venue?.address || b.functionDetails?.venue?.address,
        },
      };
    });

    const totalAmount =
      b.pricing?.totalAmount ??
      items.reduce((sum: number, it: any) => sum + (it.amount || 0), 0);

    const pdfData = {
      bookingNumber: booking.bookingNumber,
      date:
        (functionEntries[0] &&
          (functionEntries[0].date || functionEntries[0].startDate)) ||
        booking.functionDetails?.date,
      status: booking.status,
      client: {
        name: b.client?.name || "N/A",
        address:
          b.functionDetails?.venue?.address || b.client?.address || "N/A",
        phone: b.client?.phone || undefined,
        email: b.client?.email || undefined,
        contact: b.client?.phone || b.client?.email || "N/A",
        gstin: b.client?.gstin || "",
      },
      branch: {
        name: (b.bookingBranch as any)?.name || (b.branch as any)?.name,
        code: (b.bookingBranch as any)?.code || (b.branch as any)?.code,
      },
      company: {
        name: "Abeer Motion Picture Pvt. Ltd.",
        address: "Your Company Address Here",
      },
      items,
      total: totalAmount,
      advanceAmount: b.pricing?.advanceAmount || "-",
      balanceAmount: totalAmount - (b.pricing?.advanceAmount || 0),
      event: b.event,
      videoOutput: b.videoOutput,
      photoOutput: b.photoOutput,
      rawOutput: b.rawOutput,
      audioOutput: b.audioOutput || b.audio || undefined,
      videoOutputEnabled:
        typeof b.videoOutputEnabled !== "undefined"
          ? b.videoOutputEnabled
          : undefined,
      photoOutputEnabled:
        typeof b.photoOutputEnabled !== "undefined"
          ? b.photoOutputEnabled
          : undefined,
      rawOutputEnabled:
        typeof b.rawOutputEnabled !== "undefined"
          ? b.rawOutputEnabled
          : undefined,
      audioOutputEnabled:
        typeof b.audioOutputEnabled !== "undefined"
          ? b.audioOutputEnabled
          : undefined,
      schedule,
      termsAndConditions: [
        "Payment terms as agreed upon booking confirmation.",
        "Cancellation charges apply as per company policy.",
        "All services subject to availability and weather conditions.",
        "Client is responsible for proper permissions and clearances.",
      ],
    };

    setPdfBookingData(pdfData);
    setShowPDFModal(true);
  };

  const handlePrint = useReactToPrint({
    contentRef: pdfRef,
    documentTitle: `${
      pdfBookingData?.status === "enquiry" ? "Quotation" : "Invoice"
    }-${pdfBookingData?.bookingNumber}`,
  });

  const filteredBookings = bookings.filter((booking) => {
    // If the current user is a branch admin/head, restrict bookings to their branch only
    const bookingBranchId =
      (booking as any).branch?._id ||
      booking.bookingBranch?._id ||
      booking.bookingBranch ||
      "";
    const bookingClientId = (booking as any).client?._id || (booking as any).client || "";
    if (user?.role === "chairman" && user.branchId) {
      if (bookingBranchId !== user.branchId) return false;
    }
    const matchesSearch =
      booking.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.functionDetails.type
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || booking.status === filterStatus;
    const matchesBranch = filterBranch === "all" || bookingBranchId === filterBranch;
    const matchesClient = filterClient === "all" || bookingClientId === filterClient;
    return matchesSearch && matchesStatus && matchesBranch && matchesClient;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  // Financial stats calculation
  const financialStats = {
    totalBookingAmount: bookings.reduce((sum, b) => {
      return sum + (b.pricing?.totalAmount || 0);
    }, 0),
    totalReceived: bookings.reduce((sum, b) => {
      const total = b.pricing?.totalAmount || 0;
      const remaining = b.pricing?.remainingAmount || 0;
      return sum + (total - remaining);
    }, 0),
    totalRemaining: bookings.reduce((sum, b) => {
      return sum + (b.pricing?.remainingAmount || 0);
    }, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-animate w-full">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Bookings" value={stats.total} icon={Calendar} />

        <StatCard title="Pending" value={stats.pending} icon={Clock} />

        <StatCard
          title="Confirmed"
          value={stats.confirmed}
          icon={CheckCircle}
        />

        <StatCard title="Completed" value={stats.completed} icon={Camera} />
      </div>

      {/* Financial Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Booking Amount"
          value={`₹${financialStats.totalBookingAmount.toLocaleString(
            "en-IN"
          )}`}
          icon={IndianRupee}
        />

        <StatCard
          title="Amount Received"
          value={`₹${financialStats.totalReceived.toLocaleString("en-IN")}`}
          icon={ReceiptIndianRupee}
        />

        <StatCard
          title="Remaining Amount"
          value={`₹${financialStats.totalRemaining.toLocaleString("en-IN")}`}
          icon={AlertCircle}
        />
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Branches</option>
            {branches && branches.map((br: any) => (
              <option key={br._id} value={br._id}>
                {br.name}
              </option>
            ))}
          </select>

          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Clients</option>
            {clients && clients.map((cl: any) => (
              <option key={cl._id} value={cl._id}>
                {cl.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="enquiry">Enquiry</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {user?.role !== "staff" && (
        <button
          onClick={handleAddBooking}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Booking
        </button>
      )}

      {/* Bookings List */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow-sm border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Booking Details
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Client
                </th>
                {user?.role === "chairman" && (
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    Branch
                  </th>
                )}
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">
                  Total
                </th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">
                  Received
                </th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">
                  Balance Due
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking._id || booking.bookingNumber}>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {booking.bookingNumber}
                      </div>

                      {(booking.pricing as any)?.gstAmount ? (
                        <div className="text-xs text-gray-400">
                          + GST ({(booking.pricing as any).gstRate}%): ₹
                          {(
                            (booking.pricing as any).gstAmount || 0
                          ).toLocaleString()}
                        </div>
                      ) : null}
                    </div>
                  </td>

                  <td className="px-4 py-2 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {booking.client.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.client.phone}
                      </div>
                    </div>
                  </td>
                  {user?.role === "chairman" && (
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {(booking as any).branch?.name ||
                            booking.bookingBranch?.name ||
                            "—"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {(booking as any).branch?._id ||
                            booking.bookingBranch?._id ||
                            ""}
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          booking.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : booking.status === "confirmed"
                            ? "bg-blue-100 text-blue-800"
                            : booking.status === "in_progress"
                            ? "bg-yellow-100 text-yellow-800"
                            : booking.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {booking.status}
                      </span>

                      {/* Payment status / remaining amount */}
                      {(booking as any).paymentStatus === "completed" ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                          Paid
                        </span>
                      ) : (booking as any).paymentStatus === "partial" ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                          Partial
                        </span>
                      ) : (booking as any).pricing?.remainingAmount ? (
                        <span className="text-sm text-gray-600">
                          Remaining: ₹
                          {Number(
                            (booking as any).pricing.remainingAmount
                          ).toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right">
                    {typeof booking.pricing?.totalAmount === "number" &&
                    booking.pricing.totalAmount > 0
                      ? `₹${booking.pricing.totalAmount.toLocaleString()}`
                      : "-"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right">
                    {typeof booking.pricing?.advanceAmount === "number" &&
                    booking.pricing.advanceAmount > 0
                      ? `₹${booking.pricing.advanceAmount.toLocaleString()}`
                      : "-"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right">
                    {typeof booking.pricing?.remainingAmount === "number" &&
                    booking.pricing.remainingAmount > 0
                      ? `₹${booking.pricing.remainingAmount.toLocaleString()}`
                      : "-"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {user?.role === "staff" ? (
                        // Staff users can only update status — show clear action buttons for allowed next states
                        <div className="flex items-center space-x-2">
                          {
                            // Determine allowed next action based on current status
                            (() => {
                              const status = booking.status;
                              // No actions for cancelled or completed bookings
                              if (
                                status === "completed" ||
                                status === "cancelled"
                              ) {
                                return (
                                  <button
                                    disabled
                                    className="px-3 py-1 bg-gray-200 text-gray-600 rounded"
                                  >
                                    No actions
                                  </button>
                                );
                              }

                              // Map current status to the next logical action(s)
                              const transitions: {
                                [key: string]: { key: string; label: string }[];
                              } = {
                                pending: [
                                  { key: "confirmed", label: "Confirm" },
                                ],
                                confirmed: [
                                  {
                                    key: "in_progress",
                                    label: "Mark In Progress",
                                  },
                                ],
                                in_progress: [
                                  { key: "completed", label: "Complete" },
                                ],
                              };

                              const allowed = transitions[status] || [];
                              // If no allowed transitions, show disabled
                              if (allowed.length === 0)
                                return (
                                  <button
                                    disabled
                                    className="px-3 py-1 bg-gray-200 text-gray-600 rounded"
                                  >
                                    No actions
                                  </button>
                                );

                              return allowed.map((t) => (
                                <button
                                  key={t.key}
                                  onClick={() => {
                                    if (
                                      !window.confirm(
                                        `Are you sure you want to ${t.label.toLowerCase()} this booking?`
                                      )
                                    )
                                      return;
                                    handleStatusUpdate(booking._id, t.key);
                                  }}
                                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  {t.label}
                                </button>
                              ));
                            })()
                          }
                        </div>
                      ) : (
                        // Admin/Manager users can edit and delete
                        <>
                          <button
                            onClick={() => handleEditBooking(booking)}
                            className="text-blue-600 hover:text-blue-900 mr-2"
                            title="Edit Booking"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => generatePDF(booking)}
                            className="text-green-600 hover:text-green-900 mr-2"
                            title="Generate PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteBooking(
                                booking._id,
                                booking.bookingNumber
                              )
                            }
                            className="text-red-600 hover:text-red-900"
                            title="Delete Booking"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No bookings found
          </h3>
          <p className="text-gray-600">
            Get started by creating your first booking.
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl w-full max-w-7xl max-h-[80vh] overflow-y-auto shadow-2xl mx-2 sm:mx-4">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedBooking ? "Edit Booking" : "Add New Booking"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setSelectedBooking(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Client Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Client Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client *
                    </label>
                    <select
                      required
                      value={formData.clientId}
                      onChange={(e) =>
                        setFormData({ ...formData, clientId: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a client</option>
                      {(() => {
                        const bookingBranchToUse = formData.bookingBranch || user?.branchId || "";
                        const visible = (clients || []).filter((client: any) => {
                          if (!bookingBranchToUse) return true;
                          const cb = client.branch?._id || client.branch || client.branchId || "";
                          return String(cb) === String(bookingBranchToUse);
                        });
                        return visible.map((client: any) => (
                          <option key={client._id} value={client._id}>
                            {client.name} - {client.phone}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Booking Branch *
                    </label>
                    <select
                      required
                      value={formData.bookingBranch}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bookingBranch: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!!user?.branchId}
                    >
                      <option value="">Select branch</option>
                      {branches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name} ({branch.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Function Details - multiple schedule entries */}
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Function Details
                  </h3>
                </div>
                <div className="space-y-4">
                  {(formData.servicesSchedule || []).map(
                    (entry: any, idx: number) => (
                      <div key={idx}>
                        <div className="p-4 border rounded-lg bg-gray-50">
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">
                              Service #{idx + 1}
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={() => removeScheduleEntry(idx)}
                                className="text-red-600"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="text-sm text-gray-600">
                                Service
                              </label>
                              <div className="flex space-x-2">
                                <select
                                  value={entry.serviceCategoryId || ""}
                                  onChange={(e) =>
                                    updateScheduleEntry(
                                      idx,
                                      "serviceCategoryId",
                                      e.target.value
                                    )
                                  }
                                  className="w-1/2 px-3 py-2 border rounded"
                                >
                                  <option value="">Select service</option>
                                  {(categories || []).map((c: any) => (
                                    <option key={c._id} value={c._id}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                                {entry.serviceCategoryId ? (
                                  (() => {
                                    const cat = (categories || []).find(
                                      (c: any) =>
                                        c._id === entry.serviceCategoryId
                                    );
                                    if (
                                      cat &&
                                      Array.isArray(cat.types) &&
                                      cat.types.length > 0
                                    ) {
                                      return (
                                        <select
                                          value={
                                            Array.isArray(entry.serviceType)
                                              ? entry.serviceType[0] || ""
                                              : entry.serviceType || ""
                                          }
                                          onChange={(e) =>
                                            updateScheduleEntry(
                                              idx,
                                              "serviceType",
                                              e.target.value
                                                ? [e.target.value]
                                                : []
                                            )
                                          }
                                          className="w-1/2 px-3 py-2 border rounded"
                                        >
                                          <option value="">Select type</option>
                                          {cat.types.map(
                                            (t: string, i: number) => (
                                              <option key={i} value={t}>
                                                {t}
                                              </option>
                                            )
                                          )}
                                        </select>
                                      );
                                    }
                                    return (
                                      <input
                                        type="text"
                                        value={
                                          Array.isArray(entry.serviceType)
                                            ? entry.serviceType[0] || ""
                                            : entry.serviceType || ""
                                        }
                                        onChange={(e) =>
                                          updateScheduleEntry(
                                            idx,
                                            "serviceType",
                                            e.target.value
                                              ? [e.target.value]
                                              : []
                                          )
                                        }
                                        placeholder="Type (optional)"
                                        className="w-1/2 px-3 py-2 border rounded"
                                      />
                                    );
                                  })()
                                ) : (
                                  <div className="w-1/2 px-3 py-2 border rounded text-sm text-gray-500">
                                    Please select a Service
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="text-sm text-gray-600">
                                Event
                              </label>
                              <input
                                type="text"
                                value={entry.event || ""}
                                onChange={(e) =>
                                  updateScheduleEntry(
                                    idx,
                                    "event",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g. Wedding, Birthday, Corporate Event"
                                className="w-full px-3 py-2 border rounded"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-gray-600">
                                Date
                              </label>
                              <div className="flex items-center gap-3">
                                <DateInputDDMMYYYY
                                  value={entry.date || ""}
                                  onChange={(v: string) =>
                                    updateScheduleEntry(idx, "date", v)
                                  }
                                  className="w-full"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-sm text-gray-600">
                                Start Time (Optional)
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
                                className="w-full px-3 py-2 border rounded"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-gray-600">
                                End Time (Optional)
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
                                className="w-full px-3 py-2 border rounded"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-gray-600">
                                Venue Name (Optional)
                              </label>
                              <input
                                value={entry.venueName || ""}
                                onChange={(e) =>
                                  updateScheduleEntry(
                                    idx,
                                    "venueName",
                                    e.target.value
                                  )
                                }
                                placeholder="Enter venue name (optional)"
                                className="w-full px-3 py-2 border rounded"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-gray-600">
                                Venue Address (Optional)
                              </label>
                              <input
                                value={entry.venueAddress || ""}
                                onChange={(e) =>
                                  updateScheduleEntry(
                                    idx,
                                    "venueAddress",
                                    e.target.value
                                  )
                                }
                                placeholder="Enter venue address (optional)"
                                className="w-full px-3 py-2 border rounded"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-gray-600">
                                Qty
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={entry.quantity ?? 0}
                                onChange={(e) =>
                                  updateScheduleEntry(
                                    idx,
                                    "quantity",
                                    Number(e.target.value)
                                  )
                                }
                                className="w-full px-3 py-2 border rounded"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-gray-600">
                                Price
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={
                                  typeof entry.price === "number"
                                    ? entry.price
                                    : ""
                                }
                                onChange={(e) =>
                                  updateScheduleEntry(
                                    idx,
                                    "price",
                                    e.target.value === ""
                                      ? undefined
                                      : Number(e.target.value)
                                  )
                                }
                                className="w-full px-3 py-2 border rounded"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-gray-600">
                                Amount
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={
                                  typeof entry.amount === "number"
                                    ? entry.amount
                                    : ""
                                }
                                onChange={(e) =>
                                  updateScheduleEntry(
                                    idx,
                                    "amount",
                                    e.target.value === ""
                                      ? undefined
                                      : Number(e.target.value)
                                  )
                                }
                                className="w-full px-3 py-2 border rounded"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                kis cheez ka kitna lagega
                              </p>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-gray-700">
                                Assign Staff (Optional)
                              </label>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">
                                  Internal
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setStaffOutsourceStates((prev) => ({
                                      ...prev,
                                      [idx]: !staffOutsourceStates[idx],
                                    }))
                                  }
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    staffOutsourceStates[idx]
                                      ? "bg-blue-600"
                                      : "bg-gray-200"
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      staffOutsourceStates[idx]
                                        ? "translate-x-6"
                                        : "translate-x-1"
                                    }`}
                                  />
                                </button>
                                <span className="text-sm text-gray-600">
                                  Outsource
                                </span>
                              </div>
                            </div>
                            <div className="mt-2">
                              {(() => {
                                // compute conflicts: find other entries with same date and overlapping time
                                const conflicts = new Set<string>();
                                const curStart =
                                  entry.date && entry.startTime
                                    ? new Date(
                                        `${entry.date}T${entry.startTime}`
                                      )
                                    : null;
                                const curEnd =
                                  entry.date && entry.endTime
                                    ? new Date(`${entry.date}T${entry.endTime}`)
                                    : null;
                                (formData.servicesSchedule || []).forEach(
                                  (other: any, j: number) => {
                                    if (j === idx) return;
                                    if (!other.date) return;
                                    if (other.date !== entry.date) return; // only consider same-date entries
                                    const oStart =
                                      other.date && other.startTime
                                        ? new Date(
                                            `${other.date}T${other.startTime}`
                                          )
                                        : null;
                                    const oEnd =
                                      other.date && other.endTime
                                        ? new Date(
                                            `${other.date}T${other.endTime}`
                                          )
                                        : null;
                                    // if times overlap or no precise times given, treat as conflict
                                    const overlap = (() => {
                                      if (
                                        !curStart ||
                                        !curEnd ||
                                        !oStart ||
                                        !oEnd
                                      )
                                        return true;
                                      return (
                                        curStart <= oEnd && oStart <= curEnd
                                      );
                                    })();
                                    if (
                                      overlap &&
                                      Array.isArray(other.assignedStaff)
                                    ) {
                                      other.assignedStaff.forEach(
                                        (id: string) => conflicts.add(id)
                                      );
                                    }
                                  }
                                );

                                const selectedStaff = entry.assignedStaff || [];
                                const staffDropdownOpen =
                                  staffDropdownStates[idx] || false;
                                const isOutsourceMode =
                                  staffOutsourceStates[idx] || false;
                                const selectedOutsourceStaff =
                                  outsourceStaff[idx] || [];

                                if (isOutsourceMode) {
                                  return (
                                    <div className="relative">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setStaffDropdownStates((prev) => ({
                                            ...prev,
                                            [idx]: !staffDropdownOpen,
                                          }))
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between"
                                      >
                                        <span className="text-gray-500">
                                          {selectedOutsourceStaff.length === 0
                                            ? "Select professional clients..."
                                            : `${selectedOutsourceStaff.length} professionals selected`}
                                        </span>
                                        <svg
                                          className="w-5 h-5 text-gray-400"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                          />
                                        </svg>
                                      </button>

                                      {staffDropdownOpen && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                          {professionalClients.map((client) => {
                                            const isSelected =
                                              selectedOutsourceStaff.includes(
                                                client._id
                                              );
                                            return (
                                              <label
                                                key={client._id}
                                                className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={isSelected}
                                                  onChange={(e) => {
                                                    const checked =
                                                      e.target.checked;
                                                    const list = new Set(
                                                      selectedOutsourceStaff
                                                    );
                                                    if (checked)
                                                      list.add(client._id);
                                                    else
                                                      list.delete(client._id);
                                                    setOutsourceStaff(
                                                      (prev) => ({
                                                        ...prev,
                                                        [idx]: Array.from(list),
                                                      })
                                                    );
                                                  }}
                                                  className="mr-2"
                                                />
                                                <span className="text-sm">
                                                  {client.name} - {client.phone}
                                                </span>
                                              </label>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                }

                                return (
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setStaffDropdownStates((prev) => ({
                                          ...prev,
                                          [idx]: !staffDropdownOpen,
                                        }))
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between"
                                    >
                                      <span className="text-gray-500">
                                        {selectedStaff.length === 0
                                          ? "Select staff members..."
                                          : `${selectedStaff.length} staff selected`}
                                      </span>
                                      <svg
                                        className="w-5 h-5 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 9l-7 7-7-7"
                                        />
                                      </svg>
                                    </button>

                                    {staffDropdownOpen && (
                                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {staff.map((s) => {
                                          const disabled = conflicts.has(s._id);
                                          const isSelected =
                                            selectedStaff.includes(s._id);
                                          return (
                                            <label
                                              key={s._id}
                                              className={`flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer ${
                                                disabled
                                                  ? "opacity-50 cursor-not-allowed"
                                                  : ""
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                disabled={disabled}
                                                checked={isSelected}
                                                onChange={(e) => {
                                                  if (disabled) return;
                                                  const checked =
                                                    e.target.checked;
                                                  const list = new Set(
                                                    selectedStaff
                                                  );
                                                  if (checked) list.add(s._id);
                                                  else list.delete(s._id);
                                                  updateScheduleEntry(
                                                    idx,
                                                    "assignedStaff",
                                                    Array.from(list)
                                                  );
                                                }}
                                                className="mr-2"
                                              />
                                              <span
                                                className={`text-sm ${
                                                  disabled
                                                    ? "line-through text-gray-400"
                                                    : ""
                                                }`}
                                              >
                                                {s.name}
                                              </span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-gray-700">
                                Select Equipment (Optional)
                              </label>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">
                                  Internal
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEquipOutsourceStates((prev) => ({
                                      ...prev,
                                      [idx]: !equipOutsourceStates[idx],
                                    }))
                                  }
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    equipOutsourceStates[idx]
                                      ? "bg-blue-600"
                                      : "bg-gray-200"
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      equipOutsourceStates[idx]
                                        ? "translate-x-6"
                                        : "translate-x-1"
                                    }`}
                                  />
                                </button>
                                <span className="text-sm text-gray-600">
                                  Outsource
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  // Clear filter and show all
                                  setInventoryCategoryFilters((prev) => ({
                                    ...prev,
                                    [idx]: "",
                                  }));
                                }}
                                className={`px-2 py-1 text-xs rounded ${
                                  !inventoryCategoryFilters[idx]
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                All
                              </button>
                              {(Array.isArray(inventoryCategories)
                                ? inventoryCategories
                                : []
                              ).map((c: any) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={async () => {
                                    // when selecting a category, fetch inventory for that category (cached)
                                    try {
                                      setInventoryCategoryFilters((prev) => ({
                                        ...prev,
                                        [idx]: c,
                                      }));
                                      if (!cachedInventoryByCategory[c]) {
                                        const params: any = { category: c };
                                        // respect selected branch when fetching
                                        if (formData.bookingBranch)
                                          params.branch =
                                            formData.bookingBranch;
                                        else if (user && user.branchId)
                                          params.branch = user.branchId;
                                        const res: any =
                                          await inventoryAPI.getInventory(
                                            params
                                          );
                                        const invData = res.data || res;
                                        const docs =
                                          invData.docs ||
                                          invData.data ||
                                          invData.items ||
                                          invData ||
                                          [];
                                        const list = Array.isArray(docs)
                                          ? docs
                                          : [];
                                        setCachedInventoryByCategory(
                                          (prev) => ({
                                            ...prev,
                                            [c]: list,
                                          })
                                        );
                                      }
                                    } catch (err) {
                                      console.warn(
                                        "Failed to fetch inventory for category",
                                        c,
                                        err
                                      );
                                    }
                                  }}
                                  className={`px-2 py-1 text-xs rounded ${
                                    inventoryCategoryFilters[idx] === c
                                      ? "bg-blue-600 text-white"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {c}
                                </button>
                              ))}
                            </div>

                            <div className="mt-2">
                              {(() => {
                                let inventoryList: any[] = [];
                                if (
                                  inventory &&
                                  typeof inventory === "object" &&
                                  "docs" in (inventory as any) &&
                                  Array.isArray((inventory as any).docs)
                                )
                                  inventoryList = (inventory as any).docs;
                                else if (Array.isArray(inventory))
                                  inventoryList = inventory;
                                const selectedCategory =
                                  inventoryCategoryFilters[idx];
                                const baseList = selectedCategory
                                  ? (
                                      cachedInventoryByCategory[
                                        selectedCategory
                                      ] || []
                                    )
                                      .concat()
                                      .filter(Boolean)
                                  : inventoryList;
                                // Only include items marked for booking (forBooking !== false). Treat undefined as true for backward compatibility.
                                const filtered = baseList.filter(
                                  (it: any) => it.forBooking !== false
                                );
                                // compute equipment conflicts similar to staff
                                const equipConflicts = new Set<string>();
                                const curStartE =
                                  entry.date && entry.startTime
                                    ? new Date(
                                        `${entry.date}T${entry.startTime}`
                                      )
                                    : null;
                                const curEndE =
                                  entry.date && entry.endTime
                                    ? new Date(`${entry.date}T${entry.endTime}`)
                                    : null;
                                (formData.servicesSchedule || []).forEach(
                                  (other: any, j: number) => {
                                    if (j === idx) return;
                                    if (!other.date) return;
                                    if (other.date !== entry.date) return;
                                    const oStart =
                                      other.date && other.startTime
                                        ? new Date(
                                            `${other.date}T${other.startTime}`
                                          )
                                        : null;
                                    const oEnd =
                                      other.date && other.endTime
                                        ? new Date(
                                            `${other.date}T${other.endTime}`
                                          )
                                        : null;
                                    const overlap = (() => {
                                      if (
                                        !curStartE ||
                                        !curEndE ||
                                        !oStart ||
                                        !oEnd
                                      )
                                        return true;
                                      return (
                                        curStartE <= oEnd && oStart <= curEndE
                                      );
                                    })();
                                    if (
                                      overlap &&
                                      Array.isArray(other.inventorySelection)
                                    ) {
                                      other.inventorySelection.forEach(
                                        (id: string) => equipConflicts.add(id)
                                      );
                                    }
                                  }
                                );

                                const selectedEquipment =
                                  entry.inventorySelection || [];
                                const equipDropdownOpen =
                                  equipDropdownStates[idx] || false;
                                const isEquipOutsourceMode =
                                  equipOutsourceStates[idx] || false;
                                const selectedOutsourceEquipment =
                                  outsourceEquipment[idx] || [];

                                if (isEquipOutsourceMode) {
                                  return (
                                    <div className="space-y-4">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">
                                          Outsource Equipment
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newEquip = {
                                              sku: "",
                                              modelNo: "",
                                              name: "",
                                              brand: "",
                                              qty: 1,
                                              rentingAmount: 0,
                                              rentingFromPersonId: "",
                                              rentingFromPersonName: "",
                                              rentingFromPersonPhone: "",
                                              rentingFromPersonEmail: "",
                                              email: "",
                                              phone: "",
                                              address: "",
                                            };
                                            setOutsourceEquipment((prev) => ({
                                              ...prev,
                                              [idx]: [
                                                ...(prev[idx] || []),
                                                newEquip,
                                              ],
                                            }));
                                          }}
                                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                                        >
                                          Add Equipment
                                        </button>
                                      </div>

                                      {selectedOutsourceEquipment.map(
                                        (equip: any, equipIdx: number) => (
                                          <div
                                            key={equipIdx}
                                            className="border rounded-lg p-4 bg-gray-50"
                                          >
                                            <div className="flex justify-between items-center mb-3">
                                              <span className="font-medium text-sm">
                                                Equipment #{equipIdx + 1}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setOutsourceEquipment(
                                                    (prev) => ({
                                                      ...prev,
                                                      [idx]:
                                                        prev[idx]?.filter(
                                                          (_, i) =>
                                                            i !== equipIdx
                                                        ) || [],
                                                    })
                                                  );
                                                }}
                                                className="text-red-600 text-sm"
                                              >
                                                Remove
                                              </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                              <div>
                                                <label className="text-xs text-gray-600">
                                                  SKU
                                                </label>
                                                <input
                                                  type="text"
                                                  value={equip.sku || ""}
                                                  onChange={(e) => {
                                                    const updated = [
                                                      ...selectedOutsourceEquipment,
                                                    ];
                                                    updated[equipIdx] = {
                                                      ...updated[equipIdx],
                                                      sku: e.target.value,
                                                    };
                                                    setOutsourceEquipment(
                                                      (prev) => ({
                                                        ...prev,
                                                        [idx]: updated,
                                                      })
                                                    );
                                                  }}
                                                  className="w-full px-2 py-1 border rounded text-sm"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-xs text-gray-600">
                                                  Model No
                                                </label>
                                                <input
                                                  type="text"
                                                  value={equip.modelNo || ""}
                                                  onChange={(e) => {
                                                    const updated = [
                                                      ...selectedOutsourceEquipment,
                                                    ];
                                                    updated[equipIdx] = {
                                                      ...updated[equipIdx],
                                                      modelNo: e.target.value,
                                                    };
                                                    setOutsourceEquipment(
                                                      (prev) => ({
                                                        ...prev,
                                                        [idx]: updated,
                                                      })
                                                    );
                                                  }}
                                                  className="w-full px-2 py-1 border rounded text-sm"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-xs text-gray-600">
                                                  Equipment Name
                                                </label>
                                                <input
                                                  type="text"
                                                  value={equip.name || ""}
                                                  onChange={(e) => {
                                                    const updated = [
                                                      ...selectedOutsourceEquipment,
                                                    ];
                                                    updated[equipIdx] = {
                                                      ...updated[equipIdx],
                                                      name: e.target.value,
                                                    };
                                                    setOutsourceEquipment(
                                                      (prev) => ({
                                                        ...prev,
                                                        [idx]: updated,
                                                      })
                                                    );
                                                  }}
                                                  className="w-full px-2 py-1 border rounded text-sm"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-xs text-gray-600">
                                                  Brand
                                                </label>
                                                <input
                                                  type="text"
                                                  value={equip.brand || ""}
                                                  onChange={(e) => {
                                                    const updated = [
                                                      ...selectedOutsourceEquipment,
                                                    ];
                                                    updated[equipIdx] = {
                                                      ...updated[equipIdx],
                                                      brand: e.target.value,
                                                    };
                                                    setOutsourceEquipment(
                                                      (prev) => ({
                                                        ...prev,
                                                        [idx]: updated,
                                                      })
                                                    );
                                                  }}
                                                  className="w-full px-2 py-1 border rounded text-sm"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-xs text-gray-600">
                                                  Quantity
                                                </label>
                                                <input
                                                  type="number"
                                                  min="1"
                                                  value={equip.qty || 1}
                                                  onChange={(e) => {
                                                    const updated = [
                                                      ...selectedOutsourceEquipment,
                                                    ];
                                                    updated[equipIdx] = {
                                                      ...updated[equipIdx],
                                                      qty:
                                                        parseInt(
                                                          e.target.value
                                                        ) || 1,
                                                    };
                                                    setOutsourceEquipment(
                                                      (prev) => ({
                                                        ...prev,
                                                        [idx]: updated,
                                                      })
                                                    );
                                                  }}
                                                  className="w-full px-2 py-1 border rounded text-sm"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-xs text-gray-600">
                                                  Renting Amount
                                                </label>
                                                <input
                                                  type="number"
                                                  min="0"
                                                  value={
                                                    equip.rentingAmount || 0
                                                  }
                                                  onChange={(e) => {
                                                    const updated = [
                                                      ...selectedOutsourceEquipment,
                                                    ];
                                                    updated[equipIdx] = {
                                                      ...updated[equipIdx],
                                                      rentingAmount:
                                                        parseFloat(
                                                          e.target.value
                                                        ) || 0,
                                                    };
                                                    setOutsourceEquipment(
                                                      (prev) => ({
                                                        ...prev,
                                                        [idx]: updated,
                                                      })
                                                    );
                                                  }}
                                                  className="w-full px-2 py-1 border rounded text-sm"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-xs text-gray-600">
                                                  Renting From (Professional)
                                                </label>
                                                <select
                                                  value={
                                                    equip.rentingFromPersonId ||
                                                    ""
                                                  }
                                                  onChange={(e) => {
                                                    const selectedId =
                                                      e.target.value;
                                                    const selectedClient =
                                                      professionalClients.find(
                                                        (c) =>
                                                          c._id === selectedId
                                                      );
                                                    const updated = [
                                                      ...selectedOutsourceEquipment,
                                                    ];
                                                    updated[equipIdx] = {
                                                      ...updated[equipIdx],
                                                      rentingFromPersonId:
                                                        selectedId,
                                                      rentingFromPersonName:
                                                        selectedClient?.name ||
                                                        "",
                                                      rentingFromPersonPhone:
                                                        selectedClient?.phone ||
                                                        "",
                                                      rentingFromPersonEmail:
                                                        selectedClient?.email ||
                                                        "",
                                                    };
                                                    setOutsourceEquipment(
                                                      (prev) => ({
                                                        ...prev,
                                                        [idx]: updated,
                                                      })
                                                    );
                                                  }}
                                                  className="w-full px-2 py-1 border rounded text-sm"
                                                >
                                                  <option value="">
                                                    Select professional...
                                                  </option>
                                                  {(
                                                    professionalClients || []
                                                  ).map((pc) => (
                                                    <option
                                                      key={pc._id}
                                                      value={pc._id}
                                                    >
                                                      {pc.name}{" "}
                                                      {pc.phone
                                                        ? `- ${pc.phone}`
                                                        : ""}
                                                    </option>
                                                  ))}
                                                </select>
                                              </div>
                                              <div>
                                                <label className="text-xs text-gray-600">
                                                  Email
                                                </label>
                                                <input
                                                  type="email"
                                                  value={equip.email || ""}
                                                  onChange={(e) => {
                                                    const updated = [
                                                      ...selectedOutsourceEquipment,
                                                    ];
                                                    updated[equipIdx] = {
                                                      ...updated[equipIdx],
                                                      email: e.target.value,
                                                    };
                                                    setOutsourceEquipment(
                                                      (prev) => ({
                                                        ...prev,
                                                        [idx]: updated,
                                                      })
                                                    );
                                                  }}
                                                  className="w-full px-2 py-1 border rounded text-sm"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-xs text-gray-600">
                                                  Phone
                                                </label>
                                                <input
                                                  type="tel"
                                                  value={equip.phone || ""}
                                                  onChange={(e) => {
                                                    const updated = [
                                                      ...selectedOutsourceEquipment,
                                                    ];
                                                    updated[equipIdx] = {
                                                      ...updated[equipIdx],
                                                      phone: e.target.value,
                                                    };
                                                    setOutsourceEquipment(
                                                      (prev) => ({
                                                        ...prev,
                                                        [idx]: updated,
                                                      })
                                                    );
                                                  }}
                                                  className="w-full px-2 py-1 border rounded text-sm"
                                                />
                                              </div>
                                              <div className="md:col-span-2">
                                                <label className="text-xs text-gray-600">
                                                  Address
                                                </label>
                                                <textarea
                                                  value={equip.address || ""}
                                                  onChange={(e) => {
                                                    const updated = [
                                                      ...selectedOutsourceEquipment,
                                                    ];
                                                    updated[equipIdx] = {
                                                      ...updated[equipIdx],
                                                      address: e.target.value,
                                                    };
                                                    setOutsourceEquipment(
                                                      (prev) => ({
                                                        ...prev,
                                                        [idx]: updated,
                                                      })
                                                    );
                                                  }}
                                                  rows={2}
                                                  className="w-full px-2 py-1 border rounded text-sm"
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  );
                                }

                                return (
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEquipDropdownStates((prev) => ({
                                          ...prev,
                                          [idx]: !equipDropdownOpen,
                                        }))
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between"
                                    >
                                      <span className="text-gray-500">
                                        {selectedEquipment.length === 0
                                          ? "Select equipment..."
                                          : `${selectedEquipment.length} items selected`}
                                      </span>
                                      <svg
                                        className="w-5 h-5 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 9l-7 7-7-7"
                                        />
                                      </svg>
                                    </button>

                                    {equipDropdownOpen && (
                                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {filtered.map((it: any) => {
                                          const disabled = equipConflicts.has(
                                            it._id
                                          );
                                          const isSelected =
                                            selectedEquipment.includes(it._id);
                                          return (
                                            <label
                                              key={it._id}
                                              className={`flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer ${
                                                disabled
                                                  ? "opacity-50 cursor-not-allowed"
                                                  : ""
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                disabled={disabled}
                                                checked={isSelected}
                                                onChange={(e) => {
                                                  if (disabled) return;
                                                  const checked =
                                                    e.target.checked;
                                                  const list = new Set(
                                                    selectedEquipment
                                                  );
                                                  if (checked) list.add(it._id);
                                                  else list.delete(it._id);
                                                  updateScheduleEntry(
                                                    idx,
                                                    "inventorySelection",
                                                    Array.from(list)
                                                  );
                                                }}
                                                className="mr-2"
                                              />
                                              <span
                                                className={`text-sm ${
                                                  disabled
                                                    ? "line-through text-gray-400"
                                                    : ""
                                                }`}
                                              >
                                                {it.name} ({it.category})
                                              </span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Add Service button after each service entry */}
                        <div className="mt-3 text-center">
                          <button
                            type="button"
                            onClick={addScheduleEntry}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Add Another Service
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Pricing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Amount (calculated from schedule)
                    </label>
                    <input
                      type="number"
                      readOnly
                      value={(formData.servicesSchedule || []).reduce(
                        (s: number, it: any) => s + (Number(it.amount) || 0),
                        0
                      )}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Advance Amount
                    </label>
                    <input
                      type="number"
                      value={formData.advanceAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          advanceAmount: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Balance Amount: ₹
                    {(
                      (formData.servicesSchedule || []).reduce(
                        (s: number, it: any) => s + (Number(it.amount) || 0),
                        0
                      ) - formData.advanceAmount
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Output Specifications
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="videoOutputEnabled"
                      checked={formData.videoOutputEnabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          videoOutputEnabled: e.target.checked,
                          videoOutput: e.target.checked
                            ? formData.videoOutput
                            : "",
                        })
                      }
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="videoOutputEnabled"
                        className="text-sm font-medium text-gray-700 cursor-pointer"
                      >
                        Video Output
                      </label>
                      {formData.videoOutputEnabled && (
                        <input
                          type="text"
                          value={formData.videoOutput}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              videoOutput: e.target.value,
                            })
                          }
                          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g. Full HD, 4K, etc."
                        />
                      )}
                    </div>
                  </div>

                  {/* Photo Output */}
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="photoOutputEnabled"
                      checked={formData.photoOutputEnabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          photoOutputEnabled: e.target.checked,
                          photoOutput: e.target.checked
                            ? formData.photoOutput
                            : "",
                        })
                      }
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="photoOutputEnabled"
                        className="text-sm font-medium text-gray-700 cursor-pointer"
                      >
                        Photo Output
                      </label>
                      {formData.photoOutputEnabled && (
                        <input
                          type="text"
                          value={formData.photoOutput}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              photoOutput: e.target.value,
                            })
                          }
                          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g. JPEG, RAW, etc."
                        />
                      )}
                    </div>
                  </div>

                  {/* Raw Output */}
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="rawOutputEnabled"
                      checked={formData.rawOutputEnabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rawOutputEnabled: e.target.checked,
                          rawOutput: e.target.checked ? formData.rawOutput : "",
                        })
                      }
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="rawOutputEnabled"
                        className="text-sm font-medium text-gray-700 cursor-pointer"
                      >
                        Raw Output
                      </label>
                      {formData.rawOutputEnabled && (
                        <input
                          type="text"
                          value={formData.rawOutput}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              rawOutput: e.target.value,
                            })
                          }
                          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g. RAW files, unedited footage, etc."
                        />
                      )}
                    </div>
                  </div>

                  {/* Audio Output */}
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="audioOutputEnabled"
                      checked={formData.audioOutputEnabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          audioOutputEnabled: e.target.checked,
                          audioOutput: e.target.checked
                            ? formData.audioOutput
                            : "",
                        })
                      }
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="audioOutputEnabled"
                        className="text-sm font-medium text-gray-700 cursor-pointer"
                      >
                        Audio Output
                      </label>
                      {formData.audioOutputEnabled && (
                        <input
                          type="text"
                          value={formData.audioOutput}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              audioOutput: e.target.value,
                            })
                          }
                          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g. WAV, MP3, etc."
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>

              {/* Status selection (admin/managers) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="enquiry">Enquiry</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Summary Section */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-md font-semibold mb-2 text-gray-900">
                  Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Client</div>
                    <div className="text-sm text-gray-900 font-medium">
                      {clients.find((c) => c._id === formData.clientId)?.name ||
                        "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Assigned Staff</div>
                    <div className="text-sm text-gray-900 font-medium">
                      {formData.assignedStaff.length > 0
                        ? staff
                            .filter((s) =>
                              formData.assignedStaff.includes(s._id)
                            )
                            .map((s) => s.name)
                            .join(", ")
                        : "None"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Equipment</div>
                    <div className="text-sm text-gray-900 font-medium">
                      {formData.inventorySelection.length > 0
                        ? (Array.isArray(inventory)
                            ? inventory
                            : "docs" in inventory &&
                              Array.isArray((inventory as any).docs)
                            ? (inventory as any).docs
                            : []
                          )
                            .filter((i: InventoryItem) =>
                              formData.inventorySelection.includes(i._id)
                            )
                            .map((i: InventoryItem) => i.name)
                            .join(", ")
                        : "None"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">GST</div>
                    <div className="flex items-center space-x-3">
                      <label className="text-sm">Apply GST</label>
                      <input
                        type="checkbox"
                        checked={formData.applyGST}
                        onChange={(e) => {
                          const apply = e.target.checked;
                          setFormData((prev) => {
                            let subtotal = computeSubtotalFromForm(prev);
                            if (
                              (!subtotal || subtotal === 0) &&
                              selectedBooking?.pricing?.subtotal
                            ) {
                              subtotal = selectedBooking.pricing.subtotal || 0;
                            }
                            const gstRate = prev.gstRate || 18;
                            const base = computeBaseExcludingGST(
                              prev,
                              subtotal,
                              gstRate
                            );
                            const gstAmount = apply
                              ? prev.gstIncluded
                                ? Number(
                                    (
                                      (base * gstRate) /
                                      (100 + gstRate)
                                    ).toFixed(2)
                                  )
                                : Number((base * (gstRate / 100)).toFixed(2))
                              : 0;
                            const total =
                              apply && !prev.gstIncluded
                                ? Number((base + gstAmount).toFixed(2))
                                : Number(base.toFixed(2));
                            return {
                              ...prev,
                              applyGST: apply,
                              gstAmount,
                              totalAmount: total,
                            };
                          });
                        }}
                      />
                      {formData.applyGST && (
                        <div className="flex items-center space-x-2">
                          <label className="text-sm">Included</label>
                          <input
                            type="radio"
                            name="gstIncluded"
                            checked={formData.gstIncluded}
                            onChange={() => {
                              setFormData((prev) => {
                                let subtotal = computeSubtotalFromForm(prev);
                                if (
                                  (!subtotal || subtotal === 0) &&
                                  selectedBooking?.pricing?.subtotal
                                ) {
                                  subtotal =
                                    selectedBooking.pricing.subtotal || 0;
                                }
                                const gstRate = prev.gstRate || 18;
                                const base = computeBaseExcludingGST(
                                  prev,
                                  subtotal,
                                  gstRate
                                );
                                const gstAmount = Number(
                                  ((base * gstRate) / (100 + gstRate)).toFixed(
                                    2
                                  )
                                );
                                const total = Number(base.toFixed(2));
                                return {
                                  ...prev,
                                  applyGST: true,
                                  gstIncluded: true,
                                  gstAmount,
                                  totalAmount: total,
                                };
                              });
                            }}
                          />
                          <label
                            className="text-sm cursor-pointer"
                            onClick={() => {
                              setFormData((prev) => {
                                // compute fresh subtotal from current services
                                let subtotal = computeSubtotalFromForm(prev);
                                if (
                                  (!subtotal || subtotal === 0) &&
                                  selectedBooking?.pricing?.subtotal
                                ) {
                                  subtotal =
                                    selectedBooking.pricing.subtotal || 0;
                                }
                                const gstRate = prev.gstRate || 18;
                                // base is the subtotal (when prices don't include GST)
                                const base = Number(subtotal || 0);
                                const gstAmount = Number(
                                  (base * (gstRate / 100)).toFixed(2)
                                );
                                const total = Number(
                                  (base + gstAmount).toFixed(2)
                                );
                                return {
                                  ...prev,
                                  applyGST: true,
                                  gstIncluded: false,
                                  gstAmount,
                                  totalAmount: total,
                                };
                              });
                            }}
                          >
                            Not Included (+{formData.gstRate || 18}% )
                          </label>
                          <input
                            type="radio"
                            name="gstIncluded"
                            checked={!formData.gstIncluded}
                            onChange={() => {
                              setFormData((prev) => {
                                let subtotal = computeSubtotalFromForm(prev);
                                if (
                                  (!subtotal || subtotal === 0) &&
                                  selectedBooking?.pricing?.subtotal
                                ) {
                                  subtotal =
                                    selectedBooking.pricing.subtotal || 0;
                                }
                                const gstRate = prev.gstRate || 18;
                                const base = Number(subtotal || 0);
                                const gstAmount = Number(
                                  (base * (gstRate / 100)).toFixed(2)
                                );
                                const total = Number(
                                  (base + gstAmount).toFixed(2)
                                );
                                return {
                                  ...prev,
                                  applyGST: true,
                                  gstIncluded: false,
                                  gstAmount,
                                  totalAmount: total,
                                };
                              });
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Discount</div>
                    <div>
                      <input
                        type="number"
                        min={0}
                        value={formData.discountAmount || 0}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            discountAmount: Number(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-2 py-1 border rounded"
                      />
                      <div className="text-sm text-gray-500 mt-1">
                        Discount will be subtracted from final total
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Total Amount</div>
                    <div>
                      <input
                        type="number"
                        value={formData.totalAmount}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            totalAmount: Number(e.target.value),
                            manualTotal: true,
                          }))
                        }
                        className="w-full px-2 py-1 border rounded"
                      />
                      {formData.applyGST && !formData.gstIncluded ? (
                        <div className="text-sm text-gray-500 mt-1">
                          Computed with GST: ₹
                          {(
                            computeSubtotalFromForm() +
                            (formData.gstAmount || 0) -
                            (formData.discountAmount || 0)
                          ).toLocaleString()}
                        </div>
                      ) : formData.applyGST && formData.gstIncluded ? (
                        <div className="text-sm text-gray-500 mt-1">
                          GST included portion: ₹
                          {(formData.gstAmount || 0).toLocaleString()}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                {selectedBooking && getRemainingAmount(selectedBooking) > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!selectedBooking) return;
                      if (
                        !window.confirm(
                          "Mark this booking as paid? This will set remaining amount to 0 and mark payment as completed."
                        )
                      )
                        return;
                      try {
                        setSubmitting(true);
                        const currentTotal =
                          selectedBooking.pricing?.totalAmount ??
                          formData.totalAmount;
                        const currentAdvance =
                          selectedBooking.pricing?.advanceAmount ??
                          formData.advanceAmount ??
                          0;
                        const updatedPricing = {
                          subtotal:
                            selectedBooking.pricing?.subtotal ?? currentTotal,
                          totalAmount: currentTotal,
                          gstRate:
                            (selectedBooking.pricing as any)?.gstRate ?? 0,
                          gstIncluded:
                            (selectedBooking.pricing as any)?.gstIncluded ??
                            false,
                          gstAmount:
                            (selectedBooking.pricing as any)?.gstAmount ?? 0,
                          advanceAmount: Math.max(currentAdvance, currentTotal),
                          remainingAmount: 0,
                        };
                        // Only update payment fields here; status remains separate
                        const res: any = await bookingAPI.updateBooking(
                          selectedBooking._id,
                          {
                            paymentStatus: "completed",
                            pricing: updatedPricing,
                          }
                        );
                        const updated = res?.data;
                        addNotification({
                          type: "success",
                          title: "Payment",
                          message: "Marked booking as paid",
                        });
                        if (updated) {
                          setBookings((prev) =>
                            (prev || []).map((b) =>
                              b._id === updated._id ? updated : b
                            )
                          );
                        } else {
                          await fetchData();
                        }
                        setShowEditModal(false);
                        setSelectedBooking(null);
                        resetForm();
                      } catch (error: unknown) {
                        addNotification({
                          type: "error",
                          title: "Error",
                          message:
                            error instanceof Error
                              ? error.message
                              : "Failed to mark as paid",
                        });
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors mr-2"
                  >
                    Mark as Paid
                  </button>
                )}

                {selectedBooking && selectedBooking.status !== "completed" && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!selectedBooking) return;
                      if (
                        !window.confirm(
                          "Mark this booking as complete? This will set booking status to completed."
                        )
                      )
                        return;
                      try {
                        setSubmitting(true);
                        const res: any = await bookingAPI.updateBooking(
                          selectedBooking._id,
                          { status: "completed" }
                        );
                        const updated = res?.data;
                        addNotification({
                          type: "success",
                          title: "Status",
                          message: "Marked booking as completed",
                        });
                        if (updated) {
                          setBookings((prev) =>
                            (prev || []).map((b) =>
                              b._id === updated._id ? updated : b
                            )
                          );
                        } else {
                          await fetchData();
                        }
                        setShowEditModal(false);
                        setSelectedBooking(null);
                        resetForm();
                      } catch (error: unknown) {
                        addNotification({
                          type: "error",
                          title: "Error",
                          message:
                            error instanceof Error
                              ? error.message
                              : "Failed to mark as completed",
                        });
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors mr-2"
                  >
                    Mark as Complete
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedBooking(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {submitting && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {selectedBooking ? "Update Booking" : "Create Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Modal */}
      {showPDFModal && pdfBookingData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {pdfBookingData.status === "enquiry" ? "Quotation" : "Invoice"}{" "}
                Preview
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Print/Download</span>
                </button>
                <button
                  onClick={() => setShowPDFModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg">
              <BookingPDFTemplate ref={pdfRef} data={pdfBookingData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
