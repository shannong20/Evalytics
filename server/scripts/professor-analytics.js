#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs');
const { query } = require('../config/db');
const { getProfessorAnalytics } = require('../services/analyticsService');

async function main() {
  // Args: --email=user@example.com OR --professor_user_id=<uuid_or_int>
  // Optional: --start_date=YYYY-MM-DD --end_date=YYYY-MM-DD --course_id_list=1,2,3 --min_responses=5 --out=output.json
  const args = Object.fromEntries(process.argv.slice(2).map(kv => {
    const [k, ...rest] = kv.split('=');
    return [k.replace(/^--/, ''), rest.join('=') || true];
  }));

  let professor_user_id = args.professor_user_id ? String(args.professor_user_id) : null;
  const email = args.email ? String(args.email) : null;
  const start_date = args.start_date || null;
  const end_date = args.end_date || null;
  const course_id_list = args.course_id_list || null; // CSV or null
  const min_responses = args.min_responses ? parseInt(args.min_responses, 10) : 5;
  const out = args.out || null;

  if (!professor_user_id && email) {
    const { rows } = await query(
      'SELECT user_id FROM users WHERE lower(email) = lower($1) LIMIT 1',
      [email]
    );
    if (!rows || rows.length === 0) {
      console.error(JSON.stringify({ error: true, message: `No user found with email ${email}` }, null, 2));
      process.exit(1);
    }
    professor_user_id = String(rows[0].user_id);
  }

  if (!professor_user_id) {
    console.error(JSON.stringify({ error: true, message: 'professor_user_id or email is required' }, null, 2));
    process.exit(1);
  }

  let result;
  try {
    result = await getProfessorAnalytics({
      professor_user_id,
      start_date,
      end_date,
      course_id_list,
      min_responses,
    });
  } catch (err) {
    const errOut = {
      name: err && err.name,
      message: err && err.message,
      code: err && err.code,
      detail: err && err.detail,
      schema: err && err.schema,
      table: err && err.table,
      hint: err && err.hint,
      position: err && err.position,
      routine: err && err.routine,
      stack: err && err.stack,
    };
    console.error('Analytics execution error JSON:', JSON.stringify(errOut, null, 2));
    process.exit(1);
  }

  if (result && result.error) {
    console.error(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  const output = {
    human_summary: result.human_summary,
    json_output: result.json_output,
    chart_datasets: result.chart_datasets,
  };

  if (out) {
    const outPath = path.resolve(process.cwd(), out);
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`Wrote analytics to ${outPath}`);
  } else {
    console.log(JSON.stringify(output, null, 2));
  }
}

main().catch(err => {
  console.error('Error running analytics:', err);
  process.exit(1);
});
