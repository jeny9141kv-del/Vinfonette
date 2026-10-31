import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');

const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
const dataDir = path.join(localAppData, 'VinfoNette', 'data');
const dbPath = path.join(dataDir, 'vinfonette.db');
const resumesDir = path.join(dataDir, 'resumes');
const jwtSecretPath = path.join(dataDir, '.jwt_secret');

const ALL_TABLES = [
  'notifications',
  'tasks',
  'candidate_activities',
  'candidate_training',
  'placements',
  'offers',
  'interviews',
  'job_applications',
  'job_openings',
  'companies',
  'candidates',
  'training_programs',
  'audit_logs',
  'app_settings',
  'profiles'
];

function getFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function countRecords(db, tableName) {
  try {
    const row = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
    return row ? row.count : 0;
  } catch (err) {
    return -1;
  }
}

async function runFreshReset() {
  console.log(`================================================================`);
  console.log(`  VinfoNette Portal — Complete Fresh-Start Reset Utility       `);
  console.log(`================================================================`);
  console.log(`Operational Data Directory: ${dataDir}`);
  console.log(`Target SQLite Database:     ${dbPath}\n`);

  if (!fs.existsSync(dbPath)) {
    console.error(`[ERROR] Database file not found at ${dbPath}`);
    process.exit(1);
  }

  // 1. Pre-inspection
  const sourceDb = new DatabaseSync(dbPath);
  console.log(`>>> Phase 1: Pre-Reset Inspection`);
  const initialCounts = {};
  for (const table of ALL_TABLES) {
    initialCounts[table] = countRecords(sourceDb, table);
    console.log(`  - ${table.padEnd(22)}: ${initialCounts[table]} records`);
  }
  sourceDb.close();

  // 2. Backup Creation
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(localAppData, 'VinfoNette', 'backups', `reset-backup-${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  const backupDbPath = path.join(backupDir, 'vinfonette.db');
  console.log(`\n>>> Phase 2: Creating Verified Timestamped Backup`);
  console.log(`  Target Backup Folder: ${backupDir}`);

  // Copy SQLite Database
  fs.copyFileSync(dbPath, backupDbPath);
  const sourceHash = getFileHash(dbPath);
  const backupHash = getFileHash(backupDbPath);
  const backupSize = fs.statSync(backupDbPath).size;

  if (sourceHash !== backupHash) {
    throw new Error('Database backup verification failed: SHA-256 hash mismatch between source and backup.');
  }
  console.log(`  [OK] Database file backed up (${backupSize} bytes, SHA-256: ${backupHash.substring(0, 16)}...)`);

  // Copy Resumes & Uploads
  const backupResumesDir = path.join(backupDir, 'resumes');
  fs.mkdirSync(backupResumesDir, { recursive: true });
  let resumeFileCount = 0;
  if (fs.existsSync(resumesDir)) {
    const resumeFiles = fs.readdirSync(resumesDir);
    for (const file of resumeFiles) {
      const src = path.join(resumesDir, file);
      const dst = path.join(backupResumesDir, file);
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, dst);
        resumeFileCount++;
      }
    }
  }
  console.log(`  [OK] Uploaded resumes preserved in backup: ${resumeFileCount} file(s)`);

  // Copy .jwt_secret (preserving encryption identity)
  if (fs.existsSync(jwtSecretPath)) {
    fs.copyFileSync(jwtSecretPath, path.join(backupDir, '.jwt_secret'));
    console.log(`  [OK] JWT secret backed up`);
  }

  // 3. Backup Readability & Integrity Verification
  console.log(`\n>>> Phase 3: Verifying Backup Readability & Data Integrity`);
  const backupDb = new DatabaseSync(backupDbPath);
  const integrity = backupDb.prepare('PRAGMA integrity_check').get();
  if (!integrity || integrity.integrity_check !== 'ok') {
    backupDb.close();
    throw new Error(`Backup database failed PRAGMA integrity check: ${JSON.stringify(integrity)}`);
  }
  console.log(`  [OK] PRAGMA integrity_check on backup passed: ${integrity.integrity_check}`);

  // Check table counts on backup match original
  for (const table of ALL_TABLES) {
    const countInBackup = countRecords(backupDb, table);
    if (countInBackup !== initialCounts[table]) {
      backupDb.close();
      throw new Error(`Backup table count mismatch on ${table}: expected ${initialCounts[table]}, got ${countInBackup}`);
    }
  }
  console.log(`  [OK] All ${ALL_TABLES.length} tables verified readable in backup.`);
  backupDb.close();

  // Write manifest
  const manifest = {
    timestamp: new Date().toISOString(),
    sourceDatabase: dbPath,
    backupDatabase: backupDbPath,
    databaseSize: backupSize,
    databaseSha256: backupHash,
    resumesPreserved: resumeFileCount,
    tableCounts: initialCounts
  };
  fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`  [OK] Backup manifest written to ${path.join(backupDir, 'manifest.json')}`);

  // 4. Operational Data Reset in Primary Database
  console.log(`\n>>> Phase 4: Resetting Operational Data (Transaction)`);
  const db = new DatabaseSync(dbPath);

  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec('BEGIN IMMEDIATE;');
  try {
    const deletedCounts = {};
    for (const table of ALL_TABLES) {
      const before = countRecords(db, table);
      db.prepare(`DELETE FROM ${table}`).run();
      deletedCounts[table] = before;
    }
    db.exec('COMMIT;');
    console.log(`  [OK] Database transaction committed successfully.`);
  } catch (err) {
    db.exec('ROLLBACK;');
    db.close();
    throw new Error(`Database reset failed during transaction: ${err.message}`);
  }

  // Optimize & reclaim space
  db.exec('VACUUM;');
  console.log(`  [OK] VACUUM completed.`);

  // 5. Clean up old uploaded resume files (now that backup is secured and records deleted)
  if (fs.existsSync(resumesDir)) {
    const remainingFiles = fs.readdirSync(resumesDir);
    let removedResumes = 0;
    for (const file of remainingFiles) {
      const filePath = path.join(resumesDir, file);
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
        removedResumes++;
      }
    }
    console.log(`  [OK] Cleared ${removedResumes} old operational resume file(s) from ${resumesDir}`);
  }

  // 6. Post-Reset Verification
  console.log(`\n>>> Phase 5: Post-Reset Verification`);
  const postCounts = {};
  let totalRemaining = 0;
  for (const table of ALL_TABLES) {
    postCounts[table] = countRecords(db, table);
    totalRemaining += postCounts[table];
    if (postCounts[table] !== 0) {
      console.error(`  [FAIL] ${table} still has ${postCounts[table]} records!`);
    } else {
      console.log(`  [CLEAN] ${table.padEnd(22)}: 0 records`);
    }
  }

  // Verify schema and indexes still intact
  const tablesInDb = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`).all();
  const indexesInDb = db.prepare(`SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'`).all();
  console.log(`\n  Schema Preserved:`);
  console.log(`  - Application Tables: ${tablesInDb.length} tables present`);
  console.log(`  - Database Indexes:   ${indexesInDb.length} indexes present`);

  const finalIntegrity = db.prepare('PRAGMA integrity_check').get();
  console.log(`  - SQLite Integrity:   ${finalIntegrity.integrity_check}`);
  db.close();

  if (totalRemaining > 0) {
    throw new Error(`Reset verification failed: ${totalRemaining} records remain in database.`);
  }

  console.log(`\n================================================================`);
  console.log(`  FRESH-START RESET COMPLETE & VERIFIED                         `);
  console.log(`================================================================`);
  console.log(`Backup Location:  ${backupDir}`);
  console.log(`User Accounts:    0 (Old admin completely removed)`);
  console.log(`Business Records: 0 (Candidates, jobs, interviews, tasks cleared)`);
  console.log(`Setup Mode:       ENABLED (Browser setup wizard active)`);
  console.log(`================================================================\n`);
}

runFreshReset().catch((err) => {
  console.error('\n[FATAL ERROR DURING RESET]', err);
  process.exit(1);
});
