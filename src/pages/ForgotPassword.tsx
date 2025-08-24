import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { toast } from 'sonner';
import { adminApi } from '@/services/api';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address').nonempty('Email is required'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      setLoading(true);
      
      // Log the data being sent for debugging
      console.log('Submitting forgot password request with data:', data);
      
      // Make sure the email is properly included in the request
      const requestData = {
        email: data.email.trim(), // Ensure email is trimmed and included
      };
      
      console.log('Request data being sent:', requestData);
      
      // Call the forgot password API
      const response = await adminApi.forgotPassword(requestData);
      
      toast.success('Password reset instructions sent to your email');
      navigate('/login');
    } catch (error: any) {
      console.error('Forgot password error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.email?.[0] || 
                          'Failed to send reset instructions';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center mb-4">
            <img src="/Logo.jpg" alt="Logo" className="h-16 w-auto" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Forgot Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email to reset your password
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
            <div className="rounded-md shadow-sm space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        {...field}
                        onChange={(e) => {
                          // Ensure the field value is properly updated
                          field.onChange(e);
                          console.log('Email field changed to:', e.target.value);
                        }}
                        onBlur={(e) => {
                          // Ensure the field value is properly updated on blur
                          field.onBlur();
                          console.log('Email field blur, current value:', e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Instructions'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Back to Sign In
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ForgotPassword; 