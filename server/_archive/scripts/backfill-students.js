// Backfill missing rows in public.students for users with role=student
// Usage: node scripts/backfill-students.js

require('dotenv').config();
const { pool, query } = require('../config/db');

async function tableExists(table) {
  const { rows } = await query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1 LIMIT 1`,
    [table]
  );
  return rows.length > 0;
}

async function columnExists(table, column) {
  const { rows } = await query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2 LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

async function backfill() {
  console.log('🔧 Backfilling students for users with role=student...');

  if (!(await tableExists('students'))) {
    console.error("❌ Table 'public.students' does not exist. Please create it before running this script.");
    process.exitCode = 1;
    return;
  }

  const hasCourseTitle = await columnExists('students', 'course_title');

  // Determine how many users need backfilling
  const { rows: pendingRows } = await query(`
    SELECT u.user_id
    FROM public.users u
    LEFT JOIN public.students s ON s.user_id = u.user_id
    WHERE LOWER(TRIM(u.role)) IN ('student','students') AND s.user_id IS NULL
  `);

  if (pendingRows.length === 0) {
    console.log('✅ No missing student rows. Nothing to do.');
    return;
  }

  console.log(`ℹ️  Found ${pendingRows.length} user(s) missing in students.`);

  await query('BEGIN');
  try {
    if (hasCourseTitle) {
      // Insert with course_title as NULL; adjust as needed if your schema requires NOT NULL
      await query(`
        INSERT INTO public.students (user_id, course_title)
        SELECT u.user_id, NULL::varchar
        FROM public.users u
        LEFT JOIN public.students s ON s.user_id = u.user_id
        WHERE LOWER(TRIM(u.role)) IN ('student','students') AND s.user_id IS NULL
      `);
    } else {
      await query(`
        INSERT INTO public.students (user_id)
        SELECT u.user_id
        FROM public.users u
        LEFT JOIN public.students s ON s.user_id = u.user_id
        WHERE LOWER(TRIM(u.role)) IN ('student','students') AND s.user_id IS NULL
      `);
    }

    await query('COMMIT');
    console.log('✅ Backfill completed successfully.');
  } catch (err) {
    await query('ROLLBACK').catch(() => {});
    console.error('❌ Backfill failed:', {
      code: err?.code,
      message: err?.message,
      detail: err?.detail,
    });
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

backfill();
