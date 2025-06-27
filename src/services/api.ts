import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081/api',
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
    api.get('/admin/dashboard/overview', { params: { school_id: schoolId } }),

  // Schools Management
  getSchools: () => api.get('/admin/schools'),
  createSchool: (data: any) => api.post('/admin/schools', data),
  updateSchool: (id: number, data: any) => api.put(`/admin/schools/${id}`, data),
  deleteSchool: (id: number) => api.delete(`/admin/schools/${id}`),

  // Student management
  getUsers: (params?: any) => api.get('/admin/students', { params }),
  deleteUser: (id: number) => api.delete(`/admin/students/${id}`),
  createUser: (data: any) => api.post('/admin/students', data),
  updateUser: (id: number, data: any) => api.put(`/admin/students/${id}`, data),
  getUser: (id: number) => api.get(`/admin/students/${id}`),

  // Wallet Management
  getWalletStats: (schoolId?: number) => 
    api.get('/admin/wallet/stats', { params: { school_id: schoolId } }),
  getWalletTransactions: (params?: { school_id?: number; type?: string }) => 
    api.get('/admin/wallet/transactions', { params }),

  // Meal Management
  getMealStats: (schoolId?: number) => 
    api.get('/admin/meals/stats', { params: { school_id: schoolId } }),
  getMealPlans: (schoolId?: number) => 
    api.get('/admin/meal-plans', { params: { school_id: schoolId } }),
  createMealPlan: (data: any) => api.post('/admin/meal-plans', data),
  updateMealPlan: (id: number, data: any) => api.put(`/admin/meal-plans/${id}`, data),
  deleteMealPlan: (id: number) => api.delete(`/admin/meal-plans/${id}`),

  // Orders Management
  getOrders: (params?: any) => api.get('/admin/orders', { params }),
  getOrder: (id: number) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id: number, status: string) => api.put(`/admin/orders/${id}/status`, { status }),

  // Activity Logs Management
  getActivityLogs: (params?: { school_id?: number; type?: string }) => 
    api.get('/admin/audit-logs', { params }),

  // Meal endpoints (Specific AdminMealController actions)
  getMeals: (params?: { search?: string; category?: string; is_active?: string; school_id?: number; }) => api.get('/admin/meals', { params }),
  createMeal: (data: any) => api.post('/admin/meals', data),
  updateMeal: (id: number, data: any) => api.put(`/admin/meals/${id}`, data),
  deleteMeal: (id: number) => api.delete(`/admin/meals/${id}`),
  importMeals: (formData: FormData) => api.post('/admin/meals/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),

  // Add-ons Management
  getAddOns: () => api.get('/admin/add-ons'),
  createAddOn: (data: any) => api.post('/admin/add-ons', data),
  updateAddOn: (id: number, data: any) => api.put(`/admin/add-ons/${id}`, data),
  deleteAddOn: (id: number) => api.delete(`/admin/add-ons/${id}`),

  // Dashboard Reporting Endpoints
  getTotalMoney: () => api.get('/admin/dashboard/total-money'),
  getSchoolRevenue: () => api.get('/admin/dashboard/school-revenue'),
  getMealOrderStats: () => api.get('/admin/dashboard/meal-order-stats'),
  getAddOnOrderStats: () => api.get('/admin/dashboard/add-on-order-stats'),
};

export default api; 