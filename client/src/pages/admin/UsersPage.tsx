import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import UserManagement from '@/components/UserManagement';
import CreateUserForm from '@/components/admin/CreateUserForm';
import api from '@/lib/api';

interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: 'Admin' | 'User';
  role?: 'Faculty' | 'Student' | 'Supervisor';
  department_name?: string;
  is_active?: boolean;
}

export default function UsersPage() {
  const { toast } = useToast();

  const handleUserCreated = (newUser: User) => {
    toast({
      title: 'Success',
      description: 'User created successfully',
    });
  };

  const handleUserDeleted = (userId: string) => {
    // Optional: Add any additional handling when a user is deleted
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage system users and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="container mx-auto py-10">
            <UserManagement 
              onUserCreated={handleUserCreated}
              onUserDeleted={handleUserDeleted}
            />
          </div>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create New User</h2>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <CreateUserForm 
              onSuccess={handleUserCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
