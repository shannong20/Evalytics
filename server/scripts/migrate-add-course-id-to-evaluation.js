require('dotenv').config();
const { pool, query } = require('../config/db');

async function columnExists(table, column) {
  const sql = `
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
      AND column_name = $2
    LIMIT 1
  `;
  const { rows } = await query(sql, [table.toLowerCase(), column.toLowerCase()]);
  return rows.length > 0;
}

async function constraintExists(name) {
  const sql = `
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND constraint_name = $1
    LIMIT 1
  `;
  const { rows } = await query(sql, [name]);
  return rows.length > 0;
}

async function migrate() {
  console.log('🔧 Running migration: add course_id to Evaluation table');
  await query('BEGIN');
  try {
    const hasCourseCol = await columnExists('evaluation', 'course_id');
    if (!hasCourseCol) {
      console.log('Adding column course_id to Evaluation...');
      await query(`ALTER TABLE public.evaluation ADD COLUMN course_id INTEGER`);
      await query(`CREATE INDEX IF NOT EXISTS idx_evaluation_course_id ON public.evaluation(course_id)`);
    } else {
      console.log('course_id already exists on Evaluation.');
    }

    const fkName = 'fk_evaluation_course_id_course';
    const hasFk = await constraintExists(fkName);
    if (!hasFk) {
      console.log('Adding foreign key constraint to Evaluation(course_id) -> course(course_id)...');
      await query(`
        ALTER TABLE public.evaluation
        ADD CONSTRAINT ${fkName}
        FOREIGN KEY (course_id)
        REFERENCES public.course(course_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
      `);
    } else {
      console.log('Foreign key already exists.');
    }

    await query('COMMIT');
    console.log('✅ Migration completed successfully.');
  } catch (err) {
    await query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
