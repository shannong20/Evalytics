import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import type { QuestionCreateInput, QuestionType } from '../../types/question';

const schema = z.object({
  question_text: z.string().trim().min(5, 'Minimum 5 characters').max(300, 'Maximum 300 characters'),
  question_type: z.enum(['rating_scale', 'text_response']),
  is_required: z.boolean().optional().default(false),
  category: z.string().trim().min(2, 'Minimum 2 characters').max(100, 'Maximum 100 characters'),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  onCreated?: (created: { question_id: string }) => void;
};

export default function CreateQuestionForm({ onCreated }: Props) {
  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      question_text: '',
      question_type: 'rating_scale',
      is_required: false,
      category: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const baseUrl = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin': 'true',
        },
        body: JSON.stringify(values satisfies QuestionCreateInput),
      });

      if (res.status === 201) {
        const data = await res.json();
        toast.success('Question created');
        reset();
        onCreated?.(data);
        return;
      }

      const problem = await res.json().catch(() => null);
      const message = problem?.error?.message || 'Failed to create question';
      toast.error(message);
    } catch (err) {
      console.error(err);
      toast.error('Network error while creating question');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="question_text">Question Text</Label>
        <Controller
          control={control}
          name="question_text"
          render={({ field }) => (
            <Textarea
              id="question_text"
              placeholder="Enter the question"
              aria-invalid={!!errors.question_text}
              aria-describedby={errors.question_text ? 'question_text-error' : undefined}
              className="border-gray-200 focus:border-blue-500"
              {...field}
            />
          )}
        />
        {errors.question_text && (
          <p id="question_text-error" className="text-red-600 text-sm">{errors.question_text.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="question_type">Question Type</Label>
          <Controller
            control={control}
            name="question_type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={(v: QuestionType) => field.onChange(v)}>
                <SelectTrigger id="question_type" className="border-gray-200 focus:border-blue-500">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating_scale">Rating Scale</SelectItem>
                  <SelectItem value="text_response">Text Response</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select value={field.value} onValueChange={(v: string) => field.onChange(v)}>
                <SelectTrigger id="category" className="border-gray-200 focus:border-blue-500">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Commitment">Commitment</SelectItem>
                  <SelectItem value="Knowledge of Subject">Knowledge of Subject</SelectItem>
                  <SelectItem value="Teaching for Independent Learning">Teaching for Independent Learning</SelectItem>
                  <SelectItem value="Management for Learning">Management for Learning</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && (
            <p id="category-error" className="text-red-600 text-sm">{errors.category.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Controller
          control={control}
          name="is_required"
          render={({ field }) => (
            <Checkbox id="is_required" checked={!!field.value} onCheckedChange={(v: boolean) => field.onChange(!!v)} />
          )}
        />
        <Label htmlFor="is_required" className="cursor-pointer">Required</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white border-0">
          {isSubmitting ? 'Creating…' : 'Create Question'}
        </Button>
      </div>
    </form>
  );
}
