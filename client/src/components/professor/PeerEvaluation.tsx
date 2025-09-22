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

type CategoryKey = string;

export default function PeerEvaluation() {
  const [comments, setComments] = useState('');
  const [answers, setAnswers] = useState({} as AnswerMap);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([] as CategoryRecord[]);
  const [questionsByCategory, setQuestionsByCategory] = useState({} as Record<CategoryKey, QuestionRecord[]>);
  const [faculty, setFaculty] = useState([] as { id: number; name: string; department: string | null }[]);
  const [selectedEvaluateeId, setSelectedEvaluateeId] = useState(null as string | null);
  const [courses, setCourses] = useState([] as Array<{ course_id: number; course_code?: string; course_title?: string }>);
  const [selectedCourseId, setSelectedCourseId] = useState(null as string | null);
  const { user, token } = useAuth();

  useEffect(() => {
    const loadCategories = async () => {
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
    const loadFaculty = async () => {
      try {
        const baseUrl = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:5000';
        const res = await fetch(`${baseUrl}/api/v1/users/faculty`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error('Failed to load faculty');
        const json = await res.json();
        const raw = Array.isArray(json?.data?.faculty) ? json.data.faculty : (Array.isArray(json?.data) ? json.data : []);
        const evaluatorIds = [user?.id, (user as any)?.raw?.faculty_id]
          .filter((v) => v != null && v !== '')
          .map((v) => Number(v));
        const normalized = raw
          .map((r: any) => ({
            id: Number(r.faculty_id ?? r.id ?? r.user_id),
            name: r.full_name || `${r.firstname ?? ''} ${r.lastname ?? ''}`.trim(),
            department: r.department ?? r.department_name ?? null,
          }))
          .filter((f: any) => !evaluatorIds.includes(Number(f.id)));
        setFaculty(normalized);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load faculty list');
      }
    };
    loadCategories();
    loadFaculty();
  }, []);

  // Load courses when evaluatee changes
  useEffect(() => {
    let ignore = false;
    async function loadCoursesForEvaluatee() {
      if (!selectedEvaluateeId) {
        setCourses([]);
        setSelectedCourseId(null);
        return;
      }
      try {
        const baseUrl = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:5000';
        const res = await fetch(`${baseUrl}/api/v1/courses?evaluateeId=${encodeURIComponent(String(selectedEvaluateeId))}`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error('Failed to load courses');
        const json = await res.json();
        if (!ignore) setCourses(Array.isArray(json?.data) ? json.data : []);
      } catch (e) {
        console.error(e);
        if (!ignore) setCourses([]);
      }
    }
    loadCoursesForEvaluatee();
    return () => { ignore = true; };
  }, [selectedEvaluateeId, token]);

  const handleAnswerChange = (questionId: string, value: string | number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleQuestionsLoaded = (category: string, qs: QuestionRecord[]) => {
    setQuestionsByCategory(prev => ({ ...prev, [category as CategoryKey]: qs }));
  };

  const { completed, total, requiredTotal } = useMemo(() => {
    const allQuestions = (categories || []).flatMap((c) => questionsByCategory[c.name as CategoryKey] || []);
    const totalQ = allQuestions.length;
    const requiredQ = totalQ; // all required
    const completedQ = allQuestions.filter(q => answers[q.question_id] != null && answers[q.question_id] !== '').length;
    return { completed: completedQ, total: totalQ, requiredTotal: requiredQ };
  }, [questionsByCategory, answers, categories]);

  const validate = () => {
    if (!selectedEvaluateeId) {
      toast.error('Please select the colleague to evaluate.');
      return false;
    }
    if (!selectedCourseId) {
      toast.error('Please select the course.');
      return false;
    }
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
      const responses = (categories || []).flatMap((cat) => (questionsByCategory[cat.name as CategoryKey] || []).map((q) => ({
        question_id: Number(q.question_id),
        rating: Number(answers[q.question_id]),
      })));

      const payload = {
        evaluatee_id: Number(selectedEvaluateeId),
        course_id: Number(selectedCourseId),
        responses,
        comments: String(comments || '').trim() || undefined,
      } as any;

      const baseUrl = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/v1/evaluations`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 201) {
        toast.success('Peer evaluation submitted successfully');
        setAnswers({} as AnswerMap);
        setComments('');
        setSelectedEvaluateeId(null);
        setSelectedCourseId(null);
      } else {
        const problem = await res.json().catch(() => null);
        const message = problem?.error?.message || 'Failed to submit evaluation';
        toast.error(message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit evaluation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Peer Evaluation</h2>
        <p className="text-gray-600 mt-1">Evaluate your colleague’s professional performance. Questions are loaded from the question bank.</p>
      </div>

      {/* Evaluatee and course selection */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Select Professor to Evaluate</CardTitle>
          <CardDescription>Choose the colleague you would like to evaluate</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-gray-700 mb-1 block">Colleague</label>
            <Select value={selectedEvaluateeId ?? ''} onValueChange={(v) => setSelectedEvaluateeId(v || null)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select faculty" />
              </SelectTrigger>
              <SelectContent>
                {faculty.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>{f.name} {f.department ? `• ${f.department}` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-gray-700 mb-1 block">Course</label>
            <Select value={selectedCourseId ?? ''} onValueChange={(v) => setSelectedCourseId(v || null)} disabled={!selectedEvaluateeId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={selectedEvaluateeId ? 'Select a course' : 'Select a colleague first'} />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.course_id} value={String(c.course_id)}>
                    {c.course_code ? `${c.course_code}${c.course_title ? ` • ${c.course_title}` : ''}` : (c.course_title || `Course ${c.course_id}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Progress badge */}
      <div className="flex items-center justify-between">
        <Badge className={`${completed === total && total > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
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
              limit={5}
            />
          </div>
        ))}

        {/* Additional Comments (optional) to match student/supervisor format */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Additional Comments</CardTitle>
            <CardDescription>Optional. Share any feedback or remarks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="peer-comments">Comments</Label>
              <Textarea
                id="peer-comments"
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