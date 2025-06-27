import React, { useState, useEffect } from 'react';
import { adminApi } from '@/services/api';
import { Search, Filter, Plus, Edit, Trash2, Users, DollarSign, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SchoolForm from '@/components/forms/SchoolForm';

interface Student {
  id: number;
  name: string;
  // Add other student fields if needed
}

interface Meal {
  id: number;
  name: string;
  price: number;
  // Add other meal fields if needed
}

interface WeeklyPlan {
  id: number;
  name: string;
  meals: Meal[];
  // Add other weekly plan fields if needed
}

interface School {
  id: number;
  name: string;
  students: Student[];
  weekly_plans: WeeklyPlan[];
  // Add other fields that might be returned by the API if available
}

const Schools = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getSchools();
      setSchools(response.data.data || []); // Ensure it's an array even if data is null/undefined
    } catch (error) {
      toast.error('Failed to fetch schools.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStudents = schools.reduce((sum, school) => sum + (school.students?.length || 0), 0);

  // Total revenue cannot be calculated from current School model, setting to 0 or removing card
  const totalRevenue = 0;
  // Active schools also not directly available from the current School model structure
  const activeSchoolsCount = 0;

  const handleEdit = (school: School) => {
    setSelectedSchool(school);
    setShowEditModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this school?')) return;

    try {
      await adminApi.deleteSchool(id);
      toast.success('School deleted successfully');
      fetchSchools();
    } catch (error) {
      toast.error('Failed to delete school');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schools</h1>
          <p className="text-gray-600">Manage school partnerships and meal programs</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="h-5 w-5" />
          <span>Add School</span>
        </Button>
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
              <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p> {/* Display as currency */}
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Schools</p> {/* Changed from Active Schools */}
              <p className="text-2xl font-bold text-gray-900">{schools.length}</p> {/* Display total schools */}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search schools by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {/* Filter button removed as there are no additional filters implemented yet */}
            {/* <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-5 w-5" />
              <span>Filter</span>
            </button> */}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School ID</TableHead>
                <TableHead>School Name</TableHead>
                <TableHead>Students</TableHead>
                {/* Removed Address, Revenue, Meal Plans, Status, Contact as they are not directly available from API */}
                <TableHead className="w-[50px]"></TableHead> {/* Actions column */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredSchools.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    No schools found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSchools.map((school) => (
                  <TableRow key={school.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="py-4 px-6 font-medium text-gray-900">{school.id}</TableCell>
                    <TableCell className="py-4 px-6 text-gray-900">{school.name}</TableCell>
                    <TableCell className="py-4 px-6 text-gray-600">{school.students?.length || 0}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(school)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(school.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add School Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New School</DialogTitle>
          </DialogHeader>
          <SchoolForm
            onSuccess={() => {
              setShowAddModal(false);
              fetchSchools();
            }}
            onCancel={() => setShowAddModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit School Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit School</DialogTitle>
          </DialogHeader>
          {selectedSchool && (
            <SchoolForm
              initialData={selectedSchool}
              onSuccess={() => {
                setShowEditModal(false);
                setSelectedSchool(null);
                fetchSchools();
              }}
              onCancel={() => {
                setShowEditModal(false);
                setSelectedSchool(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Schools;
