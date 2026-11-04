/**
 * One-time script: Update CEO name from Vikram Malhotra → Sheetal Bedi in live DB
 * Run: node src/scripts/updateCeoName.js
 */
import { query, pool } from '../config/db.js';

async function updateCeoName() {
  console.log('🔄 Updating CEO name to Sheetal Bedi...');
  try {
    const r1 = await query(
      `UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3`,
      ['Sheetal', 'Bedi', 'user-ceo-1']
    );
    console.log(`✅ users table updated: ${r1.rowCount} row(s)`);

    const r2 = await query(
      `UPDATE employees SET first_name = $1, last_name = $2 WHERE id = $3`,
      ['Sheetal', 'Bedi', 'emp-ceo-1']
    );
    console.log(`✅ employees table updated: ${r2.rowCount} row(s)`);

    // Verify
    const verify = await query(
      `SELECT u.first_name, u.last_name, u.role, e.employee_code 
       FROM users u JOIN employees e ON e.user_id = u.id 
       WHERE u.id = 'user-ceo-1'`
    );
    console.log('🔍 Verified CEO record:', verify.rows[0]);
    console.log('\n✅ CEO name updated successfully to Sheetal Bedi!');
  } catch (err) {
    console.error('❌ Update failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

updateCeoName();
