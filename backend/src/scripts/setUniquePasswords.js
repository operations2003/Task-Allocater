import bcrypt from 'bcryptjs';
import { query, pool } from '../config/db.js';

const CREDENTIALS = [
  { email: 'ceo@tasknera.com',         pass: 'Sheetal@Ceo2026!' },
  { email: 'aakanksha@tasknera.com',   pass: 'Aakanksha@003!' },
  { email: 'kamaljeet@tasknera.com',   pass: 'Kamaljeet@005!' },
  { email: 'swati@tasknera.com',       pass: 'Swati@006!' },
  { email: 'sakshi@tasknera.com',      pass: 'Sakshi@007!' },
  { email: 'shubham@tasknera.com',     pass: 'Shubham@009!' },
  { email: 'didarshah@tasknera.com',   pass: 'Didar@010!' },
  { email: 'rashmikotekar@tasknera.com', pass: 'Rashmi@014!' },
  { email: 'prabhjotgora@tasknera.com', pass: 'Prabhjot@015!' },
  { email: 'mounika@tasknera.com',     pass: 'Mounika@018!' },
];

async function run() {
  console.log('🔐 Setting unique individual passwords for all users...\n');
  const hashes = {};

  for (const item of CREDENTIALS) {
    const hash = await bcrypt.hash(item.pass, 10);
    hashes[item.email] = hash;

    const res = await query(
      `UPDATE users SET password_hash = $1 WHERE email = $2`,
      [hash, item.email]
    );

    console.log(`✅ ${item.email.padEnd(25)} -> ${item.pass.padEnd(18)} (Updated: ${res.rowCount} row)`);
  }

  console.log('\n🔒 All 10 users updated with distinct unique passwords.');
  await pool.end();
}

run().catch((err) => {
  console.error('❌ Error setting passwords:', err.message);
  pool.end();
  process.exit(1);
});

