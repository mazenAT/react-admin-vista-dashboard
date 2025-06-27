import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  Calendar,
  Settings,
  ChefHat,
  School,
  Utensils,
  LogOut,
  ClipboardList,
  Activity
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const { logout, user } = useAuth();
  
  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard'
    },
    {
      title: 'Schools',
      icon: School,
      path: '/schools'
    },
    {
      title: 'Students',
      icon: Users,
      path: '/students'
    },
    {
      title: 'Meals',
      icon: Utensils,
      path: '/meals'
    },
    {
      title: 'Add-ons',
      icon: Activity,
      path: '/add-ons'
    },
    {
      title: 'Meal Plans',
      icon: Calendar,
      path: '/planner'
    },
    {
      title: 'Orders',
      icon: ClipboardList,
      path: '/orders'
    },
    {
      title: 'Wallet',
      icon: Wallet,
      path: '/wallet'
    },
    {
      title: 'Activity Logs',
      icon: Activity,
      path: '/activity-logs'
    },
    {
      title: 'Settings',
      icon: Settings,
      path: '/settings'
    }
  ];

  return (
    <div className="bg-white h-screen w-64 fixed left-0 top-0 shadow-lg z-10 flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <ChefHat className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Meal Manager</h1>
            <p className="text-sm text-gray-500">Admin Panel</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          if (item.title === 'Admins' && user?.role !== 'super_admin') return null;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                isActive ? 'bg-blue-50 text-blue-600 border-r-3 border-blue-600' : ''
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-6 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-medium">
                {user?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500">{user?.email || 'admin@example.com'}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="text-gray-500 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
