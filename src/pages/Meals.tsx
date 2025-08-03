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
import { MoreHorizontal, Plus, Search, Upload, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import MealForm from '@/components/forms/MealForm';
import MealImportForm from '@/components/forms/MealImportForm';
import SchoolMealPricing from '@/components/SchoolMealPricing';

interface Meal {
  id: number;
  name: string;
  description: string;
  price: number;
  school_price?: number;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  image: string;
  status: 'active' | 'inactive';
  pdf_path?: string;
  school?: {
    id: number;
    name: string;
  };
}

const Meals = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [schools, setSchools] = useState<{id: number, name: string}[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Fetch meals
  const fetchMeals = async () => {
    try {
      setLoading(true);
      
      let response;
      if (selectedSchool !== 'all') {
        // Fetch meals with school-specific prices
        const params = {
          school_id: selectedSchool,
          ...(searchQuery && { search: searchQuery }),
          ...(selectedCategory !== 'all' && { category: selectedCategory }),
          ...(selectedStatus !== 'all' && { status: selectedStatus }),
        };
        response = await adminApi.getMealsWithSchoolPrices(parseInt(selectedSchool), params);
        const mealsData = response.data.data.map((meal: any) => ({
          id: meal.id,
          name: meal.name,
          description: meal.description,
          price: parseFloat(meal.base_price),
          school_price: parseFloat(meal.school_price),
          category: meal.category,
          image: meal.image || '',
          status: meal.status || 'active',
          pdf_path: meal.pdf_path,
        }));
        setMeals(mealsData);
      } else {
        // Fetch regular meals without school pricing
        response = await adminApi.getMeals({
          search: searchQuery || undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
        });
        const mealsData = response.data.data.map((meal: any) => ({
          ...meal,
          price: parseFloat(meal.price),
          school_price: undefined, // No school price when no school selected
        }));
        setMeals(mealsData);
      }
    } catch (error) {
      toast.error('Failed to fetch meals');
    } finally {
      setLoading(false);
    }
  };

  // Fetch schools
  const fetchSchools = async () => {
    try {
      const response = await adminApi.getSchools();
      setSchools(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch schools');
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    fetchMeals();
  }, [searchQuery, selectedCategory, selectedStatus, selectedSchool]);

  // Handle meal deletion
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this meal?')) return;
    
    try {
      await adminApi.deleteMeal(id);
      toast.success('Meal deleted successfully');
      fetchMeals();
    } catch (error) {
      toast.error('Failed to delete meal');
    }
  };

  // Handle edit
  const handleEdit = (meal: Meal) => {
    setSelectedMeal(meal);
    setShowEditModal(true);
  };

  // Handle PDF upload
  const handlePdfUpload = (meal: Meal) => {
    setSelectedMeal(meal);
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
    if (!selectedMeal || !selectedPdfFile) return;

    try {
      setUploadingPdf(true);
      const formData = new FormData();
      formData.append('pdf', selectedPdfFile);

      await adminApi.uploadMealPdf(selectedMeal.id, formData);
      toast.success('PDF uploaded successfully');
      setShowPdfModal(false);
      setSelectedPdfFile(null);
      fetchMeals();
    } catch (error) {
      toast.error('Failed to upload PDF');
    } finally {
      setUploadingPdf(false);
    }
  };

  // Handle PDF view
  const handlePdfView = async (meal: Meal) => {
    try {
      const response = await adminApi.getMealPdf(meal.id);
      if (response.data.pdf_url) {
        window.open(response.data.pdf_url, '_blank');
      }
    } catch (error) {
      toast.error('Failed to load PDF');
    }
  };

  // Handle PDF delete
  const handlePdfDelete = async (meal: Meal) => {
    if (!confirm('Are you sure you want to delete the PDF for this meal?')) return;

    try {
      await adminApi.deleteMealPdf(meal.id);
      toast.success('PDF deleted successfully');
      fetchMeals();
    } catch (error) {
      toast.error('Failed to delete PDF');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meals</h1>
          <p className="text-gray-600">Manage your school's meals</p>
        </div>
        <div className="flex space-x-4">
          <Button 
            variant="outline"
            onClick={() => setShowImportModal(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Meals
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Meal
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowPricingModal(true)}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            School Pricing
          </Button>
        </div>
      </div>

      {/* Filters */}
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
        <Select value={selectedSchool} onValueChange={setSelectedSchool}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select School" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Schools</SelectItem>
            {schools.map(school => (
              <SelectItem key={school.id} value={school.id.toString()}>
                {school.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="hot meal">Hot Meal</SelectItem>
            <SelectItem value="sandwich">Sandwich</SelectItem>
            <SelectItem value="pasta">Pasta</SelectItem>
            <SelectItem value="salad">Salad</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Meals Table */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
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
            ) : meals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No meals found
                </TableCell>
              </TableRow>
            ) : (
              meals.map((meal) => (
                <TableRow key={meal.id}>
                  <TableCell className="font-medium">{meal.name}</TableCell>
                  <TableCell>{meal.description}</TableCell>
                  <TableCell className="capitalize">{meal.category}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      {selectedSchool === 'all' ? (
                        <span className="font-medium">${meal.price.toFixed(2)}</span>
                      ) : (
                        <>
                          <span className="text-sm text-gray-500">Base: ${meal.price.toFixed(2)}</span>
                          {meal.school_price && (
                            <span className={`font-medium ${Number(meal.school_price) !== Number(meal.price) ? 'text-green-600' : 'text-gray-700'}`}>
                              School: ${Number(meal.school_price).toFixed(2)}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      meal.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {meal.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(meal)}>
                          Edit
                        </DropdownMenuItem>
                        {meal.pdf_path ? (
                          <>
                            <DropdownMenuItem onClick={() => handlePdfView(meal)}>
                              View PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePdfDelete(meal)}>
                              Delete PDF
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onClick={() => handlePdfUpload(meal)}>
                            Upload PDF
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDelete(meal.id)}
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

      {/* Add Meal Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Meal</DialogTitle>
          </DialogHeader>
          <MealForm
            onSuccess={() => {
              setShowAddModal(false);
              fetchMeals();
            }}
            onCancel={() => setShowAddModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Meal Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Meal</DialogTitle>
          </DialogHeader>
          {selectedMeal && (
            <MealForm
              initialData={selectedMeal}
              onSuccess={() => {
                setShowEditModal(false);
                setSelectedMeal(null);
                fetchMeals();
              }}
              onCancel={() => {
                setShowEditModal(false);
                setSelectedMeal(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Import Meals Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Meals</DialogTitle>
          </DialogHeader>
          <MealImportForm
            onSuccess={() => {
              setShowImportModal(false);
              fetchMeals();
            }}
            onCancel={() => setShowImportModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* School Meal Pricing Modal */}
      <Dialog open={showPricingModal} onOpenChange={setShowPricingModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>School Meal Pricing</DialogTitle>
          </DialogHeader>
          <SchoolMealPricing />
        </DialogContent>
      </Dialog>

      {/* PDF Upload Modal */}
      <Dialog open={showPdfModal} onOpenChange={setShowPdfModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload PDF for {selectedMeal?.name}</DialogTitle>
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
    </div>
  );
};

export default Meals;
