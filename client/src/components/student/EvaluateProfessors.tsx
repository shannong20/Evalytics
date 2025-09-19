import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import CategoryForm, { type AnswerMap } from '../evaluation/CategoryForm';
import type { QuestionRecord, CategoryRecord } from '../../types/question';
import { useAuth } from '../../context/AuthContext';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

type Faculty = {
  id: number;
  name: string;
  email?: string;
};

type CategoryKey = string;

type EvaluateProfessorsProps = {
  prefilledProfessorName?: string;
  lockProfessorName?: boolean;
  department?: string;
  prefilledFacultyId?: number | string;
  lockFacultySelection?: boolean;
};

export default function EvaluateProfessors({ prefilledProfessorName, lockProfessorName = false, department, prefilledFacultyId, lockFacultySelection = false }: EvaluateProfessorsProps) {
  // TODO: Make this dynamic or configurable via admin
  const FORM_ID = Number(((import.meta as any).env?.VITE_EVALUATION_FORM_ID)) || 1;
  const { user, token } = useAuth();
  const [facultyId, setFacultyId] = useState(null as number | null);
  const [facultyList, setFacultyList] = useState([] as Faculty[]);
  const [isLoadingFaculty, setIsLoadingFaculty] = useState(true);
  const [answers, setAnswers] = useState({} as AnswerMap);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([] as CategoryRecord[]);
  const [questionsByCategory, setQuestionsByCategory] = useState({} as Record<CategoryKey, QuestionRecord[]>);
  const [courses, setCourses] = useState([] as { course_id: number; course_code: string; course_title: string }[]);
  const [courseId, setCourseId] = useState(null as number | null);
  const [comments, setComments] = useState('');

  // When a faculty is pre-selected (e.g., by a parent flow), honor it
  useEffect(() => {
    if (prefilledFacultyId != null && prefilledFacultyId !== '') {
      setFacultyId(Number(prefilledFacultyId));
    }
  }, [prefilledFacultyId]);

  // Fetch faculty list when component mounts
  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const baseUrl = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:5000';
        const response = await fetch(`${baseUrl}/api/v1/users/faculty`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (response.ok) {
          const payload = await response.json();
          const items = Array.isArray(payload?.data)
            ? payload.data.map((r: any) => ({
                id: Number(r.faculty_id ?? r.id),
                name: r.full_name || `${r.firstname ?? ''} ${r.lastname ?? ''}`.trim(),
                email: r.email,
              }))
            : [];
          setFacultyList(items);
          // Only set a default selection if not locked by parent and no prefilled ID exists
          if (!lockFacultySelection && (prefilledFacultyId == null || prefilledFacultyId === '') && items.length > 0) {
            setFacultyId(items[0].id);
          }
        } else {
          throw new Error('Failed to fetch faculty list');
        }
      } catch (error) {
        console.error('Error fetching faculty:', error);
        toast.error('Failed to load faculty list');
      } finally {
        setIsLoadingFaculty(false);
      }
    };

    fetchFaculty();
  }, []);

  // Fetch courses whenever a faculty (evaluatee) is selected
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        if (!facultyId) { setCourses([]); setCourseId(null); return; }
        const baseUrl = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:5000';
        const url = `${baseUrl}/api/v1/courses?evaluateeId=${facultyId}`;
        const res = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          }
        });
        if (!res.ok) throw new Error('Failed to load courses');
        const payload = await res.json();
        const list = Array.isArray(payload?.data) ? payload.data : [];
        setCourses(list);
        // If current selection is not in list, reset
        if (!list.find((c: any) => Number(c.course_id) === Number(courseId))) {
          setCourseId(list.length > 0 ? Number(list[0].course_id) : null);
        }
      } catch (e) {
        console.error('Error fetching courses:', e);
        toast.error('Failed to load courses for the selected professor');
      }
    };
    fetchCourses();
  }, [facultyId, token]);

  // Load categories once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const baseUrl = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:5000';
        const res = await fetch(`${baseUrl}/api/v1/categories/public`);
        if (!res.ok) throw new Error('Failed to load categories');
        const data: CategoryRecord[] = await res.json();
        setCategories(data);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load categories');
      }
    };
    fetchCategories();
  }, []);

  const handleAnswerChange = (questionId: string, value: string | number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleQuestionsLoaded = (category: string, qs: QuestionRecord[]) => {
    setQuestionsByCategory(prev => ({ ...prev, [category as CategoryKey]: qs }));
  };

  const { completed, total, requiredTotal } = useMemo(() => {
    const allQuestions = (categories || []).flatMap((c) => questionsByCategory[c.name as CategoryKey] || []);
    const totalQ = allQuestions.length;
    const requiredQ = totalQ; // all questions are required
    const completedQ = allQuestions.filter(q => answers[q.question_id] != null && answers[q.question_id] !== '').length;
    return { completed: completedQ, total: totalQ, requiredTotal: requiredQ };
  }, [questionsByCategory, answers, categories]);

  const validate = () => {
    if (!facultyId) {
      toast.error('Please select a professor to evaluate.');
      return false;
    }
    // Require course selection
    if (!courseId) {
      toast.error('Please select a course.');
      return false;
    }
    // Ensure all questions have answers (all required)
    const missingRequired: string[] = [];
    for (const cat of categories) {
      for (const q of questionsByCategory[cat.name as CategoryKey] || []) {
        if ((answers[q.question_id] == null || answers[q.question_id] === '')) {
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

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      // Prepare payloads for both structured and legacy endpoints
      const entries = Object.entries(answers);
      const hasNonNumericIds = entries.some(([qid]) => !Number.isInteger(Number(qid)));
      const responsesStructured = entries.map(([questionId, answerValue]) => ({
        question_id: Number(questionId),
        rating: Number(answerValue),
      }));

      if (!facultyId) {
        toast.error('Please select a professor to evaluate');
        setIsSubmitting(false);
        return;
      }

      // Guard: must be logged in to submit
      if (!user || !user.id) {
        toast.error('You must be logged in to submit an evaluation');
        setIsSubmitting(false);
        return;
      }

      const baseUrl = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:5000';

      // Build legacy payload from loaded questionsByCategory and answers
      const records = (categories || []).flatMap((cat) => (questionsByCategory[cat.name as CategoryKey] || []).map((q) => ({
        question_id: q.question_id, // keep as string for JSONB
        category: q.category,
        answer: answers[q.question_id],
        type: 'rating_scale',
      })));
      const selectedFaculty = facultyList.find(f => f.id === facultyId);
      const legacyPayload: any = {
        subject: 'professor_evaluation',
        professor_name: (selectedFaculty?.name || prefilledProfessorName || '').trim(),
        responses: records,
      };
      // Enrich legacy payload with structured identifiers to allow server dual-write
      legacyPayload.form_id = FORM_ID;
      legacyPayload.user_id = Number(user.id);
      if ((user as any)?.student_id) legacyPayload.student_id = Number((user as any).student_id);
      legacyPayload.faculty_id = facultyId;
      if (department && department.trim()) legacyPayload.department = department.trim();
      legacyPayload.course_id = courseId;
      if (String(comments).trim() !== '') legacyPayload.comments = String(comments).trim();

      let res: Response;
      if (hasNonNumericIds) {
        // Directly use legacy path when question IDs are UUIDs (non-numeric)
        res = await fetch(`${baseUrl}/api/evaluations/submissions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(legacyPayload),
        });
      } else {
        // Try structured path first
        const payload = {
          evaluatee_id: Number(facultyId),
          course_id: Number(courseId),
          responses: responsesStructured,
          comments: String(comments || '').trim() || undefined,
        };
        console.log('Submitting payload (structured):', JSON.stringify(payload, null, 2));
        res = await fetch(`${baseUrl}/api/v1/evaluations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        // Fallback to legacy on any failure (covers FK errors like student_id_fkey)
        if (res.status !== 201) {
          const errText = await res.text().catch(() => '');
          console.warn('Structured submit failed, falling back to legacy. Server said:', errText);
          res = await fetch(`${baseUrl}/api/evaluations/submissions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(legacyPayload),
          });
        }
      }

      if (res.status === 201) {
        const result = await res.json();
        toast.success('Evaluation submitted successfully');
        setAnswers({});
        setCourseId(null);
        setComments('');
        return result;
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Server error:', errorData); // Log detailed error
        throw new Error(errorData?.error?.message || 'Failed to submit evaluation');
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      toast.error(err.message || 'Failed to submit evaluation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

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
        null
      )}

      {/* Course selection (always shown once a professor is chosen) */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Select Course</CardTitle>
          <CardDescription>Courses are filtered by the selected professor's department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="courseSelect">Course</Label>
            <Select
              value={courseId != null ? String(courseId) : ''}
              onValueChange={(val) => setCourseId(Number(val))}
              disabled={isSubmitting || !facultyId || courses.length === 0}
            >
              <SelectTrigger id="courseSelect" className="w-full">
                <SelectValue placeholder={facultyId ? (courses.length ? 'Select a course' : 'No courses found') : 'Select a professor first'} />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.course_id} value={String(c.course_id)}>
                    {c.course_code} - {c.course_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Progress badge */}
      <div className="flex items-center justify-between">
        <Badge className={`${completionPercentage === 100 && requiredTotal > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
          {completed}/{total} answered
        </Badge>
        <div className="text-sm text-gray-600">Required questions: {requiredTotal}</div>
      </div>

      {/* Category forms (5 rating questions per category) */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {categories.map((cat) => (
          <div key={cat.category_id}>
            <CategoryForm
              category={cat.name}
              answers={answers}
              onAnswerChange={handleAnswerChange}
              onQuestionsLoaded={handleQuestionsLoaded}
              ratingOnly
              formId={FORM_ID}
              limit={5}
            />
          </div>
        ))}

        {/* Comments field at the end of the form */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Additional Comments</CardTitle>
            <CardDescription>Optional. Share any feedback or remarks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                placeholder="Write any additional comments here..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="min-h-28"
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="min-w-40">
            {isSubmitting ? 'Submitting…' : 'Submit Evaluation'}
          </Button>
        </div>
      </form>
    </div>
  );
}