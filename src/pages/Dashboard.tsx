
import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import { Users, BookOpen, DollarSign, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    {
      title: 'Total Students',
      value: '2,543',
      change: '+8.2% from last month',
      changeType: 'positive' as const,
      icon: Users,
      color: 'bg-blue-600'
    },
    {
      title: 'Active Courses',
      value: '1,892',
      change: '+3.1% from last month',
      changeType: 'positive' as const,
      icon: BookOpen,
      color: 'bg-green-600'
    },
    {
      title: 'Total Revenue',
      value: '$125,430',
      change: '+12.5% from last month',
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'bg-purple-600'
    },
    {
      title: 'Growth Rate',
      value: '89%',
      change: '+2.1% from last month',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'bg-orange-600'
    }
  ];

  const recentActivities = [
    {
      title: 'New student registration',
      description: 'Sarah Johnson has registered as a new student',
      time: '2 hours ago'
    },
    {
      title: 'Wallet recharge',
      description: 'Student ID: 12345 recharged wallet with $50',
      time: '4 hours ago'
    },
    {
      title: 'Class completed',
      description: 'Advanced Mathematics class has been completed',
      time: '6 hours ago'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your education platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-3">
              <button className="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors text-left">
                Add New Student
              </button>
              <button className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors text-left">
                Manage Wallet
              </button>
              <button className="bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors text-left">
                Schedule Class
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
