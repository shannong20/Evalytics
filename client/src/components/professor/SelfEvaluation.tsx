import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Save, Send, AlertCircle, CheckCircle } from 'lucide-react';
import CategoryForm, { type AnswerMap } from '../evaluation/CategoryForm';
import type { CategoryRecord, QuestionRecord } from '../../types/question';

export default function SelfEvaluation() {
  const [answers, setAnswers] = useState({} as AnswerMap);
  const [comments, setComments] = useState({} as Record<string, string>);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [categories, setCategories] = useState([] as CategoryRecord[]);
  const [questionsByCategory, setQuestionsByCategory] = useState({} as Record<string, QuestionRecord[]>);

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
    setQuestionsByCategory(prev => ({ ...prev, [category]: qs }));
  };

  const handleCommentChange = (categoryId, value) => {
    setComments(prev => ({
      ...prev,
      [categoryId]: value
    }));
  };

  const allQuestions = useMemo(() => (categories || []).flatMap(c => questionsByCategory[c.name] || []), [categories, questionsByCategory]);
  const completed = useMemo(() => allQuestions.filter(q => answers[q.question_id] != null && answers[q.question_id] !== '').length, [allQuestions, answers]);
  const total = useMemo(() => allQuestions.length, [allQuestions]);
  const completionPercentage = useMemo(() => total > 0 ? Math.round((completed / total) * 100) : 0, [completed, total]);

  const validateForm = () => {
    if (completed < total) {
      toast.error(`Please answer all questions. ${completed}/${total} completed.`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (asDraft = false) => {
    if (!asDraft && !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setIsDraft(asDraft);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      if (asDraft) toast.success('Evaluation saved as draft successfully!');
      else toast.success('Self-evaluation submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit evaluation. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsDraft(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Self-Evaluation</h2>
          <p className="text-gray-600 mt-1">Spring 2024 Faculty Self-Assessment</p>
        </div>
        <div className="text-right">
          <Badge className={`${completionPercentage === 100 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'} mb-2`}>
            {completed}/{total} questions completed
          </Badge>
          <div className="w-32 h-2 bg-gray-200 rounded-full">
            <div 
              className="h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <Card className="border-0 shadow-md bg-blue-50 border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Evaluation Instructions</p>
              <p className="text-sm text-blue-800 mt-1">
                Rate each statement on a scale of 1-5 where: 1 = Strongly Disagree, 2 = Disagree, 3 = Neutral, 4 = Agree, 5 = Strongly Agree. 
                Please provide honest and reflective responses to help with your professional development.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Categories (Dynamic) */}
      <div className="space-y-6">
        {categories.map((cat) => (
          <Card key={cat.category_id} className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{cat.name}</CardTitle>
                  <CardDescription>Answer all questions in this category.</CardDescription>
                </div>
                <Badge className="bg-gray-100 text-gray-600">
                  {(questionsByCategory[cat.name]?.filter(q => answers[q.question_id] != null && answers[q.question_id] !== '').length || 0)}/{(questionsByCategory[cat.name]?.length || 0)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <CategoryForm
                category={cat.name}
                answers={answers}
                onAnswerChange={handleAnswerChange}
                onQuestionsLoaded={handleQuestionsLoaded}
                ratingOnly
                limit={5}
              />
              {/* Comments section for each category */}
              <div className="mt-6 space-y-2">
                <Label htmlFor={`${cat.category_id}_comments`}>Additional Comments (Optional)</Label>
                <Textarea
                  id={`${cat.category_id}_comments`}
                  placeholder={`Share any additional thoughts about your ${cat.name.toLowerCase()}...`}
                  value={comments[String(cat.category_id)] || ''}
                  onChange={(e) => handleCommentChange(String(cat.category_id), e.target.value)}
                  className="min-h-[100px] border-gray-200 focus:border-blue-500"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall Comments */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Overall Comments</CardTitle>
          <CardDescription>Share any additional thoughts about your overall performance and goals</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Provide an overall reflection on your performance this semester, including key achievements, challenges faced, and goals for improvement..."
            value={comments.overall || ''}
            onChange={(e) => handleCommentChange('overall', e.target.value)}
            className="min-h-[150px] border-gray-200 focus:border-blue-500"
          />
        </CardContent>
      </Card>

      {/* Submit Actions */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              {completionPercentage === 100 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-orange-500" />
              )}
              <span className="text-sm text-gray-600">
                {completionPercentage === 100 
                  ? 'All questions completed. Ready to submit!'
                  : `${total - completed} questions remaining`
                }
              </span>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="border-gray-200 text-gray-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {isDraft ? 'Saving...' : 'Save as Draft'}
              </Button>
              <Button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || completionPercentage < 100}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting && !isDraft ? 'Submitting...' : 'Submit Evaluation'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}