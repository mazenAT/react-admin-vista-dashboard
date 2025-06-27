import React, { useState, useEffect } from 'react';
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
});

interface School {
  id: number;
  name: string;
}

interface Meal {
  id: number;
  name: string;
  category: string;
}

interface MealPlanFormProps {
  initialData?: {
    id: number;
    school_id: number;
    start_date: string;
    end_date: string;
    is_active: 'active' | 'inactive';
  };
  onSuccess: () => void;
  onCancel: () => void;
}

const MealPlanForm = ({ initialData, onSuccess, onCancel }: MealPlanFormProps) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      school_id: initialData?.school_id.toString() || '',
      start_date: initialData?.start_date ? new Date(initialData.start_date) : new Date(),
      end_date: initialData?.end_date ? new Date(initialData.end_date) : new Date(),
      is_active: initialData?.is_active || 'active',
    },
  });

  const daysOfWeek = [
    { name: 'Monday', value: 1 },
    { name: 'Tuesday', value: 2 },
    { name: 'Wednesday', value: 3 },
    { name: 'Thursday', value: 4 },
    { name: 'Friday', value: 5 },
    { name: 'Saturday', value: 6 },
    { name: 'Sunday', value: 7 },
  ];

  const [selectedMeals, setSelectedMeals] = useState<{ [key: number]: { category: string; mealId: string }[] }>({});

  // Helper to get unique categories from meals
  const categories = Array.from(new Set(meals.map(m => m.category)));

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

  useEffect(() => {
    const fetchSchoolsAndMeals = async () => {
      try {
        const [schoolsResponse, mealsResponse] = await Promise.all([
          adminApi.getSchools(),
          adminApi.getMeals(),
        ]);
        setSchools(schoolsResponse.data.data);
        setMeals(mealsResponse.data.data);
      } catch (error) {
        toast.error('Failed to fetch schools or meals');
      }
    };

    fetchSchoolsAndMeals();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Convert is_active from string to boolean and set status string
    const isActiveBool = values.is_active === 'active';
    const status = values.is_active; // 'active' or 'inactive'
    // Prepare meals array for backend
    const meals = Object.entries(selectedMeals)
      .flatMap(([dayOfWeek, slots]) =>
        slots.filter(slot => slot.mealId && slot.category).map(slot => ({
          meal_id: parseInt(slot.mealId),
          day_of_week: parseInt(dayOfWeek),
          category: slot.category,
        }))
      );
    try {
      if (initialData) {
        await adminApi.updateMealPlan(initialData.id, {
          school_id: parseInt(values.school_id),
          start_date: values.start_date.toISOString(),
          end_date: values.end_date.toISOString(),
          is_active: isActiveBool,
          status,
          meals,
        });
        toast.success('Meal plan updated successfully');
      } else {
        await adminApi.createMealPlan({
          school_id: parseInt(values.school_id),
          start_date: values.start_date.toISOString(),
          end_date: values.end_date.toISOString(),
          is_active: isActiveBool,
          status,
          meals,
        });
        toast.success('Meal plan created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error('Failed to save meal plan');
    }
  };

  return (
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

        {/* Meals for each day of the week */}
        <div className="space-y-4">
          <FormLabel>Meals for Each Day</FormLabel>
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
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
                        <SelectItem key={meal.id} value={meal.id.toString()}>{meal.name}</SelectItem>
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
  );
};

export default MealPlanForm; 