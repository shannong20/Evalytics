import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
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

// Use absolute API base to avoid requiring Vite proxy during dev
const API_BASE = (import.meta as any)?.env?.VITE_SERVER_URL || 'http://localhost:5000';

// Live student analytics state (replaces mock data)
type StudentResults = {
  overall: number;
  responses: number;
  data: Array<{ category: string; score: number; responses?: number }>;
  comments: Array<{ comment: string; sentiment: string }>;
  trends: Array<{ semester: string; score: number }>;
};

type SimpleResults = {
  overall: number;
  responses: number;
  data: Array<{ category: string; score: number; responses?: number }>;
  comments: Array<{ comment: string; sentiment: string }>;
  trends: Array<{ semester: string; score: number }>;
};

const peerResultsFallback: SimpleResults = {
  overall: 4.5,
  responses: 12,
  data: [
    { category: 'Professional Competence', score: 4.7, responses: 12 },
    { category: 'Collaboration', score: 4.4, responses: 12 },
    { category: 'Leadership', score: 4.3, responses: 12 },
    { category: 'Communication', score: 4.6, responses: 12 }
  ],
  comments: [
    { comment: 'Excellent researcher with strong collaborative skills', sentiment: 'positive' },
    { comment: 'Very knowledgeable and always willing to help', sentiment: 'positive' },
    { comment: 'Could take more initiative in department meetings', sentiment: 'constructive' }
  ],
  trends: []
};

