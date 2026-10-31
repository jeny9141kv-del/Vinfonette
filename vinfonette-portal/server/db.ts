import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { DB_PATH, DATA_DIR } from './config';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');

export type DatabaseInstance = any;

let activeDb: any = null;

export function getDb(customPath?: string): DatabaseInstance {
  if (customPath) {
    const customDir = path.dirname(customPath);
    if (!fs.existsSync(customDir)) {
      fs.mkdirSync(customDir, { recursive: true });
    }
    const db = new DatabaseSync(customPath);
    initDatabase(db);
    return db;
  }

  if (!activeDb) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    activeDb = new DatabaseSync(DB_PATH);
    initDatabase(activeDb);
  }
  return activeDb;
}

export function initDatabase(db: DatabaseInstance): void {
  // Optimize SQLite for high concurrency and safety
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    -- 1. Profiles Table (Local user credentials and roles)
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('ADMIN', 'PLACEMENT_COORDINATOR', 'MANAGEMENT', 'TRAINER')),
      avatar_url TEXT,
      phone TEXT,
      title TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 2. Training Programs Table
    CREATE TABLE IF NOT EXISTS training_programs (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      track TEXT NOT NULL,
      description TEXT,
      duration_weeks INTEGER NOT NULL DEFAULT 12,
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 3. Candidates Table
    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      candidate_id TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      phone TEXT NOT NULL,
      education TEXT NOT NULL,
      specialization TEXT NOT NULL,
      graduation_year INTEGER NOT NULL,
      batch TEXT NOT NULL,
      technical_skills TEXT NOT NULL DEFAULT '[]',
      certifications TEXT NOT NULL DEFAULT '[]',
      training_program_id TEXT REFERENCES training_programs(id) ON DELETE SET NULL,
      training_progress INTEGER NOT NULL DEFAULT 0,
      resume_url TEXT,
      resume_filename TEXT,
      preferred_roles TEXT NOT NULL DEFAULT '[]',
      preferred_locations TEXT NOT NULL DEFAULT '[]',
      current_stage TEXT NOT NULL DEFAULT 'Registered',
      placement_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (placement_status IN ('ACTIVE', 'PLACED', 'OPTED_OUT', 'ARCHIVED')),
      coordinator_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      trainer_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      readiness_assessment TEXT NOT NULL DEFAULT 'NOT_EVALUATED' CHECK (readiness_assessment IN ('NOT_EVALUATED', 'NEEDS_WORK', 'READY', 'HIGH_POTENTIAL')),
      readiness_score INTEGER NOT NULL DEFAULT 0,
      registration_date TEXT NOT NULL,
      last_activity_at TEXT NOT NULL,
      next_followup_at TEXT,
      internal_notes TEXT,
      -- Payment details
      payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PAID', 'PENDING', 'PARTIAL', 'WAIVED')),
      payment_amount REAL DEFAULT 0,
      amount_paid REAL DEFAULT 0,
      payment_date TEXT,
      payment_reference TEXT,
      payment_notes TEXT,
      -- Educational certificate
      education_certificate_url TEXT,
      education_certificate_filename TEXT,
      -- PF details
      pf_status TEXT NOT NULL DEFAULT 'NOT_APPLICABLE' CHECK (pf_status IN ('APPLICABLE', 'NOT_APPLICABLE', 'EXEMPT')),
      pf_uan TEXT,
      pf_number TEXT,
      pf_notes TEXT,
      -- Service / Experience history
      has_experience INTEGER NOT NULL DEFAULT 0,
      total_experience_years REAL DEFAULT 0,
      service_history TEXT NOT NULL DEFAULT '[]',
      experience_certificate_url TEXT,
      experience_certificate_filename TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 4. Candidate Training Performance Table
    CREATE TABLE IF NOT EXISTS candidate_training (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      program_id TEXT NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
      attendance_rate REAL NOT NULL DEFAULT 0,
      mock_interview_score INTEGER NOT NULL DEFAULT 0,
      technical_assessment_score INTEGER NOT NULL DEFAULT 0,
      soft_skills_score INTEGER NOT NULL DEFAULT 0,
      trainer_feedback TEXT,
      completion_status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (completion_status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DROPPED')),
      completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(candidate_id, program_id)
    );

    -- 5. Companies Table
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      company_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      industry TEXT NOT NULL,
      website TEXT,
      office_location TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      contact_phone TEXT,
      relationship_owner_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      tier TEXT NOT NULL DEFAULT 'TIER_1' CHECK (tier IN ('TIER_1', 'TIER_2', 'ENTERPRISE', 'STARTUP')),
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PARTNERED', 'INACTIVE', 'ARCHIVED')),
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 6. Job Openings Table
    CREATE TABLE IF NOT EXISTS job_openings (
      id TEXT PRIMARY KEY,
      job_id TEXT UNIQUE NOT NULL,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      required_skills TEXT NOT NULL DEFAULT '[]',
      experience_min_years REAL NOT NULL DEFAULT 0,
      education_requirements TEXT,
      eligible_batches TEXT NOT NULL DEFAULT '[]',
      work_location TEXT NOT NULL,
      work_mode TEXT NOT NULL DEFAULT 'HYBRID' CHECK (work_mode IN ('ON_SITE', 'HYBRID', 'REMOTE')),
      salary_min REAL,
      salary_max REAL,
      currency TEXT NOT NULL DEFAULT 'INR',
      vacancies INTEGER NOT NULL DEFAULT 1,
      application_deadline TEXT,
      recruiter_name TEXT,
      recruiter_email TEXT,
      interview_process TEXT,
      status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('DRAFT', 'OPEN', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 7. Job Applications Table
    CREATE TABLE IF NOT EXISTS job_applications (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      job_id TEXT NOT NULL REFERENCES job_openings(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN (
        'Identified', 'Shortlisted', 'Submitted', 'Screening', 'Interviewing', 'Offered', 'Hired', 'Rejected', 'Withdrawn'
      )),
      match_score INTEGER NOT NULL DEFAULT 80,
      applied_at TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(candidate_id, job_id)
    );

    -- 8. Interviews Table
    CREATE TABLE IF NOT EXISTS interviews (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      application_id TEXT REFERENCES job_applications(id) ON DELETE SET NULL,
      job_id TEXT NOT NULL REFERENCES job_openings(id) ON DELETE CASCADE,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      round_number INTEGER NOT NULL DEFAULT 1,
      round_name TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 45,
      timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
      mode TEXT NOT NULL DEFAULT 'VIRTUAL' CHECK (mode IN ('VIRTUAL', 'IN_PERSON', 'TELEPHONIC')),
      meeting_link TEXT,
      location_details TEXT,
      interviewer_names TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'confirmed', 'completed', 'rescheduled', 'cancelled', 'no-show', 'awaiting-feedback'
      )),
      feedback TEXT,
      result TEXT CHECK (result IN ('PASSED', 'FAILED', 'ON_HOLD', 'STRONG_HIRE', 'PENDING')),
      next_round TEXT,
      followup_owner_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 9. Offers Table
    CREATE TABLE IF NOT EXISTS offers (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      application_id TEXT REFERENCES job_applications(id) ON DELETE SET NULL,
      job_id TEXT NOT NULL REFERENCES job_openings(id) ON DELETE CASCADE,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      offer_date TEXT NOT NULL,
      joining_date TEXT,
      base_salary REAL NOT NULL,
      variable_salary REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'INR',
      offer_letter_url TEXT,
      status TEXT NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'ACCEPTED', 'REJECTED', 'NEGOTIATING', 'EXPIRED')),
      rejection_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 10. Placements Table (Single active confirmed placement rule enforced via UNIQUE constraint)
    CREATE TABLE IF NOT EXISTS placements (
      id TEXT PRIMARY KEY,
      candidate_id TEXT UNIQUE NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
      job_id TEXT NOT NULL REFERENCES job_openings(id) ON DELETE RESTRICT,
      offer_id TEXT REFERENCES offers(id) ON DELETE SET NULL,
      application_id TEXT REFERENCES job_applications(id) ON DELETE SET NULL,
      designation TEXT NOT NULL,
      ctc REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      joining_date TEXT NOT NULL,
      confirmation_details TEXT NOT NULL,
      placed_at TEXT NOT NULL,
      coordinator_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'JOINED', 'BACKED_OUT', 'REVOKED')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 11. Tasks Table
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      related_candidate_id TEXT REFERENCES candidates(id) ON DELETE CASCADE,
      related_company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
      related_job_id TEXT REFERENCES job_openings(id) ON DELETE CASCADE,
      related_interview_id TEXT REFERENCES interviews(id) ON DELETE CASCADE,
      owner_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Completed', 'Cancelled')),
      notes TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 12. Notifications Table
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'SYSTEM' CHECK (type IN ('PLACEMENT', 'INTERVIEW', 'TASK', 'APPLICATION', 'SYSTEM')),
      link TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- 13. Candidate Activities Log Table
    CREATE TABLE IF NOT EXISTS candidate_activities (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      actor_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      actor_name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    -- 14. Audit Logs Table (Tamper-evident logs)
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      actor_email TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '{}',
      ip_address TEXT,
      created_at TEXT NOT NULL
    );

    -- 15. Local Application Settings
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_cand_stage ON candidates(current_stage);
    CREATE INDEX IF NOT EXISTS idx_cand_batch ON candidates(batch);
    CREATE INDEX IF NOT EXISTS idx_cand_coord ON candidates(coordinator_id);
    CREATE INDEX IF NOT EXISTS idx_cand_trainer ON candidates(trainer_id);
    CREATE INDEX IF NOT EXISTS idx_int_scheduled ON interviews(scheduled_at);
    CREATE INDEX IF NOT EXISTS idx_tsk_owner ON tasks(owner_id, status);
    CREATE INDEX IF NOT EXISTS idx_act_cid ON candidate_activities(candidate_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
  `);

  // Auto-migrate schema for existing SQLite databases
  try {
    const existingCols = new Set(
      db.prepare("PRAGMA table_info(candidates)").all().map((c: any) => c.name)
    );
    const columnsToAdd = [
      { name: 'payment_status', sql: "ALTER TABLE candidates ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'PENDING'" },
      { name: 'payment_amount', sql: "ALTER TABLE candidates ADD COLUMN payment_amount REAL DEFAULT 0" },
      { name: 'amount_paid', sql: "ALTER TABLE candidates ADD COLUMN amount_paid REAL DEFAULT 0" },
      { name: 'payment_date', sql: "ALTER TABLE candidates ADD COLUMN payment_date TEXT" },
      { name: 'payment_reference', sql: "ALTER TABLE candidates ADD COLUMN payment_reference TEXT" },
      { name: 'payment_notes', sql: "ALTER TABLE candidates ADD COLUMN payment_notes TEXT" },
      { name: 'education_certificate_url', sql: "ALTER TABLE candidates ADD COLUMN education_certificate_url TEXT" },
      { name: 'education_certificate_filename', sql: "ALTER TABLE candidates ADD COLUMN education_certificate_filename TEXT" },
      { name: 'pf_status', sql: "ALTER TABLE candidates ADD COLUMN pf_status TEXT NOT NULL DEFAULT 'NOT_APPLICABLE'" },
      { name: 'pf_uan', sql: "ALTER TABLE candidates ADD COLUMN pf_uan TEXT" },
      { name: 'pf_number', sql: "ALTER TABLE candidates ADD COLUMN pf_number TEXT" },
      { name: 'pf_notes', sql: "ALTER TABLE candidates ADD COLUMN pf_notes TEXT" },
      { name: 'has_experience', sql: "ALTER TABLE candidates ADD COLUMN has_experience INTEGER NOT NULL DEFAULT 0" },
      { name: 'total_experience_years', sql: "ALTER TABLE candidates ADD COLUMN total_experience_years REAL DEFAULT 0" },
      { name: 'service_history', sql: "ALTER TABLE candidates ADD COLUMN service_history TEXT NOT NULL DEFAULT '[]'" },
      { name: 'experience_certificate_url', sql: "ALTER TABLE candidates ADD COLUMN experience_certificate_url TEXT" },
      { name: 'experience_certificate_filename', sql: "ALTER TABLE candidates ADD COLUMN experience_certificate_filename TEXT" },
    ];
    for (const col of columnsToAdd) {
      if (!existingCols.has(col.name)) {
        try {
          db.exec(col.sql);
        } catch {}
      }
    }
    // Create this index only after adding payment_status to older databases.
    db.exec('CREATE INDEX IF NOT EXISTS idx_cand_pay ON candidates(payment_status);');
  } catch {}
}
