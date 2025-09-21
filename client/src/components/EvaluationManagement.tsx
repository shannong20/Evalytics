import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../lib/api';
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

type Question = {
  question_id: number;
  text: string;
  weight: number | null;
};

type Category = {
  category_id: number;
  name: string;
  weight: number | null;
  questions: Question[];
};

type QuestionRecord = Question & {
  category_id: number;
  category_name?: string;
};

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
  const [categories, setCategories] = useState<Category[]>([]);
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

  // Load questions from backend using apiService
  const fetchQuestions = useCallback(async () => {
    setQLoading(true);
    setQError(null);
    
    console.log('[EvaluationManagement] Starting to fetch questions...');
    
    try {
      // 1. First check if we have a valid session
      console.log('[EvaluationManagement] Checking for valid session...');
      
      // Add a small delay to ensure any previous state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const session = await apiService.auth.getSession();
      
      console.log('[EvaluationManagement] Session check result:', {
        status: session.status,
        hasUserData: !!session.data,
        message: session.message,
        user: session.data ? {
          id: session.data.user_id,
          email: session.data.email,
          role: session.data.role
        } : null
      });
      
      // If no valid session, show error and stop
      if (session.status !== 'success' || !session.data) {
        const errorMsg = session.message || 'Authentication required. Please log in to view questions.';
        console.error('[EvaluationManagement] Session validation failed:', errorMsg);
        
        // Clear any stale auth data
        localStorage.removeItem('auth');
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        
        // Set the error state
        setQError(errorMsg);
        setQLoading(false);
        return;
      }

      // 2. If we have a valid session, fetch the categories with questions
      console.log('[EvaluationManagement] Session valid, fetching question categories...');
      const response = await apiService.questions.getCategories();

      // Normalize possible response shapes
      let rawCategories: any[] = [];
      const data = (response as any)?.data;
      if (Array.isArray(data)) {
        rawCategories = data;
      } else if (data && typeof data === 'object') {
        // Handle { categories: [...] } or nested { data: [...] }
        if (Array.isArray((data as any).categories)) {
          rawCategories = (data as any).categories;
        } else if (Array.isArray((data as any).data)) {
          rawCategories = (data as any).data;
        }
      }

      console.log('[EvaluationManagement] Categories response:', {
        status: response.status,
        hasData: !!response.data,
        message: response.message,
        count: rawCategories.length
      });

      // Process the response
      if (response.status === 'success' && rawCategories.length >= 0) {
        // Transform the data into categories with their questions
        const categoriesData = (rawCategories || []).map((category: any) => ({
          category_id: category.category_id ?? category.id,
          name: category.name ?? category.category_name ?? 'Uncategorized',
          weight: category.weight ?? null,
          questions: (Array.isArray(category.questions) ? category.questions : (category.questions ? [category.questions] : [])).map((q: any) => ({
            question_id: q.question_id ?? q.id,
            text: q.text ?? q.question_text ?? 'No question text',
            weight: q.weight ?? null,
          }))
        }));

        console.log(`[EvaluationManagement] Successfully processed ${categoriesData.length} categories`, categoriesData);
        setCategories(categoriesData);
      } else {
        // Handle API error response
        const errorMsg = response.message || 'Failed to load question bank';
        console.error('[EvaluationManagement] API Error:', errorMsg);
        setQError(errorMsg);
      }
    } catch (error: any) {
      // Handle unexpected errors
      console.error('[EvaluationManagement] Error in fetchQuestions:', {
        error: error,
        message: error.message,
        response: error.response?.data
      });
      
      // Provide user-friendly error messages
      if (error.response) {
        // Server responded with error status code
        if (error.response.status === 401) {
          setQError('Your session has expired. Please log in again.');
        } else if (error.response.status === 403) {
          setQError('You do not have permission to view these questions.');
        } else if (error.response.status === 404) {
          setQError('Question bank not found. Please contact support.');
        } else if (error.response.status >= 500) {
          setQError('Server error. Please try again later.');
        } else {
          setQError(`Error: ${error.response.data?.message || 'Failed to load questions'}`);
        }
      } else if (error.request) {
        // Request was made but no response received
        setQError('Unable to connect to the server. Please check your internet connection.');
      } else {
        // Something else caused the error
        setQError(error.message || 'An unexpected error occurred');
      }
    } finally {
      setQLoading(false);
    }
  }, []); // No dependencies since we're not using any external values

  useEffect(() => {
    const checkAuthAndFetchQuestions = async () => {
      if (activeTab !== 'questions') return;
      
      // First check if we have a valid session
      const session = await apiService.auth.getSession();
      console.log('Session check in useEffect:', session);
      
      if (session.status === 'success' && session.data) {
        // We have a valid session, fetch questions
        console.log('Session valid, proceeding to fetch questions');
        await fetchQuestions();
      } else {
        // No valid session, set error
        console.log('No valid session, not fetching questions');
        setQError(session.message || 'Please log in to view questions');
        setQLoading(false);
      }
    };
    
    checkAuthAndFetchQuestions();
  }, [activeTab, fetchQuestions]); // Added fetchQuestions to dependency array

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
                {!qLoading && !qError && categories.length === 0 && (
                  <p className="text-sm text-gray-600">No categories or questions found. Click "Add Question" to get started.</p>
                )}
                {!qLoading && !qError && categories.length > 0 && (
                  <div className="space-y-8">
                    {categories.map((category) => (
                      <div key={category.category_id} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {category.name}
                            {category.weight !== null && (
                              <span className="ml-2 text-sm font-normal text-gray-500">
                                (Weight: {category.weight})
                              </span>
                            )}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {category.questions.length} question{category.questions.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        {category.questions.length === 0 ? (
                          <div className="p-4 text-sm text-gray-500 bg-gray-50 rounded-lg">
                            No questions in this category yet.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {category.questions.map((question) => (
                              <div key={question.question_id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{question.text}</p>
                                    {question.weight !== null && (
                                      <div className="mt-1">
                                        <Badge variant="outline" className="text-xs">
                                          Weight: {question.weight}
                                        </Badge>
                                      </div>
                                    )}
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