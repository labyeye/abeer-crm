import axios from 'axios';


interface BranchAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface BranchData {
  name: string;
  address: BranchAddress | string;
  phone: string;
  email: string;  // Primary identifier for the branch
  code?: string;
  website?: string;
  industry?: string;
  foundedYear?: number;
  employeeCount?: number;
  // revenue can be a legacy number or a breakdown object { total, invoices, bookings, quotations }
  revenue?: number | { total: number; invoices?: number; bookings?: number; quotations?: number };
  description?: string;
  gstNumber?: string;
  password?: string;
  [key: string]: unknown;
}

interface InventoryItem {
  name: string;
  category: string;
  quantity: number;
  price: number;
  [key: string]: unknown;
}

interface StaffData {
  name: string;
  email: string;
  phone: string;
  designation: string;
  [key: string]: unknown;
}

interface QueryParams {
  [key: string]: unknown;
}


const VITE_API_URL = (import.meta as unknown as { env?: { VITE_API_URL?: string } })?.env?.VITE_API_URL;

// general API data bag type used for untyped request bodies
type APIData = Record<string, unknown>;

const api = axios.create({
  baseURL: VITE_API_URL || 'https://abeer-crm-44fd.vercel.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


export const authAPI = {
  login: async (email: string, password: string) => {
    console.log('🚀 Frontend: Attempting login for:', email);
    const response = await api.post('/auth/login', { email, password });
    console.log('✅ Frontend: Login response received:', response.data);
    return response.data;
  },
  
  register: async (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const branchAPI = {
  getBranches: async (params?: QueryParams) => {
    const response = await api.get('/branches', { params });
    return response.data;
  },
  getBranch: async (id: string) => {
    const response = await api.get(`/branches/${id}`);
    return response.data;
  },
  
  createBranch: async (branchData: BranchData) => {
    const response = await api.post('/branches', branchData);
    return response.data;
  },
  
  updateBranch: async (id: string, branchData: BranchData) => {
    const response = await api.put(`/branches/${id}`, branchData);
    return response.data;
  },
  
  deleteBranch: async (id: string) => {
    const response = await api.delete(`/branches/${id}`);
    return response.data;
  },
  
  getBranchStats: async () => {
    const response = await api.get('/branches/stats');
    return response.data;
  },
};

export const inventoryAPI = {
  getInventory: async (params?: QueryParams) => {
    const response = await api.get('/inventory', { params });
    return response.data;
  },
  
  getInventoryItem: async (id: string) => {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },
  
  createInventoryItem: async (itemData: InventoryItem) => {
    const response = await api.post('/inventory', itemData);
    return response.data;
  },
  
  updateInventoryItem: async (id: string, itemData: InventoryItem) => {
    const response = await api.put(`/inventory/${id}`, itemData);
    return response.data;
  },
  
  deleteInventoryItem: async (id: string) => {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  },
  
  updateQuantity: async (id: string, quantityData: { quantity: number; [key: string]: unknown }) => {
    const response = await api.patch(`/inventory/${id}/quantity`, quantityData);
    return response.data;
  },
  
  getInventoryStats: async () => {
    const response = await api.get('/inventory/stats');
    return response.data;
  },
  
  searchInventory: async (query: string) => {
    const response = await api.get('/inventory/search', { params: { q: query } });
    return response.data;
  },
};


export const staffAPI = {
  getStaff: async (params?: QueryParams) => {
    const response = await api.get('/staff', { params });
    return response.data;
  },
  
  getStaffMember: async (id: string) => {
    const response = await api.get(`/staff/${id}`);
    return response.data;
  },
  
  createStaff: async (staffData: StaffData) => {
    const response = await api.post('/staff', staffData);
    return response.data;
  },
  
  updateStaff: async (id: string, staffData: StaffData) => {
    const response = await api.put(`/staff/${id}`, staffData);
    return response.data;
  },
  
  deleteStaff: async (id: string) => {
    const response = await api.delete(`/staff/${id}`);
    return response.data;
  },
  
  getStaffAttendance: async (id: string, params?: QueryParams) => {
    const response = await api.get(`/staff/${id}/attendance`, { params });
    return response.data;
  },
  
  getStaffPerformance: async (id: string, params?: QueryParams) => {
    const response = await api.get(`/staff/${id}/performance`, { params });
    return response.data;
  },
  
  updateStaffPerformance: async (id: string, performanceData: { [key: string]: unknown }) => {
    const response = await api.put(`/staff/${id}/performance`, performanceData);
    return response.data;
  },
  
  getStaffSalary: async (id: string, params?: QueryParams) => {
    const response = await api.get(`/staff/${id}/salary`, { params });
    return response.data;
  },
  createStaffSalary: async (id: string, salaryData?: QueryParams) => {
    const response = await api.post(`/staff/${id}/salary`, salaryData);
    return response.data;
  },
};

export const advanceAPI = {
  createAdvanceForStaff: async (staffId: string, advanceData?: QueryParams) => {
    const response = await api.post(`/advances/staff/${staffId}`, advanceData);
    return response.data;
  },
  listAdvancesForStaff: async (staffId: string) => {
    const response = await api.get(`/advances/staff/${staffId}`);
    return response.data;
  }
};


export const attendanceAPI = {
  getAttendance: async (params?: QueryParams) => {
    const response = await api.get('/attendance', { params });
    return response.data;
  },

  getMyAttendance: async (params?: QueryParams) => {
    const response = await api.get('/attendance/my-attendance', { params });
    return response.data;
  },
  
  getAttendanceRecord: async (id: string) => {
    const response = await api.get(`/attendance/${id}`);
    return response.data;
  },
  
  checkIn: async (checkInData: APIData) => {
    const response = await api.post('/attendance/checkin', checkInData);
    return response.data;
  },
  
  checkOut: async (checkOutData: APIData) => {
    const response = await api.post('/attendance/checkout', checkOutData);
    return response.data;
  },

  markAttendanceManually: async (attendanceData: APIData) => {
    const response = await api.post('/attendance/manual', attendanceData);
    return response.data;
  },

  updateAttendance: async (id: string, attendanceData: APIData) => {
    const response = await api.put(`/attendance/${id}`, attendanceData);
    return response.data;
  },

  deleteAttendance: async (id: string) => {
    const response = await api.delete(`/attendance/${id}`);
    return response.data;
  },
  
  getAttendanceSummary: async (params?: QueryParams) => {
    const response = await api.get('/attendance/summary', { params });
    return response.data;
  },
};


export const clientAPI = {
  getClients: async (params?: QueryParams) => {
    const response = await api.get('/clients', { params });
    return response.data;
  },
  
  getClient: async (id: string) => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },
  
  createClient: async (clientData: APIData) => {
    const response = await api.post('/clients', clientData);
    return response.data;
  },
  
  updateClient: async (id: string, clientData: APIData) => {
    const response = await api.put(`/clients/${id}`, clientData);
    return response.data;
  },
  
  deleteClient: async (id: string) => {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  },
  
  getClientBookings: async (id: string, params?: QueryParams) => {
    const response = await api.get(`/clients/${id}/bookings`, { params });
    return response.data;
  },
  getClientInvoices: async (id: string, params?: QueryParams) => {
    const response = await api.get(`/clients/${id}/invoices`, { params });
    return response.data;
  },
  
  getClientSummary: async (id: string) => {
    const response = await api.get(`/clients/${id}/summary`);
    return response.data;
  },
  
  searchClients: async (query: string) => {
    const response = await api.get(`/clients/search/${query}`);
    return response.data;
  },
};


export const bookingAPI = {
  getBookings: async (params?: QueryParams) => {
    const response = await api.get('/bookings', { params });
    return response.data;
  },
  getBookingsForStaff: async (staffId: string, params?: QueryParams) => {
    const response = await api.get(`/bookings/staff/${staffId}`, { params });
    return response.data;
  },
  getBooking: async (id: string) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },
  createBooking: async (bookingData: APIData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },
  updateBooking: async (id: string, bookingData: APIData) => {
    const response = await api.put(`/bookings/${id}`, bookingData);
    return response.data;
  },
  updateBookingStatus: async (id: string, status: string) => {
    const response = await api.put(`/bookings/${id}/status`, { status });
    return response.data;
  },
  deleteBooking: async (id: string) => {
    const response = await api.delete(`/bookings/${id}`);
    return response.data;
  },
};

export const paymentAPI = {
  createPayment: async (paymentData: APIData) => {
    const response = await api.post('/payments', paymentData);
    return response.data;
  },
  getPayments: async (params?: QueryParams) => {
    const response = await api.get('/payments', { params });
    return response.data;
  },
  getClientBookings: async (clientId: string) => {
    const response = await api.get(`/payments/client/${clientId}/bookings`);
    return response.data;
  }
  ,
  updatePayment: async (id: string, data: APIData) => {
    const response = await api.put(`/payments/${id}`, data);
    return response.data;
  },
  deletePayment: async (id: string) => {
    const response = await api.delete(`/payments/${id}`);
    return response.data;
  }
};


export const rentalAPI = {
  getRentals: async (params?: QueryParams) => {
    const response = await api.get('/rentals', { params });
    return response.data;
  },
  
  getRental: async (id: string) => {
    const response = await api.get(`/rentals/${id}`);
    return response.data;
  },
  
    createRental: async (rentalData: APIData) => {
    const response = await api.post('/rentals', rentalData);
    return response.data;
  },
  
    updateRental: async (id: string, rentalData: APIData) => {
    const response = await api.put(`/rentals/${id}`, rentalData);
    return response.data;
  },
  
  deleteRental: async (id: string) => {
    const response = await api.delete(`/rentals/${id}`);
    return response.data;
  },
  
  getRentalStats: async (params?: QueryParams) => {
    const response = await api.get('/rentals/stats', { params });
    return response.data;
  },
  
  getOverdueRentals: async (params?: QueryParams) => {
    const response = await api.get('/rentals/overdue', { params });
    return response.data;
  }
};

export const notificationAPI = {
  getNotifications: async (params?: QueryParams) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },
  
  getNotificationStats: async () => {
    const response = await api.get('/notifications/stats');
    return response.data;
  },
  
  markAsRead: async (id: string) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },
  
  sendManualNotification: async (notificationData: APIData) => {
    const response = await api.post('/notifications/send', notificationData);
    return response.data;
  },
  
  accessSmartLink: async (token: string) => {
    const response = await api.get(`/notifications/link/${token}`);
    return response.data;
  },
  
  previewSmartLink: async (token: string) => {
    const response = await api.get(`/notifications/preview/${token}`);
    return response.data;
  }
};