const supervisorResultsFallback: SimpleResults = {
  overall: 4.4,
  responses: 1,
  data: [
    { category: 'Teaching Performance', score: 4.5 },
    { category: 'Research Output', score: 4.3 },
    { category: 'Service Contribution', score: 4.2 },
    { category: 'Professional Development', score: 4.6 }
  ],
  comments: [
    { comment: 'Great teaching abilities and strong commitment to research.', sentiment: 'positive' }
  ],
  trends: []
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
  const [studentResults, setStudentResults] = useState<StudentResults | null>(null);
  const [peerResults, setPeerResults] = useState<SimpleResults | null>(null);
  const [supervisorResults, setSupervisorResults] = useState<SimpleResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        if (!token) return; // wait for auth token before calling protected endpoints
        // 1) Get current user
        const meRes = await fetch(`${API_BASE}/api/v1/auth/me`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!meRes.ok) throw new Error(`auth/me failed: ${meRes.status}`);
        const meJson = await meRes.json();
        const userId = meJson?.data?.user?.user_id || meJson?.user?.user_id || meJson?.user_id;
        if (!userId) throw new Error('user_id not found in profile');
        // 2) Get analytics for this professor (student-sourced only)
        // Add evaluator_user_type=student so peer/supervisor comments don't mix into Student tab
        const aRes = await fetch(`${API_BASE}/api/v1/reports/analytics/professor?professor_user_id=${encodeURIComponent(String(userId))}&evaluator_user_type=student`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!aRes.ok) throw new Error(`analytics failed: ${aRes.status}`);
        const aJson = await aRes.json();

        const topline = aJson?.json_output?.topline || {};
        const cats = aJson?.json_output?.category_breakdown || [];
        const trend = aJson?.json_output?.trend || [];
        const comments = aJson?.json_output?.comments || [];
        const qstats = aJson?.json_output?.question_stats || [];

        const overall = typeof topline.overall_average === 'number' ? topline.overall_average : Number(topline.overall_average || 0);
        const data = cats.map((c: any) => ({
          category: String(c.name || ''),
          score: c.avg_score != null ? Number(c.avg_score) : 0,
          responses: c.responses != null ? Number(c.responses) : undefined,
        }));
        const trends = (trend || []).map((t: any) => ({
          semester: String(t.semester || ''),
          score: t.avg_score != null ? Number(t.avg_score) : 0,
        }));
        const cmts = (comments || []).map((c: any) => ({
          comment: String(c.text || ''),
          sentiment: String(c.sentiment || 'neutral'),
        }));
        const totalResponses = Array.isArray(qstats)
          ? qstats.reduce((acc: number, q: any) => acc + (q?.responses ? Number(q.responses) : 0), 0)
          : 0;

        const result: StudentResults = {
          overall,
          responses: totalResponses,
          data,
          comments: cmts,
          trends,
        };
        if (isMounted) setStudentResults(result);

        // 3) Peer analytics (evaluations from faculty peers)
        try {
          const peerRes = await fetch(`${API_BASE}/api/v1/reports/analytics/professor?professor_user_id=${encodeURIComponent(String(userId))}&evaluator_user_type=faculty`, {
            credentials: 'include',
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (peerRes.ok) {
            const pJson = await peerRes.json();
            const pTop = pJson?.json_output?.topline || {};
            const pCats = pJson?.json_output?.category_breakdown || [];
            const pTrend = pJson?.json_output?.trend || [];
            const pComments = pJson?.json_output?.comments || [];
            const pQstats = pJson?.json_output?.question_stats || [];

            const pOverall = pTop?.overall_average != null ? Number(pTop.overall_average) : 0;
            const pData = pCats.map((c: any) => ({
              category: String(c.name || ''),
              score: c.avg_score != null ? Number(c.avg_score) : 0,
              responses: c.responses != null ? Number(c.responses) : undefined,
            }));
            const pTrends = (pTrend || []).map((t: any) => ({
              semester: String(t.semester || ''),
              score: t.avg_score != null ? Number(t.avg_score) : 0,
            }));
            const pCmts = (pComments || []).map((c: any) => ({
              comment: String(c.text || ''),
              sentiment: String(c.sentiment || 'neutral'),
            }));
            const pResponses = Array.isArray(pQstats)
              ? pQstats.reduce((acc: number, q: any) => acc + (q?.responses ? Number(q.responses) : 0), 0)
              : 0;
            if (isMounted) setPeerResults({ overall: pOverall, responses: pResponses, data: pData, comments: pCmts, trends: pTrends });
          } else {
            // leave as null -> fallback UI will be used
          }
        } catch (_) {}

        // 4) Supervisor analytics (evaluations from supervisors)
        try {
          const supRes = await fetch(`${API_BASE}/api/v1/reports/analytics/professor?professor_user_id=${encodeURIComponent(String(userId))}&evaluator_user_type=supervisor`, {
            credentials: 'include',
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (supRes.ok) {
            const sJson = await supRes.json();
            const sTop = sJson?.json_output?.topline || {};
            const sCats = sJson?.json_output?.category_breakdown || [];
            const sTrend = sJson?.json_output?.trend || [];
            const sComments = sJson?.json_output?.comments || [];
            const sQstats = sJson?.json_output?.question_stats || [];

            const sOverall = sTop?.overall_average != null ? Number(sTop.overall_average) : 0;
            const sData = sCats.map((c: any) => ({
              category: String(c.name || ''),
              score: c.avg_score != null ? Number(c.avg_score) : 0,
              responses: c.responses != null ? Number(c.responses) : undefined,
            }));
            const sTrends = (sTrend || []).map((t: any) => ({
              semester: String(t.semester || ''),
              score: t.avg_score != null ? Number(t.avg_score) : 0,
            }));
            const sCmts = (sComments || []).map((c: any) => ({
              comment: String(c.text || ''),
              sentiment: String(c.sentiment || 'neutral'),
            }));
            const sResponses = Array.isArray(sQstats)
              ? sQstats.reduce((acc: number, q: any) => acc + (q?.responses ? Number(q.responses) : 0), 0)
              : 0;
            if (isMounted) setSupervisorResults({ overall: sOverall, responses: sResponses, data: sData, comments: sCmts, trends: sTrends });
          }
        } catch (_) {}
      } catch (err: any) {
        if (isMounted) setError(err?.message || 'Failed to load analytics');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [token]);

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
                <p className="text-2xl font-bold text-gray-900">{studentResults?.overall?.toFixed ? studentResults.overall.toFixed(1) : (studentResults?.overall ?? 'N/A')}</p>
                <p className="text-xs text-gray-500">{studentResults?.responses ?? 0} responses</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            {loading && <p className="text-xs text-gray-500 mt-2">Loading…</p>}
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Peers</p>
                <p className="text-2xl font-bold text-gray-900">{(peerResults?.overall ?? peerResultsFallback.overall).toFixed ? (peerResults?.overall ?? peerResultsFallback.overall).toFixed(1) : (peerResults?.overall ?? peerResultsFallback.overall)}</p>
                <p className="text-xs text-gray-500">{peerResults?.responses ?? peerResultsFallback.responses} reviews</p>
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
                <p className="text-2xl font-bold text-gray-900">{(supervisorResults?.overall ?? supervisorResultsFallback.overall).toFixed ? (supervisorResults?.overall ?? supervisorResultsFallback.overall).toFixed(1) : (supervisorResults?.overall ?? supervisorResultsFallback.overall)}</p>
                <p className="text-xs text-gray-500">{supervisorResults?.responses ?? supervisorResultsFallback.responses} review</p>
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
                  <BarChart data={studentResults?.data ?? []}>
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
                  <LineChart data={studentResults?.trends ?? []}>
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
                  {(studentResults?.data ?? []).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell>{item.score.toFixed(1)}</TableCell>
                      <TableCell>{item.responses ?? '-'}</TableCell>
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
                {(studentResults?.comments ?? []).map((item, index) => (
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
                  <BarChart data={(peerResults?.data ?? peerResultsFallback.data)}>
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
                      data={(peerResults?.data ?? peerResultsFallback.data)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="score"
                    >
                      {(peerResults?.data ?? peerResultsFallback.data).map((entry, index) => (
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
                {(peerResults?.comments ?? peerResultsFallback.comments).map((item, index) => (
                  <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-gray-800 mb-2">"{item.comment}"</p>
                    <Badge className={`${getSentimentColor(item.sentiment)} mt-1`}>{item.sentiment}</Badge>
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
                  <BarChart data={(supervisorResults?.data ?? supervisorResultsFallback.data)}>
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
                {(supervisorResults?.data ?? supervisorResultsFallback.data).map((item, index) => (
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
              <div className="space-y-3">
                {(supervisorResults?.comments ?? supervisorResultsFallback.comments).map((c, idx) => (
                  <div key={idx} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-gray-800 leading-relaxed">{c.comment}</p>
                    <Badge className={`${getSentimentColor(c.sentiment)} mt-2`}>{c.sentiment}</Badge>
                  </div>
                ))}
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