import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { adminApi } from '@/services/api';

const formSchema = z.object({
  school_id: z.string().min(1, 'School is required'),
  start_date: z.date({
    required_error: 'Date is required',
  }),
  end_date: z.date({
    required_error: 'Date is required',
  }),
  is_active: z.enum(['active', 'inactive']),
  plan_type: z.enum(['weekly', 'monthly']),
});

interface School {
  id: number;
  name: string;
}

interface Meal {
  id: number;
  name: string;
  category: string;
  price: number;
  school_price?: number | null;
}

interface MealPlanFormProps {
  initialData?: {
    id: number;
    school_id: number;
    start_date: string;
    end_date: string;
    is_active: 'active' | 'inactive';
    meals?: {
      id: number;
      name: string;
      description: string;
      price: number;
      pivot: { day_of_week: number };
    }[];
  };
  onSuccess: () => void;
  onCancel: () => void;
  onAssignMonthlyMeals?: (mealPlanId: number, startDate: Date, endDate: Date) => void;
}

const MealPlanForm = ({ initialData, onSuccess, onCancel, onAssignMonthlyMeals }: MealPlanFormProps) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      school_id: initialData?.school_id.toString() || '',
      start_date: initialData?.start_date ? new Date(initialData.start_date) : new Date(),
      end_date: initialData?.end_date ? new Date(initialData.end_date) : new Date(),
      is_active: initialData?.is_active || 'active',
      plan_type: 'weekly', // Default to weekly plan
    },
  });

  const daysOfWeek = [
    { name: 'Sunday', value: 1 },
    { name: 'Monday', value: 2 },
    { name: 'Tuesday', value: 3 },
    { name: 'Wednesday', value: 4 },
    { name: 'Thursday', value: 5 },
  ];

  const [selectedMeals, setSelectedMeals] = useState<{ [key: number]: { category: string; mealId: string }[] }>({});
  const prevSchoolIdRef = useRef<string>('');

  // Helper to get unique categories from meals
  const categories = Array.from(new Set(meals.map(m => m.category)));

  // Predefined meal categories with labels
  const MEAL_CATEGORIES = [
    { value: 'hot_meal', label: 'Hot Meal' },
    { value: 'sandwich', label: 'Sandwich' },
    { value: 'sandwich_xl', label: 'Sandwich XL' },
    { value: 'burger', label: 'Burger' },
    { value: 'crepe', label: 'Crepe' },
    { value: 'nursery', label: 'Nursery' }
  ];

  // Filter categories to only show those that have meals available
  // If no meals are loaded yet, show all categories
  const availableCategories = meals.length > 0 
    ? MEAL_CATEGORIES.filter(cat => meals.some(meal => meal.category === cat.value))
    : MEAL_CATEGORIES;
  
  console.log('=== MEAL STATE DEBUG ===');
  console.log('Meals length:', meals.length);
  console.log('Available categories:', availableCategories);
  console.log('Meal categories found:', [...new Set(meals.map(m => m.category))]);
  console.log('Sample meals by category:');
  MEAL_CATEGORIES.forEach(cat => {
    const categoryMeals = meals.filter(m => m.category === cat.value);
    console.log(`${cat.label} (${cat.value}):`, categoryMeals.length, 'meals');
    if (categoryMeals.length > 0) {
      console.log('  First meal:', categoryMeals[0]);
    }
  });

  // Add slot for a day
  const addMealSlot = (day: number) => {
    setSelectedMeals(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), { category: '', mealId: '' }],
    }));
  };
  // Remove slot
  const removeMealSlot = (day: number, idx: number) => {
    setSelectedMeals(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== idx),
    }));
  };
  // Update slot
  const updateMealSlot = (day: number, idx: number, slot: { category: string; mealId: string }) => {
    setSelectedMeals(prev => ({
      ...prev,
      [day]: prev[day].map((s, i) => (i === idx ? slot : s)),
    }));
  };

  // Function to fetch school prices for meals
  const fetchSchoolPrices = async (schoolId: string) => {
    if (schoolId === '') return;
    
    try {
      const schoolPricesResponse = await adminApi.getSchoolMealPrices(parseInt(schoolId));
      const schoolPrices = schoolPricesResponse.data.data || [];
      
      // Update meals with school prices
      setMeals(prevMeals => prevMeals.map(meal => {
        const schoolPrice = schoolPrices.find(sp => sp.meal_id === meal.id);
        return {
          ...meal,
          school_price: schoolPrice ? parseFloat(schoolPrice.price) : null,
        };
      }));
    } catch (error) {
      console.error('Failed to fetch school prices:', error);
      // If school prices fail, reset to base prices
      setMeals(prevMeals => prevMeals.map(meal => ({
        ...meal,
        school_price: null,
      })));
    }
  };

  useEffect(() => {
    const fetchSchoolsAndMeals = async () => {
      try {
        const schoolsResponse = await adminApi.getSchools();
        setSchools(schoolsResponse.data.data);
        
        // Fetch ALL meals without school prices initially (for meal planning)
        const mealsResponse = await adminApi.getMeals({ all: 'true' });
        console.log('=== MEAL FETCHING DEBUG ===');
        console.log('Full API Response:', mealsResponse);
        console.log('Response data:', mealsResponse.data);
        console.log('Meals array:', mealsResponse.data.data);
        console.log('Total meals fetched:', mealsResponse.data.data?.length);
        console.log('First 3 meals:', mealsResponse.data.data?.slice(0, 3));
        setMeals(mealsResponse.data.data);
      } catch (error) {
        console.error('=== MEAL FETCHING ERROR ===');
        console.error('Full error:', error);
        console.error('Error response:', error.response);
        console.error('Error message:', error.message);
        toast.error('Failed to fetch schools or meals');
      }
    };

    fetchSchoolsAndMeals();
  }, []);

  // Debug useEffect to track meals state changes
  useEffect(() => {
    console.log('=== MEALS STATE CHANGED ===');
    console.log('New meals array:', meals);
    console.log('Meals count:', meals.length);
    if (meals.length > 0) {
      console.log('First meal structure:', meals[0]);
      console.log('Available meal categories:', [...new Set(meals.map(m => m.category))]);
    }
  }, [meals]);

  // Watch for school changes and fetch school prices
  useEffect(() => {
    const selectedSchoolId = form.watch('school_id');
    
    // Only fetch if school changed and we have meals
    if (selectedSchoolId && selectedSchoolId !== prevSchoolIdRef.current && meals.length > 0) {
      prevSchoolIdRef.current = selectedSchoolId;
      fetchSchoolPrices(selectedSchoolId);
    }
  }, [form.watch('school_id')]);

  // Load existing meals when editing
  useEffect(() => {
    if (initialData?.meals && initialData.meals.length > 0) {
      const existingMeals: { [key: number]: { category: string; mealId: string }[] } = {};
      
      initialData.meals.forEach(meal => {
        const dayOfWeek = meal.pivot.day_of_week;
        if (!existingMeals[dayOfWeek]) {
          existingMeals[dayOfWeek] = [];
        }
        
        // Find the meal category from the meals array
        const mealData = meals.find(m => m.id === meal.id);
        const category = mealData?.category || 'hot_meal'; // Default fallback
        
        existingMeals[dayOfWeek].push({
          category,
          mealId: meal.id.toString()
        });
      });
      
      setSelectedMeals(existingMeals);
    }
  }, [initialData?.meals, meals]);

  // Note: School-specific pricing can be handled separately
  // For now, we use the same meals for all schools and focus on categorization
  // useEffect(() => {
  //   const fetchMealsWithSchoolPrices = async () => {
  //     const selectedSchoolId = form.watch('school_id');
  //     if (selectedSchoolId) {
  //       try {
  //         const response = await adminApi.getMealsWithSchoolPrices(parseInt(selectedSchoolId));
  //         console.log('Fetched meals with school prices:', response.data.data);
  //         setMeals(response.data.data || []);
  //       } catch (error) {
  //         console.error('Error fetching meals with school prices:', error);
  //         toast.error('Failed to fetch meals with school prices');
  //       }
  //     }
  //   };

  //   fetchMealsWithSchoolPrices();
  // }, [form.watch('school_id')]);

  // Prefill selectedMeals with initialData.meals if editing
  useEffect(() => {
    if (initialData && (initialData as any).meals && meals.length > 0) {
      const byDay: { [key: number]: { category: string; mealId: string }[] } = {};
      ((initialData as any).meals as any[]).forEach((meal: any) => {
        const day = meal.pivot?.day_of_week || meal.day_of_week;
        if (!byDay[day]) byDay[day] = [];
        byDay[day].push({
          category: meal.category,
          mealId: meal.id.toString(),
        });
      });
      setSelectedMeals(byDay);
    }
  }, [initialData, meals]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Convert is_active from string to boolean and set status string
    const isActiveBool = values.is_active === 'active';
    const status = values.is_active; // 'active' or 'inactive'
    
    // For weekly plans, prepare meals array for backend
    const meals = values.plan_type === 'weekly' ? Object.entries(selectedMeals)
      .flatMap(([dayOfWeek, slots]) =>
        slots.filter(slot => slot.mealId && slot.category).map(slot => ({
          meal_id: parseInt(slot.mealId),
          day_of_week: parseInt(dayOfWeek),
          category: slot.category,
        }))
      ) : [];
    
    try {
      if (initialData) {
        await adminApi.updateMealPlan(initialData.id, {
          school_id: parseInt(values.school_id),
          start_date: format(values.start_date, 'yyyy-MM-dd'),
          end_date: format(values.end_date, 'yyyy-MM-dd'),
          is_active: isActiveBool,
          status,
          meals,
        });
        toast.success('Meal plan updated successfully');
      } else {
        const response = await adminApi.createMealPlan({
          school_id: parseInt(values.school_id),
          start_date: format(values.start_date, 'yyyy-MM-dd'),
          end_date: format(values.end_date, 'yyyy-MM-dd'),
          is_active: isActiveBool,
          status,
          meals,
        });
        toast.success('Meal plan created successfully');
        
        // If it's a monthly plan, show the meal assignment form
        if (values.plan_type === 'monthly' && onAssignMonthlyMeals) {
          const mealPlanId = response.data.data.id;
          onAssignMonthlyMeals(mealPlanId, values.start_date, values.end_date);
        }
      }
      onSuccess();
    } catch (error) {
      toast.error('Failed to save meal plan');
    }
  };

  return (
    <div className="max-h-[70vh] overflow-y-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="school_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>School</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a school" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id.toString()}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="plan_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly Plan (Repeating)</SelectItem>
                    <SelectItem value="monthly">Monthly Plan (Unique Daily)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Meals for each day of the week - Only show for weekly plans */}
          {form.watch('plan_type') === 'weekly' && (
            <div className="space-y-4">
              <FormLabel>Meals for Each Day (Weekly Plan)</FormLabel>
              {meals.length === 0 && (
                <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md border border-blue-200">
                  ℹ️ Loading all available meals for planning...
                </p>
              )}

              {daysOfWeek.map((day) => (
                <div key={day.value} className="mb-4">
                  <div className="flex items-center mb-2">
                    <span className="w-24 font-medium">{day.name}</span>
                    <Button type="button" size="sm" variant="outline" onClick={() => addMealSlot(day.value)}>
                      + Add Meal
                    </Button>
                  </div>
                  

                  
                  {(selectedMeals[day.value] || []).map((slot, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <Select
                        value={slot.category}
                        onValueChange={cat => updateMealSlot(day.value, idx, { ...slot, category: cat, mealId: '' })}
                      >
                        <SelectTrigger className="w-36"><SelectValue placeholder="Category" /></SelectTrigger>
                        <SelectContent>
                          {availableCategories.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={slot.mealId}
                        onValueChange={mealId => updateMealSlot(day.value, idx, { ...slot, mealId })}
                        disabled={!slot.category}
                      >
                        <SelectTrigger className="w-64"><SelectValue placeholder="Select meal" /></SelectTrigger>
                        <SelectContent>
                          {meals.filter(m => m.category === slot.category).map(meal => (
                            <SelectItem key={meal.id} value={meal.id.toString()}>
                              {meal.name} - {meal.school_price ? 
                                `${Number(meal.school_price).toFixed(2)} EGP (School)` : 
                                `${Number(meal.price).toFixed(2)} EGP (Base)`
                              }
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" size="icon" variant="ghost" onClick={() => removeMealSlot(day.value, idx)}>
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Monthly plan info */}
          {form.watch('plan_type') === 'monthly' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Monthly Plan</h4>
              <p className="text-sm text-blue-700">
                After creating this plan, you'll be able to assign specific meals to each date in the plan period.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button type="submit">
              {initialData ? 'Update' : 'Create'} Meal Plan
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default MealPlanForm; 