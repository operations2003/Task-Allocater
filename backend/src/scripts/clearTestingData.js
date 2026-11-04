/**
 * Delete all testing data from the database
 * Cleans tasks, allocations, audit logs, reminders, notifications, and resets workload
 * Keeps: Organizations, Departments, Designations, CEO (Sheetal Bedi), and 9 Real Employees
 * Run: node src/scripts/clearTestingData.js
 */
import { query, pool } from '../config/db.js';

async function clearData() {
  console.log('🧹 Purging all testing data from database...\n');
  try {
    const r1 = await query(`DELETE FROM task_reminders`);
    console.log(`✅ task_reminders deleted: ${r1.rowCount} rows`);

    const r2 = await query(`DELETE FROM task_audit_logs`);
    console.log(`✅ task_audit_logs deleted: ${r2.rowCount} rows`);

    const r3 = await query(`DELETE FROM ai_task_allocations`);
    console.log(`✅ ai_task_allocations deleted: ${r3.rowCount} rows`);

    const r4 = await query(`DELETE FROM executive_approval_requests`);
    console.log(`✅ executive_approval_requests deleted: ${r4.rowCount} rows`);

    const r5 = await query(`DELETE FROM notifications`);
    console.log(`✅ notifications deleted: ${r5.rowCount} rows`);

    const r6 = await query(`DELETE FROM task_daily_pending_reports`);
    console.log(`✅ task_daily_pending_reports deleted: ${r6.rowCount} rows`);

    const r7 = await query(`DELETE FROM work_tasks`);
    console.log(`✅ work_tasks deleted: ${r7.rowCount} rows`);

    const r8 = await query(`UPDATE employees SET current_workload = 0, availability_status = 'AVAILABLE'`);
    console.log(`✅ employee workloads reset to 0: ${r8.rowCount} rows`);

    // Verification check
    const tasksCount = await query(`SELECT COUNT(*) FROM work_tasks`);
    const allocsCount = await query(`SELECT COUNT(*) FROM ai_task_allocations`);
    const logsCount = await query(`SELECT COUNT(*) FROM task_audit_logs`);
    const empsCount = await query(`SELECT COUNT(*) FROM employees`);

    console.log('\n📊 Database Status After Cleanup:');
    console.log(`  work_tasks: ${tasksCount.rows[0].count}`);
    console.log(`  ai_task_allocations: ${allocsCount.rows[0].count}`);
    console.log(`  task_audit_logs: ${logsCount.rows[0].count}`);
    console.log(`  employees (real team intact): ${empsCount.rows[0].count}`);

    console.log('\n✨ Database is completely clean and ready for production use!');
  } catch (err) {
    console.error('❌ Failed to clear testing data:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

clearData();

