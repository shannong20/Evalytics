import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';

export type QuestionType = {
  question_id: string | number;
  text?: string;
  question_text?: string;
  is_required?: boolean;
  required?: boolean;
  category?: string;
  question_type?: string;
  weight?: number | null;
};

export type AnswerMap = Record<string, string | number>;

type Props = {
  category: string;
  answers: AnswerMap;
  onAnswerChange: (questionId: string, value: string | number) => void;
  onQuestionsLoaded?: (category: string, questions: QuestionType[]) => void;
  questions?: QuestionType[];
  ratingOnly?: boolean;
  limit?: number;
  formId?: number;
};

export default function CategoryForm({ 
  category, 
  answers, 
  onAnswerChange, 
  onQuestionsLoaded, 
  questions: propQuestions = [], 
  ratingOnly, 
  limit, 
  formId 
}: Props) {
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const prevQuestionsRef = useRef<QuestionType[]>([]);
  const initialRender = useRef(true);
  const [isLoading, setIsLoading] = useState(false);

  // Memoize the filtered questions to prevent unnecessary recalculations
  const filteredQuestions = useMemo(() => {
    if (!propQuestions || propQuestions.length === 0) return [];

    // Transform questions to ensure consistent structure (stable shape)
    const transformed = propQuestions.map((q) => ({
      ...q,
      question_id: q.question_id?.toString() || Math.random().toString(36).substr(2, 9),
      question_text: q.text || q.question_text || 'No question text',
      is_required: q.is_required || q.required || false,
      question_type: q.question_type || 'rating_scale',
      weight: q.weight || 1,
    }));

    let filtered = transformed;
    if (ratingOnly) {
      filtered = filtered.filter((q) => q.question_type === 'rating_scale');
    }
    if (typeof limit === 'number') {
      filtered = filtered.slice(0, Math.max(0, limit));
    }
    return filtered;
  }, [propQuestions, ratingOnly, limit]);

  // Update local state when filtered questions change
  useEffect(() => {
    if (!filteredQuestions) return;

    // Only update if questions have actually changed
    const prevKey = JSON.stringify(prevQuestionsRef.current);
    const nextKey = JSON.stringify(filteredQuestions);

    if (filteredQuestions.length === 0) {
      setError('No questions available for this category');
      if (questions.length !== 0) setQuestions([]);
      return;
    }

    if (prevKey !== nextKey) {
      setQuestions(filteredQuestions);
      prevQuestionsRef.current = filteredQuestions;
      setError(null);
    }

    if (initialRender.current) {
      initialRender.current = false;
    }
  }, [filteredQuestions, category]);

  const answeredCount = useMemo(() => {
    if (!questions || !questions.length) return 0;
    return questions.filter((q: QuestionType) => 
      answers[q.question_id] != null && answers[q.question_id] !== ''
    ).length;
  }, [questions, answers]);

  const progressPct = useMemo(() => {
    const total = questions?.length ?? 0;
    return total > 0 ? Math.round((answeredCount / total) * 100) : 0;
  }, [answeredCount, questions]);

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{category}</CardTitle>
          <Badge className={questions.length > 0 && answeredCount === questions.length ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
            {answeredCount}/{questions.length}
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
        {error ? (
          <div className="text-red-500 text-center p-4">{error}</div>
        ) : isLoading ? (
          <div className="text-center p-4">Loading questions...</div>
        ) : questions.length > 0 ? (
        <div className="space-y-6">
          {isLoading && (
            <div className="text-xs text-gray-500">Refreshing questions…</div>
          )}
          {typeof limit === 'number' && questions.length < limit && (
            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              Only {questions.length} question(s) available. Ask an admin to add more questions for this category.
            </div>
          )}
          {questions.map((q: QuestionType, idx: number) => (
            <div key={q.question_id} className="space-y-3">
              <Label className="text-base flex items-start">
                <span className="mr-2">{idx + 1}.</span>
                <span>{q.question_text}</span>
              </Label>
                {q.question_type === 'rating_scale' ? (
                  <div className="mt-2">
                    <RadioGroup
                      value={String(answers[String(q.question_id)] || '')}
                      onValueChange={(value) => onAnswerChange(String(q.question_id), value)}
                    >
                      <div className="grid grid-cols-5 gap-2 mt-2">
                        {[1, 2, 3, 4, 5].map((rating) => {
                          const selected = (answers[String(q.question_id)] || '') === String(rating);
                          return (
                            <div key={rating} className="w-full">
                              <div
                                className={`p-2 text-center rounded cursor-pointer transition-colors ${
                                  selected
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                                onClick={() => onAnswerChange(String(q.question_id), rating)}
                              >
                                {rating}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </RadioGroup>
                  </div>
                ) : (
                  <div className="mt-2">
                    <Input
                      value={answers[q.question_id]?.toString() || ''}
                      onChange={(e) => onAnswerChange(q.question_id, e.target.value)}
                      placeholder="Type your answer"
                      className="w-full"
                    />
                  </div>
                )}
                {idx < questions.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-600">No questions found for this category. Ask an admin to add questions.</div>
        )}
      </CardContent>
    </Card>
  );
}
