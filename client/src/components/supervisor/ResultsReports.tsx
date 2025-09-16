import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  BarChart3, 
  Download, 
  Eye, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  UserCheck, 
  Star,
  Award,
  FileText,
  Calendar,
  Search,
  X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { toast } from 'sonner';

// Base type for evaluation results
interface BaseEvaluationResult {
  id: number;
  name: string;
  position: string;
  department: string;
  overallScore: number;
  evaluationDate: string;
  comments: string;
  trend: 'up' | 'down' | 'neutral';
}

// Type for professor evaluation results
interface ProfessorEvaluationResult extends BaseEvaluationResult {
  type: 'professor';
  scores: {
    teaching_effectiveness: number;
    professionalism: number;
    research: number;
    leadership: number;
  };
}

// Type for NTP (Non-Teaching Personnel) evaluation results
interface NTPEvaluationResult extends BaseEvaluationResult {
  type: 'ntp';
  template: string;
  scores: {
    punctuality?: number;
    task_efficiency?: number;
    communication?: number;
    teamwork?: number;
    customer_service?: number;
    technical_skills?: number;
    problem_solving?: number;
    initiative?: number;
    reliability?: number;
    safety_compliance?: string | number;
  };
}

// Union type for all evaluation results
type EvaluationResult = ProfessorEvaluationResult | NTPEvaluationResult;

// Helper function to create professor evaluation results with proper typing
const createProfessor = (
  id: number, 
  name: string, 
  position: string, 
  department: string, 
  overallScore: number, 
  evaluationDate: string, 
  scores: { teaching_effectiveness: number, professionalism: number, research: number, leadership: number },
  comments: string,
  trend: 'up' | 'down' | 'neutral'
): ProfessorEvaluationResult => ({
  id,
  name,
  position,
  department,
  overallScore,
  evaluationDate,
  type: 'professor',
  scores,
  comments,
  trend
});

// Helper function to create NTP evaluation results with proper typing
const createNTP = (
  id: number,
  name: string,
  position: string,
  department: string,
  overallScore: number,
  evaluationDate: string,
  template: string,
  scores: {
    punctuality?: number;
    task_efficiency?: number;
    communication?: number;
    teamwork?: number;
    customer_service?: number;
    technical_skills?: number;
    problem_solving?: number;
    initiative?: number;
    reliability?: number;
    safety_compliance?: string | number;
  },
  comments: string,
  trend: 'up' | 'down' | 'neutral'
): NTPEvaluationResult => ({
  id,
  name,
  position,
  department,
  overallScore,
  evaluationDate,
  type: 'ntp',
  template,
  scores,
  comments,
  trend
});

// Mock professor evaluation results
const professorResults: ProfessorEvaluationResult[] = [
  createProfessor(
    1,
    'Dr. Sarah Johnson',
    'Associate Professor',
    'Computer Science',
    4.5,
    '2024-01-15',
    {
      teaching_effectiveness: 4.8,
      professionalism: 4.5,
      research: 4.2,
      leadership: 4.5
    },
    'Excellent performance in teaching and research activities.',
    'down'
  ),
  createProfessor(
    2,
    'Prof. Michael Chen',
    'Assistant Professor',
    'Computer Science',
    4.2,
    '2024-01-12',
    {
      teaching_effectiveness: 4.0,
      professionalism: 4.3,
      research: 4.1,
      leadership: 4.4
    },
    'Strong performance with room for improvement in research output.',
    'down'
  ),
  createProfessor(
    3,
    'Dr. Maria Rodriguez',
    'Professor',
    'Computer Science',
    4.7,
    '2024-01-10',
    {
      teaching_effectiveness: 4.6,
      professionalism: 4.7,
      research: 4.9,
      leadership: 4.5
    },
    'Outstanding research contributions and excellent teaching.',
    'down'
  )
];

// Mock NTP evaluation results
const ntpResults: NTPEvaluationResult[] = [
  createNTP(
    1,
    'Maria Santos',
    'Administrative Assistant',
    'Computer Science',
    4.3,
    '2024-01-14',
    'Administrative Staff',
    {
      punctuality: 4.5,
      task_efficiency: 4.2,
      communication: 4.1,
      teamwork: 4.3,
      customer_service: 4.4
    },
    'Reliable and efficient worker with excellent punctuality.',
    'down'
  ),
  createNTP(
    2,
    'John Lee',
    'IT Support Specialist',
    'Computer Science',
    4.6,
    '2024-01-11',
    'Technical Staff',
    {
      technical_skills: 4.7,
      problem_solving: 4.5,
      initiative: 4.4,
      reliability: 4.7,
      safety_compliance: 'yes'
    },
    'Excellent technical skills and proactive problem solving.',
    'down'
  )
];

