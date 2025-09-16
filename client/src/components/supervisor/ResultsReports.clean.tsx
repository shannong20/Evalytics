import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Star, FileText, Download, Filter, Search, BarChart2, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
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

// Helper function to create professor evaluation results
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
  comments,
  trend,
  type: 'professor',
  scores
});

// Helper function to create NTP evaluation results
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
  comments,
  trend,
  type: 'ntp',
  template,
  scores
});

// Mock professor evaluation results
const professorResults: ProfessorEvaluationResult[] = [
  createProfessor(
    1,
    'Dr. Sarah Johnson',
    'Professor',
    'Computer Science',
    4.7,
    '2023-06-15',
    {
      teaching_effectiveness: 4.5,
      professionalism: 4.8,
      research: 4.9,
      leadership: 4.3
    },
    'Exceptional performance across all metrics.',
    'up'
  ),
];

// Mock NTP evaluation results
const ntpResults: NTPEvaluationResult[] = [
  createNTP(
    101,
    'Michael Chen',
    'IT Support Specialist',
    'Information Technology',
    4.2,
    '2023-06-10',
    'Technical Staff Evaluation',
    {
      punctuality: 4.5,
      task_efficiency: 4.3,
      communication: 4.1,
      teamwork: 4.6,
      technical_skills: 4.7,
      problem_solving: 4.4,
      initiative: 4.0,
      reliability: 4.5,
      safety_compliance: 'yes'
    },
    'Michael has been a reliable team member with strong technical skills.',
    'neutral'
  ),
];

export const ResultsReports: React.FC = () => {
  const [selectedStaff, setSelectedStaff] = useState<EvaluationResult | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'professor' | 'ntp'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Type guards
  const isProfessor = (staff: EvaluationResult): staff is ProfessorEvaluationResult => 
    staff.type === 'professor';

  const isNTP = (staff: EvaluationResult): staff is NTPEvaluationResult => 
    staff.type === 'ntp';

  // Filter staff based on selected filter type
  const filteredStaff = (() => {
    if (filterType === 'all') {
      return [...professorResults, ...ntpResults];
    } else if (filterType === 'professor') {
      return [...professorResults];
    } else {
      return [...ntpResults];
    }
  })();

  // Filter by search query
  const searchedStaff = filteredStaff.filter(staff => 
    staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Staff detail dialog component
  const StaffDetailDialog = ({ staff, onClose }: { staff: EvaluationResult; onClose: () => void }) => {
    // Helper function to transform scores into radar chart data
    const getRadarData = (scores: Record<string, number | string | undefined>) => {
      return Object.entries(scores)
        .filter(([key]) => key !== 'safety_compliance')
        .map(([key, value]) => ({
          subject: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          score: typeof value === 'number' ? value : (value === 'yes' ? 5 : 1),
          fullMark: 5
        }));
    };

    const radarData = getRadarData(staff.scores);

    const renderScores = (scores: Record<string, number | string | undefined>) => {
      return Object.entries(scores)
        .filter(([key]) => key !== 'safety_compliance')
        .map(([key, value]) => (
          <div key={key} className="flex items-center justify-between py-1">
            <span className="text-sm text-gray-600 capitalize">
              {key.replace(/_/g, ' ')}
            </span>
            <div className="flex items-center">
              {typeof value === 'number' ? (
                <>
                  <div className="flex mr-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < value ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-sm w-8 ${getScoreColor(value)}`}>
                    {value.toFixed(1)}/5
                  </span>
                </>
              ) : key === 'safety_compliance' && value ? (
                <Badge variant={value === 'yes' ? 'default' : 'destructive'}>
                  {value.toString().toUpperCase()}
                </Badge>
              ) : (
                <span className="text-sm font-medium">{value?.toString()}</span>
              )}
            </div>
          </div>
        ));
    };

    return (
      <Dialog open={!!staff} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{staff.name}'s Evaluation Details</DialogTitle>
            <DialogDescription>
              Detailed performance metrics and evaluation results
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="scores" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="scores">Scores</TabsTrigger>
              <TabsTrigger value="radar">Radar Chart</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="scores">
              <Card>
                <CardHeader>
                  <CardTitle>Evaluation Scores</CardTitle>
                  <CardDescription>
                    Detailed breakdown of evaluation criteria
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderScores(staff.scores)}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="radar">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Radar Chart</CardTitle>
                  <CardDescription>
                    Visual representation of performance across all criteria
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feedback">
              <Card>
                <CardHeader>
                  <CardTitle>Evaluation Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{staff.comments}</p>
                  </div>
                  {'template' in staff && (
                    <div className="mt-4 text-sm text-gray-500 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      <span>Evaluation Template: {staff.template}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Evaluation Results</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => toast.success('Exporting report...')}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredStaff.length}</div>
            <p className="text-xs text-muted-foreground">Evaluated staff members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredStaff.length > 0 
                ? (filteredStaff.reduce((sum, staff) => sum + staff.overallScore, 0) / filteredStaff.length).toFixed(1)
                : '0.0'}
              <span className="text-sm font-normal text-muted-foreground">/5.0</span>
            </div>
            <p className="text-xs text-muted-foreground">Average evaluation score</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search staff..."
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 pl-8 text-sm shadow-sm transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'professor' | 'ntp')}
          >
            <option value="all">All Staff</option>
            <option value="professor">Professors</option>
            <option value="ntp">Non-Teaching Personnel</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Results</CardTitle>
          <CardDescription>
            {filterType === 'all' ? 'All' : filterType === 'professor' ? 'Professor' : 'NTP'} evaluation results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Overall Score</TableHead>
                <TableHead>Last Evaluated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchedStaff.length > 0 ? (
                searchedStaff.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">{staff.name}</TableCell>
                    <TableCell>{staff.position}</TableCell>
                    <TableCell>{staff.department}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="flex mr-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(staff.overallScore)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className={getScoreColor(staff.overallScore)}>
                          {staff.overallScore.toFixed(1)}/5.0
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(staff.evaluationDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedStaff(staff)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No results found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Staff Detail Dialog */}
      <StaffDetailDialog
        staff={selectedStaff!}
        onClose={() => setSelectedStaff(null)}
      />
    </div>
  );
};

export default ResultsReports;
