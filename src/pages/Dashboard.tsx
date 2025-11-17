import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import { Users, ChefHat, DollarSign, TrendingUp, Banknote, PieChart, Sandwich, Salad } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SchoolRevenueStats from '@/components/SchoolRevenueStats';
import SchoolAssignmentWarning from '@/components/SchoolAssignmentWarning';
import { adminApi } from '../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import StudentForm from '@/components/forms/StudentForm';
import MealPlanForm from '@/components/forms/MealPlanForm';
import { useAuth } from '@/contexts/AuthContext';
import { getSchoolIdForAdmin } from '@/utils/apiHelpers';

interface School {
  id: string;
  name: string;
}

interface DashboardStats {
  total_students  : number;
  meals: number;
  revenue: number;
  satisfaction: number;
  activities: { title: string; description: string; time: string }[];
}

const Dashboard = () => {
  const { user } = useAuth();
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [schools, setSchools] = useState<School[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  // Modal states
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showManageWallet, setShowManageWallet] = useState(false);
  const [showScheduleMeal, setShowScheduleMeal] = useState(false);
  const [totalMoney, setTotalMoney] = useState<number | null>(null);
  const [schoolRevenue, setSchoolRevenue] = useState<any[]>([]);
  const [mealOrderStats, setMealOrderStats] = useState<any[]>([]);
  const [addOnOrderStats, setAddOnOrderStats] = useState<any[]>([]);
  const [lastMonthRevenue, setLastMonthRevenue] = useState<number | null>(null);

  const [overview, setOverview] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [orderStatus, setOrderStatus] = useState<any>(null);
  const [topWallets, setTopWallets] = useState<any>(null);
  const [refunds, setRefunds] = useState<any>(null);
  const [notificationStats, setNotificationStats] = useState<any>(null);

  useEffect(() => {
    fetchSchools();
    fetchTotalMoney();
    fetchSchoolRevenue();
    fetchMealOrderStats();
    fetchAddOnOrderStats();
    
    // For normal admin, only fetch their assigned school's data
    const schoolId = user?.role !== 'super_admin' && user?.school_id ? user.school_id : undefined;
    
    adminApi.getDashboardStats(schoolId).then(res => setOverview(res.data));
    adminApi.getRecentActivity().then(res => setRecentActivity(res.data));
    adminApi.getSystemHealth().then(res => setSystemHealth(res.data));
    adminApi.getOrdersByStatus(schoolId).then(res => setOrderStatus(res.data));
    adminApi.getTopWalletBalances(schoolId).then(res => setTopWallets(res.data));
    adminApi.getRefundsReport(schoolId).then(res => setRefunds(res.data));
    adminApi.getAddOnOrderStats(schoolId).then(res => setAddOnOrderStats(res.data));
    adminApi.getNotificationStats().then(res => setNotificationStats(res.data));
  }, [user]);

  useEffect(() => {
    if (selectedSchool) {
      fetchDashboardStats(selectedSchool);
    }
  }, [selectedSchool]);

  const fetchSchools = async () => {
    try {
      setLoadingSchools(true);
      
      // If user is not super_admin, they can only see their assigned school
      if (user?.role !== 'super_admin') {
        if (user?.school_id) {
          // For normal admin with assigned school, show only their school
          setSchools([{ id: user.school_id.toString(), name: 'My School' }]);
          setSelectedSchool(user.school_id.toString());
        } else {
          // For normal admin without assigned school, show error
          setError('You are not assigned to any school. Please contact the super administrator.');
          setSchools([]);
        }
        return;
      }
      
      // Super admin can see all schools
      const response = await adminApi.getSchools();
      if (response.data && Array.isArray(response.data.data)) {
        setSchools([{ id: 'all', name: 'All Schools' }, ...response.data.data]);
      } else {
        setSchools([{ id: 'all', name: 'All Schools' }]);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
      if (user?.role === 'super_admin') {
        setSchools([{ id: 'all', name: 'All Schools' }]);
      } else {
        setError('Failed to load school information.');
        setSchools([]);
      }
    } finally {
      setLoadingSchools(false);
    }
  };

  // Fetch dashboard stats (students, revenue, satisfaction, activities, etc.)
  const fetchDashboardStats = async (schoolId: string) => {
    try {
      setLoadingStats(true);
      setError(null);
      
      // For normal admin, only fetch their assigned school's data
      let id;
      if (user?.role !== 'super_admin') {
        if (user?.school_id) {
          id = user.school_id;
        } else {
          setError('You are not assigned to any school. Please contact the super administrator.');
          setDashboardStats(null);
          return;
        }
      } else {
        id = schoolId === 'all' ? undefined : Number(schoolId);
      }
      
      const response = await adminApi.getDashboardStats(id);
      // Always use response.data.data as the real dashboardStats object
      if (response.data && response.data.data) {
        setDashboardStats(response.data.data);
      } else {
        setDashboardStats(null);
        setError('Dashboard data is not in the expected format.');
      }
    } catch (error) {
      setDashboardStats(null);
      setError('Failed to load dashboard data. Please try again later or choose another school.');
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch total money in the system
  const fetchTotalMoney = async () => {
    try {
      const response = await adminApi.getTotalMoney();
      // Use response.data.total_money, convert to number if needed
      let value = response.data.data.total_money;
      if (typeof value === 'string') value = Number(value);
      setTotalMoney(typeof value === 'number' && !isNaN(value) ? value : 0);
    } catch (error) {
      setTotalMoney(0);
    }
  };

  // Fetch school revenue
  const fetchSchoolRevenue = async () => {
    try {
      // For normal admin, only fetch their assigned school's data
      const schoolId = user?.role !== 'super_admin' && user?.school_id ? user.school_id : undefined;
      const response = await adminApi.getSchoolRevenue(schoolId);
      let stats = [];
      if (Array.isArray(response.data.data)) {
        stats = response.data.data;
      } else if (response.data.data && Array.isArray(response.data.data.school_revenue)) {
        stats = response.data.data.school_revenue;
      } else {
        console.warn('Unexpected school revenue response:', response.data);
      }
      setSchoolRevenue(stats);
    } catch (error) {
      setSchoolRevenue([]);
    }
  };

  // Fetch meal order stats
  const fetchMealOrderStats = async () => {
    try {
      // For normal admin, only fetch their assigned school's data
      const schoolId = user?.role !== 'super_admin' && user?.school_id ? user.school_id : undefined;
      const response = await adminApi.getMealOrderStats(schoolId);
      let stats = [];
      if (response.data && response.data.data && Array.isArray(response.data.data.meal_order_stats)) {
        stats = response.data.data.meal_order_stats;
      } else {
        console.warn('Unexpected meal order stats response:', response.data);
      }
      setMealOrderStats(stats);
    } catch (error) {
      setMealOrderStats([]);
    }
  };
  
  // Fetch add-on order stats
  const fetchAddOnOrderStats = async () => {
    try {
      // For normal admin, only fetch their assigned school's data
      const schoolId = user?.role !== 'super_admin' && user?.school_id ? user.school_id : undefined;
      const response = await adminApi.getAddOnOrderStats(schoolId);
      let stats = [];
      if (response.data && response.data.data && Array.isArray(response.data.data.add_on_order_stats)) {
        stats = response.data.data.add_on_order_stats;
      } else if (Array.isArray(response.data.add_on_order_stats)) {
        stats = response.data.add_on_order_stats;
      } else if (Array.isArray(response.data.stats)) {
        stats = response.data.stats;
      } else {
        console.warn('Unexpected add-on order stats response:', response.data);
      }
      setAddOnOrderStats(stats);
    } catch (error) {
      setAddOnOrderStats([]);
    }
  };

  // Fetch last month's revenue
  const fetchLastMonthRevenue = async () => {
    try {
      const response = await adminApi.getRevenueByDate('monthly');
      // Find last month and current month
      const stats = response.data && response.data.data && Array.isArray(response.data.data.stats) ? response.data.data.stats : [];
      if (stats.length >= 2) {
        // stats[0] is current month, stats[1] is last month
        setLastMonthRevenue(Number(stats[1].revenue) || 0);
      } else {
        setLastMonthRevenue(0);
      }
    } catch (error) {
      setLastMonthRevenue(0);
    }
  };

  useEffect(() => {
    fetchLastMonthRevenue();
  }, []);

  

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full text-red-600">
          {error}
          <button onClick={() => fetchDashboardStats(selectedSchool)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!dashboardStats) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <div>No dashboard data available for the selected school.</div>
          <div className="mt-2 text-gray-500">Please choose another school from the dropdown above.</div>
        </div>
      </DashboardLayout>
    );
  }

  // Ensure all stats are arrays before mapping
  const safeMealOrderStats = Array.isArray(mealOrderStats) ? mealOrderStats : [];
  const safeAddOnOrderStats = Array.isArray(addOnOrderStats) ? addOnOrderStats : [];
  const safeSchoolRevenue = Array.isArray(schoolRevenue) ? schoolRevenue : [];
  // Calculate total revenue from schoolRevenue array
  const totalSchoolRevenue = safeSchoolRevenue.reduce((sum, row) => sum + (Number(row.revenue) || 0), 0);
  

  // Calculate revenue change percentage
  const revenueChange = lastMonthRevenue !== null && lastMonthRevenue > 0
    ? ((totalSchoolRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : 0;
  const revenueChangeText = lastMonthRevenue !== null && lastMonthRevenue > 0
    ? `${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}% from last month`
    : 'No data for last month';

  if (loadingSchools || loadingStats) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          Loading Dashboard...
        </div>
      </DashboardLayout>
    );
  }
  // In the rendering logic, always use Number() for values that may be strings
  const stats = [
    {
      title: 'Total Students',
      value: dashboardStats && dashboardStats.total_students !== undefined && dashboardStats.total_students !== null ? Number(dashboardStats.total_students).toLocaleString() : '0',
      change: '',
      changeType: 'positive' as const,
      icon: Users,
      color: 'bg-blue-600'
    },
    {
      title: 'Total Revenue',
      value: totalSchoolRevenue ? `${totalSchoolRevenue.toLocaleString()} EGP` : '0 EGP',
      change: revenueChangeText,
      changeType: (revenueChange >= 0 ? 'positive' : 'negative') as 'positive' | 'negative',
      icon: DollarSign,
      color: 'bg-purple-600'
    }
  ];
  
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's what's happening with your meal management system.</p>
          </div>
          {user?.role === 'super_admin' && (
            <div className="w-64">
              <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a school" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* School Assignment Warning for Normal Admins */}
        <SchoolAssignmentWarning 
          userRole={user?.role}
          userEmail={user?.email}
          schoolId={user?.school_id}
        />

        {/* Conditional rendering for loading, error, or no data */}
        {loadingSchools || loadingStats ? (
          <div className="flex items-center justify-center h-full">
            Loading Dashboard...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-red-600">
            {error}
            <button onClick={() => fetchDashboardStats(selectedSchool)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
              Retry
            </button>
          </div>
        ) : !dashboardStats ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div>No dashboard data available for the selected school.</div>
            {user?.role === 'super_admin' && (
              <div className="mt-2 text-gray-500">Please choose another school from the dropdown above.</div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
              <StatCard
                title="Total Money in System"
                value={totalMoney !== null && totalMoney !== undefined ? `${Number(totalMoney).toLocaleString()} EGP` : '...'}
                change={''}
                changeType="positive"
                icon={Banknote}
                color="bg-green-600"
              />
            </div>

            <SchoolRevenueStats />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {Array.isArray(dashboardStats.activities) ? dashboardStats.activities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  )) : null}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 gap-3">
                  <button className="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors text-left" onClick={() => setShowAddStudent(true)}>
                    Add New Student
                  </button>
                  <button className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors text-left" onClick={() => setShowManageWallet(true)}>
                    Manage Wallet
                  </button>
                  <button className="bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors text-left" onClick={() => setShowScheduleMeal(true)}>
                    Schedule Meal
                  </button>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by School</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left p-2">School</th>
                        <th className="text-left p-2">Revenue (EGP)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safeSchoolRevenue.map((row: any) => (
                        <tr key={row.school_id}>
                          <td className="p-2">{row.school_name}</td>
                          <td className="p-2">{row.revenue !== undefined && row.revenue !== null ? Number(row.revenue).toLocaleString() : '0'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Meal Orders by Category/Subcategory</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left p-2">Category</th>
                        <th className="text-left p-2">Subcategory</th>
                        <th className="text-left p-2">Meal Name</th>
                        <th className="text-left p-2">Meal Price</th>
                        <th className="text-left p-2">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safeMealOrderStats.map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="p-2">{row.category}</td>
                          <td className="p-2">{row.subcategory ?? ''}</td>
                          <td className="p-2">{row.meal_name ?? ''}</td>
                          <td className="p-2">{row.meal_price !== undefined && row.meal_price !== null ? row.meal_price : ''}</td>
                          <td className="p-2">{row.count !== undefined && row.count !== null ? row.count : 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add-on Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left p-2">Add-on</th>
                        <th className="text-left p-2">Count</th>
                        <th className="text-left p-2">Revenue (EGP)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safeAddOnOrderStats.map((row: any, i: number) => (
                        <tr key={i}>
                          <td className="p-2">{row.add_on_name || row.name}</td>
                          <td className="p-2">{row.count !== undefined && row.count !== null ? row.count : (row.total_ordered !== undefined ? row.total_ordered : 0)}</td>
                          <td className="p-2">{row.revenue !== undefined && row.revenue !== null ? row.revenue.toLocaleString() : (row.total_revenue !== undefined ? row.total_revenue.toLocaleString() : 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
        {/* Add Student Modal */}
        <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <StudentForm onSuccess={() => setShowAddStudent(false)} onCancel={() => setShowAddStudent(false)} />
          </DialogContent>
        </Dialog>
        {/* Manage Wallet Modal (placeholder) */}
        <Dialog open={showManageWallet} onOpenChange={setShowManageWallet}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Manage Wallet</DialogTitle>
            </DialogHeader>
            <div>Wallet management features coming soon.</div>
          </DialogContent>
        </Dialog>
        {/* Schedule Meal Modal */}
        <Dialog open={showScheduleMeal} onOpenChange={setShowScheduleMeal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule Meal Plan</DialogTitle>
            </DialogHeader>
            <MealPlanForm onSuccess={() => setShowScheduleMeal(false)} onCancel={() => setShowScheduleMeal(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
