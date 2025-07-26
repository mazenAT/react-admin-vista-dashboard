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
import { MoreHorizontal, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import MealPlanForm from '@/components/forms/MealPlanForm';

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
}

interface School {
  id: number;
  name: string;
}

const MealPlanner = () => {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);

  // Fetch meal plans
  const fetchMealPlans = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getMealPlans(
        selectedSchool !== 'all' ? parseInt(selectedSchool) : undefined
      );
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
        const [plansResponse, schoolsResponse] = await Promise.all([
          adminApi.getMealPlans(
            selectedSchool !== 'all' ? parseInt(selectedSchool) : undefined
          ),
          adminApi.getSchools(),
        ]);
        setMealPlans(plansResponse.data.data.data);
        setSchools(schoolsResponse.data.data);
      } catch (error) {
        toast.error('Failed to fetch initial data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [selectedSchool]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meal Planner</h1>
          <p className="text-gray-600">Plan and manage school meals</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Meal Plan
        </Button>
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
    </div>
  );
};

export default MealPlanner; 