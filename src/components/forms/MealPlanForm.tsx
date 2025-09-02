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
import { CalendarIcon, GripVertical, ArrowUp, ArrowDown, Copy, RotateCcw } from 'lucide-react';
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
  const [draggedItem, setDraggedItem] = useState<{ day: number; index: number } | null>(null);

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

  const [selectedMeals, setSelectedMeals] = useState<{ [key: number]: { category: string; mealId: string; order: number }[] }>({});
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
  const availableCategories = meals.length > 0 
    ? MEAL_CATEGORIES.filter(cat => meals.some(meal => meal.category === cat.value))
    : MEAL_CATEGORIES;

  // Add slot for a day
  const addMealSlot = (day: number) => {
    setSelectedMeals(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), { category: '', mealId: '', order: (prev[day]?.length || 0) + 1 }],
    }));
  };

  // Remove slot
  const removeMealSlot = (day: number, idx: number) => {
    setSelectedMeals(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== idx).map((slot, i) => ({ ...slot, order: i + 1 })),
    }));
  };

  // Update slot
  const updateMealSlot = (day: number, idx: number, slot: { category: string; mealId: string; order: number }) => {
    setSelectedMeals(prev => ({
      ...prev,
      [day]: prev[day].map((s, i) => (i === idx ? slot : s)),
    }));
  };

  // Move meal up in order
  const moveMealUp = (day: number, idx: number) => {
    if (idx === 0) return;
    setSelectedMeals(prev => {
      const newMeals = [...prev[day]];
      [newMeals[idx], newMeals[idx - 1]] = [newMeals[idx - 1], newMeals[idx]];
      return {
        ...prev,
        [day]: newMeals.map((slot, i) => ({ ...slot, order: i + 1 }))
      };
    });
  };

  // Move meal down in order
  const moveMealDown = (day: number, idx: number) => {
    setSelectedMeals(prev => {
      if (idx === prev[day].length - 1) return prev;
      const newMeals = [...prev[day]];
      [newMeals[idx], newMeals[idx + 1]] = [newMeals[idx + 1], newMeals[idx]];
      return {
        ...prev,
        [day]: newMeals.map((slot, i) => ({ ...slot, order: i + 1 }))
      };
    });
  };

  // Duplicate meal to next day
  const duplicateMealToNextDay = (day: number, idx: number) => {
    const nextDay = day === 5 ? 1 : day + 1; // Wrap around to Sunday
    const mealToDuplicate = selectedMeals[day][idx];
    
    setSelectedMeals(prev => ({
      ...prev,
      [nextDay]: [...(prev[nextDay] || []), { ...mealToDuplicate, order: (prev[nextDay]?.length || 0) + 1 }],
    }));
    
    toast.success(`Meal duplicated to ${daysOfWeek.find(d => d.value === nextDay)?.name}`);
  };

  // Clear all meals for a day
  const clearDayMeals = (day: number) => {
    if (confirm(`Are you sure you want to clear all meals for ${daysOfWeek.find(d => d.value === day)?.name}?`)) {
      setSelectedMeals(prev => ({
        ...prev,
        [day]: []
      }));
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, day: number, index: number) => {
    setDraggedItem({ day, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetDay: number, targetIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const { day: sourceDay, index: sourceIndex } = draggedItem;
    
    if (sourceDay === targetDay && sourceIndex === targetIndex) {
      setDraggedItem(null);
      return;
    }

    setSelectedMeals(prev => {
      const newMeals = { ...prev };
      const sourceMeal = newMeals[sourceDay][sourceIndex];
      
      // Remove from source
      newMeals[sourceDay] = newMeals[sourceDay].filter((_, i) => i !== sourceIndex);
      
      // Add to target
      if (!newMeals[targetDay]) newMeals[targetDay] = [];
      newMeals[targetDay].splice(targetIndex, 0, sourceMeal);
      
      // Update order numbers
      Object.keys(newMeals).forEach(day => {
        newMeals[parseInt(day)] = newMeals[parseInt(day)].map((slot, i) => ({ ...slot, order: i + 1 }));
      });
      
      return newMeals;
    });

    setDraggedItem(null);
  };

  // Function to fetch school prices for meals
  const fetchSchoolPrices = async (schoolId: string) => {
    if (schoolId === '') return;
    
    try {
      const schoolPricesResponse = await adminApi.getSchoolMealPrices(parseInt(schoolId));
      const schoolPrices = schoolPricesResponse.data.data || [];
      
      setMeals(prevMeals => {
        const updatedMeals = prevMeals.map((meal: any) => {
          const schoolPrice = schoolPrices.find(sp => sp.meal_id === meal.id);
          return {
            ...meal,
            price: parseFloat(meal.price),
            school_price: schoolPrice ? parseFloat(schoolPrice.price) : null,
          };
        });
        return updatedMeals;
      });
    } catch (error) {
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
        
        const mealsResponse = await adminApi.getMeals({ all: 'true' });
        setMeals(mealsResponse.data.data);
      } catch (error) {
        toast.error('Failed to fetch schools or meals');
      }
    };

    fetchSchoolsAndMeals();
  }, []);

  // Watch for school changes and fetch school prices
  useEffect(() => {
    const selectedSchoolId = form.watch('school_id');
    
    if (selectedSchoolId && selectedSchoolId !== prevSchoolIdRef.current && meals.length > 0) {
      prevSchoolIdRef.current = selectedSchoolId;
      fetchSchoolPrices(selectedSchoolId);
    }
  }, [form.watch('school_id')]);

  // Load existing meals when editing
  useEffect(() => {
    if (initialData?.meals && initialData.meals.length > 0) {
      const existingMeals: { [key: number]: { category: string; mealId: string; order: number }[] } = {};
      
      initialData.meals.forEach(meal => {
        const dayOfWeek = meal.pivot.day_of_week;
        if (!existingMeals[dayOfWeek]) {
          existingMeals[dayOfWeek] = [];
        }
        
        const mealData = meals.find(m => m.id === meal.id);
        const category = mealData?.category || 'hot_meal';
        
        existingMeals[dayOfWeek].push({
          category,
          mealId: meal.id.toString(),
          order: existingMeals[dayOfWeek].length + 1
        });
      });
      
      setSelectedMeals(existingMeals);
    }
  }, [initialData?.meals, meals]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const isActiveBool = values.is_active === 'active';
    const status = values.is_active;
    
    const mealPlanMeals = values.plan_type === 'weekly' ? Object.entries(selectedMeals)
      .flatMap(([dayOfWeek, slots]) =>
        slots.filter(slot => slot.mealId && slot.category).map(slot => {
          const mealId = parseInt(slot.mealId);
          const meal = meals.find(m => m.id === mealId);
          const actualPrice = meal?.school_price || meal?.price || 0;
          
          return {
            meal_id: mealId,
            day_of_week: parseInt(dayOfWeek),
            category: slot.category,
            price: actualPrice,
            base_price: meal?.price || 0,
            school_price: meal?.school_price || null,
            order: slot.order
          };
        })
      ) : [];
    
    try {
      if (initialData) {
        await adminApi.updateMealPlan(initialData.id, {
          school_id: parseInt(values.school_id),
          start_date: format(values.start_date, 'yyyy-MM-dd'),
          end_date: format(values.end_date, 'yyyy-MM-dd'),
          is_active: isActiveBool,
          status,
          meals: mealPlanMeals,
        });
        toast.success('Meal plan updated successfully');
      } else {
        const response = await adminApi.createMealPlan({
          school_id: parseInt(values.school_id),
          start_date: format(values.start_date, 'yyyy-MM-dd'),
          end_date: format(values.end_date, 'yyyy-MM-dd'),
          is_active: isActiveBool,
          status,
          meals: mealPlanMeals,
        });
        toast.success('Meal plan created successfully');
        
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
                <FormLabel>Start Date</FormLabel>
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
                <FormLabel>End Date</FormLabel>
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

          {/* Enhanced Meals for each day of the week - Only show for weekly plans */}
          {form.watch('plan_type') === 'weekly' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Meals for Each Day (Weekly Plan)</FormLabel>
                <div className="text-sm text-gray-500">
                  💡 Drag meals to reorder • Use arrows to move up/down • Duplicate to next day
                </div>
              </div>
              
              {meals.length === 0 && (
                <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md border border-blue-200">
                  ℹ️ Loading all available meals for planning...
                </p>
              )}

              {daysOfWeek.map((day) => (
                <div key={day.value} className="mb-6 p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-24 font-medium">{day.name}</span>
                      <span className="text-sm text-gray-500">
                        ({selectedMeals[day.value]?.length || 0} meals)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline" 
                        onClick={() => addMealSlot(day.value)}
                      >
                        + Add Meal
                      </Button>
                      {selectedMeals[day.value]?.length > 0 && (
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline" 
                          onClick={() => clearDayMeals(day.value)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Clear All
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {(selectedMeals[day.value] || []).map((slot, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-2 p-3 bg-white border rounded-lg shadow-sm"
                        draggable
                        onDragStart={(e) => handleDragStart(e, day.value, idx)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, day.value, idx)}
                      >
                        {/* Drag Handle */}
                        <div className="cursor-move text-gray-400 hover:text-gray-600">
                          <GripVertical className="w-4 h-4" />
                        </div>

                        {/* Order Number */}
                        <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                          {slot.order}
                        </div>

                        {/* Category Select */}
                        <Select
                          value={slot.category}
                          onValueChange={cat => updateMealSlot(day.value, idx, { ...slot, category: cat, mealId: '' })}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCategories.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Meal Select */}
                        <Select
                          value={slot.mealId}
                          onValueChange={mealId => updateMealSlot(day.value, idx, { ...slot, mealId })}
                          disabled={!slot.category}
                        >
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Select meal" />
                          </SelectTrigger>
                          <SelectContent>
                            {meals.filter(m => m.category === slot.category).map(meal => {
                              const displayPrice = meal.school_price || meal.price;
                              const priceLabel = meal.school_price ? 'School' : 'Base';
                              
                              return (
                                <SelectItem key={meal.id} value={meal.id.toString()}>
                                  {meal.name} - {Number(displayPrice).toFixed(2)} EGP ({priceLabel})
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => moveMealUp(day.value, idx)}
                            disabled={idx === 0}
                            title="Move up"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => moveMealDown(day.value, idx)}
                            disabled={idx === (selectedMeals[day.value]?.length || 0) - 1}
                            title="Move down"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => duplicateMealToNextDay(day.value, idx)}
                            disabled={!slot.mealId}
                            title="Duplicate to next day"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => removeMealSlot(day.value, idx)}
                            className="text-red-600 hover:text-red-700"
                            title="Remove meal"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
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
