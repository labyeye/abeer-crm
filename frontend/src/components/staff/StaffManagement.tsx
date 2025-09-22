import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Edit,
  Trash2,
  X,
  Loader2,
  Building2,
  IndianRupee,
} from "lucide-react";
import { useNotification } from "../../contexts/NotificationContext";
import { useAuth } from "../../contexts/AuthContext";
import { staffAPI, branchAPI } from "../../services/api";

interface StaffMember {
  _id: string;
  employeeId: string;
  name: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  fatherName: string;
  motherName: string;
  aadharNumbers: {
    staff: string;
    father: string;
    mother: string;
  };
  contacts: {
    staff: string;
    father: string;
    mother: string;
  };
  referredBy?: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  designation: string;
  department: string;
  staffType: "monthly" | "per_day" | "per_task";
  joiningDate: string;
  salary: number;
  branch: {
    _id: string;
    name: string;
    code: string;
    companyName: string;
  };
  isActive: boolean;
  maritalStatus?: "married" | "unmarried";
  children?: {
    boys: {
      count: number;
      names: string[];
    };
    girls: {
      count: number;
      names: string[];
    };
  };
  grandfatherName?: string;
  education?: Array<{
    degree?: string;
    institution?: string;
    year?: number;
    subjects?: Array<{
      name: string;
      marks?: number;
    }>;
  }>;
  experience?: Array<{
    company?: string;
    role?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
}

interface Branch {
  _id: string;
  name: string;
  code: string;
  companyName: string;
}

interface StaffFormData {
  userId: string;
  employeeId: string;
  name: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  fatherName: string;
  motherName: string;
  aadharNumbers: {
    staff: string;
    father: string;
    mother: string;
  };
  contacts: {
    staff: string;
    father: string;
    mother: string;
  };
  referredBy: string;
  password: string;
  branch: string;
  staffType: "monthly" | "per_day" | "per_task";
  designation: string;
  department: string;
  joiningDate: string;
  salary: {
    basic: number;
    allowances: number;
  };
  maritalStatus: "married" | "unmarried";
  grandfatherName: string;
  children: {
    boysCount: number;
    girlsCount: number;
    boysNames: string[];
    girlsNames: string[];
  };
  education: Array<{
    degree?: string;
    institution?: string;
    year?: number;
    subjects?: Array<{
      name: string;
      marks?: number;
    }>;
  }>;
  educationClassSubject?: string;
  experience?: Array<{
    company?: string;
    role?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  [key: string]: unknown;
}

const StaffManagement = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staffPhoto, setStaffPhoto] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState<StaffFormData>({
    userId: "",
    employeeId: "",
    name: "",
    phone: "",
    email: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
    },
    fatherName: "",
    motherName: "",
    aadharNumbers: {
      staff: "",
      father: "",
      mother: "",
    },
    contacts: {
      staff: "",
      father: "",
      mother: "",
    },
    referredBy: "",
    password: "",
    branch: "",
    staffType: "monthly",
    designation: "",
    department: "",
    joiningDate: "",
    salary: {
      basic: 0,
      allowances: 0,
    },
    maritalStatus: "unmarried",
    grandfatherName: "",
    children: {
      boysCount: 0,
      girlsCount: 0,
      boysNames: [],
      girlsNames: [],
    },
    education: [
      {
        degree: "",
        institution: "",
        year: undefined,
        subjects: [{ name: "", marks: undefined }],
      },
    ],
    educationClassSubject: "",
    experience: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [attendanceModalStaff, setAttendanceModalStaff] =
    useState<StaffMember | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [attendanceLoading] = useState(false);

  const { addNotification } = useNotification();
  const { user } = useAuth();

  useEffect(() => {
    fetchStaff();
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedStaff) {
      handleEditStaff(selectedStaff);
    } else {
      resetForm();
    }
  }, [selectedStaff, branches]);

  useEffect(() => {
    if (
      user &&
      user.role === "admin" &&
      user.branchId &&
      branches.length > 0 &&
      !selectedStaff
    ) {
      const userBranch = branches.find((b) => b._id === user.branchId);
      if (userBranch && formData.branch !== userBranch._id) {
        setFormData((prev) => ({ ...prev, branch: userBranch._id }));
      }
    }
  }, [branches, user, selectedStaff, formData.branch]);

  useEffect(() => {
    fetchStaff();
  }, [filterBranch, filterStatus, searchTerm]);

