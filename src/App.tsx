import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import SuperAdminProtectedRoute from '@/components/SuperAdminProtectedRoute';

// Pages
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Schools from '@/pages/Schools';
import Students from '@/pages/Students';
import Meals from '@/pages/Meals';
import MealPlanner from '@/pages/MealPlanner';
import Orders from '@/pages/Orders';
import Deliveries from '@/pages/Deliveries';
import ActivityLogs from '@/pages/ActivityLogs';
import Wallet from '@/pages/Wallet';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';
import AddOns from '@/pages/AddOns';
import Reports from '@/pages/Reports';
import Campaigns from '@/pages/Campaigns';
import ContactNotes from '@/pages/ContactNotes';
import Admins from '@/pages/Admins';
import ContactInformation from '@/pages/ContactInformation';
import RefundReports from '@/pages/RefundReports';
import PdfManagement from '@/pages/PdfManagement';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <AdminProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/schools"
            element={
              <SuperAdminProtectedRoute>
                <DashboardLayout>
                  <Schools />
                </DashboardLayout>
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <AdminProtectedRoute>
                <DashboardLayout>
                  <Students />
                </DashboardLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/meals"
            element={
              <AdminProtectedRoute>
                <DashboardLayout>
                  <Meals />
                </DashboardLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/planner"
            element={
              <AdminProtectedRoute>
                <DashboardLayout>
                  <MealPlanner />
                </DashboardLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <AdminProtectedRoute>
                <DashboardLayout>
                  <Orders />
                </DashboardLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/deliveries"
            element={
              <AdminProtectedRoute>
                <DashboardLayout>
                  <Deliveries />
                </DashboardLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/activity-logs"
            element={
              <SuperAdminProtectedRoute>
                <DashboardLayout>
                  <ActivityLogs />
                </DashboardLayout>
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/campaigns"
            element={
              <AdminProtectedRoute>
                <DashboardLayout>
                  <Campaigns />
                </DashboardLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/contact-notes"
            element={
              <AdminProtectedRoute>
                <DashboardLayout>
                  <ContactNotes />
                </DashboardLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <SuperAdminProtectedRoute>
                <DashboardLayout>
                  <Reports />
                </DashboardLayout>
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/admins"
            element={
              <SuperAdminProtectedRoute>
                <DashboardLayout>
                  <Admins />
                </DashboardLayout>
              </SuperAdminProtectedRoute>
            }
          />
          <Route
            path="/contact-information"
            element={
              <SuperAdminProtectedRoute>
                <DashboardLayout>
                  <ContactInformation />
                </DashboardLayout>
              </SuperAdminProtectedRoute>
            }
          />
          <Route path="/wallet" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Wallet />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <SuperAdminProtectedRoute>
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </SuperAdminProtectedRoute>
          } />
          <Route
            path="/add-ons"
            element={
              <AdminProtectedRoute>
                <DashboardLayout>
                  <AddOns />
                </DashboardLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/refund-reports"
            element={
              <AdminProtectedRoute>
                <DashboardLayout>
                  <RefundReports />
                </DashboardLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/pdf-management"
            element={
              <SuperAdminProtectedRoute>
                <DashboardLayout>
                  <PdfManagement />
                </DashboardLayout>
              </SuperAdminProtectedRoute>
            }
          />

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
