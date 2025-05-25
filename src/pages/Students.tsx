
import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Search, Filter, Plus, Edit, Trash2 } from 'lucide-react';

const Students = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const students = [
    {
      id: 'ST-001',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      phone: '+1 234-567-8901',
      course: 'Mathematics',
      status: 'Active',
      balance: '$89.50'
    },
    {
      id: 'ST-002',
      name: 'Sarah Smith',
      email: 'sarah@example.com',
      phone: '+1 234-567-8902',
      course: 'Physics',
      status: 'Active',
      balance: '$125.00'
    },
    {
      id: 'ST-003',
      name: 'Mike Wilson',
      email: 'mike@example.com',
      phone: '+1 234-567-8903',
      course: 'Chemistry',
      status: 'Inactive',
      balance: '$45.75'
    },
    {
      id: 'ST-004',
      name: 'Emma Davis',
      email: 'emma@example.com',
      phone: '+1 234-567-8904',
      course: 'Biology',
      status: 'Active',
      balance: '$67.25'
    }
  ];

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Students</h1>
            <p className="text-gray-600">Manage and track student information</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add Student</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search students..."
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
                  <th className="text-left py-3 px-6 font-medium text-gray-500">Student ID</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500">Student Name</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500">Email</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500">Course</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500">Balance</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 font-medium text-gray-900">{student.id}</td>
                    <td className="py-4 px-6 text-gray-900">{student.name}</td>
                    <td className="py-4 px-6 text-gray-600">{student.email}</td>
                    <td className="py-4 px-6 text-gray-600">{student.course}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        student.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-900 font-medium">{student.balance}</td>
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

export default Students;
