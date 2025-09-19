import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import type { QuestionCreateInput, CategoryRecord } from '../../types/question';
import { useAuth } from '../../context/AuthContext';

const schema = z.object({
  text: z.string().trim().min(5, 'Minimum 5 characters').max(255, 'Maximum 255 characters'),
  category_id: z.number().int().positive('Select a category'),
  weight: z.number().min(0).max(100).optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  onCreated?: (created: { question_id: string }) => void;
};

export default function CreateQuestionForm({ onCreated }: Props) {
  const { token } = useAuth();
  const [categories, setCategories] = React.useState([] as CategoryRecord[]);
  const [loadingCats, setLoadingCats] = React.useState(true as boolean);
  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      text: '',
      category_id: undefined as unknown as number,
      weight: undefined,
    },
    mode: 'onBlur',
  });

  React.useEffect(() => {
    const loadCategories = async () => {
      try {
        const baseUrl = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:5000';
        const url = `${baseUrl}/api/v1/categories/public`;
        let data: CategoryRecord[] | null = null;
        try {
          const res = await fetch(url);
          if (res.ok) {
            data = await res.json();
          } else {
            throw new Error(`HTTP ${res.status}`);
          }
        } catch (_e) {
          // Fallback: try the alternate common port (3000<->5000)
          try {
            const altBase = baseUrl.includes(':5000')
              ? baseUrl.replace(':5000', ':3000')
              : baseUrl.includes(':3000')
              ? baseUrl.replace(':3000', ':5000')
              : 'http://localhost:3000';
            const res2 = await fetch(`${altBase}/api/v1/categories/public`);
            if (res2.ok) {
              data = await res2.json();
            }
          } catch {}
        }
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          throw new Error('Failed to load categories');
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to load categories');
      } finally {
        setLoadingCats(false);
      }
    };
    loadCategories();
  }, []);

  const onSubmit = async (values: FormValues) => {
    try {
      const baseUrl = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/v1/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        // The API expects { text, category_id, weight? }
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
        <Label htmlFor="text">Question Text</Label>
        <Controller
          control={control}
          name="text"
          render={({ field }) => (
            <Textarea
              id="text"
              placeholder="Enter the question"
              aria-invalid={!!errors.text}
              aria-describedby={errors.text ? 'text-error' : undefined}
              className="border-gray-200 focus:border-blue-500"
              {...field}
            />
          )}
        />
        {errors.text && (
          <p id="text-error" className="text-red-600 text-sm">{errors.text.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category_id">Category</Label>
        <Controller
          control={control}
          name="category_id"
          render={({ field }) => (
            <Select value={field.value?.toString()}
                    onValueChange={(v: string) => field.onChange(Number(v))}
                    disabled={loadingCats}
            >
              <SelectTrigger id="category_id" className="border-gray-200 focus:border-blue-500">
                <SelectValue placeholder={loadingCats ? 'Loading categories…' : (categories.length === 0 ? 'No categories found' : 'Select category')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.category_id} value={c.category_id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.category_id && (
          <p id="category_id-error" className="text-red-600 text-sm">{errors.category_id.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="weight">Weight (optional)</Label>
        <Controller
          control={control}
          name="weight"
          render={({ field }) => (
            <input
              id="weight"
              type="number"
              step="0.01"
              min={0}
              max={100}
              placeholder="e.g., 1.00"
              className="w-full border rounded px-3 py-2 border-gray-200 focus:border-blue-500"
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
            />
          )}
        />
        {errors.weight && (
          <p id="weight-error" className="text-red-600 text-sm">{errors.weight.message}</p>
        )}
      </div>

      {/* All questions are required by default; no toggle needed. */}

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white border-0">
          {isSubmitting ? 'Creating…' : 'Create Question'}
        </Button>
      </div>
    </form>
  );
}
