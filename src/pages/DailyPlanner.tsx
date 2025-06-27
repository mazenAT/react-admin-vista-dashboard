
import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Calendar, Clock, Plus, Users, ChefHat } from 'lucide-react';

const DailyPlanner = () => {
  const [activeTab, setActiveTab] = useState('weekly');
  
  const weeklyPlans = [
    {
      id: 'WP-001',
      name: 'Premium Weekly Plan',
      duration: 'Week of Oct 14-20',
      schools: ['Lincoln Elementary', 'Roosevelt High'],
      students: 420,
      chef: 'Chef Martinez',
      is_active: 'active',
      meals: ['Breakfast', 'Lunch', 'Snack', 'Dinner'],
      price: '$45.00'
    },
    {
      id: 'WP-002',
      name: 'Standard Weekly Plan',
      duration: 'Week of Oct 14-20',
      schools: ['Washington Middle', 'Jefferson Academy'],
      students: 320,
      chef: 'Chef Johnson',
      is_active: 'active',
      meals: ['Lunch', 'Snack'],
      price: '$25.00'
    }
  ];

  const monthlyPlans = [
    {
      id: 'MP-001',
      name: 'Premium Monthly Plan',
      duration: 'October 2024',
      schools: ['Lincoln Elementary', 'Roosevelt High'],
      students: 650,
      chef: 'Chef Williams',
      is_active: 'active',
      meals: ['Breakfast', 'Lunch', 'Snack', 'Dinner'],
      price: '$165.00'
    },
    {
      id: 'MP-002',
      name: 'Standard Monthly Plan',
      duration: 'October 2024',
      schools: ['Washington Middle'],
      students: 425,
      chef: 'Chef Davis',
      is_active: 'upcoming',
      meals: ['Lunch', 'Snack'],
      price: '$90.00'
    }
  ];

  const currentPlans = activeTab === 'weekly' ? weeklyPlans : monthlyPlans;

  const upcomingEvents = [
    {
      date: 'Oct 16',
      title: 'Weekly Menu Planning',
      time: '2:00 PM'
    },
    {
      date: 'Oct 18',
      title: 'Monthly Plan Review',
      time: '10:00 AM'
    },
    {
      date: 'Oct 20',
      title: 'School Nutrition Meeting',
      time: '9:00 AM'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meal Plans</h1>
            <p className="text-gray-600">Manage weekly and monthly meal planning across schools</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Create Plan</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Meal Plans */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Meal Plans</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
              
              {/* Tabs */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('weekly')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'weekly'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Weekly Plans
                </button>
                <button
                  onClick={() => setActiveTab('monthly')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'monthly'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monthly Plans
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {currentPlans.map((plan, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        plan.is_active === 'active' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        <ChefHat className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                        <span className="text-lg font-bold text-gray-900">{plan.price}</span>
                      </div>
                      <p className="text-sm text-gray-600">{plan.chef}</p>
                      <p className="text-sm text-gray-500 mb-2">{plan.duration}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Users className="h-4 w-4" />
                            <span>{plan.students} students</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            plan.is_active === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {plan.is_active}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {plan.meals.map((meal, mealIndex) => (
                          <span key={mealIndex} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            {meal}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Schools: {plan.schools.join(', ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Events */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {upcomingEvents.map((event, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-500">{event.date} at {event.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Plan Overview</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Active Weekly Plans</span>
                    <span className="font-semibold text-gray-900">{weeklyPlans.filter(p => p.is_active === 'active').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Active Monthly Plans</span>
                    <span className="font-semibold text-gray-900">{monthlyPlans.filter(p => p.is_active === 'active').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Students Served</span>
                    <span className="font-semibold text-gray-900">1,815</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Revenue This Month</span>
                    <span className="font-semibold text-green-600">$68,950</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DailyPlanner;
