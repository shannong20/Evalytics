import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

// Backend API base URL
const API_BASE = (import.meta as any)?.env?.VITE_SERVER_URL || 'http://localhost:5000';

// Static department names per requirement
const STATIC_DEPARTMENTS = [
  'College of Agriculture',
  'College of Arts and Sciences',
  'College of Community Health and Allied Medical Sciences',
  'College of Computer Science',
  'College of Education',
  'College of Fisheries',
];

// const department = query to get listDepartments() from @departmentServices.js then modify line 240 to replace STATIC_DEPARTMENTS.

export default function SignUpForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleInitial: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'user', // 'admin' | 'user'
    role: '',     // when userType === 'user': 'faculty' | 'student' | 'supervisor'
    departmentId: null,
    departmentName: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const roleRequiresDepartment = useMemo(() => {
    if (formData.userType !== 'user') return false;
    const r = (formData.role || '').toLowerCase();
    return r === 'student' || r === 'faculty' || r === 'supervisor';
  }, [formData.userType, formData.role]);

  // No remote fetch; we use a fixed list of departments

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (submitting) return;

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    if (!formData.userType) {
      alert('Please select a user type');
      return;
    }

    if (formData.userType === 'user' && !formData.role) {
      alert('Please select a role');
      return;
    }

    if (roleRequiresDepartment && !formData.departmentName) {
      alert('Please select a department');
      return;
    }

    try {
      setSubmitting(true);
      // Map to backend expected fields
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleInitial: formData.middleInitial || undefined,
        email: formData.email,
        password: formData.password,
        userType: 'user',
        role: formData.userType === 'user' ? (formData.role || '').trim().toLowerCase() : undefined,
        departmentId: formData.departmentId || 0, //must replace this with correct logic
        departmentName: formData.departmentName || undefined,
      };

      // Debug: validate payload before sending (mask password)
      const debugPayload = { ...payload, password: payload.password ? '***' : undefined };
      console.log('Signup Payload:', debugPayload);

      const res = await fetch(`${API_BASE}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      console.log('Signup Response:', res.status, data);

      if (!res.ok) {
        const message = (data && (data.message || data.error)) || 'Sign up failed. Please try again.';
        alert(message);
        return;
      }
      
      // Success
      alert(data?.message || 'Sign up successful!');
      navigate('/auth/login');
    } catch (err) {
      alert('Network error during sign up. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next: any = { ...prev, [name]: value };
      // If switching to admin, clear role and department
      if (name === 'userType') {
        if (value !== 'user') {
          next.role = '';
          next.departmentName = '';
        }
      }
      // If role becomes empty, clear department
      if (name === 'role') {
        const r = (value || '').toLowerCase();
        if (!r) {
          next.departmentName = '';
        }
      }
      return next;
    });
  };

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
            
            {/* User Type and Role */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                {/* <Label htmlFor="userType">User Type</Label>
                <select
                  id="userType"
                  name="userType"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.userType}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select user type</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select> */}
              {/* </div>
              <div className="space-y-2"> */}
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  name="role"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={formData.userType !== 'user'}
                  required={formData.userType === 'user'}
                >
                  <option value="" disabled>{formData.userType === 'user' ? 'Select role' : 'N/A for Admin'}</option>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>
            </div>
            
            
            
            <div className="space-y-2">
              <Label htmlFor="departmentName">Department</Label>
              <select
                id="departmentName"
                name="departmentName"
                className={`flex h-10 w-full rounded-md border ${roleRequiresDepartment && !formData.departmentName ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
                value={formData.departmentName}
                onChange={handleChange}
                disabled={formData.userType !== 'user'}
              >
                <option value="">{formData.userType !== 'user' ? 'N/A for Admin' : 'Select department'}</option>
                {STATIC_DEPARTMENTS.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
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
