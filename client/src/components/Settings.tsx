import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { 
  Settings as SettingsIcon, 
  School, 
  Calendar, 
  Mail, 
  Shield, 
  Database,
  Bell,
  Users,
  Save,
  RefreshCw
} from 'lucide-react';

const departments = [
  'Computer Science',
  'Mathematics',
  'Engineering',
  'Business Administration',
  'Liberal Arts',
  'Natural Sciences',
  'Education',
  'Nursing'
];

export default function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-600 mt-1">System configuration and preferences</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white border-0">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="users">User Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <School className="w-5 h-5 text-blue-600" />
                <div>
                  <CardTitle>Institution Information</CardTitle>
                  <CardDescription>Basic information about your institution</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="institution">Institution Name</Label>
                  <Input
                    id="institution"
                    defaultValue="DMMMSU-SLUC"
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="acronym">Acronym</Label>
                  <Input
                    id="acronym"
                    defaultValue="DMMMSU-SLUC"
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  defaultValue="La Union, Philippines"
                  className="border-gray-200 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    defaultValue="+63 (72) 888-0000"
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    defaultValue="admin@dmmmsu.edu.ph"
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>System Preferences</CardTitle>
              <CardDescription>General system configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Language</Label>
                  <Select defaultValue="english">
                    <SelectTrigger className="border-gray-200 focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="filipino">Filipino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select defaultValue="asia-manila">
                    <SelectTrigger className="border-gray-200 focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asia-manila">Asia/Manila</SelectItem>
                      <SelectItem value="utc">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academic" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-green-600" />
                <div>
                  <CardTitle>Academic Configuration</CardTitle>
                  <CardDescription>Manage academic periods and departments</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Current Academic Year</h4>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-900">Academic Year 2024</p>
                    <p className="text-sm text-blue-700">March 2024 - February 2025</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Evaluation Periods</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-green-900">Spring Semester 2024</p>
                      <p className="text-sm text-green-700">March - May 2024</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Fall Semester 2024</p>
                      <p className="text-sm text-gray-700">September - December 2024</p>
                    </div>
                    <Badge variant="outline">Scheduled</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Departments</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {departments.map((dept, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded text-sm text-gray-700">
                      {dept}
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="mt-3 border-gray-200 text-gray-600">
                  Manage Departments
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-orange-600" />
                <div>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Configure system notifications and alerts</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Receive notifications via email</p>
                  </div>
                  <Switch 
                    checked={emailNotifications} 
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">System Alerts</h4>
                    <p className="text-sm text-gray-600">Browser notifications for critical alerts</p>
                  </div>
                  <Switch 
                    checked={systemAlerts} 
                    onCheckedChange={setSystemAlerts}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Email Templates</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">Evaluation Reminder</p>
                        <p className="text-sm text-gray-600">Sent to users with pending evaluations</p>
                      </div>
                      <Button variant="outline" size="sm" className="border-gray-200 text-gray-600">
                        Edit
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">Account Registration</p>
                        <p className="text-sm text-gray-600">Welcome email for new users</p>
                      </div>
                      <Button variant="outline" size="sm" className="border-gray-200 text-gray-600">
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-red-600" />
                <div>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Configure security policies and access controls</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Password Policy</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Minimum Length</Label>
                      <Select defaultValue="8">
                        <SelectTrigger className="border-gray-200 focus:border-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6 characters</SelectItem>
                          <SelectItem value="8">8 characters</SelectItem>
                          <SelectItem value="10">10 characters</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Password Expiry</Label>
                      <Select defaultValue="90">
                        <SelectTrigger className="border-gray-200 focus:border-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="60">60 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                          <SelectItem value="never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Session Management</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium text-yellow-900">Session Timeout</p>
                      <p className="text-sm text-yellow-700">Auto-logout after inactivity</p>
                    </div>
                    <Select defaultValue="30">
                      <SelectTrigger className="w-32 border-yellow-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Database className="w-5 h-5 text-purple-600" />
                <div>
                  <CardTitle>Backup & Recovery</CardTitle>
                  <CardDescription>Configure data backup and recovery settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Automatic Backups</h4>
                  <p className="text-sm text-gray-600">Enable scheduled database backups</p>
                </div>
                <Switch 
                  checked={autoBackup} 
                  onCheckedChange={setAutoBackup}
                />
              </div>

              {autoBackup && (
                <div className="pl-4 border-l-2 border-purple-200">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Backup Frequency</Label>
                        <Select defaultValue="daily">
                          <SelectTrigger className="border-gray-200 focus:border-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Retention Period</Label>
                        <Select defaultValue="30">
                          <SelectTrigger className="border-gray-200 focus:border-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Recent Backups</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-green-900">March 15, 2024 - 02:00 AM</p>
                      <p className="text-sm text-green-700">Full backup completed (2.4 GB)</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Success</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-green-900">March 14, 2024 - 02:00 AM</p>
                      <p className="text-sm text-green-700">Full backup completed (2.3 GB)</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Success</Badge>
                  </div>
                </div>
                <div className="flex space-x-2 mt-3">
                  <Button variant="outline" className="border-gray-200 text-gray-600">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Create Backup Now
                  </Button>
                  <Button variant="outline" className="border-gray-200 text-gray-600">
                    View All Backups
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-indigo-600" />
                <div>
                  <CardTitle>User Roles & Permissions</CardTitle>
                  <CardDescription>Configure user roles and access permissions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-red-900">Administrator</h4>
                      <p className="text-sm text-red-700">Full system access and configuration</p>
                      <div className="mt-2">
                        <Badge className="bg-red-100 text-red-800 mr-2">All Permissions</Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-red-200 text-red-600">
                      Configure
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-blue-900">HR Manager</h4>
                      <p className="text-sm text-blue-700">User management and evaluation oversight</p>
                      <div className="mt-2 space-x-2">
                        <Badge className="bg-blue-100 text-blue-800">User Management</Badge>
                        <Badge className="bg-blue-100 text-blue-800">Reports</Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-blue-200 text-blue-600">
                      Configure
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-green-900">Faculty</h4>
                      <p className="text-sm text-green-700">Course evaluation and self-assessment</p>
                      <div className="mt-2 space-x-2">
                        <Badge className="bg-green-100 text-green-800">Evaluations</Badge>
                        <Badge className="bg-green-100 text-green-800">Profile</Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-green-200 text-green-600">
                      Configure
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-purple-900">Student</h4>
                      <p className="text-sm text-purple-700">Course and instructor evaluation</p>
                      <div className="mt-2">
                        <Badge className="bg-purple-100 text-purple-800">Course Evaluations</Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-purple-200 text-purple-600">
                      Configure
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}