export const taskAPI = {
  getTasks: async (params?: QueryParams) => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },
  
  getTask: async (id: string) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },
  
  createTask: async (taskData: APIData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },
  
  updateTask: async (id: string, taskData: APIData) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },
  
  autoAssignTasks: async (bookingId: string) => {
    const response = await api.post(`/tasks/auto-assign/${bookingId}`);
    return response.data;
  },
  
  assignStaffToTask: async (taskId: string, assignmentData: APIData) => {
    const response = await api.post(`/tasks/${taskId}/assign`, assignmentData);
    return response.data;
  },
  
  skipTask: async (taskId: string, reason: string) => {
    const response = await api.post(`/tasks/${taskId}/skip`, { reason });
    return response.data;
  },
  
  completeTask: async (taskId: string, completionData: APIData) => {
    const response = await api.post(`/tasks/${taskId}/complete`, completionData);
    return response.data;
  },
  
  getMyTasks: async (params?: QueryParams) => {
    const response = await api.get('/tasks/my-tasks', { params });
    return response.data;
  },
  
  getTaskStats: async () => {
    const response = await api.get('/tasks/stats');
    return response.data;
  }
};


export const dailyExpensesAPI = {
  getExpenses: async (params?: QueryParams) => {
    const response = await api.get('/daily-expenses', { params });
    return response.data;
  },
  
  getExpense: async (id: string) => {
    const response = await api.get(`/daily-expenses/${id}`);
    return response.data;
  },
  
  createExpense: async (expenseData: APIData) => {
    const response = await api.post('/daily-expenses', expenseData);
    return response.data;
  },
  
  updateExpense: async (id: string, expenseData: APIData) => {
    const response = await api.put(`/daily-expenses/${id}`, expenseData);
    return response.data;
  },
  
  deleteExpense: async (id: string) => {
    const response = await api.delete(`/daily-expenses/${id}`);
    return response.data;
  },
  
  getDailyExpensesStats: async () => {
    const response = await api.get('/daily-expenses/stats');
    return response.data;
  }
  ,
  getPurposes: async () => {
    const response = await api.get('/daily-expenses/purposes');
    return response.data;
  },
  createPurpose: async (payload: { name: string }) => {
    const response = await api.post('/daily-expenses/purposes', payload);
    return response.data;
  }
  ,
  updatePurpose: async (id: string, payload: { name: string }) => {
    const response = await api.put(`/daily-expenses/purposes/${id}`, payload);
    return response.data;
  }
};


