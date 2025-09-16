import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import type { QuestionRecord } from '../../types/question';

export type AnswerMap = Record<string, string | number>;

const CATEGORY_ORDER = [
  'Commitment',
  'Knowledge of Subject',
  'Teaching for Independent Learning',
  'Management for Learning',
] as const;

type CategoryKey = typeof CATEGORY_ORDER[number];

export default function FullEvaluationForm() {
  const [answers, setAnswers] = useState({} as AnswerMap);
  const [targetName, setTargetName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [questionsByCategory, setQuestionsByCategory] = useState({
    'Commitment': [],
    'Knowledge of Subject': [],
    'Teaching for Independent Learning': [],
    'Management for Learning': [],
  } as Record<CategoryKey, QuestionRecord[]>);

  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError('');
        const baseUrl = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:5000';
        const res = await fetch(`${baseUrl}/api/questions/public`);
        if (!res.ok) throw new Error('Failed to load questions');
        const data: QuestionRecord[] = await res.json();
        if (!Array.isArray(data)) throw new Error('Invalid data received');

        // Only rating_scale questions as required
        const ratings = data.filter(q => q.question_type === 'rating_scale');

        // Group by canonical categories in a fixed order
        const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
          acc[cat] = ratings.filter(q => q.category === cat);
          return acc;
        }, {
          'Commitment': [] as QuestionRecord[],
          'Knowledge of Subject': [] as QuestionRecord[],
          'Teaching for Independent Learning': [] as QuestionRecord[],
          'Management for Learning': [] as QuestionRecord[],
        } as Record<CategoryKey, QuestionRecord[]>);

        if (isMounted) setQuestionsByCategory(grouped);
      } catch (e: any) {
        if (isMounted) setError(e?.message || 'Error loading questions');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAll();
    return () => { isMounted = false; };
  }, []);

  const handleAnswerChange = (questionId: string, value: string | number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const allQuestions = useMemo(() => CATEGORY_ORDER.flatMap(cat => questionsByCategory[cat] || []), [questionsByCategory]);
  const completed = useMemo(() => allQuestions.filter(q => answers[q.question_id] != null && answers[q.question_id] !== '').length, [allQuestions, answers]);
  const requiredTotal = useMemo(() => allQuestions.filter(q => q.is_required).length, [allQuestions]);

  const validate = () => {
    if (!targetName.trim()) {
      toast.error('Please enter the person or subject being evaluated.');
      return false;
    }
    const missingRequired: string[] = [];
    for (const q of allQuestions) {
      if (q.is_required && (answers[q.question_id] == null || answers[q.question_id] === '')) missingRequired.push(q.question_id);
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
    try {
      const records = allQuestions.map((q) => ({
        question_id: q.question_id,
        category: q.category,
        answer: answers[q.question_id],
        type: q.question_type,
      }));

      const payload = {
        subject: 'full_evaluation',
        professor_name: targetName.trim(),
        responses: records,
      };

      const baseUrl = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 201) {
        toast.success('Evaluation submitted successfully');
        setAnswers({});
        setTargetName('');
      } else {
        const problem = await res.json().catch(() => null);
        const message = problem?.error?.message || 'Failed to submit evaluation';
        toast.error(message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit evaluation.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Full Evaluation</h2>
        <p className="text-gray-600 mt-1">All rating questions from the question bank, grouped by category.</p>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Who are you evaluating?</CardTitle>
          <CardDescription>Enter the name (e.g., professor or colleague) for this full evaluation.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="e.g. Dr. Jane Doe"
            value={targetName}
            onChange={(e) => setTargetName(e.target.value)}
            className="border-gray-200 focus:border-blue-500"
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Badge className={`${completed === allQuestions.length && allQuestions.length > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
          {completed}/{allQuestions.length} answered
        </Badge>
        <div className="text-sm text-gray-600">Required questions: {requiredTotal}</div>
      </div>

      {loading && <div className="text-sm text-gray-600">Loading questions…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && CATEGORY_ORDER.map((cat) => {
        const qs = questionsByCategory[cat] || [];
        return (
          <Card key={cat} className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{cat}</CardTitle>
                  <CardDescription>Answer all questions in this category.</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                  {qs.filter(q => answers[q.question_id] != null && answers[q.question_id] !== '').length}/{qs.length} answered
                </Badge>
              </div>
              <div className="mt-3 w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${qs.length ? Math.round((qs.filter(q => answers[q.question_id] != null && answers[q.question_id] !== '').length / qs.length) * 100) : 0}%` }}
                />
              </div>
            </CardHeader>
            <CardContent>
              {qs.length === 0 ? (
                <div className="text-sm text-gray-600">No questions found for this category.</div>
              ) : (
                <div className="space-y-6">
                  {qs.map((q, idx) => (
                    <div key={q.question_id} className="space-y-3">
                      <Label className="text-base flex items-start">
                        <span className="mr-2">{idx + 1}.</span>
                        <span>
                          {q.question_text}
                          {q.is_required && <span className="text-red-500 ml-1">*</span>}
                        </span>
                      </Label>

                      <RadioGroup
                        value={answers[q.question_id]?.toString() || ''}
                        onValueChange={(value) => handleAnswerChange(q.question_id, value)}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                          {[1,2,3,4,5].map((rating) => {
                            const selected = (answers[q.question_id]?.toString() || '') === rating.toString();
                            return (
                              <div key={rating} className="w-full">
                                <RadioGroupItem value={rating.toString()} id={`${q.question_id}_${rating}`} className="sr-only" />
                                <Label
                                  htmlFor={`${q.question_id}_${rating}`}
                                  className={`w-full inline-flex items-center justify-center px-3 py-2 rounded-md border text-sm cursor-pointer transition select-none ${selected ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'}`}
                                >
                                  {rating === 1 ? '1 - Poor' : rating === 2 ? '2 - Fair' : rating === 3 ? '3 - Satisfactory' : rating === 4 ? '4 - Very Satisfactory' : '5 - Outstanding'}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                        <div className="text-xs text-gray-500 flex justify-between mt-2">
                          <span>Poor</span>
                          <span>Outstanding</span>
                        </div>
                      </RadioGroup>

                      {idx < qs.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <div className="flex justify-end">
        <Button onClick={handleSubmit} className="min-w-40">Submit Full Evaluation</Button>
      </div>
    </div>
  );
}
