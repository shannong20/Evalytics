require('dotenv').config();
const { pool, query } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function columnExists(table, column) {
  const { rows } = await query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2 LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

async function getColumnType(table, column) {
  const { rows } = await query(
    `SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2`,
    [table, column]
  );
  return rows[0]?.data_type || null;
}

async function getPrimaryKeyName(table) {
  const { rows } = await query(
    `SELECT tc.constraint_name
     FROM information_schema.table_constraints tc
     WHERE tc.table_schema='public' AND tc.table_name=$1 AND tc.constraint_type='PRIMARY KEY'
     LIMIT 1`,
    [table]
  );
  return rows[0]?.constraint_name || null;
}

async function constraintExists(name) {
  const { rows } = await query(
    `SELECT 1 FROM pg_constraint WHERE conname=$1 LIMIT 1`,
    [name]
  );
  return rows.length > 0;
}

async function migrate() {
  console.log('🔧 Running questions table migration against DB:', process.env.DB_NAME);
  await query('BEGIN');

  // Ensure table exists (no defaults requiring extensions)
  await query(`
    CREATE TABLE IF NOT EXISTS public.questions (
      question_id uuid PRIMARY KEY,
      question_text varchar(300) NOT NULL,
      question_type varchar(20) NOT NULL,
      is_required boolean NOT NULL DEFAULT false,
      category varchar(100) NOT NULL
    );
  `);

  // Ensure required columns
  if (!(await columnExists('questions', 'is_required'))) {
    await query(`ALTER TABLE public.questions ADD COLUMN is_required boolean NOT NULL DEFAULT false`);
  }
  if (!(await columnExists('questions', 'category'))) {
    await query(`ALTER TABLE public.questions ADD COLUMN category varchar(100) NOT NULL DEFAULT 'General'`);
  }

  // Leave existing primary key type as-is to avoid breaking dependent objects.

  // Ensure valid type constraint for question_type
  if (!(await constraintExists('chk_questions_type_valid'))) {
    await query(`ALTER TABLE public.questions ADD CONSTRAINT chk_questions_type_valid CHECK (question_type IN ('rating_scale','text_response'))`);
  }

  // Ensure unique constraint on (category, question_text)
  if (!(await constraintExists('uq_questions_category_text'))) {
    await query(`ALTER TABLE public.questions ADD CONSTRAINT uq_questions_category_text UNIQUE (category, question_text)`);
  }

  // Helpful index for category filtering
  await query(`CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions(category)`);

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
