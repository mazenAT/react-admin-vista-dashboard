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
  Activity,
  Megaphone,
  MessageSquare,
  Truck,
  RefreshCw
} from 'lucide-react';
import SessionInfo from './SessionInfo';

const Sidebar = () => {
  const location = useLocation();
  const { logout, user } = useAuth();
  
  // Define menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      {
        title: 'Dashboard',
        icon: LayoutDashboard,
        path: '/dashboard'
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
        title: 'Deliveries',
        icon: Truck,
        path: '/deliveries'
      },
      {
        title: 'Add-ons',
        icon: Activity,
        path: '/add-ons'
      },
      {
        title: 'Campaigns',
        icon: Megaphone,
        path: '/campaigns'
      },
      {
        title: 'Contact Notes',
        icon: MessageSquare,
        path: '/contact-notes'
      },
      {
        title: 'Refund Reports',
        icon: RefreshCw,
        path: '/refund-reports'
      },
      {
        title: 'Wallet',
        icon: Wallet,
        path: '/wallet'
      }
    ];

    // Super admin gets additional items
    if (user?.role === 'super_admin') {
      return [
        ...baseItems,
        {
          title: 'Schools',
          icon: School,
          path: '/schools'
        },
        {
          title: 'Activity Logs',
          icon: Activity,
          path: '/activity-logs'
        },
        {
          title: 'Contact Information',
          icon: MessageSquare,
          path: '/contact-information'
        },
        {
          title: 'Reports',
          icon: ClipboardList,
          path: '/reports'
        },
        {
          title: 'Settings',
          icon: Settings,
          path: '/settings'
        },
        {
          title: 'Admins',
          icon: Users,
          path: '/admins'
        }
      ];
    }

    // Normal admin only gets base items
    return baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <div className="bg-white h-screen w-64 fixed left-0 top-0 shadow-lg z-10 flex flex-col">
      <div className="p-6 border-b">
        <div className="flex flex-col items-center space-y-3">
          <img src="/Logo.jpg" alt="Logo" className="h-14 w-auto mb-2" />
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
      </div>
      
      <nav className="mt-6 flex-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
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
      
      {/* Session Info and Logout */}
      <div className="p-6 border-t space-y-3">
        <SessionInfo />
        <Button
          onClick={logout}
          variant="outline"
          className="w-full flex items-center justify-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;