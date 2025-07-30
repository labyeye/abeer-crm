import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:3500/api',
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
    const response = await api.post('/auth/login', { email, password });
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
    const response = await api.get('/companies');
    return response.data;
  },
  
  getCompany: async (id: string) => {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },
  
  createCompany: async (companyData: any) => {
    const response = await api.post('/companies', companyData);
    return response.data;
  },
  
  updateCompany: async (id: string, companyData: any) => {
    const response = await api.put(`/companies/${id}`, companyData);
    return response.data;
  },
  
  deleteCompany: async (id: string) => {
    const response = await api.delete(`/companies/${id}`);
    return response.data;
  },
  
  getCompanyStats: async () => {
    const response = await api.get('/companies/stats');
    return response.data;
  },
};

export const inventoryAPI = {
  getInventory: async (params?: any) => {
    const response = await api.get('/inventory', { params });
    return response.data;
  },
  
  getInventoryItem: async (id: string) => {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },
  
  createInventoryItem: async (itemData: any) => {
    const response = await api.post('/inventory', itemData);
    return response.data;
  },
  
  updateInventoryItem: async (id: string, itemData: any) => {
    const response = await api.put(`/inventory/${id}`, itemData);
    return response.data;
  },
  
  deleteInventoryItem: async (id: string) => {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  },
  
  updateQuantity: async (id: string, quantityData: any) => {
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
  getStaff: async (params?: any) => {
    const response = await api.get('/staff', { params });
    return response.data;
  },
  
  getStaffMember: async (id: string) => {
    const response = await api.get(`/staff/${id}`);
    return response.data;
  },
  
  createStaff: async (staffData: any) => {
    const response = await api.post('/staff', staffData);
    return response.data;
  },
  
  updateStaff: async (id: string, staffData: any) => {
    const response = await api.put(`/staff/${id}`, staffData);
    return response.data;
  },
  
  deleteStaff: async (id: string) => {
    const response = await api.delete(`/staff/${id}`);
    return response.data;
  },
  
  getStaffAttendance: async (id: string, params?: any) => {
    const response = await api.get(`/staff/${id}/attendance`, { params });
    return response.data;
  },
  
  getStaffPerformance: async (id: string, params?: any) => {
    const response = await api.get(`/staff/${id}/performance`, { params });
    return response.data;
  },
  
  updateStaffPerformance: async (id: string, performanceData: any) => {
    const response = await api.put(`/staff/${id}/performance`, performanceData);
    return response.data;
  },
  
  getStaffSalary: async (id: string, params?: any) => {
    const response = await api.get(`/staff/${id}/salary`, { params });
    return response.data;
  },
};

// Attendance API calls
export const attendanceAPI = {
  getAttendance: async (params?: any) => {
    const response = await api.get('/attendance', { params });
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

export default api; 