import React from 'react';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { adminApi } from '@/services/api';
import { toast } from 'sonner';

const mealFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.string().min(1, 'Price is required').regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format'),
  category: z.enum(['hot_meal', 'sandwich', 'sandwich_xl', 'burger', 'crepe', 'nursery'], { message: 'Invalid category' }),
  image: z.string().url('Invalid URL').optional().or(z.literal('')),
  status: z.enum(['active', 'inactive'], { message: 'Invalid status' }),
});

type MealFormValues = z.infer<typeof mealFormSchema>;

interface MealFormProps {
  initialData?: {
    id: number;
    name: string;
    description: string;
    price: number;
    category: "hot_meal" | "sandwich" | "sandwich_xl" | "burger" | "crepe" | "nursery";
    image: string;
    status: "active" | "inactive";
  };
  onSuccess: () => void;
  onCancel: () => void;
}

const MealForm: React.FC<MealFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const form = useForm<MealFormValues>({
    resolver: zodResolver(mealFormSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      description: initialData.description,
      price: initialData.price.toString(),
      category: initialData.category,
      image: initialData.image,
      status: initialData.status,
    } : {
      name: '',
      description: '',
      price: '0.00',
      category: 'hot_meal',
      image: '',
      status: 'active',
    },
  });

  const onSubmit = async (data: MealFormValues) => {
    try {
      const mealData = {
        ...data,
        price: parseFloat(data.price),
      };

      if (initialData) {
        await adminApi.updateMeal(initialData.id, mealData);
        toast.success('Meal updated successfully');
      } else {
        await adminApi.createMeal(mealData);
        toast.success('Meal created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error(initialData ? 'Failed to update meal' : 'Failed to create meal');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter meal name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter meal description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="Enter price" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="hot_meal">Hot Meal</SelectItem>
                  <SelectItem value="sandwich">Sandwich</SelectItem>
                  <SelectItem value="sandwich_xl">Sandwich XL</SelectItem>
                  <SelectItem value="burger">Burger</SelectItem>
                  <SelectItem value="crepe">Crepe</SelectItem>
                  <SelectItem value="nursery">Nursery</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input placeholder="Enter image URL" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
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

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Update Meal' : 'Create Meal'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default MealForm; 