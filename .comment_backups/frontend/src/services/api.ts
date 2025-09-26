import axios from 'axios';

// Common interfaces
interface CompanyData {
  name: string;
  address: string;
  phone: string;
  email: string;
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

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3500/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle errors
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

// Auth API calls
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

export const companyAPI = {
  getCompanies: async () => {
    const response = await api.get('/branches');
    return response.data;
  },
  getCompany: async (id: string) => {
    const response = await api.get(`/branches/${id}`);
    return response.data;
  },
  
  createCompany: async (companyData: CompanyData) => {
    const response = await api.post('/branches', companyData);
    return response.data;
  },
  
  updateCompany: async (id: string, companyData: CompanyData) => {
    const response = await api.put(`/branches/${id}`, companyData);
    return response.data;
  },
  
  deleteCompany: async (id: string) => {
  const response = await api.delete(`/branches/${id}`);
  return response.data;
  },
  
  getCompanyStats: async () => {
    const response = await api.get('/branches/stats');
    return response.data;
  },
};

export const branchAPI = {
  getBranches: async (params?: QueryParams) => {
    const response = await api.get('/branches', { params });
    return response.data;
  }
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

// Staff API calls
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
};

// Attendance API calls
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
  
  checkIn: async (checkInData: any) => {
    const response = await api.post('/attendance/checkin', checkInData);
    return response.data;
  },
  
  checkOut: async (checkOutData: any) => {
    const response = await api.post('/attendance/checkout', checkOutData);
    return response.data;
  },
  
  markAttendanceManually: async (attendanceData: any) => {
    const response = await api.post('/attendance/manual', attendanceData);
    return response.data;
  },
  
  updateAttendance: async (id: string, attendanceData: any) => {
    const response = await api.put(`/attendance/${id}`, attendanceData);
    return response.data;
  },
  
  deleteAttendance: async (id: string) => {
    const response = await api.delete(`/attendance/${id}`);
    return response.data;
  },
  
  getAttendanceSummary: async (params?: any) => {
    const response = await api.get('/attendance/summary', { params });
    return response.data;
  },
};

// Client API calls
export const clientAPI = {
  getClients: async (params?: any) => {
    const response = await api.get('/clients', { params });
    return response.data;
  },
  
  getClient: async (id: string) => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },
  
  createClient: async (clientData: any) => {
    const response = await api.post('/clients', clientData);
    return response.data;
  },
  
  updateClient: async (id: string, clientData: any) => {
    const response = await api.put(`/clients/${id}`, clientData);
    return response.data;
  },
  
  deleteClient: async (id: string) => {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  },
  
  getClientBookings: async (id: string, params?: any) => {
    const response = await api.get(`/clients/${id}/bookings`, { params });
    return response.data;
  },
  
  getClientQuotations: async (id: string, params?: any) => {
    const response = await api.get(`/clients/${id}/quotations`, { params });
    return response.data;
  },
  
  getClientInvoices: async (id: string, params?: any) => {
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

// Booking API calls
export const bookingAPI = {
  getBookings: async (params?: any) => {
    const response = await api.get('/bookings', { params });
    return response.data;
  },
  getBookingsForStaff: async (staffId: string, params?: any) => {
    const response = await api.get(`/bookings/staff/${staffId}`, { params });
    return response.data;
  },
  getBooking: async (id: string) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },
  createBooking: async (bookingData: any) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },
  updateBooking: async (id: string, bookingData: any) => {
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

// Rental API calls
export const rentalAPI = {
  getRentals: async (params?: any) => {
    const response = await api.get('/rentals', { params });
    return response.data;
  },
  
  getRental: async (id: string) => {
    const response = await api.get(`/rentals/${id}`);
    return response.data;
  },
  
  createRental: async (rentalData: any) => {
    const response = await api.post('/rentals', rentalData);
    return response.data;
  },
  
  updateRental: async (id: string, rentalData: any) => {
    const response = await api.put(`/rentals/${id}`, rentalData);
    return response.data;
  },
  
  deleteRental: async (id: string) => {
    const response = await api.delete(`/rentals/${id}`);
    return response.data;
  },
  
  getRentalStats: async (params?: any) => {
    const response = await api.get('/rentals/stats', { params });
    return response.data;
  },
  
  getOverdueRentals: async (params?: any) => {
    const response = await api.get('/rentals/overdue', { params });
    return response.data;
  }
};

export const notificationAPI = {
  getNotifications: async (params?: any) => {
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
  
  sendManualNotification: async (notificationData: any) => {
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
  getTasks: async (params?: any) => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },
  
  getTask: async (id: string) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },
  
  createTask: async (taskData: any) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },
  
  updateTask: async (id: string, taskData: any) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },
  
  autoAssignTasks: async (bookingId: string) => {
    const response = await api.post(`/tasks/auto-assign/${bookingId}`);
    return response.data;
  },
  
  assignStaffToTask: async (taskId: string, assignmentData: any) => {
    const response = await api.post(`/tasks/${taskId}/assign`, assignmentData);
    return response.data;
  },
  
  skipTask: async (taskId: string, reason: string) => {
    const response = await api.post(`/tasks/${taskId}/skip`, { reason });
    return response.data;
  },
  
  completeTask: async (taskId: string, completionData: any) => {
    const response = await api.post(`/tasks/${taskId}/complete`, completionData);
    return response.data;
  },
  
  getMyTasks: async (params?: any) => {
    const response = await api.get('/tasks/my-tasks', { params });
    return response.data;
  },
  
  getTaskStats: async () => {
    const response = await api.get('/tasks/stats');
    return response.data;
  }
};

