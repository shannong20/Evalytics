require('dotenv').config();
const { pool, query } = require('../config/db');

async function migrate() {
  console.log('🔧 Running evaluation_answers table migration against DB:', process.env.DB_NAME);
  await query('BEGIN');

  // Ensure pgcrypto is available if we want to use UUIDs elsewhere
  await query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

  await query(`
    CREATE TABLE IF NOT EXISTS public.evaluation_answers (
      answer_id BIGSERIAL PRIMARY KEY,
      response_id INTEGER NOT NULL REFERENCES public.evaluation_responses(response_id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL REFERENCES public.questions(question_id) ON DELETE RESTRICT,
      answer_value TEXT NOT NULL,
      metadata JSONB,
      created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_eval_answers_response_id ON public.evaluation_answers(response_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_eval_answers_question_id ON public.evaluation_answers(question_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_eval_answers_created_at ON public.evaluation_answers(created_at)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_eval_answers_metadata_gin ON public.evaluation_answers USING GIN (metadata)`);

  await query('COMMIT');
  console.log('✅ Migration completed successfully.');
}

migrate()
  .catch(async (err) => {
    console.error('❌ Migration failed:', err.message);
    try { await query('ROLLBACK'); } catch (_) {}
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
