
import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Search, Filter, Plus, Edit, Trash2, Users, DollarSign } from 'lucide-react';

const Schools = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const schools = [
    {
      id: 'SCH-001',
      name: 'Lincoln Elementary School',
      address: '123 Main St, Springfield',
      students: 320,
      revenue: '$12,450.00',
      mealPlans: 'Weekly & Monthly',
      status: 'Active',
      contact: 'principal@lincoln.edu'
    },
    {
      id: 'SCH-002',
      name: 'Roosevelt High School',
      address: '456 Oak Ave, Springfield',
      students: 850,
      revenue: '$32,150.00',
      mealPlans: 'Weekly & Monthly',
      status: 'Active',
      contact: 'admin@roosevelt.edu'
    },
    {
      id: 'SCH-003',
      name: 'Washington Middle School',
      address: '789 Pine St, Springfield',
      students: 425,
      revenue: '$16,780.00',
      mealPlans: 'Monthly Only',
      status: 'Active',
      contact: 'office@washington.edu'
    },
    {
      id: 'SCH-004',
      name: 'Jefferson Academy',
      address: '321 Elm Dr, Springfield',
      students: 180,
      revenue: '$7,920.00',
      mealPlans: 'Weekly Only',
      status: 'Inactive',
      contact: 'info@jefferson.edu'
    }
  ];

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = schools.reduce((sum, school) => 
    sum + parseFloat(school.revenue.replace('$', '').replace(',', '')), 0
  );

  const totalStudents = schools.reduce((sum, school) => sum + school.students, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Schools</h1>
            <p className="text-gray-600">Manage school partnerships and meal programs</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add School</span>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{totalStudents.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Schools</p>
                <p className="text-2xl font-bold text-gray-900">{schools.filter(s => s.status === 'Active').length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search schools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="h-5 w-5" />
                <span>Filter</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-500">School ID</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500">School Name</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500">Address</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500">Students</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500">Revenue</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500">Meal Plans</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSchools.map((school) => (
                  <tr key={school.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 font-medium text-gray-900">{school.id}</td>
                    <td className="py-4 px-6 text-gray-900">{school.name}</td>
                    <td className="py-4 px-6 text-gray-600">{school.address}</td>
                    <td className="py-4 px-6 text-gray-600">{school.students}</td>
                    <td className="py-4 px-6 text-gray-900 font-medium">{school.revenue}</td>
                    <td className="py-4 px-6 text-gray-600">{school.mealPlans}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        school.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {school.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Schools;