export const vendorAPI = {
  getVendors: async (params?: QueryParams) => {
    const response = await api.get('/vendors', { params });
    return response.data;
  },
  
  getVendor: async (id: string) => {
    const response = await api.get(`/vendors/${id}`);
    return response.data;
  },
  
  createVendor: async (vendorData: APIData) => {
    const response = await api.post('/vendors', vendorData);
    return response.data;
  },
  
  updateVendor: async (id: string, vendorData: APIData) => {
    const response = await api.put(`/vendors/${id}`, vendorData);
    return response.data;
  },
  
  deleteVendor: async (id: string) => {
    const response = await api.delete(`/vendors/${id}`);
    return response.data;
  },
  
  updateVendorRating: async (id: string, rating: number) => {
    const response = await api.put(`/vendors/${id}/rating`, { rating });
    return response.data;
  },
  
  getVendorStats: async () => {
    const response = await api.get('/vendors/stats');
    return response.data;
  }
};


export const analyticsAPI = {
  getDashboardData: async (params?: QueryParams) => {
    const response = await api.get('/analytics/dashboard', { params });
    return response.data;
  },
  
  getRevenueAnalytics: async (params?: QueryParams) => {
    const response = await api.get('/analytics/revenue', { params });
    return response.data;
  },
  getOperationalAnalytics: async (params?: QueryParams) => {
    const response = await api.get('/analytics/operations', { params });
    return response.data;
  },
  getClientAnalytics: async (params?: QueryParams) => {
    const response = await api.get('/analytics/clients', { params });
    return response.data;
  },
  getTeamAnalytics: async (params?: QueryParams) => {
    const response = await api.get('/analytics/team', { params });
    return response.data;
  },
  getMarketingAnalytics: async (params?: QueryParams) => {
    const response = await api.get('/analytics/marketing', { params });
    return response.data;
  },
  getForecastingData: async (params?: QueryParams) => {
    const response = await api.get('/analytics/forecasting', { params });
    return response.data;
  },
  
  exportAnalytics: async (type: string, params?: QueryParams) => {
    const response = await api.get(`/analytics/export/${type}`, { params });
    return response.data;
  }
};


