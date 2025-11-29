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

// Create base schema for create mode
const createStudentFormSchema = z.object({
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

// Create schema for edit mode - all fields optional except at least one must be provided
const editStudentFormSchema = z.object({
  name: z.string().min(1, 'Name is required').optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  school_id: z.string().min(1, 'School is required').optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  password_confirmation: z.string().optional().or(z.literal('')),
  wallet_balance: z.string().refine((val) => val === '' || !isNaN(parseFloat(val)), {
    message: 'Balance must be a valid number',
  }).optional().or(z.literal('')),
}).refine((data) => {
  // If password is provided, it must match confirmation
  if (data.password && data.password !== '') {
    return data.password === data.password_confirmation;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ['password_confirmation'],
}).refine((data) => {
  // At least one field must be provided for update
  return data.name !== '' || data.email !== '' || data.school_id !== '' || 
         (data.password !== '' && data.password) || data.wallet_balance !== '';
}, {
  message: 'At least one field must be updated',
});

type CreateStudentFormValues = z.infer<typeof createStudentFormSchema>;
type EditStudentFormValues = z.infer<typeof editStudentFormSchema>;
type StudentFormValues = CreateStudentFormValues | EditStudentFormValues;

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
    wallet?: {
      balance: number;
    };
  };
  onSuccess: () => void;
  onCancel: () => void;
  mode?: 'student' | 'parent'; // Add mode parameter
}

const StudentForm: React.FC<StudentFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);

  const isEditMode = !!initialData;
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(isEditMode ? editStudentFormSchema : createStudentFormSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      email: initialData.email,
      school_id: initialData.school_id.toString(),
      wallet_balance: (initialData.wallet?.balance || 0).toString(),
      password: '',
      password_confirmation: '',
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

      if (initialData) {
        // For edit mode: only send fields that have changed
        const updateData: any = {};
        
        if (data.name && data.name !== initialData.name) {
          updateData.name = data.name;
        }
        
        if (data.email && data.email !== initialData.email) {
          updateData.email = data.email;
        }
        
        if (data.school_id && parseInt(data.school_id) !== initialData.school_id) {
          updateData.school_id = parseInt(data.school_id);
        }
        
        if (data.password && data.password !== '') {
          updateData.password = data.password;
        }
        
        if (data.wallet_balance !== undefined && data.wallet_balance !== '') {
          const newBalance = parseFloat(data.wallet_balance);
          const currentBalance = initialData.wallet?.balance || 0;
          if (newBalance !== currentBalance) {
            updateData.wallet_balance = newBalance;
          }
        }

        // Only send update if there are changes
        if (Object.keys(updateData).length === 0) {
          toast.info('No changes to save');
          onSuccess();
          return;
        }

        await adminApi.updateUser(initialData.id, updateData);
        toast.success('User updated successfully');
      } else {
        // For create mode: send all required fields
        const studentData = {
          ...data,
          school_id: parseInt(data.school_id),
          wallet_balance: parseFloat(data.wallet_balance),
          role: 'student',
        };
        await adminApi.createUser(studentData);
        toast.success('Student created successfully');
      }
      onSuccess();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      toast.error(initialData ? `Failed to update user: ${errorMessage}` : `Failed to create student: ${errorMessage}`);
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
              <FormLabel>Password {isEditMode && <span className="text-gray-500 text-sm">(leave blank to keep current)</span>}</FormLabel>
              <FormControl>
                <Input type="password" placeholder={isEditMode ? "Enter new password (optional)" : "Enter password"} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {(!isEditMode || form.watch('password')) && (
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
        )}


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