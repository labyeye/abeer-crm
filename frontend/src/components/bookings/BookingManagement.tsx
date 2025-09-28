import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useNotification } from "../../contexts/NotificationContext";
import { useAuth } from "../../contexts/AuthContext";

import {
  bookingAPI,
  clientAPI,
  staffAPI,
  inventoryAPI,
  branchAPI,
  serviceCategoryAPI,
} from "../../services/api";

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
    designation: string;
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
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
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
  designation: string;
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


  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
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
  const [staffDropdownStates, setStaffDropdownStates] = useState<{[key: number]: boolean}>({});
  const [equipDropdownStates, setEquipDropdownStates] = useState<{[key: number]: boolean}>({});
  const [staffOutsourceStates, setStaffOutsourceStates] = useState<{[key: number]: boolean}>({});
  const [equipOutsourceStates, setEquipOutsourceStates] = useState<{[key: number]: boolean}>({});
  const [outsourceStaff, setOutsourceStaff] = useState<{[key: number]: string[]}>({});
  const [outsourceEquipment, setOutsourceEquipment] = useState<{[key: number]: any[]}>({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [formData, setFormData] = useState({
    clientId: "",
    // servicesSchedule allows multiple service entries (date/time/staff/equipment per entry)
    servicesSchedule: [
      {
        serviceCategoryId: "",
        serviceType: [] as string[],
        serviceName: "",
        date: "",
        startTime: "",
        endTime: "",
        venueName: "",
        venueAddress: "",
        assignedStaff: [] as string[],
        inventorySelection: [] as string[],
        quantity: 1,
        price: 0,
        amount: 0,
      },
    ] as Array<{
      serviceName?: string;
      serviceCategoryId?: string;
      serviceType?: string[];
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
    inventorySelection: [] as string[], // fallback/global selection (kept for compatibility)
    assignedStaff: [] as string[], // fallback/global (kept for compatibility)
    bookingBranch: "",
    services: [] as any[],
    totalAmount: 0,
    advanceAmount: 0,
    status: "pending",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const { addNotification } = useNotification();

  const { user } = useAuth();
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
        allClients.filter((client: any) => 
          client.category && client.category.toLowerCase() === 'professional'
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
          date: new Date().toISOString().split('T')[0], // Default to today's date
          startTime: "",
          endTime: "",
          venueName: "",
          venueAddress: "",
          assignedStaff: [],
          inventorySelection: [],
          quantity: 1,
          price: 0,
          amount: 0,
        },
      ],
      functionType: "",
      venueName: "",
      venueAddress: "",
      serviceNeeded: "",
      inventorySelection: [],
      assignedStaff: [],
      bookingBranch: "",
      services: [],
      totalAmount: 0,
      advanceAmount: 0,
      status: "pending",
      notes: "",
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

  const handleAddBooking = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditBooking = async (booking: Booking) => {
    setSelectedBooking(booking);
    // Build servicesSchedule from existing booking details. If booking has only single functionDetails,
    // convert it into a single-element schedule. Include assigned staff and inventory selection per entry.
    // Try to map existing booking.services (if present) to schedule entries so pricing is editable per schedule
  let scheduleEntries: any[] = [];
  const b: any = booking as any;
    // Prefer using functionDetailsList if available because it contains per-service dates, staff and inventory
    if (Array.isArray(b.functionDetailsList) && b.functionDetailsList.length > 0) {
      scheduleEntries = b.functionDetailsList.map((fd: any, i: number) => {
        const svc = Array.isArray(b.services) ? b.services[i] : null;
        return {
          serviceName: svc?.service || svc?.serviceName || fd.type || b.serviceNeeded || '',
          date: fd.date ? (typeof fd.date === 'string' ? fd.date.split('T')[0] : new Date(fd.date).toISOString().split('T')[0]) : (b.functionDetails?.date ? b.functionDetails.date.split('T')[0] : ''),
          startTime: (fd.time && fd.time.start) || b.functionDetails?.time?.start || '',
          endTime: (fd.time && fd.time.end) || b.functionDetails?.time?.end || '',
          venueName: (fd.venue && fd.venue.name) || b.functionDetails?.venue?.name || '',
          venueAddress: (fd.venue && fd.venue.address) || b.functionDetails?.venue?.address || '',
          assignedStaff: Array.isArray(fd.assignedStaff) && fd.assignedStaff.length ? fd.assignedStaff.map((s: any) => (s._id ? s._id : s)) : (b.assignedStaff?.map((s: any) => s._id) || []),
          inventorySelection: Array.isArray(fd.inventorySelection) && fd.inventorySelection.length ? fd.inventorySelection.map((it: any) => (it._id ? it._id : it)) : (b.inventorySelection?.map((i: any) => i._id) || []),
          quantity: svc?.quantity ?? svc?.qty ?? 1,
          price: svc?.rate ?? svc?.price ?? 0,
          amount: svc?.amount ?? svc?.total ?? ((svc?.quantity ?? svc?.qty ?? 1) * (svc?.rate ?? svc?.price ?? 0)),
          serviceCategoryId: svc?.serviceCategory || svc?.serviceCategoryId || '',
          serviceType: svc?.serviceType || svc?.type || [],
        };
      });
    } else if (Array.isArray(booking.services) && booking.services.length > 0) {
      // Fallback: map services to a single-date (functionDetails) when functionDetailsList is absent
      scheduleEntries = b.services.map((svc: any) => ({
        serviceName: svc.service || svc.serviceName || b.serviceNeeded || b.functionDetails?.type || '',
        date: b.functionDetails?.date ? b.functionDetails.date.split('T')[0] : '',
        startTime: b.functionDetails?.time?.start || '',
        endTime: b.functionDetails?.time?.end || '',
        venueName: b.functionDetails?.venue?.name || '',
        venueAddress: b.functionDetails?.venue?.address || '',
        assignedStaff: b.assignedStaff?.map((s: any) => s._id) || [],
        inventorySelection: b.inventorySelection?.map((i: any) => i._id) || [],
        quantity: svc.quantity ?? svc.qty ?? 1,
        price: svc.rate ?? svc.price ?? 0,
        amount: svc.amount ?? svc.total ?? (svc.quantity ?? svc.qty ?? 1) * (svc.rate ?? svc.price ?? 0),
        serviceCategoryId: svc.serviceCategory || svc.serviceCategoryId || '',
        serviceType: svc.serviceType || svc.type || [],
      }));
    } else {
      scheduleEntries = [
        {
          serviceName: b.serviceNeeded || b.functionDetails?.type || '',
          date: b.functionDetails?.date ? b.functionDetails.date.split('T')[0] : '',
          startTime: b.functionDetails?.time?.start || '',
          endTime: b.functionDetails?.time?.end || '',
          venueName: b.functionDetails?.venue?.name || '',
          venueAddress: b.functionDetails?.venue?.address || '',
          assignedStaff: b.assignedStaff?.map((s: any) => s._id) || [],
          inventorySelection: b.inventorySelection?.map((i: any) => i._id) || [],
          quantity: 1,
          price: 0,
          amount: 0,
          serviceCategoryId: '',
          serviceType: [],
        },
      ];
    }

    // Prepopulate inventory category filters and cache so equipment and categories show up in edit
    try {
      const initialFilters: { [key: number]: string } = {};
      const initialCache: { [key: string]: any[] } = {};
      const branchId = (booking as any).branch?._id || booking.bookingBranch?._id || (user && user.branchId) || undefined;
      // booking.inventorySelection may contain objects; build a map
      const invObjects = Array.isArray(booking.inventorySelection) ? booking.inventorySelection : [];
      for (let i = 0; i < scheduleEntries.length; i++) {
        const entry = scheduleEntries[i];
        const ids = entry.inventorySelection || [];
        if (ids && ids.length) {
          // find category of first matched inventory object
          let foundCat: string | null = null;
          for (const id of ids) {
            const found = invObjects.find((it: any) => String(it._id || it) === String(id));
            if (found && (((found as any).category) || ((found as any).type))) {
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
                const docs = invData.docs || invData.data || invData.items || invData || [];
                initialCache[foundCat] = Array.isArray(docs) ? docs : [];
              } catch (err) {
                console.warn('Failed to prefetch inventory for category', foundCat, err);
              }
            }
          }
        }
      }
      if (Object.keys(initialFilters).length) setInventoryCategoryFilters(prev => ({ ...prev, ...initialFilters }));
      if (Object.keys(initialCache).length) setCachedInventoryByCategory(prev => ({ ...prev, ...initialCache }));
    } catch (err) {
      console.warn('Error preparing edit prefill for inventory categories', err);
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
      advanceAmount: booking.pricing.advanceAmount,
      status: booking.status || "pending",
      notes: "",
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Generate booking number
      const bookingNumber = `BK-${Date.now()}`;

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
                price: 0,
                amount: 0,
              },
            ];
      const subtotal = (scheduleList || []).reduce(
        (sum: number, s: any) => sum + (Number(s.amount) || 0),
        0
      );
      const remainingAmount = subtotal - (formData.advanceAmount || 0);

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
          end: s.endTime || "" 
        },
        venue: {
          name: s.venueName || formData.venueName || "",
          address: s.venueAddress || formData.venueAddress || "",
        },
        // Add outsource data (optional)
        outsourceStaff: outsourceStaff[idx] || [],
        outsourceEquipment: outsourceEquipment[idx] || [],
      }));
      // union assigned staff and inventory across schedule entries and global selections
      const allAssignedStaff = Array.from(
        new Set([
          ...(formData.assignedStaff || []),
          ...scheduleList.flatMap((s: any) => s.assignedStaff || []),
        ])
      );
      const allInventory = Array.from(
        new Set([
          ...(formData.inventorySelection || []),
          ...scheduleList.flatMap((s: any) => s.inventorySelection || []),
        ])
      );

      // Optional validation - only validate if service category is provided
      const invalidEntry = (scheduleList || []).find(
        (s: any) =>
          s.serviceCategoryId && !(Array.isArray(s.serviceType) && s.serviceType.length > 0)
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
          serviceType: Array.isArray(s.serviceType) && s.serviceType.length > 0 ? s.serviceType : [],
          serviceCategory: s.serviceCategoryId || "",
          quantity: s.quantity ?? 1,
          rate: s.price ?? 0,
          amount: s.amount ?? (s.quantity ?? 1) * (s.price ?? 0),
          description: "",
        };
      });

      // If there's only one schedule entry, include its startDate/endDate in top-level functionDetails for compatibility
      const primaryFunction =
        functionDetailsList.length === 1 ? functionDetailsList[0] : null;

      const bookingData = {
        bookingNumber,
        client: formData.clientId,
        branch: formData.bookingBranch,
        functionDetails: primaryFunction
          ? {
              ...primaryFunction,
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
        inventorySelection: allInventory,
        assignedStaff: allAssignedStaff,
        bookingBranch: formData.bookingBranch,
        status: formData.status,
        services: servicesFromSchedule,
        pricing: {
          subtotal,
          totalAmount: subtotal,
          advanceAmount: formData.advanceAmount,
          remainingAmount,
        },
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
          date: new Date().toISOString().split('T')[0], // Default to today's date
          startTime: "",
          endTime: "",
          venueName: "",
          venueAddress: "",
          assignedStaff: [],
          inventorySelection: [],
          quantity: 1,
          price: 0,
          amount: 0,
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
        await bookingAPI.deleteBooking(id);
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

  const filteredBookings = bookings.filter((booking) => {
    // If the current user is a branch admin/head, restrict bookings to their branch only
    const bookingBranchId =
      (booking as any).branch?._id ||
      booking.bookingBranch?._id ||
      booking.bookingBranch ||
      "";
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
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Booking Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage client bookings and events
          </p>
        </div>
        {user?.role !== "staff" && (
          <button
            onClick={handleAddBooking}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Booking
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Bookings
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-yellow-500 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.pending}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-green-500 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.confirmed}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 p-3 rounded-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.completed}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                {user?.role === "chairman" && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service & Staff
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking._id || booking.bookingNumber}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {booking.bookingNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        ₹{booking.pricing.totalAmount.toLocaleString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 whitespace-nowrap">
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {booking.functionDetails.type}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(
                          booking.functionDetails.date
                        ).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.functionDetails.venue.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {booking.serviceNeeded}
                      </div>
                      <div className="text-sm text-gray-500">
                        Staff: {booking.assignedStaff?.length || 0}
                      </div>
                      <div className="text-sm text-gray-500">
                        Equipment: {booking.inventorySelection?.length || 0}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                      {(booking as any).paymentStatus === 'completed' ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">Paid</span>
                      ) : (booking as any).paymentStatus === 'partial' ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">Partial</span>
                      ) : (
                        (booking as any).pricing?.remainingAmount ? (
                          <span className="text-sm text-gray-600">Remaining: ₹{Number((booking as any).pricing.remainingAmount).toLocaleString()}</span>
                        ) : null
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Booking"
                          >
                            <Edit className="w-4 h-4" />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
                      {clients.map((client) => (
                        <option key={client._id} value={client._id}>
                          {client.name} - {client.phone}
                        </option>
                      ))}
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
                            <div className="font-medium">Service #{idx + 1}</div>
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
                                          e.target.value ? [e.target.value] : []
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
                            <label className="text-sm text-gray-600">Date</label>
                            <div className="flex items-center gap-3">
                              <input
                                type="date"
                                value={entry.date || ""}
                                onChange={(e) =>
                                  updateScheduleEntry(idx, "date", e.target.value)
                                }
                                className="w-full px-3 py-2 border rounded"
                              />
                              {/* Show DD/MM/YYYY preview beside the native control */}
                              <div className="text-sm text-gray-600 px-3 py-2 border rounded bg-gray-50">
                                {entry.date ? (() => {
                                  try {
                                    const d = new Date(entry.date);
                                    if (isNaN(d.getTime())) return "Invalid date";
                                    const dd = String(d.getDate()).padStart(2, '0');
                                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                                    const yyyy = d.getFullYear();
                                    return `${dd}/${mm}/${yyyy}`;
                                  } catch (e) {
                                    return "Invalid date";
                                  }
                                })() : 'DD/MM/YYYY'}
                              </div>
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
                            <label className="text-sm text-gray-600">Qty</label>
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
                              value={entry.price ?? 0}
                              onChange={(e) =>
                                updateScheduleEntry(
                                  idx,
                                  "price",
                                  Number(e.target.value)
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
                              value={entry.amount ?? 0}
                              onChange={(e) =>
                                updateScheduleEntry(
                                  idx,
                                  "amount",
                                  Number(e.target.value)
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
                              <span className="text-sm text-gray-600">Internal</span>
                              <button
                                type="button"
                                onClick={() => setStaffOutsourceStates(prev => ({ ...prev, [idx]: !staffOutsourceStates[idx] }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  staffOutsourceStates[idx] ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                              >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  staffOutsourceStates[idx] ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                              </button>
                              <span className="text-sm text-gray-600">Outsource</span>
                            </div>
                          </div>
                          <div className="mt-2">
                            {(() => {
                              // compute conflicts: find other entries with same date and overlapping time
                              const conflicts = new Set<string>();
                              const curStart =
                                entry.date && entry.startTime
                                  ? new Date(`${entry.date}T${entry.startTime}`)
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
                                    return curStart <= oEnd && oStart <= curEnd;
                                  })();
                                  if (
                                    overlap &&
                                    Array.isArray(other.assignedStaff)
                                  ) {
                                    other.assignedStaff.forEach((id: string) =>
                                      conflicts.add(id)
                                    );
                                  }
                                }
                              );
                              
                              const selectedStaff = entry.assignedStaff || [];
                              const staffDropdownOpen = staffDropdownStates[idx] || false;
                              const isOutsourceMode = staffOutsourceStates[idx] || false;
                              const selectedOutsourceStaff = outsourceStaff[idx] || [];
                              
                              if (isOutsourceMode) {
                                return (
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() => setStaffDropdownStates(prev => ({ ...prev, [idx]: !staffDropdownOpen }))}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between"
                                    >
                                      <span className="text-gray-500">
                                        {selectedOutsourceStaff.length === 0
                                          ? "Select professional clients..."
                                          : `${selectedOutsourceStaff.length} professionals selected`}
                                      </span>
                                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </button>
                                    
                                    {staffDropdownOpen && (
                                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {professionalClients.map((client) => {
                                          const isSelected = selectedOutsourceStaff.includes(client._id);
                                          return (
                                            <label
                                              key={client._id}
                                              className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                  const checked = e.target.checked;
                                                  const list = new Set(selectedOutsourceStaff);
                                                  if (checked) list.add(client._id);
                                                  else list.delete(client._id);
                                                  setOutsourceStaff(prev => ({ ...prev, [idx]: Array.from(list) }));
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
                                    onClick={() => setStaffDropdownStates(prev => ({ ...prev, [idx]: !staffDropdownOpen }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between"
                                  >
                                    <span className="text-gray-500">
                                      {selectedStaff.length === 0
                                        ? "Select staff members..."
                                        : `${selectedStaff.length} staff selected`}
                                    </span>
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  
                                  {staffDropdownOpen && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                      {staff.map((s) => {
                                        const disabled = conflicts.has(s._id);
                                        const isSelected = selectedStaff.includes(s._id);
                                        return (
                                          <label
                                            key={s._id}
                                            className={`flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer ${
                                              disabled ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                          >
                                            <input
                                              type="checkbox"
                                              disabled={disabled}
                                              checked={isSelected}
                                              onChange={(e) => {
                                                if (disabled) return;
                                                const checked = e.target.checked;
                                                const list = new Set(selectedStaff);
                                                if (checked) list.add(s._id);
                                                else list.delete(s._id);
                                                updateScheduleEntry(idx, "assignedStaff", Array.from(list));
                                              }}
                                              className="mr-2"
                                            />
                                            <span className={`text-sm ${disabled ? 'line-through text-gray-400' : ''}`}>
                                              {s.name} ({s.designation})
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
                              <span className="text-sm text-gray-600">Internal</span>
                              <button
                                type="button"
                                onClick={() => setEquipOutsourceStates(prev => ({ ...prev, [idx]: !equipOutsourceStates[idx] }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  equipOutsourceStates[idx] ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                              >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  equipOutsourceStates[idx] ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                              </button>
                              <span className="text-sm text-gray-600">Outsource</span>
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
                                        params.branch = formData.bookingBranch;
                                      else if (user && user.branchId)
                                        params.branch = user.branchId;
                                      const res: any =
                                        await inventoryAPI.getInventory(params);
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
                                      setCachedInventoryByCategory((prev) => ({
                                        ...prev,
                                        [c]: list,
                                      }));
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
                              const filtered = selectedCategory
                                ? (
                                    cachedInventoryByCategory[
                                      selectedCategory
                                    ] || []
                                  )
                                    .concat()
                                    .filter(Boolean)
                                : inventoryList;
                              // compute equipment conflicts similar to staff
                              const equipConflicts = new Set<string>();
                              const curStartE =
                                entry.date && entry.startTime
                                  ? new Date(`${entry.date}T${entry.startTime}`)
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
                              
                              const selectedEquipment = entry.inventorySelection || [];
                              const equipDropdownOpen = equipDropdownStates[idx] || false;
                              const isEquipOutsourceMode = equipOutsourceStates[idx] || false;
                              const selectedOutsourceEquipment = outsourceEquipment[idx] || [];
                              
                              if (isEquipOutsourceMode) {
                                return (
                                  <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium">Outsource Equipment</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newEquip = {
                                            sku: '',
                                            modelNo: '',
                                            name: '',
                                            brand: '',
                                            qty: 1,
                                            rentingAmount: 0,
                                            rentingFromPersonName: '',
                                            email: '',
                                            phone: '',
                                            address: ''
                                          };
                                          setOutsourceEquipment(prev => ({
                                            ...prev,
                                            [idx]: [...(prev[idx] || []), newEquip]
                                          }));
                                        }}
                                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                                      >
                                        Add Equipment
                                      </button>
                                    </div>
                                    
                                    {selectedOutsourceEquipment.map((equip: any, equipIdx: number) => (
                                      <div key={equipIdx} className="border rounded-lg p-4 bg-gray-50">
                                        <div className="flex justify-between items-center mb-3">
                                          <span className="font-medium text-sm">Equipment #{equipIdx + 1}</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOutsourceEquipment(prev => ({
                                                ...prev,
                                                [idx]: prev[idx]?.filter((_, i) => i !== equipIdx) || []
                                              }));
                                            }}
                                            className="text-red-600 text-sm"
                                          >
                                            Remove
                                          </button>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div>
                                            <label className="text-xs text-gray-600">SKU</label>
                                            <input
                                              type="text"
                                              value={equip.sku || ''}
                                              onChange={(e) => {
                                                const updated = [...selectedOutsourceEquipment];
                                                updated[equipIdx] = { ...updated[equipIdx], sku: e.target.value };
                                                setOutsourceEquipment(prev => ({ ...prev, [idx]: updated }));
                                              }}
                                              className="w-full px-2 py-1 border rounded text-sm"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-xs text-gray-600">Model No</label>
                                            <input
                                              type="text"
                                              value={equip.modelNo || ''}
                                              onChange={(e) => {
                                                const updated = [...selectedOutsourceEquipment];
                                                updated[equipIdx] = { ...updated[equipIdx], modelNo: e.target.value };
                                                setOutsourceEquipment(prev => ({ ...prev, [idx]: updated }));
                                              }}
                                              className="w-full px-2 py-1 border rounded text-sm"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-xs text-gray-600">Equipment Name</label>
                                            <input
                                              type="text"
                                              value={equip.name || ''}
                                              onChange={(e) => {
                                                const updated = [...selectedOutsourceEquipment];
                                                updated[equipIdx] = { ...updated[equipIdx], name: e.target.value };
                                                setOutsourceEquipment(prev => ({ ...prev, [idx]: updated }));
                                              }}
                                              className="w-full px-2 py-1 border rounded text-sm"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-xs text-gray-600">Brand</label>
                                            <input
                                              type="text"
                                              value={equip.brand || ''}
                                              onChange={(e) => {
                                                const updated = [...selectedOutsourceEquipment];
                                                updated[equipIdx] = { ...updated[equipIdx], brand: e.target.value };
                                                setOutsourceEquipment(prev => ({ ...prev, [idx]: updated }));
                                              }}
                                              className="w-full px-2 py-1 border rounded text-sm"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-xs text-gray-600">Quantity</label>
                                            <input
                                              type="number"
                                              min="1"
                                              value={equip.qty || 1}
                                              onChange={(e) => {
                                                const updated = [...selectedOutsourceEquipment];
                                                updated[equipIdx] = { ...updated[equipIdx], qty: parseInt(e.target.value) || 1 };
                                                setOutsourceEquipment(prev => ({ ...prev, [idx]: updated }));
                                              }}
                                              className="w-full px-2 py-1 border rounded text-sm"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-xs text-gray-600">Renting Amount</label>
                                            <input
                                              type="number"
                                              min="0"
                                              value={equip.rentingAmount || 0}
                                              onChange={(e) => {
                                                const updated = [...selectedOutsourceEquipment];
                                                updated[equipIdx] = { ...updated[equipIdx], rentingAmount: parseFloat(e.target.value) || 0 };
                                                setOutsourceEquipment(prev => ({ ...prev, [idx]: updated }));
                                              }}
                                              className="w-full px-2 py-1 border rounded text-sm"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-xs text-gray-600">Renting From (Name)</label>
                                            <input
                                              type="text"
                                              value={equip.rentingFromPersonName || ''}
                                              onChange={(e) => {
                                                const updated = [...selectedOutsourceEquipment];
                                                updated[equipIdx] = { ...updated[equipIdx], rentingFromPersonName: e.target.value };
                                                setOutsourceEquipment(prev => ({ ...prev, [idx]: updated }));
                                              }}
                                              className="w-full px-2 py-1 border rounded text-sm"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-xs text-gray-600">Email</label>
                                            <input
                                              type="email"
                                              value={equip.email || ''}
                                              onChange={(e) => {
                                                const updated = [...selectedOutsourceEquipment];
                                                updated[equipIdx] = { ...updated[equipIdx], email: e.target.value };
                                                setOutsourceEquipment(prev => ({ ...prev, [idx]: updated }));
                                              }}
                                              className="w-full px-2 py-1 border rounded text-sm"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-xs text-gray-600">Phone</label>
                                            <input
                                              type="tel"
                                              value={equip.phone || ''}
                                              onChange={(e) => {
                                                const updated = [...selectedOutsourceEquipment];
                                                updated[equipIdx] = { ...updated[equipIdx], phone: e.target.value };
                                                setOutsourceEquipment(prev => ({ ...prev, [idx]: updated }));
                                              }}
                                              className="w-full px-2 py-1 border rounded text-sm"
                                            />
                                          </div>
                                          <div className="md:col-span-2">
                                            <label className="text-xs text-gray-600">Address</label>
                                            <textarea
                                              value={equip.address || ''}
                                              onChange={(e) => {
                                                const updated = [...selectedOutsourceEquipment];
                                                updated[equipIdx] = { ...updated[equipIdx], address: e.target.value };
                                                setOutsourceEquipment(prev => ({ ...prev, [idx]: updated }));
                                              }}
                                              rows={2}
                                              className="w-full px-2 py-1 border rounded text-sm"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              
                              return (
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setEquipDropdownStates(prev => ({ ...prev, [idx]: !equipDropdownOpen }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between"
                                  >
                                    <span className="text-gray-500">
                                      {selectedEquipment.length === 0
                                        ? "Select equipment..."
                                        : `${selectedEquipment.length} items selected`}
                                    </span>
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  
                                  {equipDropdownOpen && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                      {filtered.map((it: any) => {
                                        const disabled = equipConflicts.has(it._id);
                                        const isSelected = selectedEquipment.includes(it._id);
                                        return (
                                          <label
                                            key={it._id}
                                            className={`flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer ${
                                              disabled ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                          >
                                            <input
                                              type="checkbox"
                                              disabled={disabled}
                                              checked={isSelected}
                                              onChange={(e) => {
                                                if (disabled) return;
                                                const checked = e.target.checked;
                                                const list = new Set(selectedEquipment);
                                                if (checked) list.add(it._id);
                                                else list.delete(it._id);
                                                updateScheduleEntry(idx, "inventorySelection", Array.from(list));
                                              }}
                                              className="mr-2"
                                            />
                                            <span className={`text-sm ${disabled ? 'line-through text-gray-400' : ''}`}>
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
    </div>
  );
};

export default BookingManagement;