export const expenseAPI = {
  getExpenses: async (params?: QueryParams) => {
    const response = await api.get('/expenses', { params });
    return response.data;
  },
  getFinanceAnalytics: async (params?: QueryParams) => {
    const response = await api.get('/expenses/analytics', { params });
    return response.data;
  }
};


export const aiAPI = {
  getInsights: async (params?: QueryParams) => {
    const response = await api.get('/ai/insights', { params });
    return response.data;
  },

  getPredictions: async (params?: QueryParams) => {
    const response = await api.get('/ai/predictions', { params });
    return response.data;
  },

  generateInsights: async (data: APIData) => {
    const response = await api.post('/ai/generate', data);
    return response.data;
  },

  getRecommendations: async (params?: QueryParams) => {
    const response = await api.get('/ai/recommendations', { params });
    return response.data;
  },

  implementRecommendation: async (id: string) => {
    const response = await api.post(`/ai/recommendations/${id}/implement`);
    return response.data;
  },

  getAIAnalytics: async () => {
    const response = await api.get('/ai/analytics');
    return response.data;
  }
};


export const mobileAPI = {
  getFeatures: async (params?: QueryParams) => {
    const response = await api.get('/mobile/features', { params });
    return response.data;
  },

  getAnalytics: async () => {
    const response = await api.get('/mobile/analytics');
    return response.data;
  },

  updateFeature: async (id: string, data: APIData) => {
    const response = await api.put(`/mobile/features/${id}`, data);
    return response.data;
  },

  getDeviceStats: async () => {
    const response = await api.get('/mobile/device-stats');
    return response.data;
  },

  generateQR: async (data?: APIData) => {
    const response = await api.post('/mobile/generate-qr', data);
    return response.data;
  },

  deployUpdate: async (data: APIData) => {
    const response = await api.post('/mobile/deploy', data);
    return response.data;
  },

  getFeedback: async (params?: QueryParams) => {
    const response = await api.get('/mobile/feedback', { params });
    return response.data;
  },

  getPerformance: async () => {
    const response = await api.get('/mobile/performance');
    return response.data;
  }
};


