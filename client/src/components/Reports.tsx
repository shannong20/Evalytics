import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Download, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

const departmentData = [
  { name: 'Computer Science', rating: 4.8, responses: 245, change: '+0.3' },
  { name: 'Mathematics', rating: 4.6, responses: 189, change: '+0.1' },
  { name: 'Engineering', rating: 4.7, responses: 312, change: '+0.2' },
  { name: 'Business Admin', rating: 4.5, responses: 156, change: '-0.1' },
  { name: 'Liberal Arts', rating: 4.4, responses: 98, change: '+0.4' },
];

const performanceMetrics = [
  { metric: 'Teaching Effectiveness', current: '4.6', previous: '4.4', trend: 'up' },
  { metric: 'Student Engagement', current: '4.3', previous: '4.1', trend: 'up' },
  { metric: 'Course Content Quality', current: '4.7', previous: '4.8', trend: 'down' },
  { metric: 'Assessment Methods', current: '4.4', previous: '4.2', trend: 'up' },
];

export default function Reports() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600 mt-1">Performance insights and evaluation analytics</p>
        </div>
        <div className="flex space-x-2">
          <Select>
            <SelectTrigger className="w-40 border-gray-200 focus:border-blue-500">
              <SelectValue placeholder="Academic Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-gray-200 text-gray-600">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Overall Rating</p>
                    <p className="text-2xl font-bold text-gray-900">4.6</p>
                    <p className="text-sm text-green-600 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      +0.2 from last period
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-green-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Responses</p>
                    <p className="text-2xl font-bold text-gray-900">2,847</p>
                    <p className="text-sm text-green-600 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      +12% from last period
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Response Rate</p>
                    <p className="text-2xl font-bold text-gray-900">87%</p>
                    <p className="text-sm text-green-600 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      +5% from last period
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Evaluations</p>
                    <p className="text-2xl font-bold text-gray-900">24</p>
                    <p className="text-sm text-orange-600 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      +8% from last period
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Placeholder */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Evaluation Trends</CardTitle>
              <CardDescription>Performance metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">Performance Chart</p>
                  <p className="text-sm">Interactive chart would be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>Average ratings by department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departmentData.map((dept, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{dept.name}</h4>
                      <p className="text-sm text-gray-600">{dept.responses} responses</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{dept.rating}</p>
                        <p className={`text-sm flex items-center ${dept.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {dept.change.startsWith('+') ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                          {dept.change}
                        </p>
                      </div>
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                          style={{ width: `${(dept.rating / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Key performance indicators comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {performanceMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{metric.metric}</h4>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Current:</span>
                          <Badge className="bg-blue-100 text-blue-800">{metric.current}</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Previous:</span>
                          <Badge variant="outline">{metric.previous}</Badge>
                        </div>
                        <div className={`flex items-center space-x-1 ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {metric.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span className="text-sm font-medium">
                            {metric.trend === 'up' ? 'Improved' : 'Declined'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div 
                        className={`h-2 rounded-full ${metric.trend === 'up' ? 'bg-gradient-to-r from-green-500 to-blue-500' : 'bg-gradient-to-r from-red-500 to-orange-500'}`}
                        style={{ width: `${(parseFloat(metric.current) / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Historical Trends</CardTitle>
              <CardDescription>Long-term performance analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <TrendingUp className="w-20 h-20 mx-auto mb-4 text-gray-400" />
                  <p className="text-xl font-medium">Trend Analysis Chart</p>
                  <p className="text-sm mt-2">Multi-year performance trends would be displayed here</p>
                  <p className="text-xs text-gray-400 mt-4">
                    • Year-over-year comparisons<br/>
                    • Seasonal patterns<br/>
                    • Predictive analytics
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}