const performanceTrends = [
  { month: 'Sep', professors: 4.1, ntp: 4.2 },
  { month: 'Oct', professors: 4.2, ntp: 4.3 },
  { month: 'Nov', professors: 4.3, ntp: 4.4 },
  { month: 'Dec', professors: 4.4, ntp: 4.5 },
  { month: 'Jan', professors: 4.5, ntp: 4.4 }
];

const departmentComparison = [
  { department: 'Computer Science', avgScore: 4.5, staffCount: 20 },
  { department: 'Mathematics', avgScore: 4.2, staffCount: 15 },
  { department: 'Physics', avgScore: 4.3, staffCount: 12 },
  { department: 'Chemistry', avgScore: 4.1, staffCount: 18 }
];

const scoreDistribution = [
  { range: '4.5-5.0', count: 8, color: '#22c55e' },
  { range: '4.0-4.4', count: 12, color: '#3b82f6' },
  { range: '3.5-3.9', count: 5, color: '#f59e0b' },
  { range: '3.0-3.4', count: 2, color: '#ef4444' },
  { range: '&lt; 3.0', count: 1, color: '#dc2626' }
];

// Type for chart data
interface ChartData {
  name: string;
  value: number;
  color?: string;
}

type TabValue = 'faculty' | 'ntp' | 'comparison';

