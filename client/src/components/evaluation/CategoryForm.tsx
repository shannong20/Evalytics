import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import type { QuestionRecord } from '../../types/question';

export type AnswerMap = Record<string, string | number>;

type Props = {
  category: string;
  answers: AnswerMap;
  onAnswerChange: (questionId: string, value: string | number) => void;
  onQuestionsLoaded?: (category: string, questions: QuestionRecord[]) => void;
  ratingOnly?: boolean;
  limit?: number;
  formId?: number;
};

export default function CategoryForm({ category, answers, onAnswerChange, onQuestionsLoaded, ratingOnly, limit, formId }: Props) {
  const [questions, setQuestions] = useState(null as QuestionRecord[] | null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);

  useEffect(() => {
    let isMounted = true;
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError(null);
        const baseUrl = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:5000';
        const url = typeof formId === 'number'
          ? `${baseUrl}/api/v1/questions/public/form/${formId}`
          : `${baseUrl}/api/v1/questions/public?category=${encodeURIComponent(category)}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to load questions for ${category}`);
        }
        const data: QuestionRecord[] = await res.json();
        if (isMounted) {
          let filtered = Array.isArray(data) ? data : [];
          // If fetching by form, filter by category on the client
          if (typeof formId === 'number') {
            filtered = filtered.filter(q => q.category === category);
          }
          if (ratingOnly) {
            // Default missing type to 'rating_scale'
            filtered = filtered.filter(q => (q.question_type ?? 'rating_scale') === 'rating_scale');
          }
          if (typeof limit === 'number') {
            filtered = filtered.slice(0, Math.max(0, limit));
          }
          setQuestions(filtered);
          onQuestionsLoaded?.(category, filtered);
        }
      } catch (e: any) {
        if (isMounted) setError(e?.message || 'Error loading questions');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchQuestions();
    return () => { isMounted = false; };
  }, [category, ratingOnly, limit, formId]);

  const answeredCount = useMemo(() => {
    if (!questions) return 0;
    return questions.filter(q => answers[q.question_id] != null && answers[q.question_id] !== '').length;
  }, [questions, answers]);

  const progressPct = useMemo(() => {
    const total = questions?.length ?? 0;
    return total > 0 ? Math.round((answeredCount / total) * 100) : 0;
  }, [answeredCount, questions]);

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{category}</CardTitle>
            <CardDescription>Answer all required questions in this category</CardDescription>
          </div>
          <Badge className={questions && answeredCount === questions.length ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
            {answeredCount}/{questions?.length ?? 0}
          </Badge>
        </div>
        <div className="mt-3 w-full h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}
        {questions && questions.length > 0 ? (
          <div className="space-y-6">
            {loading && (
              <div className="text-xs text-gray-500">Refreshing questions…</div>
            )}
            {typeof limit === 'number' && questions.length < limit && (
              <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                Only {questions.length} question(s) available. Ask an admin to add more questions for this category.
              </div>
            )}
            {questions.map((q, idx) => (
              <div key={q.question_id} className="space-y-3">
                <Label className="text-base flex items-start">
                  <span className="mr-2">{idx + 1}.</span>
                  <span>
                    {q.question_text}
                    <span className="text-red-500 ml-1">*</span>
                  </span>
                </Label>

                <RadioGroup
                  value={answers[q.question_id]?.toString() || ''}
                  onValueChange={(value) => onAnswerChange(q.question_id, value)}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {[1,2,3,4,5].map((rating) => {
                      const selected = (answers[q.question_id]?.toString() || '') === rating.toString();
                      return (
                        <div key={rating} className="w-full relative">
                          {/* Place the radio input inside a relative container and hide without using sr-only to avoid focus-driven scroll */}
                          <RadioGroupItem 
                            value={rating.toString()} 
                            id={`${q.question_id}_${rating}`} 
                            className="absolute inset-0 opacity-0 pointer-events-none"
                          />
                          <Label
                            htmlFor={`${q.question_id}_${rating}`}
                            className={`w-full inline-flex items-center justify-center px-3 h-10 rounded-md border text-sm cursor-pointer transition select-none whitespace-nowrap ${selected ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'}`}
                          >
                            {rating === 1 ? '1 - Poor' : rating === 2 ? '2 - Fair' : rating === 3 ? '3 - Satisfactory' : rating === 4 ? '4 - Very Satisfactory' : '5 - Outstanding'}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                  
                </RadioGroup>

                {idx < questions.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        ) : (
          loading ? (
            <div className="text-sm text-gray-600">Loading questions…</div>
          ) : (
            <div className="text-sm text-gray-600">No questions found for this category. Ask an admin to add questions.</div>
          )
        )}
      </CardContent>
    </Card>
  );
}
