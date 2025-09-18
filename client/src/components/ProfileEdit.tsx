import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';

const API_BASE = (import.meta as any)?.env?.VITE_SERVER_URL || 'http://localhost:5000';
const STATIC_DEPARTMENTS = [
  'College of Agriculture',
  'College of Arts and Sciences',
  'College of Community Health and Allied Medical Sciences',
  'College of Computer Science',
  'College of Education',
  'College of Fisheries',
];

export default function ProfileEdit() {
  const { user, token, setAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState([] as any);
  const [form, setForm] = useState({
    lastName: '',
    firstName: '',
    middleInitial: '',
    email: '',
    userType: '', // 'admin' | 'user'
    role: '',     // if userType === 'user'
    departmentName: '',
  });

  const roleRequiresDepartment = useMemo(() => {
    if (form.userType !== 'user') return false;
    const r = (form.role || '').toLowerCase();
    return r === 'student' || r === 'faculty' || r === 'supervisor';
  }, [form.userType, form.role]);

  useEffect(() => {
    // Load departments for mapping id -> name when pre-filling
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/departments`);
        const data = await res.json();
        if (res.ok && Array.isArray(data?.data)) setDepartments(data.data);
      } catch (_) {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          const u = (data?.data?.user || {}) as any;
          const existingDeptId = u.department_id ? String(u.department_id) : '';
          // Try to map current department_id to its name using the fetched departments list; fallback empty
          const depObj = (departments || []).find((d: any) => String(d.department_id) === existingDeptId);
          setForm({
            lastName: u.last_name ?? u.lastname ?? '',
            firstName: u.first_name ?? u.firstname ?? '',
            middleInitial: u.middle_initial ?? '',
            email: u.email ?? '',
            userType: u.user_type ?? '',
            role: u.role ?? '',
            departmentName: depObj?.name || '',
          });
        }
      } catch (_) {
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const onChange = (e: any) => {
    const { name, value } = e.target;
    setForm(prev => {
      const next: any = { ...prev, [name]: value };
      if (name === 'userType') {
        if (value !== 'user') {
          next.role = '';
          next.departmentName = '';
        }
      }
      if (name === 'role') {
        const r = (value || '').toLowerCase();
        if (!(r === 'faculty' || r === 'supervisor')) {
          next.departmentName = '';
        }
      }
      return next;
    });
  };

  const onSave = async (e: any) => {
    e.preventDefault();
    if (saving) return;

    if (!form.userType) {
      alert('Please select a user type');
      return;
    }
    if (form.userType === 'user' && !form.role) {
      alert('Please select a role');
      return;
    }
    if (roleRequiresDepartment && !form.departmentName) {
      alert('Please select a department');
      return;
    }

    try {
      setSaving(true);
      // Build snake_case payload for updateUser
      const payload: any = {
        last_name: form.lastName,
        first_name: form.firstName,
        middle_initial: form.middleInitial || undefined,
        email: form.email,
        user_type: form.userType,
        role: form.userType === 'user' ? (form.role || '').toLowerCase() : undefined,
        departmentName: form.departmentName || undefined,
      };

      // Debug: log payload (mask email minimal and no password here)
      console.log('Profile Update Payload:', payload);

      const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      console.log('Profile Update Response:', res.status, data);
      if (!res.ok) {
        const msg = data?.message || 'Failed to update profile';
        alert(msg);
        return;
      }
      // Update auth context copy
      if (data?.data?.user) {
        setAuth({ user: data.data.user, token: token as string });
      }
      alert('Profile updated successfully');
    } catch (_) {
      alert('Network error while saving profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-600">Loading profile...</div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSave} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" value={form.lastName} onChange={onChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" name="firstName" value={form.firstName} onChange={onChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleInitial">Middle Initial</Label>
                <Input id="middleInitial" name="middleInitial" value={form.middleInitial} onChange={onChange} maxLength={1} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={onChange} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userType">User Type</Label>
                <select id="userType" name="userType" className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.userType} onChange={onChange} required>
                  <option value="" disabled>Select user type</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select id="role" name="role" className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.role} onChange={onChange} disabled={form.userType !== 'user'} required={form.userType === 'user'}>
                  <option value="" disabled>{form.userType === 'user' ? 'Select role' : 'N/A for Admin'}</option>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="departmentName">Department</Label>
              <select id="departmentName" name="departmentName" className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm ${roleRequiresDepartment && !form.departmentName ? 'border-red-500' : ''}`} value={form.departmentName} onChange={onChange} disabled={form.userType !== 'user'}>
                <option value="">{form.userType !== 'user' ? 'N/A for Admin' : 'Select department'}</option>
                {STATIC_DEPARTMENTS.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              {form.userType === 'user' && roleRequiresDepartment && !form.departmentName && (
                <p className="text-xs text-red-600">Department is required for Student, Faculty, and Supervisor roles.</p>
              )}
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={saving} className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
