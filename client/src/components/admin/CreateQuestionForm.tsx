import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { apiService } from '../../lib/api';

type Category = {
  category_id: string;
  name: string;
};

type QuestionCreateInput = {
  text: string; // 5–1000 chars, trimmed
  category_id: string; // category ID as string
  is_required?: boolean; // default false
};

const schema = z.object({
  text: z.string().trim().min(5, 'Minimum 5 characters').max(1000, 'Maximum 1000 characters'),
  category_id: z.string().min(1, 'Please select a category'),
  is_required: z.boolean().optional().default(false),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  onCreated?: (created: { question_id: string; text: string; category_id: string; is_required: boolean }) => void;
};

export default function CreateQuestionForm({ onCreated }: Props) {
  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      text: '',
      category_id: '',
      is_required: false,
    },
    mode: 'onBlur',
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiService.questions.getCategories();
        if (response.status === 'success') {
          // Normalize possible response shapes: data (array) | { categories: [...] } | { data: [...] }
          const data: any = (response as any).data;
          let rawCategories: any[] = [];
          if (Array.isArray(data)) {
            rawCategories = data;
          } else if (data && typeof data === 'object') {
            rawCategories = (data.categories && Array.isArray(data.categories))
              ? data.categories
              : (Array.isArray(data.data) ? data.data : []);
          }

          const allCategories: Category[] = (rawCategories || []).map((category: any) => ({
            category_id: String(category.category_id ?? category.id ?? ''),
            name: category.name ?? category.category_name ?? 'Uncategorized'
          }));
          setCategories(allCategories);
        } else {
          throw new Error(response.message || 'Failed to load categories');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const onSubmit = async (data: FormValues) => {
    try {
      console.log('Submitting question:', data);
      // API does not accept is_required for Question per schema; only send required fields
      const response = await apiService.questions.createQuestion({
        text: data.text,
        category_id: data.category_id,
      });

      if (response.status === 'success' && response.data) {
        toast.success('Question created successfully');
        reset();
        onCreated?.({
          question_id: String((response.data as any).question_id ?? ''),
          text: String((response.data as any).text ?? data.text),
          category_id: String((response.data as any).category_id ?? data.category_id),
          // Since Question table has no is_required, default to false for UI consumers
          is_required: Boolean((response.data as any).is_required ?? false),
        });
      } else {
        throw new Error(response.message || 'Failed to create question');
      }
    } catch (error) {
      console.error('Error creating question:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create question');
    }
  };

  if (isLoading) {
    return <div>Loading categories...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="text">Question Text</Label>
        <Controller
          name="text"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="text"
              placeholder="Enter your question here"
              className={`mt-1 w-full ${errors.text ? 'border-red-500' : ''}`}
            />
          )}
        />
        {errors.text && (
          <p className="mt-1 text-sm text-red-600">{errors.text.message}</p>
        )}
      </div>

      <div>
        <Label>Category</Label>
        <Controller
          name="category_id"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.category_id} value={category.category_id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.category_id && (
          <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Controller
          name="is_required"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="is_required"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label htmlFor="is_required" className="text-sm font-medium leading-none cursor-pointer">Required</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white border-0">
          {isSubmitting ? 'Creating…' : 'Create Question'}
        </Button>
      </div>
    </form>
  );
}
