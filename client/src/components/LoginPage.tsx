import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../context/AuthContext';

// Backend API base URL
const API_BASE = (import.meta as any)?.env?.VITE_SERVER_URL || 'http://localhost:5000';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!formData.email || !formData.password) {
      alert('Please enter your email and password');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = (data && (data.message || data.error)) || 'Invalid email or password';
        alert(message);
        return;
      }

      // Persist authenticated session in AuthContext (and localStorage via AuthProvider)
      if (data && data.token && data?.data?.user) {
        setAuth({ user: data.data.user, token: data.token });
      }

      alert('Login successful!');

      // Prefer backend-provided role if present; fallback to selected role
      const userRole = (data?.data?.user?.role || formData.role || '').toLowerCase();
      switch (userRole) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'student':
          navigate('/student');
          break;
        case 'faculty':
        case 'professor':
          navigate('/professor/dashboard');
          break;
        case 'supervisor':
          navigate('/supervisor/dashboard');
          break;
        default:
          // Generic fallback
          navigate('/');
      }
    } catch (err) {
      alert('Network error during login. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">E</span>
          </div>
          <div>
            <CardTitle className="text-2xl text-gray-800">Evalytics</CardTitle>
            <CardDescription className="text-gray-600">
              DMMMSU-SLUC Analytics System
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-sm text-blue-600 hover:underline">
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full"
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 disabled:opacity-60">
              Sign In
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            
            <Link to="/auth/signup">
              <Button type="button" variant="outline" className="w-full">
                Create an account
              </Button>
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}