import { createRequire } from 'module';
import path from 'path';
import os from 'os';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');

const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
const dbPath = path.join(localAppData, 'VinfoNette', 'data', 'vinfonette.db');

console.log('Database Path:', dbPath);

try {
  const db = new DatabaseSync(dbPath);
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables found:', tables.map(t => t.name));

  const users = db.prepare('SELECT id, email, full_name, role, status, created_at FROM profiles').all();
  console.log(`\n--- USERS IN DATABASE (${users.length}) ---`);
  users.forEach(u => {
    console.log(`- ID: ${u.id} | Email: ${u.email} | Name: ${u.full_name} | Role: ${u.role} | Status: ${u.status}`);
  });

  const candidatesCount = db.prepare('SELECT COUNT(*) as count FROM candidates').get();
  console.log(`\nCandidates count: ${candidatesCount.count}`);

  const placementsCount = db.prepare('SELECT COUNT(*) as count FROM placements').get();
  console.log(`Placements count: ${placementsCount.count}`);
} catch (err) {
  console.error('Error reading database:', err);
}
