import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  Users, 
  User, 
  UserCheck, 
  BookOpen, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  BarChart3
} from 'lucide-react';

// Mock data for performance trends
const performanceTrends = [
  { semester: 'Fall 2022', students: 4.2, peers: 4.1, supervisor: 4.0, self: 4.3 },
  { semester: 'Spring 2023', students: 4.4, peers: 4.3, supervisor: 4.2, self: 4.4 },
  { semester: 'Fall 2023', students: 4.5, peers: 4.4, supervisor: 4.3, self: 4.5 },
  { semester: 'Spring 2024', students: 4.6, peers: 4.5, supervisor: 4.4, self: 4.6 },
];

// Mock notifications
const notifications = [
  {
    id: 1,
    type: 'pending',
    title: 'Self-Evaluation Due',
    message: 'Spring 2024 self-evaluation is due in 3 days',
    priority: 'high'
  },
  {
    id: 2,
    type: 'new',
    title: 'Peer Evaluation Request',
    message: 'Dr. Juan Dela Cruz has requested your evaluation',
    priority: 'medium'
  },
  {
    id: 3,
    type: 'completed',
    title: 'Student Evaluations Complete',
    message: 'All student evaluations for CS101 have been submitted',
    priority: 'low'
  }
];

const summaryCards = [
  { 
    title: 'Student Ratings', 
    value: '4.6', 
    change: '+0.1', 
    icon: Users, 
    color: 'from-blue-500 to-blue-600',
    responses: '187 responses'
  },
  { 
    title: 'Peer Reviews', 
    value: '4.5', 
    change: '+0.1', 
    icon: UserCheck, 
    color: 'from-green-500 to-green-600',
    responses: '12 reviews'
  },
  { 
    title: 'Supervisor Rating', 
    value: '4.4', 
    change: '+0.1', 
    icon: User, 
    color: 'from-purple-500 to-purple-600',
    responses: '1 review'
  },
  { 
    title: 'Self Assessment', 
    value: '4.6', 
    change: '0', 
    icon: BookOpen, 
    color: 'from-orange-500 to-orange-600',
    responses: 'Updated'
  },
];

export default function ProfessorDashboard() {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'pending': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'new': return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">Welcome back, Dr. Santos. Here's your evaluation overview.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm text-green-600">{card.change} from last semester</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{card.responses}</p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-r ${card.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Trends Chart */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Your evaluation scores across recent semesters</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semester" />
                  <YAxis domain={[3.5, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="students" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    name="Students"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="peers" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    name="Peers"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="supervisor" 
                    stroke="hsl(var(--chart-3))" 
                    strokeWidth={2}
                    name="Supervisor"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="self" 
                    stroke="hsl(var(--chart-4))" 
                    strokeWidth={2}
                    name="Self"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Notifications Panel */}
        <div>
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Recent updates and pending tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{notification.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <Badge className={`${getPriorityColor(notification.priority)} mt-2`}>
                          {notification.priority} priority
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4 border-gray-200 text-gray-600">
                View All Notifications
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and evaluations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              className="h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
              onClick={() => window.location.href = '/professor/self-evaluation'}
            >
              <div className="text-center">
                <User className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm">Complete Self-Evaluation</span>
              </div>
            </Button>
            <Button 
              className="h-16 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0"
              onClick={() => window.location.href = '/professor/peer-evaluation'}
            >
              <div className="text-center">
                <Users className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm">Evaluate Peers</span>
              </div>
            </Button>
            <Button 
              className="h-16 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white border-0"
              onClick={() => window.location.href = '/professor/results'}
            >
              <div className="text-center">
                <BarChart3 className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm">View Reports</span>
              </div>
            </Button>
            <Button 
              variant="outline"
              className="h-16 border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <div className="text-center">
                <Calendar className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm">Schedule Meeting</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}