  const fetchStaff = async () => {
    try {
      setLoading(true);

      const params: any = {};
      if (user?.role === "chairman" && filterBranch !== "all") {
        params.branch = filterBranch;
      }
      if (filterStatus !== "all") {
        params.status = filterStatus;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const staffResponse = await staffAPI.getStaff(params);
      console.log("Full API response:", staffResponse);

      const staffData =
        staffResponse.data?.data || staffResponse.data || staffResponse;

      console.log("Staff data:", staffData);

      if (Array.isArray(staffData)) {
        setStaffMembers(staffData);
      } else if (staffData && Array.isArray(staffData.data)) {
        setStaffMembers(staffData.data);
      } else {
        console.error("Unexpected data structure:", staffData);
        setStaffMembers([]);
      }
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error.message || "Failed to fetch staff",
      });
      setStaffMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const branchResponse = await branchAPI.getBranches();
      const branchesFetched =
        branchResponse?.data?.data || branchResponse?.data || [];
      setBranches(branchesFetched);
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error.message || "Failed to fetch branches",
      });
    }
  };

  const resetForm = () => {
    let defaultBranch = "";
    if (user) {
      if (user.role === "admin") {
        if (user.branchId) {
          if (branches.length > 0) {
            const userBranch = branches.find((b) => b._id === user.branchId);
            if (userBranch) {
              defaultBranch = userBranch._id;
            } else {
              defaultBranch = user.branchId;
            }
          } else {
            defaultBranch = user.branchId;
          }
        }
      }
    }

    setFormData({
      userId: "",
      employeeId: "",
      name: "",
      phone: "",
      email: "",
      address: {
        street: "",
        city: "",
        state: "",
        pincode: "",
      },
      fatherName: "",
      motherName: "",
      aadharNumbers: {
        staff: "",
        father: "",
        mother: "",
      },
      contacts: {
        staff: "",
        father: "",
        mother: "",
      },
      referredBy: "",
      password: "",
      branch: defaultBranch,
      staffType: "monthly",
      designation: "",
      department: "",
      joiningDate: "",
      salary: {
        basic: 0,
        allowances: 0,
      },
      maritalStatus: "unmarried",
      grandfatherName: "",
      children: {
        boysCount: 0,
        girlsCount: 0,
        boysNames: [],
        girlsNames: [],
      },
      education: [
        {
          degree: "",
          institution: "",
          year: undefined,
          subjects: [{ name: "", marks: undefined }],
        },
      ],
      educationClassSubject: "",
      experience: [],
    });
  };

  const handleAddStaff = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditStaff = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setFormData({
      userId: staff.user._id || "",
      employeeId: staff.employeeId,
      name: staff.name,
      phone: staff.phone,
      email: staff.user.email || "",
      address: staff.address,
      fatherName: staff.fatherName,
      motherName: staff.motherName,
      aadharNumbers: staff.aadharNumbers,
      contacts: staff.contacts,
      referredBy: staff.referredBy || "",
      password: "",
      branch: staff.branch?._id || "",
      staffType: staff.staffType,
      designation: staff.designation,
      department: staff.department,
      joiningDate: staff.joiningDate.split("T")[0],
      salary:
        typeof staff.salary === "object"
          ? staff.salary
          : { basic: staff.salary || 0, allowances: 0 },
      maritalStatus: (staff.maritalStatus || "unmarried") as
        | "married"
        | "unmarried",
      grandfatherName: staff.grandfatherName || "",
      children: {
        boysCount: staff.children?.boys?.count || 0,
        girlsCount: staff.children?.girls?.count || 0,
        boysNames: staff.children?.boys?.names || [],
        girlsNames: staff.children?.girls?.names || [],
      },
      education:
        staff.education && staff.education.length > 0
          ? staff.education.map((e: any) => ({
              degree: e.degree || e.class || e.qualification || "",
              institution: e.institution || e.school || e.college || "",
              year: e.year || e.passingYear || undefined,
              subjects:
                Array.isArray(e.subjects) && e.subjects.length > 0
                  ? e.subjects.map((s: any) => ({
                      name: s.name || s.subject || "Overall",
                      marks:
                        s.marks !== undefined
                          ? Number(s.marks)
                          : s.score !== undefined
                          ? Number(s.score)
                          : undefined,
                    }))
                  : e.marks !== undefined
                  ? [
                      {
                        name: e.subjectName || "Overall",
                        marks: Number(e.marks),
                      },
                    ]
                  : [],
            }))
          : [
              {
                degree: "",
                institution: "",
                year: undefined,
                subjects: [{ name: "", marks: undefined }],
              },
            ],
      // map experience subdocuments to form-friendly values
      experience:
        staff.experience && staff.experience.length > 0
          ? staff.experience.map((e: any) => ({
              company: e.company || "",
              role: e.role || "",
              location: e.location || "",
              startDate: e.startDate ? e.startDate.split("T")[0] : "",
              endDate: e.endDate ? e.endDate.split("T")[0] : "",
              description: e.description || "",
            }))
          : [],
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (selectedStaff) {
        await staffAPI.updateStaff(selectedStaff._id, formData);
        addNotification({
          type: "success",
          title: "Success",
          message: "Staff member updated successfully",
        });
      } else {
        await staffAPI.createStaff(formData);
        addNotification({
          type: "success",
          title: "Success",
          message: "Staff member created successfully",
        });
      }
      fetchStaff();
      // notify other components (e.g., BranchManagement) to refresh branch stats/counts
      try {
        window.dispatchEvent(new Event("branchesUpdated"));
      } catch (err) {
        /* ignore */
      }
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedStaff(null);
      resetForm();
    } catch (error: any) {
      addNotification({
        type: "error",
        title: "Error",
        message: error.message || "Failed to save staff member",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Experience helpers
  const addExperienceEntry = () => {
    setFormData((prev) => ({
      ...prev,
      experience: [
        ...((prev.experience as any[]) || []),
        {
          company: "",
          role: "",
          location: "",
          startDate: "",
          endDate: "",
          description: "",
        },
      ],
    }));
  };

  const updateExperienceEntry = (
    index: number,
    field: string,
    value: string
  ) => {
    setFormData((prev) => {
      const exp = Array.isArray(prev.experience)
        ? [...(prev.experience as any[])]
        : [];
      exp[index] = { ...(exp[index] || {}), [field]: value };
      return { ...prev, experience: exp };
    });
  };

  const removeExperienceEntry = (index: number) => {
    setFormData((prev) => {
      const exp = Array.isArray(prev.experience)
        ? [...(prev.experience as any[])]
        : [];
      exp.splice(index, 1);
      return { ...prev, experience: exp };
    });
  };

  // Education helpers (subject-wise)
  const addEducationEntry = () => {
    setFormData((prev) => ({
      ...prev,
      education: [
        ...(Array.isArray(prev.education) ? prev.education : []),
        {
          degree: "",
          institution: "",
          year: undefined,
          subjects: [{ name: "", marks: undefined }],
        },
      ],
    }));
  };

  const updateEducationField = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const education = Array.isArray(prev.education)
        ? [...(prev.education as any[])]
        : [];
      education[index] = { ...(education[index] || {}), [field]: value };
      return { ...prev, education };
    });
  };

  const removeEducationEntry = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      education: ((prev.education as any[]) || []).filter(
        (_, i) => i !== index
      ),
    }));
  };

  const addSubjectEntry = (eduIndex: number) => {
    setFormData((prev) => {
      const education = Array.isArray(prev.education)
        ? [...(prev.education as any[])]
        : [];
      const edu = { ...(education[eduIndex] || {}) };
      edu.subjects = Array.isArray(edu.subjects)
        ? [...edu.subjects, { name: "", marks: undefined }]
        : [{ name: "", marks: undefined }];
      education[eduIndex] = edu;
      return { ...prev, education };
    });
  };

  const updateSubjectEntry = (
    eduIndex: number,
    subjIndex: number,
    field: string,
    value: any
  ) => {
    setFormData((prev) => {
      const education = Array.isArray(prev.education)
        ? [...(prev.education as any[])]
        : [];
      const edu = { ...(education[eduIndex] || {}) };
      edu.subjects = Array.isArray(edu.subjects) ? [...edu.subjects] : [];
      edu.subjects[subjIndex] = {
        ...(edu.subjects[subjIndex] || {}),
        [field]: value,
      };
      education[eduIndex] = edu;
      return { ...prev, education };
    });
  };

  const removeSubjectEntry = (eduIndex: number, subjIndex: number) => {
    setFormData((prev) => {
      const education = Array.isArray(prev.education)
        ? [...(prev.education as any[])]
        : [];
      const edu = { ...(education[eduIndex] || {}) };
      edu.subjects = (edu.subjects || []).filter(
        (_: any, i: number) => i !== subjIndex
      );
      education[eduIndex] = edu;
      return { ...prev, education };
    });
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await staffAPI.deleteStaff(id);
        addNotification({
          type: "success",
          title: "Success",
          message: "Staff member deleted successfully",
        });
        fetchStaff();
        try {
          window.dispatchEvent(new Event("branchesUpdated"));
        } catch (err) {
          /* ignore */
        }
      } catch (error: any) {
        addNotification({
          type: "error",
          title: "Error",
          message: error.message || "Failed to delete staff member",
        });
      }
    }
  };

  const filteredStaff = staffMembers.filter((staff) => {
    const shouldApplyBranchFilter = user?.role === "chairman";

    if (
      filterStatus === "all" &&
      (!shouldApplyBranchFilter || filterBranch === "all") &&
      searchTerm.trim() === ""
    ) {
      return true;
    }

    const matchesSearch =
      searchTerm === "" ||
      staff.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.designation?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (staff.isActive ? "active" : "inactive") === filterStatus;

    const matchesBranch =
      !shouldApplyBranchFilter ||
      filterBranch === "all" ||
      staff.branch?._id === filterBranch ||
      staff.branch?.code === filterBranch;

    return matchesSearch && matchesStatus && matchesBranch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your team members and their information
          </p>
        </div>
        <button
          onClick={handleAddStaff}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Staff Member
        </button>
      </div>

      {}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search staff members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="terminated">Terminated</option>
          </select>

          {}
          {user?.role === "chairman" && (
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Branches</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name} ({branch.code})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((staff) => (
          <div
            key={staff._id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {staff.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{staff.name}</h3>
                  <p className="text-sm text-gray-600">{staff.employeeId}</p>
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  staff.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {staff.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                {staff.designation} - {staff.department}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                {staff.phone}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                {staff.user.email}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                Joined: {new Date(staff.joiningDate).toLocaleDateString()}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <IndianRupee className="w-4 h-4 mr-2" />₹
                {staff.salary?.toLocaleString() || "N/A"}
              </div>
              {staff.branch && (
                <div className="flex items-center text-sm text-gray-600">
                  <Building2 className="w-4 h-4 mr-2" />
                  Branch: {staff.branch.name} ({staff.branch.code})
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleEditStaff(staff)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit Staff"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteStaff(staff._id, staff.name)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Staff"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No staff members found
          </h3>
          <p className="text-gray-600">
            Get started by adding your first staff member.
          </p>
        </div>
      )}

      {}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedStaff ? "Edit Staff Member" : "Add New Staff Member"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setSelectedStaff(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Profile Photo
                </h3>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setStaffPhoto(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="mb-4"
                />
                {staffPhoto && (
                  <img
                    src={staffPhoto}
                    alt="Staff"
                    className="w-24 h-24 rounded-full object-cover mb-2"
                  />
                )}
              </div>

              {}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employee ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.employeeId}
                      onChange={(e) =>
                        setFormData({ ...formData, employeeId: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Designation *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.designation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          designation: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Branch Assignment *
                    </label>
                    {user && user.role === "admin" ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                        {(() => {
                          const userBranch = branches.find(
                            (b) => b._id === user.branchId
                          );
                          if (userBranch) {
                            return `${userBranch.name} (${userBranch.code})`;
                          } else if (user.branchId) {
                            return `Branch ID: ${user.branchId}`;
                          } else {
                            return "No branch assigned";
                          }
                        })()}
                      </div>
                    ) : selectedStaff ? (
                      // When editing a staff member allow chairman to change the branch assignment
                      user && user.role === "chairman" ? (
                        <select
                          required
                          value={formData.branch}
                          onChange={(e) =>
                            setFormData({ ...formData, branch: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select a branch</option>
                          {branches.map((branch) => (
                            <option key={branch._id} value={branch._id}>
                              {branch.name} ({branch.code})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                          {(() => {
                            const currentBranch = branches.find(
                              (b) => b._id === formData.branch
                            );
                            if (currentBranch) {
                              return `${currentBranch.name} (${currentBranch.code})`;
                            } else if (formData.branch) {
                              return `Branch ID: ${formData.branch}`;
                            } else {
                              return "No branch assigned";
                            }
                          })()}
                        </div>
                      )
                    ) : (
                      <select
                        required
                        value={formData.branch}
                        onChange={(e) =>
                          setFormData({ ...formData, branch: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a branch</option>
                        {branches.map((branch) => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name} ({branch.code})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Joining Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.joiningDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          joiningDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Address
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address.street}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            street: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address.city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            city: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address.state}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            state: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address.pincode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            pincode: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Family Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Father's Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fatherName}
                      onChange={(e) =>
                        setFormData({ ...formData, fatherName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mother's Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.motherName}
                      onChange={(e) =>
                        setFormData({ ...formData, motherName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Personal Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marital Status
                    </label>
                    <select
                      value={formData.maritalStatus}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maritalStatus: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="unmarried">Unmarried</option>
                      <option value="married">Married</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grandfather Name
                    </label>
                    <input
                      type="text"
                      value={formData.grandfatherName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          grandfatherName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Aadhar Numbers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Staff Aadhar *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.aadharNumbers.staff}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          aadharNumbers: {
                            ...formData.aadharNumbers,
                            staff: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Father's Aadhar *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.aadharNumbers.father}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          aadharNumbers: {
                            ...formData.aadharNumbers,
                            father: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mother's Aadhar *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.aadharNumbers.mother}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          aadharNumbers: {
                            ...formData.aadharNumbers,
                            mother: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Children Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Boys (count)
                    </label>
                    <input
                      type="number"
                      value={formData.children?.boysCount || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          children: {
                            ...(formData.children || {}),
                            boysCount: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Boys Names (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={(formData.children?.boysNames ?? []).join(", ")}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          children: {
                            ...(formData.children || {
                              boysCount: 0,
                              girlsCount: 0,
                              boysNames: [],
                              girlsNames: [],
                            }),
                            boysNames: e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Girls (count)
                    </label>
                    <input
                      type="number"
                      value={formData.children?.girlsCount || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          children: {
                            ...(formData.children || {}),
                            girlsCount: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Girls Names (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={(formData.children?.girlsNames ?? []).join(", ")}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          children: {
                            ...(formData.children || {
                              boysCount: 0,
                              girlsCount: 0,
                              boysNames: [],
                              girlsNames: [],
                            }),
                            girlsNames: e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Education
                  </h3>
                  <button
                    type="button"
                    onClick={addEducationEntry}
                    className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                  >
                    Add Education
                  </button>
                </div>
              </div>

              {}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Education: Class/Subject
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Add education entries and subjects with marks for each entry.
                </p>
                <div className="space-y-4">
                  {(formData.education || []).map((edu: any, eIdx: number) => (
                    <div key={eIdx} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="Degree / Class (e.g. 12th Science, B.Com)"
                          value={edu.degree || ""}
                          onChange={(ev) =>
                            updateEducationField(
                              eIdx,
                              "degree",
                              ev.target.value
                            )
                          }
                          className="px-3 py-2 border rounded"
                        />
                        <input
                          type="text"
                          placeholder="Institution"
                          value={edu.institution || ""}
                          onChange={(ev) =>
                            updateEducationField(
                              eIdx,
                              "institution",
                              ev.target.value
                            )
                          }
                          className="px-3 py-2 border rounded"
                        />
                        <input
                          type="number"
                          placeholder="Year"
                          value={edu.year || ""}
                          onChange={(ev) =>
                            updateEducationField(
                              eIdx,
                              "year",
                              ev.target.value
                                ? Number(ev.target.value)
                                : undefined
                            )
                          }
                          className="px-3 py-2 border rounded"
                        />
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Subjects & Marks</h4>
                          <div className="space-x-2">
                            <button
                              type="button"
                              onClick={() => addSubjectEntry(eIdx)}
                              className="text-sm text-primary hover:underline"
                            >
                              + Add Subject
                            </button>
                            {(formData.education || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeEducationEntry(eIdx)}
                                className="text-sm text-red-600 hover:underline"
                              >
                                Remove Education
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2 mt-2">
                          {(edu.subjects || []).map(
                            (sub: any, sIdx: number) => (
                              <div
                                key={sIdx}
                                className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center"
                              >
                                <input
                                  type="text"
                                  placeholder="Subject name"
                                  value={sub.name || ""}
                                  onChange={(ev) =>
                                    updateSubjectEntry(
                                      eIdx,
                                      sIdx,
                                      "name",
                                      ev.target.value
                                    )
                                  }
                                  className="px-3 py-2 border rounded"
                                />
                                <input
                                  type="number"
                                  placeholder="Marks"
                                  value={sub.marks ?? ""}
                                  onChange={(ev) =>
                                    updateSubjectEntry(
                                      eIdx,
                                      sIdx,
                                      "marks",
                                      ev.target.value
                                        ? Number(ev.target.value)
                                        : undefined
                                    )
                                  }
                                  className="px-3 py-2 border rounded"
                                />
                                <div className="md:col-span-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeSubjectEntry(eIdx, sIdx)
                                    }
                                    className="text-sm text-red-600 hover:underline"
                                  >
                                    Remove Subject
                                  </button>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={addEducationEntry}
                    className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                  >
                    + Add Education
                  </button>
                </div>
              </div>
              {}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Experience: Previous Workplaces
                  </h3>
                  <button
                    type="button"
                    onClick={addExperienceEntry}
                    className="text-sm text-primary hover:underline"
                  >
                    + Add Experience
                  </button>
                </div>
                <div className="space-y-4">
                  {(formData.experience || []).map((exp: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          value={exp.company || ""}
                          onChange={(e) =>
                            updateExperienceEntry(
                              idx,
                              "company",
                              e.target.value
                            )
                          }
                          placeholder="Company"
                          className="px-3 py-2 border rounded"
                        />
                        <input
                          value={exp.role || ""}
                          onChange={(e) =>
                            updateExperienceEntry(idx, "role", e.target.value)
                          }
                          placeholder="Role/Position"
                          className="px-3 py-2 border rounded"
                        />
                        <input
                          value={exp.location || ""}
                          onChange={(e) =>
                            updateExperienceEntry(
                              idx,
                              "location",
                              e.target.value
                            )
                          }
                          placeholder="Location"
                          className="px-3 py-2 border rounded"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                        <input
                          type="date"
                          value={exp.startDate || ""}
                          onChange={(e) =>
                            updateExperienceEntry(
                              idx,
                              "startDate",
                              e.target.value
                            )
                          }
                          className="px-3 py-2 border rounded"
                        />
                        <input
                          type="date"
                          value={exp.endDate || ""}
                          onChange={(e) =>
                            updateExperienceEntry(
                              idx,
                              "endDate",
                              e.target.value
                            )
                          }
                          className="px-3 py-2 border rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeExperienceEntry(idx)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                      <textarea
                        value={exp.description || ""}
                        onChange={(e) =>
                          updateExperienceEntry(
                            idx,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Description / responsibilities"
                        className="w-full mt-3 px-3 py-2 border rounded"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </div>
              {}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Contact Numbers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Staff Contact *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.contacts.staff}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contacts: {
                            ...formData.contacts,
                            staff: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Father's Contact *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.contacts.father}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contacts: {
                            ...formData.contacts,
                            father: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mother's Contact *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.contacts.mother}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contacts: {
                            ...formData.contacts,
                            mother: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Login Credentials
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password {selectedStaff ? "" : "*"}
                    </label>
                    <input
                      type="password"
                      required={!selectedStaff}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={
                        selectedStaff
                          ? "Leave blank to keep current password"
                          : ""
                      }
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Referred By
                    </label>
                    <input
                      type="text"
                      value={formData.referredBy}
                      onChange={(e) =>
                        setFormData({ ...formData, referredBy: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Employment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Staff Type *
                    </label>
                    <select
                      required
                      value={formData.staffType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          staffType: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="per_day">Per Day</option>
                      <option value="per_task">Per Task</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Basic Salary *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.salary.basic}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          salary: {
                            ...formData.salary,
                            basic: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allowances
                    </label>
                    <input
                      type="number"
                      value={formData.salary.allowances}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          salary: {
                            ...formData.salary,
                            allowances: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedStaff(null);
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
                  {selectedStaff ? "Update Staff" : "Add Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {attendanceModalStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Attendance History - {attendanceModalStaff.name}
              </h2>
              <button
                onClick={() => {
                  setAttendanceModalStaff(null);
                  setAttendanceHistory([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {attendanceLoading ? (
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            ) : attendanceHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                No attendance records found.
              </div>
            ) : (
              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2">Date</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Check In</th>
                    <th className="p-2">Check Out</th>
                    <th className="p-2">Working Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.map((att, idx) => (
                    <tr key={att._id || idx}>
                      <td className="p-2">
                        {new Date(att.date).toLocaleDateString()}
                      </td>
                      <td className="p-2">{att.status}</td>
                      <td className="p-2">
                        {att.checkIn?.time
                          ? new Date(att.checkIn.time).toLocaleTimeString()
                          : "-"}
                      </td>
                      <td className="p-2">
                        {att.checkOut?.time
                          ? new Date(att.checkOut.time).toLocaleTimeString()
                          : "-"}
                      </td>
                      <td className="p-2">{att.workingHours ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