export const quotationAPI = {
  getQuotations: async (params?: any) => {
    const response = await api.get('/quotations', { params });
    return response.data;
  },
  
  getQuotation: async (id: string) => {
    const response = await api.get(`/quotations/${id}`);
    return response.data;
  },
  
  createQuotation: async (quotationData: any) => {
    const response = await api.post('/quotations', quotationData);
    return response.data;
  },
  
  updateQuotation: async (id: string, quotationData: any) => {
    const response = await api.put(`/quotations/${id}`, quotationData);
    return response.data;
  },
  
  deleteQuotation: async (id: string) => {
    const response = await api.delete(`/quotations/${id}`);
    return response.data;
  },
  downloadQuotationPdf: async (id: string) => {
    const response = await api.get(`/quotations/${id}/pdf`, { responseType: 'blob' });
    return response.data;
  },
  
  convertToBooking: async (id: string) => {
    const response = await api.post(`/quotations/${id}/convert-to-booking`);
    return response.data;
  },
  
  sendFollowUp: async (id: string) => {
    const response = await api.post(`/quotations/${id}/follow-up`);
    return response.data;
  },
  
  getQuotationStats: async () => {
    const response = await api.get('/quotations/stats');
    return response.data;
  }
};

// Daily Expenses API calls
export const dailyExpensesAPI = {
  getExpenses: async (params?: any) => {
    const response = await api.get('/daily-expenses', { params });
    return response.data;
  },
  
  getExpense: async (id: string) => {
    const response = await api.get(`/daily-expenses/${id}`);
    return response.data;
  },
  
  createExpense: async (expenseData: any) => {
    const response = await api.post('/daily-expenses', expenseData);
    return response.data;
  },
  
  updateExpense: async (id: string, expenseData: any) => {
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
};

// Vendor API calls
export const vendorAPI = {
  getVendors: async (params?: any) => {
    const response = await api.get('/vendors', { params });
    return response.data;
  },
  
  getVendor: async (id: string) => {
    const response = await api.get(`/vendors/${id}`);
    return response.data;
  },
  
  createVendor: async (vendorData: any) => {
    const response = await api.post('/vendors', vendorData);
    return response.data;
  },
  
  updateVendor: async (id: string, vendorData: any) => {
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

// Analytics API calls
export const analyticsAPI = {
  getDashboardData: async (params?: any) => {
    const response = await api.get('/analytics/dashboard', { params });
    return response.data;
  },
  
  getRevenueAnalytics: async (params?: any) => {
    const response = await api.get('/analytics/revenue', { params });
    return response.data;
  },
  
  getOperationalAnalytics: async (params?: any) => {
    const response = await api.get('/analytics/operations', { params });
    return response.data;
  },
  
  getClientAnalytics: async (params?: any) => {
    const response = await api.get('/analytics/clients', { params });
    return response.data;
  },
  
  getTeamAnalytics: async (params?: any) => {
    const response = await api.get('/analytics/team', { params });
    return response.data;
  },
  
  getMarketingAnalytics: async (params?: any) => {
    const response = await api.get('/analytics/marketing', { params });
    return response.data;
  },
  
  getForecastingData: async (params?: any) => {
    const response = await api.get('/analytics/forecasting', { params });
    return response.data;
  },
  
  exportAnalytics: async (type: string, params?: any) => {
    const response = await api.get(`/analytics/export/${type}`, { params });
    return response.data;
  }
};

// Finance & Expenses API
export const expenseAPI = {
  getExpenses: async (params?: any) => {
    const response = await api.get('/expenses', { params });
    return response.data;
  },
  getFinanceAnalytics: async (params?: any) => {
    const response = await api.get('/expenses/analytics', { params });
    return response.data;
  }
};

// Phase 3 - AI API calls
export const aiAPI = {
  getInsights: async (params?: any) => {
    const response = await api.get('/ai/insights', { params });
    return response.data;
  },
  
  getPredictions: async (params?: any) => {
    const response = await api.get('/ai/predictions', { params });
    return response.data;
  },
  
  generateInsights: async (data: any) => {
    const response = await api.post('/ai/generate', data);
    return response.data;
  },
  
  getRecommendations: async (params?: any) => {
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

// Mobile App API calls
export const mobileAPI = {
  getFeatures: async (params?: any) => {
    const response = await api.get('/mobile/features', { params });
    return response.data;
  },
  
  getAnalytics: async () => {
    const response = await api.get('/mobile/analytics');
    return response.data;
  },
  
  updateFeature: async (id: string, data: any) => {
    const response = await api.put(`/mobile/features/${id}`, data);
    return response.data;
  },
  
  getDeviceStats: async () => {
    const response = await api.get('/mobile/device-stats');
    return response.data;
  },
  
  generateQR: async (data?: any) => {
    const response = await api.post('/mobile/generate-qr', data);
    return response.data;
  },
  
  deployUpdate: async (data: any) => {
    const response = await api.post('/mobile/deploy', data);
    return response.data;
  },
  
  getFeedback: async (params?: any) => {
    const response = await api.get('/mobile/feedback', { params });
    return response.data;
  },
  
  getPerformance: async () => {
    const response = await api.get('/mobile/performance');
    return response.data;
  }
};

// Automation API calls
export const automationAPI = {
  getRules: async (params?: any) => {
    const response = await api.get('/automation/rules', { params });
    return response.data;
  },
  
  createRule: async (data: any) => {
    const response = await api.post('/automation/rules', data);
    return response.data;
  },
  
  updateRule: async (id: string, data: any) => {
    const response = await api.put(`/automation/rules/${id}`, data);
    return response.data;
  },
  
  toggleRule: async (id: string) => {
    const response = await api.post(`/automation/rules/${id}/toggle`);
    return response.data;
  },
  
  getTemplates: async (params?: any) => {
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

// Integration API calls
export const integrationAPI = {
  getIntegrations: async (params?: any) => {
    const response = await api.get('/integrations', { params });
    return response.data;
  },
  
  createIntegration: async (data: any) => {
    const response = await api.post('/integrations', data);
    return response.data;
  },
  
  updateIntegration: async (id: string, data: any) => {
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
  
  getApiEndpoints: async (params?: any) => {
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
  
  getWebhooks: async (params?: any) => {
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