export const automationAPI = {
  getRules: async (params?: QueryParams) => {
    const response = await api.get('/automation/rules', { params });
    return response.data;
  },

  createRule: async (data: APIData) => {
    const response = await api.post('/automation/rules', data);
    return response.data;
  },

  updateRule: async (id: string, data: APIData) => {
    const response = await api.put(`/automation/rules/${id}`, data);
    return response.data;
  },

  toggleRule: async (id: string) => {
    const response = await api.post(`/automation/rules/${id}/toggle`);
    return response.data;
  },

  getTemplates: async (params?: QueryParams) => {
    const response = await api.get('/automation/templates', { params });
    return response.data;
  },

  installTemplate: async (id: string) => {
    const response = await api.post(`/automation/templates/${id}/install`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/automation/stats');
    return response.data;
  },

  getAIRecommendations: async () => {
    const response = await api.get('/automation/ai-recommendations');
    return response.data;
  },

  executeRule: async (id: string) => {
    const response = await api.post(`/automation/rules/${id}/execute`);
    return response.data;
  }
};


export const companyAPI = {
  getCompanyInfo: async () => {
    const response = await api.get('/company');
    return response.data;
  },

  updateCompanyInfo: async (data: APIData) => {
    const response = await api.put('/company', data);
    return response.data;
  },

  getCompanyStats: async (params?: QueryParams) => {
    const response = await api.get('/company/stats', { params });
    return response.data;
  },

  getFinancialOverview: async (params?: QueryParams) => {
    const response = await api.get('/company/finance/overview', { params });
    return response.data;
  },

  getBranchStats: async (params?: QueryParams) => {
    const response = await api.get('/company/branch/stats', { params });
    return response.data;
  },

  getEmployeeStats: async (params?: QueryParams) => {
    const response = await api.get('/company/employee/stats', { params });
    return response.data;
  },
};

export const serviceCategoryAPI = {
  getCategories: async (params?: QueryParams) => {
    const response = await api.get('/service-categories', { params });
    return response.data;
  },
  createCategory: async (data: APIData) => {
    const response = await api.post('/service-categories', data);
    return response.data;
  },
  updateCategory: async (id: string, data: APIData) => {
    const response = await api.put(`/service-categories/${id}`, data);
    return response.data;
  },
  deleteCategory: async (id: string) => {
    const response = await api.delete(`/service-categories/${id}`);
    return response.data;
  }
};

export const integrationAPI = {
  getIntegrations: async (params?: QueryParams) => {
    const response = await api.get('/integrations', { params });
    return response.data;
  },

  createIntegration: async (data: APIData) => {
    const response = await api.post('/integrations', data);
    return response.data;
  },

  updateIntegration: async (id: string, data: APIData) => {
    const response = await api.put(`/integrations/${id}`, data);
    return response.data;
  },

  toggleIntegration: async (id: string) => {
    const response = await api.post(`/integrations/${id}/toggle`);
    return response.data;
  },

  syncIntegration: async (id: string) => {
    const response = await api.post(`/integrations/${id}/sync`);
    return response.data;
  },

  getApiEndpoints: async (params?: QueryParams) => {
    const response = await api.get('/integrations/api/endpoints', { params });
    return response.data;
  },

  getApiStats: async () => {
    const response = await api.get('/integrations/api/stats');
    return response.data;
  },

  testEndpoint: async (id: string) => {
    const response = await api.post(`/integrations/api/endpoints/${id}/test`);
    return response.data;
  },

  getWebhooks: async (params?: QueryParams) => {
    const response = await api.get('/integrations/webhooks', { params });
    return response.data;
  },

  testWebhook: async (id: string) => {
    const response = await api.post(`/integrations/webhooks/${id}/test`);
    return response.data;
  },

  getIntegrationStats: async () => {
    const response = await api.get('/integrations/stats');
    return response.data;
  }
};

export default api;