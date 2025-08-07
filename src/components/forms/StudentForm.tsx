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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { adminApi } from '@/services/api';
import { toast } from 'sonner';

const studentFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  school_id: z.string().min(1, 'School is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
  wallet_balance: z.string().min(1, 'Initial balance is required').refine((val) => !isNaN(parseFloat(val)), {
    message: 'Balance must be a valid number',
  }),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ['password_confirmation'],
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

interface School {
  id: number;
  name: string;
}

interface StudentFormProps {
  initialData?: {
    id: number;
    name: string;
    email: string;
    school_id: number;
    wallet_balance?: number; // Made optional to match the Student interface
  };
  onSuccess: () => void;
  onCancel: () => void;
  mode?: 'student' | 'parent'; // Add mode parameter
}

const StudentForm: React.FC<StudentFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      school_id: initialData.school_id.toString(),
      wallet_balance: (initialData.wallet_balance || 0).toString(),
    } : {
      name: '',
      email: '',
      school_id: '',
      wallet_balance: '0',
      password: '',
      password_confirmation: '',
    },
  });

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await adminApi.getSchools();
        setSchools(response.data.data);
      } catch (error) {
        toast.error('Failed to fetch schools');
      }
    };

    fetchSchools();
  }, []);

  const onSubmit = async (data: StudentFormValues) => {
    try {
      setLoading(true);
      const studentData = {
        ...data,
        school_id: parseInt(data.school_id),
        wallet_balance: parseFloat(data.wallet_balance),
        role: 'student',
      };

      if (initialData) {
        await adminApi.updateUser(initialData.id, studentData);
        toast.success('Student updated successfully');
      } else {
        await adminApi.createUser(studentData);
        toast.success('Student created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error(initialData ? 'Failed to update student' : 'Failed to create student');
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
                <Input placeholder="Enter student name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password_confirmation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Confirm password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        <FormField
          control={form.control}
          name="wallet_balance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Initial Wallet Balance</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="Enter initial balance" {...field} />
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
            {loading ? 'Saving...' : initialData ? 'Update Student' : 'Create Student'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default StudentForm; 