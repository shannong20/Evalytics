import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus, Search, Edit, Trash2, Filter, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import CreateUserForm from './admin/CreateUserForm';

// Define the User interface
export interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: 'Admin' | 'User';
  role?: 'Faculty' | 'Student' | 'Supervisor';
  department_name?: string;
  is_active?: boolean;
}

interface UserManagementProps {
  // Optional callback when a user is created
  onUserCreated?: (newUser: User) => void;
  // Optional callback when a user is deleted
  onUserDeleted?: (userId: string) => void;
}

function UserManagement({ onUserCreated, onUserDeleted }: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  // Removed the filteredUsers state since we're using useMemo now
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    console.log('Starting to fetch users...');
    try {
      setIsLoading(true);
      console.log('Calling api.users.list()...');
      const response = await api.users.list();
      console.log('API Response:', response);

      // Normalize various response shapes to a users[] array
      let usersArr: any[] = [];
      if (response && typeof response === 'object') {
        if ('status' in response && response.status === 'success') {
          const data: any = (response as any).data;
          if (Array.isArray(data)) {
            usersArr = data;
          } else if (data && typeof data === 'object' && Array.isArray(data.users)) {
            usersArr = data.users;
          }
        } else if ('users' in (response as any) && Array.isArray((response as any).users)) {
          // Plain object with users array
          usersArr = (response as any).users;
        } else if (Array.isArray((response as any).data)) {
          // { data: [...] }
          usersArr = (response as any).data;
        }
      }

      if (Array.isArray(usersArr)) {
        console.log('Setting users state with normalized array:', usersArr);
        // Optionally map to the component's User type shape
        const normalized: User[] = usersArr.map((u: any) => ({
          user_id: String(u.user_id ?? u.id ?? ''),
          first_name: u.first_name ?? '',
          last_name: u.last_name ?? '',
          email: u.email ?? '',
          user_type: (u.user_type ?? 'User') as 'Admin' | 'User',
          role: u.role ?? undefined,
          department_name: u.department_name ?? u.department ?? undefined,
          is_active: u.is_active ?? true,
        }));
        setUsers(normalized);
        setError(null);
      } else {
        console.error('Unexpected response format:', response);
        setError('Failed to load users: Invalid response format');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: (response as any)?.message || 'Failed to load users: Invalid response format',
        });
      }
    } catch (err) {
      console.error('Error in fetchUsers:', err);
      setError('Failed to load users');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An error occurred while fetching users: ' + (err instanceof Error ? err.message : 'Unknown error'),
      });
    } finally {
      console.log('Finished fetching users, setting loading to false');
      setIsLoading(false);
    }
  };
  
  // Filter users based on search term and role filter
  const filteredUsers = React.useMemo(() => {
    console.log('Calculating filteredUsers...');
    console.log('Current users state:', users);
    
    // If users is not an array, return an empty array
    if (!Array.isArray(users)) {
      console.log('Users is not an array yet');
      return [];
    }
    
    // If users array is empty, return empty array
    if (users.length === 0) {
      console.log('Users array is empty');
      return [];
    }
    
    console.log('Processing users:', users);
    
    const searchTermLower = searchTerm.toLowerCase();
    const roleFilterLower = roleFilter.toLowerCase();
    
    const filtered = users.filter(user => {
      if (!user) return false;
      
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().trim();
      
      const matchesSearch = 
        searchTermLower === '' || 
        fullName.includes(searchTermLower) ||
        (user.email && user.email.toLowerCase().includes(searchTermLower));
      
      const matchesRole = 
        roleFilter === 'all' || 
        (user.role && user.role.toLowerCase() === roleFilterLower);
      
      const include = matchesSearch && matchesRole;
      
      console.log(`User ${user.user_id} (${user.email}) - `, {
        fullName,
        matchesSearch,
        matchesRole,
        searchTermLower,
        roleFilterLower,
        include
      });
      
      return include;
    });
    
    console.log('Filtered users result:', filtered);
    return filtered;
  }, [users, searchTerm, roleFilter]);

  const getRoleColor = (role?: string) => {
    if (!role) return 'bg-gray-100 text-gray-800';
    switch (role.toLowerCase()) {
      case 'faculty': return 'bg-blue-100 text-blue-800';
      case 'supervisor': return 'bg-green-100 text-green-800';
      case 'student': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserTypeDisplay = (userType: string) => {
    return userType.charAt(0).toUpperCase() + userType.slice(1).toLowerCase();
  };

  // Corrected to receive the new user object
  const handleUserCreated = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
    if (onUserCreated) {
      onUserCreated(newUser);
    }
    setIsCreateDialogOpen(false);
    
    toast({
      title: 'Success',
      description: 'User created successfully',
    });
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      setIsLoading(true);
      const response = await api.users.delete(userId);
      
      if (response.status === 'success') {
        setUsers(prev => prev.filter(user => user.user_id !== userId));
        if (onUserDeleted) {
          onUserDeleted(userId);
        }
        toast({
          title: 'Success',
          description: 'User deleted successfully',
        });
        fetchUsers();
      } else {
        throw new Error(response.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete user. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-1">Manage faculty, staff, and student accounts</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white border-0"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system. Fill in the required details below.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <CreateUserForm 
                onSuccess={handleUserCreated} 
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40 border-gray-200 focus:border-blue-500">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>Complete list of system users</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex justify-center items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading users...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell className="text-gray-600">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getUserTypeDisplay(user.user_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.role ? (
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {user.department_name || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={user.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {user.is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200"
                          disabled={isLoading}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200"
                          onClick={() => handleDeleteUser(user.user_id)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {users.length === 0 ? 'No users found' : 'No users match your search criteria'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default UserManagement;