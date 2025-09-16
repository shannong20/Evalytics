import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Download, 
  Users, 
  UserCheck, 
  User, 
  BookOpen,
  TrendingUp,
  FileText,
  Calendar,
  Award
} from 'lucide-react';

// Mock data for different evaluation types
const studentResults = {
  overall: 4.6,
  responses: 187,
  data: [
    { category: 'Teaching Effectiveness', score: 4.7, responses: 187 },
    { category: 'Course Content', score: 4.6, responses: 187 },
    { category: 'Communication', score: 4.5, responses: 187 },
    { category: 'Assessment Methods', score: 4.6, responses: 187 },
    { category: 'Availability', score: 4.8, responses: 187 }
  ],
  comments: [
    { comment: "Excellent teaching style and very approachable", sentiment: "positive" },
    { comment: "Course materials are well organized and helpful", sentiment: "positive" },
    { comment: "Could use more real-world examples", sentiment: "constructive" },
    { comment: "Great feedback on assignments", sentiment: "positive" }
  ],
  trends: [
    { semester: 'Fall 2022', score: 4.2 },
    { semester: 'Spring 2023', score: 4.4 },
    { semester: 'Fall 2023', score: 4.5 },
    { semester: 'Spring 2024', score: 4.6 }
  ]
};

const peerResults = {
  overall: 4.5,
  responses: 12,
  data: [
    { category: 'Professional Competence', score: 4.7, responses: 12 },
    { category: 'Collaboration', score: 4.4, responses: 12 },
    { category: 'Leadership', score: 4.3, responses: 12 },
    { category: 'Communication', score: 4.6, responses: 12 }
  ],
  feedback: [
    { reviewer: "Anonymous Peer", feedback: "Excellent researcher with strong collaborative skills" },
    { reviewer: "Anonymous Peer", feedback: "Very knowledgeable and always willing to help" },
    { reviewer: "Anonymous Peer", feedback: "Could take more initiative in department meetings" }
  ]
};

const supervisorResults = {
  overall: 4.4,
  responses: 1,
  data: [
    { category: 'Teaching Performance', score: 4.5 },
    { category: 'Research Output', score: 4.3 },
    { category: 'Service Contribution', score: 4.2 },
    { category: 'Professional Development', score: 4.6 }
  ],
  feedback: "Dr. Santos continues to demonstrate excellent teaching abilities and shows strong commitment to research. Recommendations for increased involvement in university-wide service activities."
};

