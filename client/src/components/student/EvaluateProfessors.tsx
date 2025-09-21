import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import CategoryForm, { type AnswerMap } from '../evaluation/CategoryForm';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../lib/api';
import { Loader2, Search } from 'lucide-react';

// Types for API responses
interface QuestionResponse {
  question_id?: number | string;
  id?: number | string;
  text?: string;
  question_text?: string;
  is_required?: boolean;
  required?: boolean;
  weight?: number | null;
}

interface CategoryResponse {
  category_id?: number | string;
  name?: string;
  category_name?: string;
  questions?: QuestionResponse[] | QuestionResponse;
  weight?: number | null;
}

interface CategoriesResponse {
  status: string;
  message?: string;
  data?: CategoryResponse[] | { categories?: CategoryResponse[]; data?: CategoryResponse[] };
}

interface Department {
  department_id: string | number;
  name: string;
  // Add other department properties as needed
}

type QuestionRecord = {
  question_id: string;
  question_text: string;
  is_required: boolean;
  category: string;
};

type Faculty = {
  id: number;
  name: string;
  email?: string;
};

const CATEGORIES = [
  'Commitment',
  'Knowledge of Subject',
  'Teaching for Independent Learning',
  'Management for Learning',
] as const;

type CategoryKey = typeof CATEGORIES[number];

type EvaluateProfessorsProps = {
  prefilledProfessorName?: string;
  lockProfessorName?: boolean;
  department?: string;
  prefilledFacultyId?: number | string;
  lockFacultySelection?: boolean;
  onSubmitted?: () => void;
};

