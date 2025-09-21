import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiService } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const userSchema = z.object({
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  userType: z.enum(['Admin', 'User']),
  role: z.enum(['Faculty', 'Student', 'Supervisor'])
    .refine(
      (val) => {
        const form = document.forms[0];
        if (!form) return true; // Skip validation if form not found
        const userType = (form.elements.namedItem('userType') as HTMLInputElement)?.value;
        return userType === 'Admin' || !!val;
      },
      { message: 'Role is required for User accounts' }
    )
    .optional(),
  departmentId: z.string().optional(),
}).refine(
  (data) => data.userType === 'Admin' || data.role,
  {
    message: 'Role is required for User accounts',
    path: ['role']
  }
);

type UserFormValues = z.infer<typeof userSchema>;

type Department = {
  department_id: number;
  name: string;
};

type Props = {
  onSuccess: () => void;
  onCancel?: () => void;
};

export default function CreateUserForm({ onSuccess, onCancel }: Props) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      userType: 'User',
      role: undefined,
      departmentId: undefined,
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await apiService.departments.list();
        if (response.status === 'success' && response.data) {
          setDepartments(response.data);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        toast.error('Failed to load departments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const onSubmit = async (values: UserFormValues) => {
    try {
      const response = await apiService.users.create({
        ...values,
        departmentId: values.departmentId ? parseInt(values.departmentId) : undefined,
      });

      if (response.status === 'success') {
        toast.success('User created successfully');
        reset();
        onSuccess();
      } else {
        // Handle API-level errors (non-2xx responses that returned a response)
        const errorMessage = response.message || 'Failed to create user';
        if (response.status === 403) {
          toast.error('Permission denied. Only administrators can create users.');
        } else {
          throw new Error(errorMessage);
        }
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Handle network errors or 403 Forbidden
      if (error?.response?.status === 403) {
        toast.error('Permission denied. Only administrators can create users.');
      } else if (error?.response?.data?.message) {
        // Handle API error messages
        toast.error(error.response.data.message);
      } else if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred while creating the user');
      }
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Controller
            name="firstName"
            control={control}
            render={({ field }) => (
              <Input
                id="firstName"
                placeholder="Enter first name"
                {...field}
                disabled={isSubmitting}
              />
            )}
          />
          {errors.firstName && (
            <p className="text-sm text-red-500">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Controller
            name="lastName"
            control={control}
            render={({ field }) => (
              <Input
                id="lastName"
                placeholder="Enter last name"
                {...field}
                disabled={isSubmitting}
              />
            )}
          />
          {errors.lastName && (
            <p className="text-sm text-red-500">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              {...field}
              disabled={isSubmitting}
            />
          )}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              {...field}
              disabled={isSubmitting}
            />
          )}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>User Type</Label>
        <Controller
          name="userType"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Select user type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="User">User</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.userType && (
          <p className="text-sm text-red-500">{errors.userType.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Role</Label>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Faculty">Faculty</SelectItem>
                <SelectItem value="Student">Student</SelectItem>
                <SelectItem value="Supervisor">Supervisor</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.role && (
          <p className="text-sm text-red-500">{errors.role.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Department (Optional)</Label>
        <Controller
          name="departmentId"
          control={control}
          render={({ field }) => (
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem
                    key={dept.department_id}
                    value={dept.department_id.toString()}
                  >
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.departmentId && (
          <p className="text-sm text-red-500">{errors.departmentId.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white border-0"
        >
          {isSubmitting ? 'Creating...' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}