const selfResults = {
  overall: 4.6,
  lastUpdated: "March 15, 2024",
  data: [
    { category: 'Teaching Effectiveness', score: 4.6 },
    { category: 'Research & Scholarship', score: 4.5 },
    { category: 'Service & Leadership', score: 4.4 },
    { category: 'Communication', score: 4.8 }
  ],
  goals: [
    "Publish 2 research papers in peer-reviewed journals",
    "Increase participation in university committees",
    "Develop new course materials for advanced topics",
    "Mentor 2-3 junior faculty members"
  ]
};

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function ResultsReports() {
  const [activeTab, setActiveTab] = useState('students');

  const handleDownloadReport = (type) => {
    // Simulate report download
    const fileName = `${type}-evaluation-report-spring-2024.pdf`;
    alert(`Downloading ${fileName}...`);
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'constructive': return 'bg-yellow-100 text-yellow-800';
      case 'negative': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Results & Reports</h2>
          <p className="text-gray-600 mt-1">View your evaluation results and performance analytics</p>
        </div>
        <Button 
          onClick={() => handleDownloadReport('comprehensive')}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Full Report
        </Button>
      </div>

      {/* Overall Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Students</p>
                <p className="text-2xl font-bold text-gray-900">{studentResults.overall}</p>
                <p className="text-xs text-gray-500">{studentResults.responses} responses</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Peers</p>
                <p className="text-2xl font-bold text-gray-900">{peerResults.overall}</p>
                <p className="text-xs text-gray-500">{peerResults.responses} reviews</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Supervisor</p>
                <p className="text-2xl font-bold text-gray-900">{supervisorResults.overall}</p>
                <p className="text-xs text-gray-500">{supervisorResults.responses} review</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Self Assessment</p>
                <p className="text-2xl font-bold text-gray-900">{selfResults.overall}</p>
                <p className="text-xs text-gray-500">Last updated</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="students">Student Results</TabsTrigger>
          <TabsTrigger value="peers">Peer Results</TabsTrigger>
          <TabsTrigger value="supervisor">Supervisor Results</TabsTrigger>
          <TabsTrigger value="self">Self Assessment</TabsTrigger>
        </TabsList>

        {/* Student Results */}
        <TabsContent value="students" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Average scores by evaluation category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={studentResults.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                    <YAxis domain={[3, 5]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="hsl(var(--chart-1))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Student ratings over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={studentResults.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="semester" />
                    <YAxis domain={[3.5, 5]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Detailed Scores</CardTitle>
                  <CardDescription>Category-wise performance breakdown</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => handleDownloadReport('student')}
                  className="border-gray-200 text-gray-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Average Score</TableHead>
                    <TableHead>Responses</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentResults.data.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell>{item.score.toFixed(1)}</TableCell>
                      <TableCell>{item.responses}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                              style={{ width: `${(item.score / 5) * 100}%` }}
                            ></div>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Student Comments</CardTitle>
              <CardDescription>Recent feedback from students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {studentResults.comments.map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-800">{item.comment}</p>
                    <Badge className={`${getSentimentColor(item.sentiment)} mt-2`}>
                      {item.sentiment}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Peer Results */}
        <TabsContent value="peers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Peer Evaluation Scores</CardTitle>
                <CardDescription>Ratings from colleague reviews</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={peerResults.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                    <YAxis domain={[3, 5]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
                <CardDescription>Performance across categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={peerResults.data}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="score"
                    >
                      {peerResults.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Peer Feedback</CardTitle>
                  <CardDescription>Comments from colleagues</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => handleDownloadReport('peer')}
                  className="border-gray-200 text-gray-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {peerResults.feedback.map((item, index) => (
                  <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-gray-800 mb-2">"{item.feedback}"</p>
                    <p className="text-sm text-green-700 font-medium">— {item.reviewer}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supervisor Results */}
        <TabsContent value="supervisor" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Supervisor Evaluation</CardTitle>
                <CardDescription>Department head assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={supervisorResults.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                    <YAxis domain={[3, 5]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="hsl(var(--chart-3))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
                <CardDescription>Overall assessment metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {supervisorResults.data.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">{item.category}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                          style={{ width: `${(item.score / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-gray-900">{item.score}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Supervisor Comments</CardTitle>
                  <CardDescription>Detailed feedback and recommendations</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => handleDownloadReport('supervisor')}
                  className="border-gray-200 text-gray-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-gray-800 leading-relaxed">{supervisorResults.feedback}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Self Assessment */}
        <TabsContent value="self" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Self-Assessment Scores</CardTitle>
                <CardDescription>Your self-evaluation ratings</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={selfResults.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                    <YAxis domain={[3, 5]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="hsl(var(--chart-4))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Development Goals</CardTitle>
                <CardDescription>Your professional objectives</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selfResults.goals.map((goal, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Award className="w-5 h-5 text-orange-600 mt-0.5" />
                      <p className="text-gray-700">{goal}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Assessment Details</CardTitle>
                  <CardDescription>Last updated: {selfResults.lastUpdated}</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/professor/self-evaluation'}
                    className="border-gray-200 text-gray-600"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Update Assessment
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleDownloadReport('self')}
                    className="border-gray-200 text-gray-600"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Self-Rating</TableHead>
                    <TableHead>Performance Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selfResults.data.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell>{item.score.toFixed(1)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                              style={{ width: `${(item.score / 5) * 100}%` }}
                            ></div>
                          </div>
                          <Badge className="bg-orange-100 text-orange-800">Very Good</Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}