export default function EvaluateProfessors({ prefilledProfessorName, lockProfessorName = false, department, prefilledFacultyId, lockFacultySelection = false, onSubmitted }: EvaluateProfessorsProps) {
  // TODO: Make this dynamic or configurable via admin
  const FORM_ID = Number(((import.meta as any).env?.VITE_EVALUATION_FORM_ID)) || 1;
  const { user, token } = useAuth();
  const [facultyId, setFacultyId] = useState<number | null>(null);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [isLoadingFaculty, setIsLoadingFaculty] = useState(true);
  const [answers, setAnswers] = useState({} as AnswerMap);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departmentId, setDepartmentId] = useState<string | number | null>(null);
  const [questionsByCategory, setQuestionsByCategory] = useState<Record<string, QuestionRecord[]>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // When a faculty is pre-selected (e.g., by a parent flow), honor it
  useEffect(() => {
    console.log('prefilledFacultyId changed:', { prefilledFacultyId, prefilledProfessorName });
    
    if (prefilledFacultyId != null && prefilledFacultyId !== '') {
      const id = Number(prefilledFacultyId);
      console.log('Setting facultyId from prefilled value:', id);
      setFacultyId(id);
      
      // If we have a prefilled professor name but no faculty list yet,
      // create a temporary faculty entry
      if (prefilledProfessorName && !facultyList.some(f => f.id === id)) {
        console.log('Adding prefilled professor to faculty list:', { id, name: prefilledProfessorName });
        setFacultyList(prev => [...prev, { id, name: prefilledProfessorName }]);
      }
    }
  }, [prefilledFacultyId, prefilledProfessorName, facultyList]);

  // Fetch questions and categories when component mounts
  useEffect(() => {
    const fetchQuestionsAndCategories = async () => {
      console.log('[EvaluateProfessors] Starting to fetch questions...');
      setIsLoading(true);
      setError(null);
      
      try {
        // 1. First check if we have a valid session
        console.log('[EvaluateProfessors] Checking for valid session...');
        const session = await apiService.auth.getSession();
        
        console.log('[EvaluateProfessors] Session check result:', {
          status: session.status,
          hasUserData: !!session.data,
          message: session.message
        });
        
        // If no valid session, show error and stop
        if (session.status !== 'success' || !session.data) {
          const errorMsg = session.message || 'Authentication required. Please log in to evaluate professors.';
          console.error('[EvaluateProfessors] Session validation failed:', errorMsg);
          setError(errorMsg);
          setIsLoading(false);
          return;
        }

        // 2. If we have a valid session, fetch the categories with questions
        console.log('[EvaluateProfessors] Session valid, fetching question categories...');
        const response = await apiService.questions.getCategories() as CategoriesResponse;
        
        // Log the complete response for debugging
        console.log('[EvaluateProfessors] Raw API response:', response);
        
        // Process the response
        if (response.status === 'success' && response.data) {
          // Initialize empty questions by category object
          const questionsByCat: Record<string, QuestionRecord[]> = {};
          
          try {
            // Extract categories from the response
            // Handle different response structures
            let categories: CategoryResponse[] = [];
            
            if (Array.isArray(response.data)) {
              categories = response.data;
            } else {
              const data = response.data as { categories?: CategoryResponse[]; data?: CategoryResponse[] };
              categories = data.categories || data.data || [];
            }
            
            console.log('[EvaluateProfessors] Processing categories:', categories);
            
            if (categories.length === 0) {
              console.warn('[EvaluateProfessors] No categories found in response');
              setError('No evaluation categories found. Please contact support.');
              return;
            }
            
            // Process each category and its questions
            for (const category of categories) {
              if (!category) continue;
              
              const categoryName = category.name || category.category_name || 'Uncategorized';
              
              if (!questionsByCat[categoryName]) {
                questionsByCat[categoryName] = [];
              }
              
              // Handle questions which might be an array or a single question
              const questions = category.questions 
                ? Array.isArray(category.questions) 
                  ? category.questions 
                  : [category.questions]
                : [];
              
              if (questions.length > 0) {
                questionsByCat[categoryName].push(
                  ...questions.map((q: QuestionResponse) => ({
                    question_id: String(q.question_id ?? q.id ?? Math.random().toString(36).substr(2, 9)),
                    question_text: q.text || q.question_text || 'No question text provided',
                    is_required: Boolean(q.is_required ?? q.required ?? false),
                    category: categoryName,
                    // weight not part of QuestionRecord, used only in processing
                  }))
                );
              } else {
                console.log(`[EvaluateProfessors] No questions found for category: ${categoryName}`, category);
              }
            }
          
            console.log('[EvaluateProfessors] Successfully processed questions by category:', questionsByCat);
            setQuestionsByCategory(questionsByCat);
          } catch (error) {
            console.error('[EvaluateProfessors] Error processing categories:', error);
            setError('Error processing evaluation questions. Please try again later.');
          }
        } else {
          // Handle API error response
          const errorMsg = response.message || 'Failed to load evaluation questions';
          console.error('[EvaluateProfessors] API Error:', errorMsg);
          setError(errorMsg);
        }
      } catch (error: any) {
        console.error('[EvaluateProfessors] Error in fetchQuestions:', {
          error: error,
          message: error.message,
          response: error.response?.data
        });
        
        // Provide user-friendly error messages
        if (error.response) {
          if (error.response.status === 401) {
            setError('Your session has expired. Please log in again.');
          } else if (error.response.status === 403) {
            setError('You do not have permission to view these questions.');
          } else if (error.response.status === 404) {
            setError('Evaluation form not found. Please contact support.');
          } else if (error.response.status >= 500) {
            setError('Server error. Please try again later.');
          } else {
            setError(`Error: ${error.response.data?.message || 'Failed to load evaluation form'}`);
          }
        } else if (error.request) {
          setError('Unable to connect to the server. Please check your internet connection.');
        } else {
          setError(error.message || 'An unexpected error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuestionsAndCategories();
  }, []);

  // Debug function to log and debug department data
  const debugDepartmentData = (data: any, label: string) => {
    console.group(`Debug: ${label}`);
    console.log('Data type:', typeof data);
    console.log('Data value:', data);
    if (data && typeof data === 'object') {
      console.log('Data keys:', Object.keys(data));
      console.log('Stringified data:', JSON.stringify(data, null, 2));
    }
    console.groupEnd();
    debugger; // This will pause execution when developer tools are open
  };

  // Fetch faculty list when component mounts or department changes
  // Check if form can be submitted
  const canSubmit = useMemo(() => {
    // If we have a prefilled faculty ID, we can submit even if no faculty is selected in the dropdown
    const hasFaculty = facultyId !== null || (lockFacultySelection && prefilledFacultyId);
    console.log('Form submission check:', { hasFaculty, facultyId, prefilledFacultyId, answerCount: Object.values(answers).length });
    return hasFaculty && Object.values(answers).length > 0;
  }, [facultyId, answers, lockFacultySelection, prefilledFacultyId]);

  useEffect(() => {
    const fetchFaculty = async () => {
      // If we have a prefilled faculty ID and we're locked, skip fetching the faculty list
      if (lockFacultySelection && prefilledFacultyId) {
        console.log('Skipping faculty fetch - using prefilled faculty ID:', prefilledFacultyId);
        setIsLoadingFaculty(false);
        return;
      }

      if (!token) {
        console.error('No authentication token found');
        return;
      }

      console.log('fetchFaculty called with department:', department);
      setIsLoadingFaculty(true);
      
      try {
        // If no department is selected, fetch all faculty
        if (!department) {
          console.log('No department selected, fetching all faculty');
          const response = await apiService.users.list({ 
            role: 'Faculty' 
          });
          
          if (response.status === 'success' && Array.isArray(response.data)) {
            const items = response.data.map((faculty: any) => ({
              id: Number(faculty.user_id),
              name: `${faculty.first_name} ${faculty.last_name}`.trim(),
              email: faculty.email || ''
            }));
            setFacultyList(items);
          } else {
            console.error('Unexpected response format:', response);
            toast.error('Failed to load faculty list');
          }
          return;
        }

        // If department is provided, first get the department ID
        console.log('Fetching department ID for:', department);
        
        // 1. Get department ID by name if department is provided
        let departmentId: string | number | null = null;
        
        if (department) {
          const deptResponse = await apiService.departments.findByName(department);
          console.log('Department API Response:', deptResponse);
          
          if (deptResponse.status !== 'success' || !deptResponse.data) {
            console.error('Department not found or error in response:', deptResponse);
            throw new Error(`Department '${department}' not found`);
          }
          
          // 2. Extract and validate department ID
          const deptData = deptResponse.data as { department_id: string | number };
          console.log('Department data from response:', deptData);
          
          // Use department_id from the response
          const deptId = deptData.department_id;
          console.log('Department ID from response:', deptId, 'Type:', typeof deptId);
          
          if (!deptId) {
            console.error('No department ID found in response data:', deptData);
            throw new Error('Department ID not found in response');
          }
          
          // 3. Convert to number if it's a valid number, otherwise keep as string
          if (typeof deptId === 'number') {
            departmentId = deptId;
          } else if (typeof deptId === 'string') {
            const numId = Number(deptId);
            departmentId = !isNaN(numId) && numId > 0 ? numId : deptId.trim();
          } else {
            throw new Error(`Invalid department ID type: ${typeof deptId}`);
          }
          
          console.log('Using department ID:', departmentId, 'Type:', typeof departmentId);
          setDepartmentId(departmentId);
        }
        
        // 4. Fetch faculty, optionally filtered by department
        console.log('Fetching faculty for department ID:', departmentId, 'Type:', typeof departmentId);
        const facultyResponse = await apiService.users.list({
          role: 'Faculty',
          ...(departmentId && { departmentId: typeof departmentId === 'string' ? Number(departmentId) : departmentId })
        });
        
        console.log('Faculty response:', facultyResponse);
        
        if (facultyResponse.status === 'success' && Array.isArray(facultyResponse.data)) {
          const items = facultyResponse.data.map((faculty: any) => ({
            id: Number(faculty.user_id),
            name: `${faculty.first_name} ${faculty.last_name}`.trim(),
            email: faculty.email || ''
          }));
          
          setFacultyList(items);
          
          // Only set a default selection if not locked by parent and no prefilled ID exists
          if (!lockFacultySelection && (prefilledFacultyId == null || prefilledFacultyId === '') && items.length > 0) {
            setFacultyId(items[0].id);
          }
        } else {
          throw new Error(facultyResponse.message || 'Failed to fetch faculty list');
        }
      } catch (error) {
        console.error('Error fetching faculty:', error);
        toast.error('Failed to load faculty list');
      } finally {
        setIsLoadingFaculty(false);
      }
    };

    fetchFaculty();
  }, [department, lockFacultySelection, prefilledFacultyId]);

  const handleAnswerChange = (questionId: string, value: string | number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleQuestionsLoaded = (category: string, qs: any[]) => {
    if (CATEGORIES.includes(category as CategoryKey)) {
      // Normalize incoming questions to QuestionRecord
      const normalized: QuestionRecord[] = (qs || []).map((q: any) => ({
        question_id: String(q.question_id),
        question_text: q.question_text ?? q.text ?? 'No question text provided',
        is_required: Boolean(q.is_required ?? q.required ?? false),
        category,
      }));
      setQuestionsByCategory(prev => ({ ...prev, [category as CategoryKey]: normalized }));
    }
  };

  const { completed, total, requiredTotal } = useMemo(() => {
    const allQuestions = Object.values(questionsByCategory).flat();
    const totalQ = allQuestions.length;
    const requiredQ = allQuestions.filter(q => q.is_required).length;
    const completedQ = allQuestions.filter(q => answers[q.question_id] != null && answers[q.question_id] !== '').length;
    return { completed: completedQ, total: totalQ, requiredTotal: requiredQ };
  }, [questionsByCategory, answers]);

  const validate = () => {
    if (!facultyId) {
      toast.error('Please select a professor to evaluate.');
      return false;
    }
    // Ensure all required questions have answers
    const missingRequired: string[] = [];
    for (const cat of CATEGORIES) {
      for (const q of questionsByCategory[cat as CategoryKey] || []) {
        if (q.is_required && (answers[q.question_id] == null || answers[q.question_id] === '')) {
          missingRequired.push(q.question_id);
        }
      }
    }
    if (missingRequired.length) {
      toast.error('Please answer all required questions before submitting.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !facultyId) {
      toast.error('Please complete all required fields');
      return;
    }
    
    if (!user?.id) {
      toast.error('You must be logged in to submit an evaluation');
      return;
    }

    setIsSubmitting(true);
    try {
      const responses = Object.entries(answers).map(([question_id, rating]) => ({
        question_id: parseInt(question_id),
        rating: Number(rating)
      }));

      const response = await apiService.evaluations.submit({
        evaluator_id: Number(user.id),
        evaluatee_id: facultyId,
        responses,
        form_id: FORM_ID,
        ...(department && { department })
      });

      if (response.status === 'success') {
        toast.success('Evaluation submitted successfully!');
        setAnswers({});
        
        // If not locked, move to next faculty or reset to first
        if (!lockFacultySelection && facultyList.length > 0) {
          const currentIndex = facultyList.findIndex(f => f.id === facultyId);
          if (currentIndex !== -1) {
            const nextIndex = (currentIndex + 1) % facultyList.length;
            setFacultyId(facultyList[nextIndex].id);
          }
        }

        // Notify parent flow (e.g., stepper) on successful submission
        if (typeof onSubmitted === 'function') {
          onSubmitted();
        }
      } else {
        throw new Error(response.message || 'Failed to submit evaluation');
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit evaluation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading evaluation form...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Evaluate Professors</h1>
        <p className="text-gray-600 mt-1">Answer the questions in each category. Questions are loaded from the question bank.</p>
      </div>

      {/* Professor selection (hidden when locked by parent flow) */}
      {!lockFacultySelection ? (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Select Professor to Evaluate</CardTitle>
            <CardDescription>Choose the professor you would like to evaluate</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingFaculty ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-blue-500"></div>
                <span className="ml-2">Loading professors...</span>
              </div>
            ) : (
              <Select 
                value={facultyId?.toString() || ''} 
                onValueChange={(value) => setFacultyId(Number(value))}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a professor" />
                </SelectTrigger>
                <SelectContent>
                  {facultyList.map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.id.toString()}>
                      {faculty.name} {faculty.email ? `(${faculty.email})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Professor</CardTitle>
            <CardDescription>Prefilled by your selection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-800">{prefilledProfessorName || 'Selected faculty'}</div>
          </CardContent>
        </Card>
      )}

      {/* Progress badge */}
      <div className="flex items-center justify-between">
        <Badge className={`${completionPercentage === 100 && requiredTotal > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
          {completed}/{total} answered
        </Badge>
        <div className="text-sm text-gray-600">Required questions: {requiredTotal}</div>
      </div>

      {/* Category forms (5 rating questions per category) */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {Object.entries(questionsByCategory).map(([category, questions]) => (
        <div key={category}>
          <CategoryForm
            category={category}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            onQuestionsLoaded={handleQuestionsLoaded}
            questions={questions}
            ratingOnly
            formId={FORM_ID}
            limit={5}
          />
        </div>
      ))}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="min-w-40">
            {isSubmitting ? 'Submitting…' : 'Submit Evaluation'}
          </Button>
        </div>
      </form>
    </div>
  );
}