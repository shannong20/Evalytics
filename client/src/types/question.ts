export type QuestionType = 'rating_scale' | 'text_response';

export interface QuestionCreateInput {
  text: string; // 5–255 chars, trimmed
  category_id: number;
  weight?: number; // optional, defaults server-side
}

export interface QuestionRecord extends QuestionCreateInput {
  question_id: string; // UUID
  // Optional in case the backend does not provide them; UI defaults to rating scale and required.
  question_type?: QuestionType;
  is_required?: boolean;
  category?: string; // category name (joined on server for convenience)
  question_text?: string; // alias of text provided by server for display
}

export interface CategoryRecord {
  category_id: number;
  name: string;
  weight: number;
}
