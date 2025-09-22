#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { query } = require('../config/db');

async function main() {
  const args = Object.fromEntries(process.argv.slice(2).map(kv => {
    const [k, ...rest] = kv.split('=');
    return [k.replace(/^--/, ''), rest.join('=') || true];
  }));
  const email = args.email ? String(args.email) : null;
  if (!email) {
    console.error(JSON.stringify({ error: true, message: 'email is required' }));
    process.exit(1);
  }
  const { rows } = await query('SELECT user_id, first_name, last_name, email FROM users WHERE lower(email)=lower($1) LIMIT 1', [email]);
  if (!rows || rows.length === 0) {
    console.error(JSON.stringify({ error: true, message: `No user for email ${email}` }));
    process.exit(1);
  }
  console.log(JSON.stringify(rows[0]));
}

main().catch(err => {
  console.error('ERR', err && err.stack ? err.stack : err);
  process.exit(1);
});
