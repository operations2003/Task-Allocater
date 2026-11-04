import dotenv from 'dotenv';
dotenv.config();

import { authService } from '../services/authService.js';
import { getDirectClient } from '../config/db.js';

/**
 * TaskNera CEO Command Centre - Provisioning Script
 * Usage: node src/scripts/setupCeo.js [email] [password] [firstName] [lastName]
 */
const setupCeo = async () => {
  const args = process.argv.slice(2);
  const email = args[0] || process.env.CEO_DEFAULT_EMAIL || 'ceo@tasknera.com';
  const password = args[1] || process.env.CEO_DEFAULT_PASSWORD || 'TaskNera@Ceo2026!';
  const firstName = args[2] || 'Vikram';
  const lastName = args[3] || 'Malhotra';

  console.log('👑 TaskNera CEO Command Centre - Executive Provisioning');
  console.log(`Setting up CEO Account for: ${email}...`);

  try {
    const result = await authService.provisionCeoAccount({
      email,
      password,
      firstName,
      lastName,
    });
    console.log('✅ CEO Account provisioned successfully!');
    console.log(`Email: ${result.email}`);
    console.log('Role: CEO (Executive Authority)');
    console.log('You can now log in to the TaskNera CEO Command Centre.\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to provision CEO Account:', err.message);
    process.exit(1);
  }
};

setupCeo();

