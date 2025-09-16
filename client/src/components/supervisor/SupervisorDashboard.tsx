import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { 
  Users, 
  UserCheck, 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  CheckCircle2,
  Star,
  Calendar
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Mock data
const departmentStats = {
  totalProfessors: 12,
  totalNTP: 8,
  avgProfessorScore: 4.2,
  avgNTPScore: 4.5,
  pendingEvaluations: 5,
  completedEvaluations: 15
};

const professorPerformanceData = [
  { name: 'Dr. Johnson', teaching: 4.5, research: 4.2, leadership: 4.0, professionalism: 4.3 },
  { name: 'Prof. Chen', teaching: 4.8, research: 3.9, leadership: 4.5, professionalism: 4.6 },
  { name: 'Dr. Rodriguez', teaching: 4.1, research: 4.7, leadership: 3.8, professionalism: 4.2 },
  { name: 'Prof. Wilson', teaching: 4.6, research: 4.0, leadership: 4.2, professionalism: 4.4 },
  { name: 'Dr. Brown', teaching: 4.3, research: 4.4, leadership: 4.1, professionalism: 4.5 }
];

const ntpEvaluationData = [
  { name: 'Excellent (4.5-5.0)', value: 35, color: '#22c55e' },
  { name: 'Good (3.5-4.4)', value: 45, color: '#3b82f6' },
  { name: 'Satisfactory (2.5-3.4)', value: 15, color: '#f59e0b' },
  { name: 'Needs Improvement (1.0-2.4)', value: 5, color: '#ef4444' }
];

const pendingNotifications = [
  {
    id: 1,
    type: 'evaluation_due',
    message: 'Evaluation for Prof. Anderson is due tomorrow',
    priority: 'high',
    date: '2024-01-20'
  },
  {
    id: 2,
    type: 'template_update',
    message: 'New NTP evaluation template ready for review',
    priority: 'medium',
    date: '2024-01-19'
  },
  {
    id: 3,
    type: 'report_ready',
    message: 'Q4 performance report is available',
    priority: 'low',
    date: '2024-01-18'
  }
];

export default function SupervisorDashboard() {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Supervisor Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Overview of your department's performance and evaluation status
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Professors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departmentStats.totalProfessors}</div>
            <p className="text-xs text-muted-foreground">
              Computer Science Department
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-Teaching Personnel</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departmentStats.totalNTP}</div>
            <p className="text-xs text-muted-foreground">
              Administrative & Support Staff
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Professor Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departmentStats.avgProfessorScore}/5.0</div>
            <p className="text-xs text-muted-foreground">
              +0.2 from last quarter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Evaluations</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departmentStats.pendingEvaluations}</div>
            <p className="text-xs text-muted-foreground">
              Due this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Professor Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Professor Performance Comparison</CardTitle>
            <CardDescription>
              Average scores across key evaluation criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={professorPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Bar dataKey="teaching" fill="#3b82f6" name="Teaching" />
                <Bar dataKey="research" fill="#22c55e" name="Research" />
                <Bar dataKey="leadership" fill="#f59e0b" name="Leadership" />
                <Bar dataKey="professionalism" fill="#8b5cf6" name="Professionalism" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* NTP Evaluation Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>NTP Evaluation Distribution</CardTitle>
            <CardDescription>
              Performance rating distribution for non-teaching personnel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ntpEvaluationData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {ntpEvaluationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Evaluation Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Evaluation Progress</span>
          </CardTitle>
          <CardDescription>
            Current quarter evaluation completion status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-gray-600">
              {departmentStats.completedEvaluations} of {departmentStats.completedEvaluations + departmentStats.pendingEvaluations} completed
            </span>
          </div>
          <Progress 
            value={(departmentStats.completedEvaluations / (departmentStats.completedEvaluations + departmentStats.pendingEvaluations)) * 100} 
            className="w-full" 
          />
          
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm">Completed: {departmentStats.completedEvaluations}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm">Pending: {departmentStats.pendingEvaluations}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>Recent Notifications</span>
          </CardTitle>
          <CardDescription>
            Important updates and pending actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingNotifications.map((notification) => (
            <div key={notification.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{notification.message}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{notification.date}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className={getPriorityColor(notification.priority)}>
                  {notification.priority}
                </Badge>
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}