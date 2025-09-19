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

async function migrate() {
  console.log('🔧 Running migration: add comments to evaluation table (if missing)');
  await query('BEGIN');
  try {
    const hasComments = await columnExists('evaluation', 'comments');
    if (!hasComments) {
      console.log('Adding column comments TEXT to public.evaluation...');
      await query(`ALTER TABLE public.evaluation ADD COLUMN comments TEXT`);
    } else {
      console.log('comments column already exists on public.evaluation');
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
