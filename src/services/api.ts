import axios from 'axios';
import { addSchoolIdToParams, getSchoolIdForAdmin } from '@/utils/apiHelpers';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://community-hub-backend-production.up.railway.app/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add a request interceptor to add the auth token
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

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Only redirect to login if it's not already a login request
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login')) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const response = await api.post('/auth/refresh');
        const { token } = response.data.data;
        
        localStorage.setItem('token', token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, then logout
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Use window.location.href to ensure full page reload and clear any state
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

interface School {
  id: string;
  name: string;
}

interface DashboardStats {
  students: number;
  meals: number;
  revenue: number;
  satisfaction: number;
  activities: { title: string; description: string; time: string }[];
}

interface SchoolRevenueData {
  school_id: number;
  school_name: string;
  monthly_revenue: { [key: string]: number };
  yearly_total: number;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

export const getSchools = async (): Promise<ApiResponse<School[]>> => {
  const response = await api.get<ApiResponse<School[]>>('/schools');
  return response.data;
};

export const getDashboardStatistics = async (schoolId: string): Promise<ApiResponse<DashboardStats>> => {
  const response = await api.get<ApiResponse<DashboardStats>>(`/dashboard-stats?school_id=${schoolId}`);
  return response.data;
};

export const getRevenueStatistics = async (year: number): Promise<ApiResponse<SchoolRevenueData[]>> => {
  const response = await api.get<ApiResponse<SchoolRevenueData[]>>(`/schools/revenue-statistics?year=${year}`);
  return response.data;
};

export const adminApi = {
  // Auth endpoints
  login: (data: { email: string; password: string }) => 
    api.post('/auth/login', data),

  // Profile Management (for logged-in admin user)
  getAdminProfile: () => api.get('/admin/profile'),
  updateAdminProfile: (data: any) => api.put('/admin/profile', data),

  // Dashboard Statistics
  getDashboardStats: (schoolId?: number) => 
    api.get('/admin/dashboard/overview', { params: addSchoolIdToParams({ school_id: schoolId }) }),

  // Schools Management
  getSchools: () => api.get('/admin/schools'),
  createSchool: (data: any) => api.post('/admin/schools', data),
  updateSchool: (id: number, data: any) => api.put(`/admin/schools/${id}`, data),
  deleteSchool: (id: number) => api.delete(`/admin/schools/${id}`),

  // Student management
  getUsers: (params?: any) => api.get('/admin/students', { params: addSchoolIdToParams(params) }),
  deleteUser: (id: number) => api.delete(`/admin/students/${id}`),
  createUser: (data: any) => api.post('/admin/students', data),
  updateUser: (id: number, data: any) => api.put(`/admin/students/${id}`, data),
  getUser: (id: number) => api.get(`/admin/students/${id}`),
  adminTopUp: (studentId: number, amount: number) => api.post(`/admin/students/${studentId}/wallet/topup`, { amount }),
  getStudentTransactions: (studentId: number) => api.get(`/admin/students/${studentId}/transactions`),
  adminRefund: (id: number, data: { amount: number; reason?: string }) => api.post(`/admin/students/${id}/wallet/refund`, data),

  // Wallet Management
  getWalletStats: (schoolId?: number) => 
    api.get('/admin/wallet/stats', { params: addSchoolIdToParams({ school_id: schoolId }) }),
  getWalletTransactions: (params?: { school_id?: number; type?: string; start_date?: string; end_date?: string }) => 
    api.get('/admin/wallet/transactions', { params: addSchoolIdToParams(params) }),

  // Meal Management
  getMealStats: (schoolId?: number) => 
    api.get('/admin/meals/stats', { params: addSchoolIdToParams({ school_id: schoolId }) }),
  getMealPlans: (schoolId?: number) => 
    api.get('/admin/meal-plans', { params: addSchoolIdToParams({ school_id: schoolId }) }),
  createMealPlan: (data: any) => api.post('/admin/meal-plans', data),
  updateMealPlan: (id: number, data: any) => api.put(`/admin/meal-plans/${id}`, data),
  deleteMealPlan: (id: number) => api.delete(`/admin/meal-plans/${id}`),
  assignMealsToDates: (id: number, data: any) => api.post(`/admin/meal-plans/${id}/assign-meals-to-dates`, data),
  uploadMealPlanPdf: (id: number, formData: FormData) => api.post(`/admin/meal-plans/${id}/upload-pdf`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getMealPlanPdf: (id: number) => api.get(`/admin/meal-plans/${id}/pdf`),
  deleteMealPlanPdf: (id: number) => api.delete(`/admin/meal-plans/${id}/pdf`),

  // Orders Management
  getOrders: (params?: any) => api.get('/admin/orders', { params: addSchoolIdToParams(params) }),
  getOrder: (id: number) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id: number, status: string) => api.put(`/admin/orders/${id}/status`, { status }),
  approvePreOrder: (id: number) => api.post(`/pre-orders/${id}/approve`),

  // Activity Logs Management
  getActivityLogs: (params?: any) => api.get('/admin/audit-logs', { params }),

  // Meal endpoints (Specific AdminMealController actions)
  getMeals: (params?: { search?: string; category?: string; status?: string; school_id?: number; }) => api.get('/admin/meals', { params: addSchoolIdToParams(params) }),
  createMeal: (data: any) => api.post('/admin/meals', data),
  updateMeal: (id: number, data: any) => api.put(`/admin/meals/${id}`, data),
  deleteMeal: (id: number) => api.delete(`/admin/meals/${id}`),
  importMeals: (formData: FormData) => api.post('/admin/meals/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  uploadMealPdf: (id: number, formData: FormData) => api.post(`/admin/meals/${id}/upload-pdf`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  deleteMealPdf: (id: number) => api.delete(`/admin/meals/${id}/pdf`),
  getMealPdf: (id: number) => api.get(`/admin/meals/${id}/pdf`),
  getMealsWithSchoolPrices: (schoolId: number, params?: any) => api.get('/admin/meals-with-school-prices', { params }),

  // School Meal Pricing
  getSchoolMealPrices: (schoolId: number) => api.get('/admin/school-meal-prices', { params: { school_id: schoolId } }),
  createSchoolMealPrice: (data: any) => api.post('/admin/school-meal-prices', data),
  updateSchoolMealPrice: (id: number, data: any) => api.put(`/admin/school-meal-prices/${id}`, data),
  deleteSchoolMealPrice: (id: number) => api.delete(`/admin/school-meal-prices/${id}`),
  bulkUpdateSchoolMealPrices: (data: any) => api.post('/admin/school-meal-prices/bulk-update', data),

  // Campaigns Management
  getCampaigns: (params?: any) => api.get('/admin/campaigns', { params: addSchoolIdToParams(params) }),
  createCampaign: (data: any) => api.post('/admin/campaigns', data),
  updateCampaign: (id: number, data: any) => api.put(`/admin/campaigns/${id}`, data),
  deleteCampaign: (id: number) => api.delete(`/admin/campaigns/${id}`),
  toggleCampaignStatus: (id: number) => api.post(`/admin/campaigns/${id}/toggle-status`),
  reorderCampaigns: (data: any) => api.post('/admin/campaigns/reorder', data),

  // Contact Notes Management
  getContactNotes: (params?: any) => api.get('/admin/contact-notes', { params: addSchoolIdToParams(params) }),
  getContactNote: (id: number) => api.get(`/admin/contact-notes/${id}`),
  deleteContactNote: (id: number) => api.delete(`/admin/contact-notes/${id}`),
  respondToContactNote: (id: number, response: string) => api.post(`/admin/contact-notes/${id}/respond`, { response }),
  updateContactNoteStatus: (id: number, status: string) => api.put(`/admin/contact-notes/${id}/status`, { status }),
  markContactNoteAsRead: (id: number) => api.post(`/admin/contact-notes/${id}/mark-read`),
  markAllContactNotesAsRead: () => api.post('/admin/contact-notes/mark-all-read'),
  getContactNotesStatistics: () => api.get('/admin/contact-notes/statistics'),

  // Add-ons Management
  getAddOns: (params?: any) => api.get('/admin/add-ons', { params: addSchoolIdToParams(params) }),
  createAddOn: (data: any) => api.post('/admin/add-ons', data),
  updateAddOn: (id: number, data: any) => api.put(`/admin/add-ons/${id}`, data),
  deleteAddOn: (id: number) => api.delete(`/admin/add-ons/${id}`),
  getAddOnCategories: () => api.get('/admin/add-ons/categories'),

  // Add-on Orders Management
  getAddOnOrders: (params?: any) => api.get('/admin/add-on-orders', { params: addSchoolIdToParams(params) }),
  getAddOnOrder: (id: number) => api.get(`/admin/add-on-orders/${id}`),
  updateAddOnOrder: (id: number, data: any) => api.put(`/admin/add-on-orders/${id}`, data),
  deleteAddOnOrder: (id: number) => api.delete(`/admin/add-on-orders/${id}`),

  // Dashboard Reporting Endpoints
  getTotalMoney: () => api.get('/admin/dashboard/total-money'),
  getSchoolRevenue: (schoolId?: number) => api.get('/admin/dashboard/school-revenue', { params: schoolId ? { school_id: schoolId } : {} }),
  getMealOrderStats: (schoolId?: number) => api.get('/admin/dashboard/meal-order-stats', { params: schoolId ? { school_id: schoolId } : {} }),
  getAddOnOrderStats: (schoolId?: number) => api.get('/admin/dashboard/add-on-order-stats', { params: schoolId ? { school_id: schoolId } : {} }),
  getRecentActivity: () => api.get('/admin/dashboard/recent-activity'),
  getOrdersByStatus: (schoolId?: number) => api.get('/admin/dashboard/orders-by-status', { params: schoolId ? { school_id: schoolId } : {} }),
  getTopWalletBalances: (schoolId?: number) => api.get('/admin/dashboard/top-wallet-balances', { params: schoolId ? { school_id: schoolId } : {} }),
  getRefundsReport: (params?: any) => api.get('/admin/refunds/report', { params: addSchoolIdToParams(params) }),
  getNotificationStats: () => api.get('/admin/notifications/stats'),
  getRevenueByDate: (period: string) => api.get('/admin/dashboard/revenue-by-date', { params: { period } }),
  getSystemHealth: () => api.get('/admin/dashboard/system-health'),

  // Pre-Order Management
  getPreOrders: () => api.get('/admin/pre-orders', { params: addSchoolIdToParams() }),
  getPreOrder: (id: number) => api.get(`/admin/pre-orders/${id}`),
  updatePreOrder: (id: number, data: any) => api.put(`/admin/pre-orders/${id}`, data),
  deletePreOrder: (id: number) => api.delete(`/admin/pre-orders/${id}`),
  cancelPreOrder: (id: number) => api.post(`/admin/pre-orders/${id}/cancel`),
  markAsDelivered: (id: number) => api.post(`/admin/pre-orders/${id}/mark-delivered`),
  getOrderStats: () => api.get('/admin/pre-orders/stats'),
  getAdmins: () => api.get('/admin/admins'),



  // Export Reports
  exportReport: (type: string, format: string) => 
    api.get(`/admin/reports/export`, { 
      params: { type, format },
      responseType: 'blob'
    }),

  // Contact Information Management
  getContactInformation: () => api.get('/admin/contact-information'),
  createContactInformation: (data: any) => api.post('/admin/contact-information', data),
  updateContactInformation: (id: number, data: any) => api.put(`/admin/contact-information/${id}`, data),
  deleteContactInformation: (id: number) => api.delete(`/admin/contact-information/${id}`),

  // General PDF Management
  uploadGeneralPdf: (formData: FormData) => api.post('/admin/general-pdfs', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),

  // Refund Reports
  getRefundStats: () => api.get('/admin/refunds/stats'),
  updateRefundStatus: (refundId: number, status: string) => api.put(`/admin/refunds/${refundId}/status`, { status }),
  exportRefunds: (params?: any) => api.get('/admin/refunds/export', { 
    params: addSchoolIdToParams(params),
    responseType: 'blob'
  }),
};

export default api; 