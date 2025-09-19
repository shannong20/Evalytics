import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import CategoryForm, { type AnswerMap } from '../evaluation/CategoryForm';
import type { QuestionRecord, CategoryRecord } from '../../types/question';

type CategoryKey = string;

export default function PeerEvaluation() {
  const [peerName, setPeerName] = useState('');
  const [answers, setAnswers] = useState({} as AnswerMap);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([] as CategoryRecord[]);
  const [questionsByCategory, setQuestionsByCategory] = useState({} as Record<CategoryKey, QuestionRecord[]>);

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
    loadCategories();
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
    const requiredQ = totalQ; // all required
    const completedQ = allQuestions.filter(q => answers[q.question_id] != null && answers[q.question_id] !== '').length;
    return { completed: completedQ, total: totalQ, requiredTotal: requiredQ };
  }, [questionsByCategory, answers, categories]);

  const validate = () => {
    if (!peerName.trim()) {
      toast.error('Please enter the colleague’s name.');
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
      const records = (categories || []).flatMap((cat) => (questionsByCategory[cat.name as CategoryKey] || []).map((q) => ({
        question_id: q.question_id,
        category: q.category,
        answer: answers[q.question_id],
        type: 'rating_scale',
      })));

      const payload = {
        subject: 'peer_evaluation',
        peer_name: peerName.trim(),
        responses: records,
      };

      const baseUrl = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 201) {
        toast.success('Peer evaluation submitted successfully');
        setAnswers({} as AnswerMap);
        setPeerName('');
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

      {/* Peer name input */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Who are you evaluating?</CardTitle>
          <CardDescription>Enter your colleague’s name.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="e.g. Prof. John Smith"
            value={peerName}
            onChange={(e) => setPeerName(e.target.value)}
            className="border-gray-200 focus:border-blue-500"
          />
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

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="min-w-40">
            {isSubmitting ? 'Submitting…' : 'Submit Evaluation'}
          </Button>
        </div>
      </form>
    </div>
  );
}