import React, { useState } from 'react';
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
import { adminApi } from '@/services/api';
import { toast } from 'sonner';

const schoolFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

type SchoolFormValues = z.infer<typeof schoolFormSchema>;

interface SchoolFormProps {
  initialData?: {
    id: number;
    name: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

const SchoolForm: React.FC<SchoolFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);

  const form = useForm<SchoolFormValues>({
    resolver: zodResolver(schoolFormSchema),
    defaultValues: initialData || {
      name: '',
    },
  });

  const onSubmit = async (data: SchoolFormValues) => {
    try {
      setLoading(true);
      if (initialData) {
        await adminApi.updateSchool(initialData.id, data);
        toast.success('School updated successfully');
      } else {
        await adminApi.createSchool(data);
        toast.success('School created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error(initialData ? 'Failed to update school' : 'Failed to create school');
    } finally {
      setLoading(false);
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
                <Input placeholder="Enter school name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : initialData ? 'Update School' : 'Create School'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default SchoolForm;