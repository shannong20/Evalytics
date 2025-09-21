import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2 } from 'lucide-react';
import apiService, { ApiResponse } from '../lib/api';

interface Department {
  id: number;
  name: string;
}

type FormData = {
  firstName: string;
  lastName: string;
  middleInitial: string;
  email: string;
  password: string;
  confirmPassword: string;
  userType: string;
  role: string;
  departmentId: number | null;
  departmentName: string;
};

const API_BASE = (import.meta as any)?.env?.VITE_SERVER_URL || 'http://localhost:5000';

export default function SignUpForm() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [localSelectedDept, setLocalSelectedDept] = useState('');
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    middleInitial: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'user',
    role: '',
    departmentId: null,
    departmentName: '',
  });
  
  const [submitting, setSubmitting] = useState(false);
  
  const roleRequiresDepartment = useMemo(() => {
    const r = (formData.role || '').toLowerCase();
    return r === 'student' || r === 'faculty' || r === 'supervisor';
  }, [formData.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    
    console.log('Form submission started', { formData, localSelectedDept });

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    if (!formData.role) {
      alert('Please select a role');
      return;
    }

    // Ensure departments are loaded
    if (isLoading) {
      alert('Please wait while we load the departments...');
      return;
    }

    if (departments.length === 0) {
      alert('Failed to load departments. Please refresh the page and try again.');
      return;
    }

    // Create a copy of formData to avoid direct state mutation
    const submissionData = { ...formData };

    if (roleRequiresDepartment) {
      if (!localSelectedDept) {
        alert('Please select a department');
        return;
      }
      
      console.log('Available departments:', departments);
      console.log('Selected department ID:', localSelectedDept);
      
      // Ensure formData is in sync with the selected department
      const selectedDeptId = parseInt(localSelectedDept, 10);
      const selectedDept = departments.find((dept: Department) => dept.id === selectedDeptId);
      
      console.log('Found department:', selectedDept);
      
      if (!selectedDept) {
        console.error('Department not found in the list. Available departments:', departments);
        alert('Invalid department selected. Please try again.');
        return;
      }
      
      // Update submission data with the selected department
      submissionData.departmentId = selectedDept.id;
      submissionData.departmentName = selectedDept.name;
    }

    setSubmitting(true);

    try {
      console.log('Registration payload:', {
        firstName: submissionData.firstName,
        lastName: submissionData.lastName,
        middleInitial: submissionData.middleInitial,
        email: submissionData.email,
        password: submissionData.password,
        userType: 'User',
        role: submissionData.role,
        departmentId: submissionData.departmentId
      });

      // Try with direct fetch to bypass any potential apiService issues
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: submissionData.firstName,
          lastName: submissionData.lastName,
          middleInitial: submissionData.middleInitial,
          email: submissionData.email,
          password: submissionData.password,
          userType: 'User',
          role: submissionData.role,
          departmentId: submissionData.departmentId
        }),
      });

      const data = await response.json();
      console.log('Registration response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.message || 'Failed to register');
      }

      alert('Registration successful! Please log in.');
      navigate('/login');
    } catch (err: any) {
      console.error('Registration error:', err);
      let errorMessage = 'Failed to register. Please try again.';
      
      // Handle API response errors
      if (err.response?.data?.errors) {
        errorMessage = err.response.data.errors.map((e: any) => e.msg).join('\n');
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev: FormData) => {
      const next = { ...prev, [name]: value };
      
      if (name === 'role') {
        const r = (value || '').toLowerCase();
        if (!r) {
          next.departmentId = null;
          next.departmentName = '';
          setLocalSelectedDept('');
        }
      }
      
      return next;
    });
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    console.log('Selected department value:', selectedValue);
    console.log('Current departments:', departments);
    
    setLocalSelectedDept(selectedValue);
    
    if (!selectedValue) {
      setFormData((prev: FormData) => ({
        ...prev,
        departmentId: null,
        departmentName: ''
      }));
      return;
    }
    
    const selectedDeptId = Number(selectedValue);
    const selectedDept = departments.find(dept => dept.id === selectedDeptId);
    
    console.log('Found department in change handler:', selectedDept);
    
    if (selectedDept) {
      console.log('Setting department:', selectedDept);
      setFormData((prev: FormData) => ({
        ...prev,
        departmentId: selectedDept.id,
        departmentName: selectedDept.name
      }));
    } else {
      console.error('Department not found in change handler. Available departments:', departments);
      // Reset the selection if the department isn't found
      setLocalSelectedDept('');
      setFormData((prev: FormData) => ({
        ...prev,
        departmentId: null,
        departmentName: ''
      }));
    }
  };


  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        console.log('Fetching departments...');
        const response = await apiService.departments.list();
        console.log('API Response:', response); // Log the full response
        
        if (response.status === 'success' && response.data && Array.isArray(response.data)) {
          const depts = response.data.map((dept: any) => {
            // Ensure IDs are numbers for consistent comparison
            const id = Number(dept.id || dept.department_id);
            const name = String(dept.name || dept.department_name || 'Unknown Department');
            console.log(`Mapped department - ID: ${id} (${typeof id}), Name: ${name}`);
            return { id, name };
          });
          
          console.log('Final mapped departments array:', depts);
          setDepartments(depts);
          
          // If we have a selected department, ensure it exists in the new list
          if (localSelectedDept) {
            const selectedId = Number(localSelectedDept);
            const exists = depts.some((dept: Department) => dept.id === selectedId);
            console.log(`Department ${selectedId} (${typeof selectedId}) exists in new list:`, exists);
            
            // If the selected department doesn't exist in the new list, reset the selection
            if (!exists) {
              console.log('Resetting department selection');
              setLocalSelectedDept('');
              setFormData(prev => ({
                ...prev,
                departmentId: null,
                departmentName: ''
              }));
            }
          }
        } else {
          console.error('Failed to load departments:', response);
          setError('Failed to load departments');
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
        setError('Error loading departments. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">E</span>
          </div>
          <div>
            <CardTitle className="text-2xl text-gray-800">Create an Account</CardTitle>
            <CardDescription className="text-gray-600">
              Join Evalytics today
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleInitial">Middle Initial</Label>
                <Input
                  id="middleInitial"
                  name="middleInitial"
                  type="text"
                  maxLength={1}
                  value={formData.middleInitial}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">Select a role</option>
                <option value="faculty">Faculty</option>
                <option value="student">Student</option>
                <option value="supervisor">Supervisor</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              {isLoading ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="ml-2">Loading departments...</span>
                </div>
              ) : error ? (
                <div className="text-sm text-red-500">{error}</div>
              ) : (
                <select
                  id="department"
                  name="department"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={localSelectedDept}
                  onChange={handleDepartmentChange}
                  required={roleRequiresDepartment}
                  disabled={isLoading}
                >
                  <option value="">Select a department</option>
                  {departments.map((dept: Department) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              )}
              {formData.userType === 'user' && roleRequiresDepartment && !formData.departmentName && (
                <p className="text-xs text-red-600">Department is required for Student, Faculty, and Supervisor roles.</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
            
            <Button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 disabled:opacity-60">
              Sign Up
            </Button>
            
            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-blue-600 hover:underline">
                Log in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
