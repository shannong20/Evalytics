require('dotenv').config();
const { pool, query } = require('../config/db');

async function migrate() {
  console.log('🔧 Creating evaluation_responses table on DB:', process.env.DB_NAME);
  await query('BEGIN');
  try {
    // Create base table without hard FKs to avoid dependency issues across environments
    await query(`
      CREATE TABLE IF NOT EXISTS public.evaluation_responses (
        response_id SERIAL PRIMARY KEY,
        form_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        faculty_id INTEGER NOT NULL,
        submitted_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Helpful indexes (also covered by a separate index migration, but harmless here)
    await query(`CREATE INDEX IF NOT EXISTS idx_eval_responses_form_id ON public.evaluation_responses(form_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_eval_responses_student_id ON public.evaluation_responses(student_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_eval_responses_faculty_id ON public.evaluation_responses(faculty_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_eval_responses_submitted_at ON public.evaluation_responses(submitted_at)`);

    await query('COMMIT');
    console.log('✅ evaluation_responses table migration completed.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    try { await query('ROLLBACK'); } catch (_) {}
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
