require('dotenv').config();
const { pool, query } = require('../config/db');

async function migrate() {
  console.log('🔧 Adding analytics indexes to evaluation_responses on DB:', process.env.DB_NAME);
  await query('BEGIN');
  try {
    // Create indexes if the table exists
    await query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'evaluation_responses'
        ) THEN
          EXECUTE 'CREATE INDEX IF NOT EXISTS idx_eval_responses_faculty_id ON public.evaluation_responses(faculty_id)';
          EXECUTE 'CREATE INDEX IF NOT EXISTS idx_eval_responses_form_id ON public.evaluation_responses(form_id)';
          EXECUTE 'CREATE INDEX IF NOT EXISTS idx_eval_responses_submitted_at ON public.evaluation_responses(submitted_at)';
          EXECUTE 'CREATE INDEX IF NOT EXISTS idx_eval_responses_student_id ON public.evaluation_responses(student_id)';
        END IF;
      END
      $$;
    `);

    await query('COMMIT');
    console.log('✅ Index migration completed.');
  } catch (err) {
    console.error('❌ Index migration failed:', err.message);
    try { await query('ROLLBACK'); } catch (_) {}
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