export default function ResultsReports() {
  const [selectedStaff, setSelectedStaff] = useState<EvaluationResult | null>(null);
  const [currentTab, setCurrentTab] = useState<TabValue>('faculty');
  const [filterType, setFilterType] = useState<'all' | 'professor' | 'ntp'>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('current');
  const [searchQuery, setSearchQuery] = useState('');

  // Type guard to check if a staff member is a professor
  const isProfessor = (staff: EvaluationResult): staff is ProfessorEvaluationResult => 
    staff.type === 'professor';
    
  // Type guard to check if a staff member is NTP
  const isNTP = (staff: EvaluationResult): staff is NTPEvaluationResult => 
    staff.type === 'ntp';

  // Get all staff based on the current filter and search query
  const filteredStaff = React.useMemo<EvaluationResult[]>(() => {
    let result: EvaluationResult[] = [];
    
    // Apply type filter
    if (filterType === 'all') {
      result = [...professorResults, ...ntpResults];
    } else if (filterType === 'professor') {
      result = [...professorResults];
    } else {
      result = [...ntpResults];
    }
    
    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(staff => 
        staff.name.toLowerCase().includes(query) ||
        staff.department.toLowerCase().includes(query) ||
        staff.position.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [filterType, searchQuery]);

  const handleViewDetails = (staff: EvaluationResult) => {
    setSelectedStaff(staff);
  };

  // Get color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 4.0) return 'text-blue-600';
    if (score >= 3.5) return 'text-amber-500';
    return 'text-red-600';
  };

  // Render trend icon based on trend value
  const renderTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />; // Neutral/equal
    }
  };

  // Alias for getTrendIcon to maintain backward compatibility
  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    return renderTrendIcon(trend);
  };
  
  // Calculate summary statistics
  const totalStaff = filteredStaff.length;
  const averageScore = totalStaff > 0 
    ? filteredStaff.reduce((sum, staff) => sum + staff.overallScore, 0) / totalStaff 
    : 0;
    
  const highPerformers = filteredStaff.filter(staff => staff.overallScore >= 4.5).length;
  const needsImprovement = filteredStaff.filter(staff => staff.overallScore < 3.5).length;

  const handleDownloadReport = () => {
    // Implementation for downloading report
    toast.success('Downloading report...');
  };

  // Staff Detail Dialog Component
  const StaffDetailDialog = ({ staff, onClose }: { staff: EvaluationResult; onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState('scores');
    
    // Get radar chart data based on staff type
    const getRadarData = () => {
      if (isProfessor(staff)) {
        return [
          { subject: 'Teaching', A: staff.scores.teaching_effectiveness, fullMark: 5 },
          { subject: 'Professionalism', A: staff.scores.professionalism, fullMark: 5 },
          { subject: 'Research', A: staff.scores.research, fullMark: 5 },
          { subject: 'Leadership', A: staff.scores.leadership, fullMark: 5 },
        ];
      } else {
        return Object.entries(staff.scores)
          .filter(([key]) => key !== 'safety_compliance')
          .map(([key, value]) => ({
            subject: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            A: typeof value === 'number' ? value : (value === 'yes' ? 5 : 1),
            fullMark: 5
          }));
      }
    };

    return (
      <Dialog open={!!staff} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{staff.name}'s Evaluation Details</DialogTitle>
            <DialogDescription>
              {staff.position} • {staff.department}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Overall Score</h3>
                <div className="flex items-center space-x-2">
                  <span className={`text-3xl font-bold ${getScoreColor(staff.overallScore)}`}>
                    {staff.overallScore.toFixed(1)}
                  </span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.round(staff.overallScore) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Evaluation Date</p>
                <p className="font-medium">{staff.evaluationDate}</p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="scores">Scores</TabsTrigger>
                <TabsTrigger value="chart">Chart</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
              </TabsList>
              
              <TabsContent value="scores" className="pt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(staff.scores).map(([key, value]) => (
                    <div key={key} className="rounded-lg border p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">
                            {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {typeof value === 'number' ? `${value.toFixed(1)}/5` : String(value).toUpperCase()}
                          </p>
                        </div>
                        {typeof value === 'number' && (
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.round(Number(value)) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="chart" className="pt-4">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData()}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} />
                      <Radar
                        name="Scores"
                        dataKey="A"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              
              <TabsContent value="feedback" className="pt-4">
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Comments</h4>
                  <p className="text-muted-foreground">
                    {staff.comments || 'No additional comments provided.'}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleDownloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Evaluation Results</h1>
        <div>
          <h1>Results & Reports</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive evaluation results and performance analytics
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleDownloadReport}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Evaluations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredStaff.length}</div>
            <p className="text-xs text-gray-600">This quarter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredStaff.length > 0 ? (filteredStaff.reduce((sum, s) => sum + s.overallScore, 0) / filteredStaff.length).toFixed(1) : '0.0'}
            </div>
            <p className="text-xs text-gray-600">Department average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredStaff.filter(s => s.overallScore >= 4.5).length}
            </div>
            <p className="text-xs text-gray-600">Score &gt;= 4.5</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Improvement Needed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredStaff.filter(s => s.overallScore < 3.5).length}
            </div>
            <p className="text-xs text-gray-600">Score &lt; 3.5</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>
              Monthly average scores for professors and NTP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[3.5, 5]} />
                <Tooltip />
                <Line type="monotone" dataKey="professors" stroke="#3b82f6" name="Professors" />
                <Line type="monotone" dataKey="ntp" stroke="#22c55e" name="NTP" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
            <CardDescription>
              Distribution of evaluation scores across all staff
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={scoreDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ range, count }) => `${range}: ${count}`}
                >
                  {scoreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Department Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Department Comparison</CardTitle>
          <CardDescription>
            Average performance scores across departments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis domain={[3.5, 5]} />
              <Tooltip />
              <Bar dataKey="avgScore" fill="#3b82f6" name="Average Score" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filter Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                <SelectItem value="professor">Professors Only</SelectItem>
                <SelectItem value="ntp">NTP Only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Quarter</SelectItem>
                <SelectItem value="last">Last Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Results</CardTitle>
          <CardDescription>
            Detailed results for all staff evaluations
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Overall Score</TableHead>
                <TableHead>Evaluation Date</TableHead>
                <TableHead>Trend</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${staff.type === 'professor' ? 'bg-blue-100' : 'bg-green-100'}`}>
                        {staff.type === 'professor' ? 
                          <Users className="h-4 w-4 text-blue-600" /> : 
                          <UserCheck className="h-4 w-4 text-green-600" />
                        }
                      </div>
                      <div>
                        <p className="font-medium">{staff.name}</p>
                        <p className="text-sm text-gray-600">{staff.department}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{staff.position}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {staff.type === 'professor' ? 'Professor' : 'NTP'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${getScoreColor(staff.overallScore)}`}>
                        {staff.overallScore}
                      </span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.round(staff.overallScore) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{staff.evaluationDate}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(staff.trend)}
                      <span className="text-sm capitalize">{staff.trend}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedStaff(staff)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Staff Detail Dialog */}
      {selectedStaff && (
        <StaffDetailDialog
          staff={selectedStaff}
          onClose={() => setSelectedStaff(null)}
        />
      )}
    </div>
  );
}