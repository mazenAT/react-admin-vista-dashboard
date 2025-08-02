import React, { useState, useEffect } from 'react';
import { adminApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { MoreHorizontal, Plus, Search, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
import MealPlanForm from '@/components/forms/MealPlanForm';
import { useAuth } from '@/contexts/AuthContext';

interface MealPlan {
  id: number;
  start_date: string;
  end_date: string;
  meals: {
    id: number;
    name: string;
    description: string;
    price: number;
    pivot: { day_of_week: number };
  }[];
  school: {
    id: number;
    name: string;
  };
  is_active: boolean;
  pdf_url?: string;
}

interface School {
  id: number;
  name: string;
}

const MealPlanner = () => {
  const { user } = useAuth();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showGeneralPdfModal, setShowGeneralPdfModal] = useState(false);
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [generalPdfTitle, setGeneralPdfTitle] = useState('');

  // Fetch meal plans
  const fetchMealPlans = async () => {
    try {
      setLoading(true);
      // For normal admin, only fetch their assigned school's meal plans
      const schoolId = user?.role !== 'super_admin' && user?.school_id 
        ? user.school_id 
        : (selectedSchool !== 'all' ? parseInt(selectedSchool) : undefined);
      
      const response = await adminApi.getMealPlans(schoolId);
      setMealPlans(response.data.data.data);
    } catch (error) {
      toast.error('Failed to fetch meal plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // For normal admin, only show their assigned school
        if (user?.role !== 'super_admin') {
          if (user?.school_id) {
            setSchools([{ id: user.school_id, name: 'My School' }]);
            setSelectedSchool(user.school_id.toString());
          } else {
            toast.error('You are not assigned to any school');
            setSchools([]);
            return;
          }
        } else {
          // Super admin can see all schools
          const schoolsResponse = await adminApi.getSchools();
          setSchools(schoolsResponse.data.data);
        }

        // Fetch meal plans based on user role and school selection
        const schoolId = user?.role !== 'super_admin' && user?.school_id 
          ? user.school_id 
          : (selectedSchool !== 'all' ? parseInt(selectedSchool) : undefined);
        
        const plansResponse = await adminApi.getMealPlans(schoolId);
        setMealPlans(plansResponse.data.data.data);
      } catch (error) {
        toast.error('Failed to fetch initial data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [selectedSchool, user]);

  // Filter meal plans based on search and date
  const filteredMealPlans = Array.isArray(mealPlans) ? mealPlans.filter(plan => {
    const matchesSearch = 
      plan.school.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = selectedDate 
      ? new Date(plan.end_date).toDateString() === selectedDate.toDateString()
      : true;
    return matchesSearch && matchesDate;
  }):[];
  
  // Handle edit
  const handleEdit = (mealPlan: MealPlan) => {
    setSelectedMealPlan(mealPlan);
    setShowEditModal(true);
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this meal plan?')) return;
    
    try {
      await adminApi.deleteMealPlan(id);
      toast.success('Meal plan deleted successfully');
      fetchMealPlans();
    } catch (error) {
      toast.error('Failed to delete meal plan');
    }
  };

  // Handle PDF upload
  const handlePdfUpload = (mealPlan: MealPlan) => {
    setSelectedMealPlan(mealPlan);
    setShowPdfModal(true);
  };

  // Handle PDF file selection
  const handlePdfFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedPdfFile(file);
    } else {
      toast.error('Please select a valid PDF file');
    }
  };

  // Handle PDF upload submission
  const handlePdfUploadSubmit = async () => {
    if (!selectedMealPlan || !selectedPdfFile) return;

    try {
      setUploadingPdf(true);
      const formData = new FormData();
      formData.append('pdf', selectedPdfFile);

      await adminApi.uploadMealPlanPdf(selectedMealPlan.id, formData);
      toast.success('PDF uploaded successfully');
      setShowPdfModal(false);
      setSelectedPdfFile(null);
      fetchMealPlans();
    } catch (error) {
      toast.error('Failed to upload PDF');
    } finally {
      setUploadingPdf(false);
    }
  };

  // Handle PDF view
  const handlePdfView = async (mealPlan: MealPlan) => {
    try {
      const response = await adminApi.getMealPlanPdf(mealPlan.id);
      if (response.data.pdf_url) {
        window.open(response.data.pdf_url, '_blank');
      }
    } catch (error) {
      toast.error('Failed to load PDF');
    }
  };

  // Handle PDF delete
  const handlePdfDelete = async (mealPlan: MealPlan) => {
    if (!confirm('Are you sure you want to delete the PDF for this meal plan?')) return;

    try {
      await adminApi.deleteMealPlanPdf(mealPlan.id);
      toast.success('PDF deleted successfully');
      fetchMealPlans();
    } catch (error) {
      toast.error('Failed to delete PDF');
    }
  };

  // Handle general PDF upload
  const handleGeneralPdfUpload = async () => {
    if (!selectedPdfFile || !generalPdfTitle.trim()) {
      toast.error('Please provide both a title and PDF file');
      return;
    }

    try {
      setUploadingPdf(true);
      const formData = new FormData();
      formData.append('pdf', selectedPdfFile);
      formData.append('title', generalPdfTitle);

      await adminApi.uploadGeneralPdf(formData);
      toast.success('PDF uploaded successfully');
      setShowGeneralPdfModal(false);
      setSelectedPdfFile(null);
      setGeneralPdfTitle('');
    } catch (error) {
      toast.error('Failed to upload PDF');
    } finally {
      setUploadingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meal Planner</h1>
          <p className="text-gray-600">Plan and manage school meals</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
            onClick={() => setShowGeneralPdfModal(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload PDF
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Meal Plan
          </Button>
        </div>
      </div>

      {/* Filters and Calendar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Search and School Filter */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search meals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {user?.role === 'super_admin' && (
              <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select School" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schools</SelectItem>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id.toString()}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white p-4 rounded-lg shadow">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
          />
        </div>
      </div>

      {/* Meal Plans Table */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Meals</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>PDF</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) :
              (!Array.isArray(mealPlans) || mealPlans.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No meal plans found
                  </TableCell>
                </TableRow>
              ) : (
                mealPlans.filter(Boolean).map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>{plan.start_date && plan.end_date ? `${new Date(plan.start_date).toLocaleDateString()} - ${new Date(plan.end_date).toLocaleDateString()}` : 'N/A'}</TableCell>
                    <TableCell>{plan.school?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {Array.isArray(plan.meals) && plan.meals.length > 0 ? (
                        <ul className="space-y-1">
                          {plan.meals.filter(Boolean).map((meal) => (
                            <li key={meal.id}>
                              <span className="font-semibold">{meal.name}</span> <span className="text-xs text-gray-500">(Day {meal.pivot?.day_of_week ?? '?'})</span> - ${typeof meal.price === 'number' ? meal.price.toFixed(2) : 'N/A'}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400">No meals</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${plan.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {plan.pdf_url ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePdfView(plan)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePdfDelete(plan)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePdfUpload(plan)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            Upload
                          </Button>
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
                          <DropdownMenuItem onClick={() => handleEdit(plan)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDelete(plan.id)}
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

      {/* Add Meal Plan Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Meal Plan</DialogTitle>
          </DialogHeader>
          <MealPlanForm
            onSuccess={() => {
              setShowAddModal(false);
              fetchMealPlans();
            }}
            onCancel={() => setShowAddModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Meal Plan Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Meal Plan</DialogTitle>
          </DialogHeader>
          {selectedMealPlan && (
            <MealPlanForm
              initialData={{
                id: selectedMealPlan.id,
                school_id: selectedMealPlan.school.id,
                start_date: selectedMealPlan.start_date,
                end_date: selectedMealPlan.end_date,
                is_active: selectedMealPlan.is_active ? 'active' : 'inactive',
                // meals removed to fix linter error
              }}
              onSuccess={() => {
                setShowEditModal(false);
                fetchMealPlans();
              }}
              onCancel={() => setShowEditModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Upload Modal */}
      <Dialog open={showPdfModal} onOpenChange={setShowPdfModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload PDF for Meal Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="pdf-file" className="block text-sm font-medium text-gray-700 mb-2">
                Select PDF File
              </label>
              <input
                id="pdf-file"
                type="file"
                accept=".pdf"
                onChange={handlePdfFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            {selectedPdfFile && (
              <div className="text-sm text-gray-600">
                Selected: {selectedPdfFile.name}
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPdfModal(false);
                  setSelectedPdfFile(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePdfUploadSubmit}
                disabled={!selectedPdfFile || uploadingPdf}
              >
                {uploadingPdf ? 'Uploading...' : 'Upload PDF'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* General PDF Upload Modal */}
      <Dialog open={showGeneralPdfModal} onOpenChange={setShowGeneralPdfModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload General PDF</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="general-pdf-title" className="block text-sm font-medium text-gray-700 mb-2">
                PDF Title
              </label>
              <Input
                id="general-pdf-title"
                placeholder="Enter PDF title"
                value={generalPdfTitle}
                onChange={(e) => setGeneralPdfTitle(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="general-pdf-file" className="block text-sm font-medium text-gray-700 mb-2">
                Select PDF File
              </label>
              <input
                id="general-pdf-file"
                type="file"
                accept=".pdf"
                onChange={handlePdfFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            {selectedPdfFile && (
              <div className="text-sm text-gray-600">
                Selected: {selectedPdfFile.name}
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowGeneralPdfModal(false);
                  setSelectedPdfFile(null);
                  setGeneralPdfTitle('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGeneralPdfUpload}
                disabled={!selectedPdfFile || !generalPdfTitle.trim() || uploadingPdf}
              >
                {uploadingPdf ? 'Uploading...' : 'Upload PDF'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MealPlanner; 