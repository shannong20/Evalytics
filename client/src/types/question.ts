export type QuestionType = 'rating_scale' | 'text_response';

export interface QuestionCreateInput {
  question_text: string; // 5–300 chars, trimmed
  question_type: QuestionType;
  is_required?: boolean; // default false
  category: string; // 2–100 chars, trimmed
}

export interface QuestionRecord extends Required<Omit<QuestionCreateInput, 'is_required'>> {
  question_id: string; // UUID
  is_required: boolean;
}
