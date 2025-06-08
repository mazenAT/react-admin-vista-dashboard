
import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import { Users, ChefHat, DollarSign, TrendingUp } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Dashboard = () => {
  const [selectedSchool, setSelectedSchool] = useState<string>('all');

  const schools = [
    { id: 'all', name: 'All Schools' },
    { id: 'lincoln', name: 'Lincoln Elementary School' },
    { id: 'roosevelt', name: 'Roosevelt High School' },
    { id: 'washington', name: 'Washington Middle School' },
    { id: 'jefferson', name: 'Jefferson Academy' }
  ];

  const schoolData = {
    all: {
      students: 2543,
      meals: 1892,
      revenue: 125430,
      satisfaction: 89,
      activities: [
        {
          title: 'New student registration',
          description: 'Sarah Johnson has registered for meal plan at Lincoln Elementary',
          time: '2 hours ago'
        },
        {
          title: 'Wallet recharge',
          description: 'Student ID: 12345 at Roosevelt High recharged wallet with $50',
          time: '4 hours ago'
        },
        {
          title: 'Meal service completed',
          description: 'Lunch service completed across all schools with 1,892 students served',
          time: '6 hours ago'
        }
      ]
    },
    lincoln: {
      students: 320,
      meals: 245,
      revenue: 18750,
      satisfaction: 92,
      activities: [
        {
          title: 'New student registration',
          description: 'Sarah Johnson has registered for meal plan',
          time: '2 hours ago'
        },
        {
          title: 'Weekly meal plan activated',
          description: 'Premium weekly plan started for 15 new students',
          time: '5 hours ago'
        },
        {
          title: 'Lunch service completed',
          description: 'Lunch service completed with 245 students served',
          time: '1 day ago'
        }
      ]
    },
    roosevelt: {
      students: 850,
      meals: 672,
      revenue: 52150,
      satisfaction: 87,
      activities: [
        {
          title: 'Wallet recharge',
          description: 'Student ID: 12345 recharged wallet with $50',
          time: '4 hours ago'
        },
        {
          title: 'Monthly plan renewal',
          description: '45 students renewed their monthly meal plans',
          time: '8 hours ago'
        },
        {
          title: 'Breakfast service completed',
          description: 'Morning service completed with 420 students served',
          time: '1 day ago'
        }
      ]
    },
    washington: {
      students: 425,
      meals: 356,
      revenue: 24680,
      satisfaction: 90,
      activities: [
        {
          title: 'Special dietary request',
          description: 'New gluten-free meal option added for 12 students',
          time: '3 hours ago'
        },
        {
          title: 'Payment reminder sent',
          description: 'Low balance notifications sent to 8 students',
          time: '6 hours ago'
        },
        {
          title: 'Lunch service completed',
          description: 'Lunch service completed with 356 students served',
          time: '1 day ago'
        }
      ]
    },
    jefferson: {
      students: 180,
      meals: 142,
      revenue: 9850,
      satisfaction: 85,
      activities: [
        {
          title: 'New meal option introduced',
          description: 'Vegetarian weekly plan now available',
          time: '1 hour ago'
        },
        {
          title: 'Student feedback received',
          description: 'Positive feedback on new salad bar options',
          time: '7 hours ago'
        },
        {
          title: 'Weekly planning meeting',
          description: 'Menu planning session completed for next week',
          time: '2 days ago'
        }
      ]
    }
  };

  const currentData = schoolData[selectedSchool as keyof typeof schoolData];

  const stats = [
    {
      title: 'Total Students',
      value: currentData.students.toLocaleString(),
      change: '+8.2% from last month',
      changeType: 'positive' as const,
      icon: Users,
      color: 'bg-blue-600'
    },
    {
      title: 'Daily Meals Served',
      value: currentData.meals.toLocaleString(),
      change: '+3.1% from last month',
      changeType: 'positive' as const,
      icon: ChefHat,
      color: 'bg-green-600'
    },
    {
      title: 'Total Revenue',
      value: `$${currentData.revenue.toLocaleString()}`,
      change: '+12.5% from last month',
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'bg-purple-600'
    },
    {
      title: 'Customer Satisfaction',
      value: `${currentData.satisfaction}%`,
      change: '+2.1% from last month',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'bg-orange-600'
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
              {currentData.activities.map((activity, index) => (
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
                Schedule Meal
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
