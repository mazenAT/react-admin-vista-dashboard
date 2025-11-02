import React, { useState, useEffect } from 'react';
import { adminApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { MoreHorizontal, Plus, Search, Trash2, CheckCircle, XCircle, Edit } from 'lucide-react';
import { toast } from 'sonner';
import StudentForm from '@/components/forms/StudentForm';
import StudentDetails from '@/components/StudentDetails';
import BulkActions from '@/components/BulkActions';

interface Student {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  school: {
    id: number;
    name: string;
  };
  school_id: number;
  wallet?: {
    balance: number;
  };
  allergies?: string[];
  family_members?: FamilyMember[];
}

interface FamilyMember {
  id: number;
  name: string;
  grade: string;
  class: string;
  allergies: string[];
  is_active: boolean;
}

interface School {
  id: number;
  name: string;
}

const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [perPage, setPerPage] = useState(10);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<(string | number)[]>([]);

  // Fetch students
  const fetchStudents = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await adminApi.getUsers({
        role: 'user',
        search: searchQuery || undefined,
        school_id: selectedSchool !== 'all' ? parseInt(selectedSchool) : undefined,
        page: page,
        per_page: perPage
      });
      
      // Handle paginated response
      if (response.data.data && Array.isArray(response.data.data)) {
        setStudents(response.data.data);
        // Extract pagination metadata
        setCurrentPage(response.data.current_page || 1);
        setTotalPages(response.data.last_page || 1);
        setTotalRecords(response.data.total || 0);
        setPerPage(response.data.per_page || 10);
      } else {
        // Fallback for non-paginated response
        setStudents(response.data.data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch parents');
    } finally {
      setLoading(false);
    }
  };

  // Fetch schools
  const fetchSchools = async () => {
    try {
      const response = await adminApi.getSchools();
      setSchools(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch schools');
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchStudents(1);
  }, [selectedSchool, searchQuery]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchStudents(page);
  };

  // Handle student deletion
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user? This will also delete all associated family members.')) return;
    
    try {
      const response = await adminApi.deleteUser(id);
      const message = response?.data?.message || 'User deleted successfully';
      toast.success(message);
      fetchStudents(currentPage); // Keep current page after delete
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to delete user';
      toast.error(errorMessage);
      console.error('Delete error:', error);
    }
  };

  // Handle view details
  const handleViewDetails = (student: Student) => {
    console.log('Opening details for student:', student);
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  // Handle edit
  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setShowEditModal(true);
  };

  // Bulk Actions
  const handleBulkDelete = async (ids: (string | number)[]) => {
    if (!confirm(`Are you sure you want to delete ${ids.length} user(s)? This will also delete all associated family members.`)) return;
    
    try {
      const response = await adminApi.bulkDeleteStudents(ids.map(String));
      const message = response?.data?.message || `Successfully deleted ${ids.length} users`;
      toast.success(message);
      setSelectedStudentIds([]);
      fetchStudents(currentPage); // Keep current page after bulk delete
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to delete users';
      toast.error(errorMessage);
      console.error('Bulk delete error:', error);
    }
  };

  const handleBulkActivate = async (ids: (string | number)[]) => {
    try {
      await adminApi.bulkActivateStudents(ids.map(String));
      toast.success(`Successfully activated ${ids.length} students`);
      setSelectedStudentIds([]);
      fetchStudents(currentPage);
    } catch (error) {
      toast.error('Failed to activate students');
    }
  };

  const handleBulkDeactivate = async (ids: (string | number)[]) => {
    try {
      await adminApi.bulkDeactivateStudents(ids.map(String));
      toast.success(`Successfully deactivated ${ids.length} students`);
      setSelectedStudentIds([]);
      fetchStudents(currentPage);
    } catch (error) {
      toast.error('Failed to deactivate students');
    }
  };

  const handleBulkUpdate = async (ids: (string | number)[], updateData: any) => {
    try {
      await adminApi.bulkUpdateStudents(ids.map(String), updateData);
      toast.success(`Successfully updated ${ids.length} students`);
      setSelectedStudentIds([]);
      fetchStudents(currentPage);
    } catch (error) {
      toast.error('Failed to update students');
    }
  };

  const bulkActions = [
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive' as const,
      onClick: handleBulkDelete,
      confirm: true,
      confirmMessage: `Are you sure you want to delete ${selectedStudentIds.length} students? This action cannot be undone.`
    },
    {
      id: 'activate',
      label: 'Activate',
      icon: <CheckCircle className="h-4 w-4" />,
      variant: 'default' as const,
      onClick: handleBulkActivate,
      confirm: true,
      confirmMessage: `Are you sure you want to activate ${selectedStudentIds.length} students?`
    },
    {
      id: 'deactivate',
      label: 'Deactivate',
      icon: <XCircle className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: handleBulkDeactivate,
      confirm: true,
      confirmMessage: `Are you sure you want to deactivate ${selectedStudentIds.length} students?`
    },
    {
      id: 'update',
      label: 'Bulk Update',
      icon: <Edit className="h-4 w-4" />,
      variant: 'secondary' as const,
      onClick: () => {
        // This would open a modal for bulk update
        toast.info('Bulk update functionality - coming soon!');
      },
      confirm: false
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parents</h1>
          <p className="text-gray-600">Manage your school's parents and their family members</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Parent
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search parents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedSchool} onValueChange={setSelectedSchool}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select School" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Schools</SelectItem>
            {schools.map(school => (
              <SelectItem key={school.id} value={String(school.id)}>{school.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Parents Table */}
      <div className="bg-white rounded-lg shadow">
        <BulkActions
          items={students}
          selectedIds={selectedStudentIds}
          onSelectionChange={setSelectedStudentIds}
          actions={bulkActions}
          selectAllLabel="Select All Students"
          selectedLabel="Students Selected"
        />
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedStudentIds.length === students.length && students.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedStudentIds(students.map(s => s.id));
                    } else {
                      setSelectedStudentIds([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead>Parent Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Wallet Balance</TableHead>
              <TableHead>Family Members</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading parents...
                  </div>
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No parents found
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedStudentIds.includes(student.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStudentIds([...selectedStudentIds, student.id]);
                        } else {
                          setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.phone || 'N/A'}</TableCell>
                  <TableCell>{student.school?.name || 'N/A'}</TableCell>
                  <TableCell>{(student.wallet?.balance || 0).toFixed(2)} EGP</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {student.family_members && student.family_members.length > 0 ? (
                        student.family_members.map((member) => (
                          <div key={member.id} className="text-sm bg-gray-50 px-2 py-1 rounded">
                            <span className="font-medium">{member.name}</span>
                            <span className="text-gray-500 ml-2">
                              {member.grade} • Class {member.class}
                            </span>
                            {member.allergies && member.allergies.length > 0 && (
                              <div className="text-xs text-red-600 mt-1">
                                Allergies: {member.allergies.join(', ')}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">No family members</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(student)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(student)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(student.id)}
                          className="text-red-600"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, totalRecords)} of {totalRecords} results
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) {
                        handlePageChange(currentPage - 1);
                      }
                    }}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(pageNum);
                        }}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) {
                        handlePageChange(currentPage + 1);
                      }
                    }}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Add Parent Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Parent</DialogTitle>
          </DialogHeader>
          <StudentForm
            onSuccess={() => {
              setShowAddModal(false);
              fetchStudents(1); // Go to first page after adding
            }}
            onCancel={() => setShowAddModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Parent Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Parent</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <StudentForm
              initialData={selectedStudent}
              onSuccess={() => {
                setShowEditModal(false);
                setSelectedStudent(null);
                fetchStudents(currentPage);
              }}
              onCancel={() => {
                setShowEditModal(false);
                setSelectedStudent(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Student Details Modal */}
      {showDetailsModal && selectedStudent && (
        <StudentDetails
          student={selectedStudent}
          open={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedStudent(null);
          }}
        />
      )}
    </div>
  );
};

export default Students;
