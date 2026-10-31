import { createRequire } from 'module';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');

const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
const dbPath = path.join(localAppData, 'VinfoNette', 'data', 'vinfonette.db');

const args = process.argv.slice(2);
const command = args[0] || 'status';

function parseArg(flag) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return null;
}

function getDatabase() {
  return new DatabaseSync(dbPath);
}

async function main() {
  console.log(`================================================================`);
  console.log(`  VinfoNette Local Administrator Management Utility             `);
  console.log(`================================================================`);
  console.log(`  Database: ${dbPath}\n`);

  const db = getDatabase();

  switch (command) {
    case 'status': {
      const users = db.prepare('SELECT id, email, full_name, role, status, created_at FROM profiles').all();
      const candRow = db.prepare('SELECT COUNT(*) as c FROM candidates').get();

      console.log(`User Accounts Configured: ${users.length}`);
      if (users.length === 0) {
        console.log(`[STATUS] No administrator account exists yet. First-run setup is REQUIRED.`);
        console.log(`You can initialize your administrator account in your browser at /login,`);
        console.log(`or run: npm run admin:set -- --email admin@vinfonette.local --password YourPassword123!`);
      } else {
        console.log(`[STATUS] Administrator account is configured:\n`);
        users.forEach((u) => {
          console.log(`  - Role:       ${u.role}`);
          console.log(`    Email:      ${u.email}`);
          console.log(`    Full Name:  ${u.full_name}`);
          console.log(`    Status:     ${u.status}`);
          console.log(`    Created At: ${u.created_at}\n`);
        });
      }

      console.log(`Candidate Records Preserved: ${candRow.c}`);
      break;
    }

    case 'clear-for-setup': {
      // Safely clear ONLY profiles table so the web browser first-run wizard activates
      const candBefore = db.prepare('SELECT COUNT(*) as c FROM candidates').get();
      db.prepare('DELETE FROM profiles').run();
      db.prepare('UPDATE candidates SET coordinator_id = NULL, trainer_id = NULL').run();

      const candAfter = db.prepare('SELECT COUNT(*) as c FROM candidates').get();

      console.log(`[SUCCESS] Profiles cleared successfully.`);
      console.log(`- Candidate records preserved: ${candAfter.c} (Before: ${candBefore.c})`);
      console.log(`- The browser setup flow at /login will now display the First-Time Administrator Setup screen.`);
      console.log(`- Refresh http://127.0.0.1:3000/login (or 3001) to create your own credentials.`);
      break;
    }

    case 'set': {
      const email = parseArg('--email') || parseArg('-e');
      const password = parseArg('--password') || parseArg('-p');
      const name = parseArg('--name') || parseArg('-n') || 'Primary Local Administrator';
      const title = parseArg('--title') || 'Director of Placements';

      if (!email || !password) {
        console.error(`[ERROR] Missing required arguments.`);
        console.log(`Usage: node scripts/admin-manager.js set --email your@email.com --password YourPassword123! [--name "Your Name"]`);
        process.exit(1);
      }

      if (password.length < 8) {
        console.error(`[ERROR] Password must be at least 8 characters long.`);
        process.exit(1);
      }

      const password_hash = await bcrypt.hash(password, 10);
      const now = new Date().toISOString();

      // Check if an admin exists
      const existing = db.prepare("SELECT id FROM profiles WHERE role = 'ADMIN'").get();

      if (existing) {
        db.prepare(`
          UPDATE profiles SET
            email = ?,
            password_hash = ?,
            full_name = ?,
            title = ?,
            status = 'ACTIVE',
            updated_at = ?
          WHERE id = ?
        `).run(email.trim().toLowerCase(), password_hash, name.trim(), title, now, existing.id);

        console.log(`[SUCCESS] Existing Administrator updated successfully.`);
        console.log(`- Email:     ${email.trim().toLowerCase()}`);
        console.log(`- Full Name: ${name.trim()}`);
        console.log(`- Status:    ACTIVE`);
        console.log(`You can now sign in at http://127.0.0.1:3000/login (or 3001) with these credentials.`);
      } else {
        const id = crypto.randomUUID();
        db.prepare(`
          INSERT INTO profiles (id, email, password_hash, full_name, role, title, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'ADMIN', ?, 'ACTIVE', ?, ?)
        `).run(id, email.trim().toLowerCase(), password_hash, name.trim(), title, now, now);

        console.log(`[SUCCESS] Initial Administrator created successfully.`);
        console.log(`- Email:     ${email.trim().toLowerCase()}`);
        console.log(`- Full Name: ${name.trim()}`);
        console.log(`- Status:    ACTIVE`);
        console.log(`You can now sign in at http://127.0.0.1:3000/login (or 3001) with these credentials.`);
      }
      break;
    }

    default:
      console.log(`Unknown command: ${command}`);
      console.log(`Available commands:`);
      console.log(`  node scripts/admin-manager.js status`);
      console.log(`  node scripts/admin-manager.js set --email <email> --password <password> [--name <name>]`);
      console.log(`  node scripts/admin-manager.js clear-for-setup`);
      break;
  }
  console.log(`================================================================`);
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
