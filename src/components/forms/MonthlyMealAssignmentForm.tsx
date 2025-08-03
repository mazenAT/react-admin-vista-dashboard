import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { format, eachDayOfInterval, isSameDay } from 'date-fns';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { adminApi } from '@/services/api';

interface Meal {
  id: number;
  name: string;
  category: string;
}

interface MealAssignment {
  meal_id: number;
  meal_date: string;
}

interface MonthlyMealAssignmentFormProps {
  mealPlanId: number;
  startDate: Date;
  endDate: Date;
  onSuccess: () => void;
  onCancel: () => void;
}

const MonthlyMealAssignmentForm = ({ 
  mealPlanId, 
  startDate, 
  endDate, 
  onSuccess, 
  onCancel 
}: MonthlyMealAssignmentFormProps) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [assignments, setAssignments] = useState<MealAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  // Get all dates in the plan range
  const allDates = eachDayOfInterval({ start: startDate, end: endDate });

  // Helper to get unique categories from meals
  const categories = Array.from(new Set(meals.map(m => m.category)));

  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const mealsResponse = await adminApi.getMeals();
        setMeals(mealsResponse.data.data);
      } catch (error) {
        toast.error('Failed to fetch meals');
      }
    };

    fetchMeals();
  }, []);

  const addAssignment = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (!assignments.find(a => a.meal_date === dateStr)) {
      setAssignments(prev => [...prev, { meal_id: 0, meal_date: dateStr }]);
    }
  };

  const removeAssignment = (dateStr: string) => {
    setAssignments(prev => prev.filter(a => a.meal_date !== dateStr));
  };

  const updateAssignment = (dateStr: string, mealId: number) => {
    setAssignments(prev => 
      prev.map(a => a.meal_date === dateStr ? { ...a, meal_id: mealId } : a)
    );
  };

  const handleSubmit = async () => {
    const validAssignments = assignments.filter(a => a.meal_id > 0);
    
    if (validAssignments.length === 0) {
      toast.error('Please assign at least one meal to a date');
      return;
    }

    setLoading(true);
    try {
      await adminApi.assignMealsToDates(mealPlanId, {
        meal_assignments: validAssignments
      });
      toast.success('Meals assigned to dates successfully');
      onSuccess();
    } catch (error) {
      toast.error('Failed to assign meals to dates');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-h-[70vh] overflow-y-auto p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Assign Meals to Specific Dates</h3>
        <p className="text-sm text-gray-600">
          Plan Period: {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
        </p>
      </div>

      {/* Calendar View */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Select Dates to Assign Meals</h4>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium p-2">
              {day}
            </div>
          ))}
          {allDates.map((date, index) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const hasAssignment = assignments.find(a => a.meal_date === dateStr);
            const isToday = isSameDay(date, new Date());
            
            return (
              <div
                key={index}
                className={cn(
                  "p-2 text-center text-sm border cursor-pointer hover:bg-gray-50",
                  hasAssignment && "bg-blue-100 border-blue-300",
                  isToday && "bg-yellow-100 border-yellow-300"
                )}
                onClick={() => addAssignment(date)}
              >
                {format(date, 'd')}
              </div>
            );
          })}
        </div>
      </div>

      {/* Meal Assignments */}
      <div className="space-y-4">
        <h4 className="font-medium">Meal Assignments</h4>
        {assignments.length === 0 ? (
          <p className="text-sm text-gray-500">Click on dates above to assign meals</p>
        ) : (
          assignments.map((assignment) => {
            const date = new Date(assignment.meal_date);
            const selectedMeal = meals.find(m => m.id === assignment.meal_id);
            
            return (
              <div key={assignment.meal_date} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{format(date, 'EEEE, MMM dd, yyyy')}</div>
                  <Select
                    value={assignment.meal_id.toString()}
                    onValueChange={(value) => updateAssignment(assignment.meal_date, parseInt(value))}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Select a meal" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <div key={category}>
                          <div className="px-2 py-1 text-sm font-medium text-gray-500 bg-gray-100">
                            {category}
                          </div>
                          {meals
                            .filter(meal => meal.category === category)
                            .map(meal => (
                              <SelectItem key={meal.id} value={meal.id.toString()}>
                                {meal.name}
                              </SelectItem>
                            ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeAssignment(assignment.meal_date)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })
        )}
      </div>

      <div className="flex justify-end space-x-4 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={loading || assignments.length === 0}
        >
          {loading ? 'Assigning...' : 'Assign Meals'}
        </Button>
      </div>
    </div>
  );
};

export default MonthlyMealAssignmentForm; 