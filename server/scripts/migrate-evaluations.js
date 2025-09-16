require('dotenv').config();
const { pool, query } = require('../config/db');

async function migrate() {
  console.log('🔧 Running evaluations table migration against DB:', process.env.DB_NAME);
  await query('BEGIN');

  // Ensure pgcrypto for gen_random_uuid()
  await query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

  await query(`
    CREATE TABLE IF NOT EXISTS public.evaluation_submissions (
      submission_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      subject varchar(100) NOT NULL,
      target_name varchar(255) NOT NULL,
      responses jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_eval_submissions_created_at ON public.evaluation_submissions(created_at)`);

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
