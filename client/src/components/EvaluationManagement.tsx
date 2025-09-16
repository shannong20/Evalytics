import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Plus, Calendar as CalendarIcon, Eye, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import CreateQuestionForm from './admin/CreateQuestionForm';
import type { QuestionRecord } from '../types/question';

const sampleEvaluations = [
  { id: 1, title: 'Faculty Performance Evaluation - Spring 2024', type: 'Faculty', status: 'Active', startDate: '2024-03-01', endDate: '2024-03-31', responses: 245 },
  { id: 2, title: 'Staff Annual Review 2024', type: 'Staff', status: 'Draft', startDate: '2024-04-01', endDate: '2024-04-30', responses: 0 },
  { id: 3, title: 'Student Course Evaluation - Fall 2023', type: 'Course', status: 'Completed', startDate: '2023-11-01', endDate: '2023-11-30', responses: 1847 },
  { id: 4, title: '360-Degree Leadership Assessment', type: 'Leadership', status: 'Active', startDate: '2024-02-15', endDate: '2024-03-15', responses: 67 },
];

// Removed mock questions; will fetch from API

export default function EvaluationManagement() {
  const [activeTab, setActiveTab] = useState('list');
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [questionOpen, setQuestionOpen] = useState(false);
  const [questions, setQuestions] = useState([] as QuestionRecord[]);
  const [qLoading, setQLoading] = useState(false);
  const [qError, setQError] = useState(null as string | null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Draft': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Load questions from backend
  const fetchQuestions = async () => {
    setQLoading(true);
    setQError(null);
    try {
      const baseUrl = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/questions`, {
        headers: { 'x-admin': 'true' },
      });
      if (!res.ok) {
        const problem = await res.json().catch(() => null);
        throw new Error(problem?.error?.message || `Failed to load questions (${res.status})`);
      }
      const data: QuestionRecord[] = await res.json();
      setQuestions(data);
    } catch (e: any) {
      setQError(e?.message || 'Failed to load questions');
    } finally {
      setQLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'questions') {
      fetchQuestions();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Evaluation Management</h2>
          <p className="text-gray-600 mt-1">Create and manage evaluation forms and periods</p>
        </div>
        <Button 
          onClick={() => setActiveTab('create')}
          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white border-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Evaluation
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Active Evaluations</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
          <TabsTrigger value="questions">Question Bank</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {sampleEvaluations.map((evaluation) => (
            <Card key={evaluation.id} className="border-0 shadow-md">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{evaluation.title}</CardTitle>
                    <CardDescription>
                      {format(new Date(evaluation.startDate), 'MMM dd, yyyy')} - {format(new Date(evaluation.endDate), 'MMM dd, yyyy')}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(evaluation.status)}>
                    {evaluation.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex space-x-6">
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-medium">{evaluation.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Responses</p>
                      <p className="font-medium">{evaluation.responses}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="border-gray-200 text-gray-600 hover:text-green-600 hover:border-green-200">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Create New Evaluation</CardTitle>
              <CardDescription>Set up a new evaluation form and schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Evaluation Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter evaluation title"
                    className="border-gray-200 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Evaluation Type</Label>
                  <Select>
                    <SelectTrigger className="border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="faculty">Faculty Performance</SelectItem>
                      <SelectItem value="staff">Staff Annual Review</SelectItem>
                      <SelectItem value="course">Course Evaluation</SelectItem>
                      <SelectItem value="leadership">Leadership Assessment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter evaluation description"
                  className="border-gray-200 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal border-gray-200">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal border-gray-200">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" className="border-gray-200 text-gray-600">
                  Save as Draft
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white border-0">
                  Create Evaluation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Question Bank</CardTitle>
                  <CardDescription>Manage evaluation questions and templates</CardDescription>
                </div>
                <Dialog open={questionOpen} onOpenChange={setQuestionOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white border-0">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Question</DialogTitle>
                      <DialogDescription>Define a question to include in evaluations.</DialogDescription>
                    </DialogHeader>
                    <CreateQuestionForm onCreated={() => { setQuestionOpen(false); setActiveTab('questions'); fetchQuestions(); }} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {qLoading && (
                  <p className="text-sm text-gray-600">Loading questions…</p>
                )}
                {!qLoading && qError && (
                  <p className="text-sm text-red-600">{qError}</p>
                )}
                {!qLoading && !qError && questions.length === 0 && (
                  <p className="text-sm text-gray-600">No questions yet. Click "Add Question" to create one.</p>
                )}
                {!qLoading && !qError && questions.length > 0 && (
                  <div className="space-y-4">
                    {questions.map((q) => (
                      <div key={q.question_id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{q.question_text}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {q.question_type === 'rating_scale' ? 'Rating Scale' : 'Text Response'}
                              </Badge>
                              {q.is_required && (
                                <Badge className="bg-red-100 text-red-800 text-xs">Required</Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">{q.category}</Badge>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" className="border-gray-200 text-gray-600">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}