-- ==============================================================================
-- VINFONETTE INTERNAL PLACEMENT MANAGEMENT PORTAL
-- MIGRATION 01: Core Database Schema, Tables, Constraints, and Triggers
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Profiles Table (User role, contact, and profile settings)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'PLACEMENT_COORDINATOR' 
        CHECK (role IN ('ADMIN', 'PLACEMENT_COORDINATOR', 'MANAGEMENT', 'TRAINER')),
    avatar_url TEXT,
    phone TEXT,
    title TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 2. Training Programs Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.training_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    track TEXT NOT NULL,
    description TEXT,
    duration_weeks INT NOT NULL DEFAULT 12,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3. Candidates Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id TEXT NOT NULL UNIQUE, -- e.g. VN-2026-001
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    education TEXT NOT NULL,
    specialization TEXT NOT NULL,
    graduation_year INT NOT NULL,
    batch TEXT NOT NULL, -- e.g. '2026-A', '2025-B'
    technical_skills TEXT[] NOT NULL DEFAULT '{}',
    certifications TEXT[] NOT NULL DEFAULT '{}',
    training_program_id UUID REFERENCES public.training_programs(id) ON DELETE SET NULL,
    training_progress INT NOT NULL DEFAULT 0 CHECK (training_progress >= 0 AND training_progress <= 100),
    resume_url TEXT,
    resume_filename TEXT,
    preferred_roles TEXT[] NOT NULL DEFAULT '{}',
    preferred_locations TEXT[] NOT NULL DEFAULT '{}',
    current_stage TEXT NOT NULL DEFAULT 'Registered' CHECK (current_stage IN (
        'Registered',
        'Training in Progress',
        'Training Completed',
        'Resume Ready',
        'Placement Ready',
        'Applications Submitted',
        'Interview Scheduled',
        'Interview Completed',
        'Offer Received',
        'Placed Successfully',
        'On Hold',
        'Not Interested',
        'Rejected',
        'Withdrawn'
    )),
    placement_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (placement_status IN ('ACTIVE', 'PLACED', 'OPTED_OUT', 'ARCHIVED')),
    coordinator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    trainer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    readiness_assessment TEXT NOT NULL DEFAULT 'NOT_EVALUATED' CHECK (readiness_assessment IN ('NOT_EVALUATED', 'NEEDS_WORK', 'READY', 'HIGH_POTENTIAL')),
    readiness_score INT NOT NULL DEFAULT 0 CHECK (readiness_score >= 0 AND readiness_score <= 100),
    registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    next_followup_at TIMESTAMPTZ,
    internal_notes TEXT,
    -- Payment Details
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PAID', 'PENDING', 'PARTIAL', 'WAIVED')),
    payment_amount NUMERIC(12,2) DEFAULT 0,
    amount_paid NUMERIC(12,2) DEFAULT 0,
    payment_date DATE,
    payment_reference TEXT,
    payment_notes TEXT,
    -- Educational Certificate
    education_certificate_url TEXT,
    education_certificate_filename TEXT,
    -- PF Details
    pf_status TEXT NOT NULL DEFAULT 'NOT_APPLICABLE' CHECK (pf_status IN ('APPLICABLE', 'NOT_APPLICABLE', 'EXEMPT')),
    pf_uan TEXT,
    pf_number TEXT,
    pf_notes TEXT,
    -- Service History & Experience Certificate
    has_experience BOOLEAN NOT NULL DEFAULT FALSE,
    total_experience_years NUMERIC(4,1) DEFAULT 0.0,
    service_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    experience_certificate_url TEXT,
    experience_certificate_filename TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 4. Candidate Training Performance Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.candidate_training (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES public.training_programs(id) ON DELETE CASCADE,
    attendance_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    mock_interview_score INT NOT NULL DEFAULT 0,
    technical_assessment_score INT NOT NULL DEFAULT 0,
    soft_skills_score INT NOT NULL DEFAULT 0,
    trainer_feedback TEXT,
    completion_status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (completion_status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DROPPED')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_candidate_program UNIQUE (candidate_id, program_id)
);

-- ------------------------------------------------------------------------------
-- 5. Companies Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT NOT NULL UNIQUE, -- e.g. CMP-001
    name TEXT NOT NULL,
    industry TEXT NOT NULL,
    website TEXT,
    office_location TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    relationship_owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tier TEXT NOT NULL DEFAULT 'TIER_1' CHECK (tier IN ('TIER_1', 'TIER_2', 'ENTERPRISE', 'STARTUP')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PARTNERED', 'INACTIVE', 'ARCHIVED')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 6. Job Openings Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_openings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id TEXT NOT NULL UNIQUE, -- e.g. JOB-2026-01
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    required_skills TEXT[] NOT NULL DEFAULT '{}',
    experience_min_years NUMERIC(3,1) NOT NULL DEFAULT 0,
    education_requirements TEXT,
    eligible_batches TEXT[] NOT NULL DEFAULT '{}',
    work_location TEXT NOT NULL,
    work_mode TEXT NOT NULL DEFAULT 'HYBRID' CHECK (work_mode IN ('ON_SITE', 'HYBRID', 'REMOTE')),
    salary_min NUMERIC(12,2),
    salary_max NUMERIC(12,2),
    currency TEXT NOT NULL DEFAULT 'INR',
    vacancies INT NOT NULL DEFAULT 1,
    application_deadline DATE,
    recruiter_name TEXT,
    recruiter_email TEXT,
    interview_process TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('DRAFT', 'OPEN', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 7. Job Applications Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.job_openings(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Identified' CHECK (status IN (
        'Identified',
        'Shortlisted',
        'Submitted',
        'Screening',
        'Interviewing',
        'Offered',
        'Hired',
        'Rejected',
        'Withdrawn'
    )),
    match_score INT NOT NULL DEFAULT 80,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_candidate_application UNIQUE (candidate_id, job_id)
);

-- ------------------------------------------------------------------------------
-- 8. Interviews Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    application_id UUID REFERENCES public.job_applications(id) ON DELETE SET NULL,
    job_id UUID NOT NULL REFERENCES public.job_openings(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    round_number INT NOT NULL DEFAULT 1,
    round_name TEXT NOT NULL, -- e.g. Technical Round 1, Managerial, HR
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 45,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    mode TEXT NOT NULL DEFAULT 'VIRTUAL' CHECK (mode IN ('VIRTUAL', 'IN_PERSON', 'TELEPHONIC')),
    meeting_link TEXT,
    location_details TEXT,
    interviewer_names TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
        'scheduled',
        'confirmed',
        'completed',
        'rescheduled',
        'cancelled',
        'no-show',
        'awaiting-feedback'
    )),
    feedback TEXT,
    result TEXT CHECK (result IN ('PASSED', 'FAILED', 'ON_HOLD', 'STRONG_HIRE', 'PENDING')),
    next_round TEXT,
    followup_owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 9. Offers Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.job_openings(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    offer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    joining_date DATE,
    base_salary NUMERIC(12,2) NOT NULL,
    variable_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'INR',
    offer_letter_url TEXT,
    status TEXT NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'ACCEPTED', 'REJECTED', 'NEGOTIATING', 'EXPIRED')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 10. Placements Table (Single active placement rule per candidate)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL UNIQUE REFERENCES public.candidates(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    job_id UUID NOT NULL REFERENCES public.job_openings(id) ON DELETE RESTRICT,
    offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
    application_id UUID REFERENCES public.job_applications(id) ON DELETE SET NULL,
    designation TEXT NOT NULL,
    ctc NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    joining_date DATE NOT NULL,
    confirmation_details TEXT NOT NULL,
    placed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    coordinator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'JOINED', 'BACKED_OUT', 'REVOKED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 11. Tasks and Follow-ups Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    related_candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    related_company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    related_job_id UUID REFERENCES public.job_openings(id) ON DELETE CASCADE,
    related_interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    due_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Completed', 'Cancelled')),
    notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 12. In-App Notifications Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'SYSTEM' CHECK (type IN ('PLACEMENT', 'INTERVIEW', 'TASK', 'APPLICATION', 'SYSTEM')),
    link TEXT,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 13. Candidate Activities Log Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.candidate_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    type TEXT NOT NULL, -- STAGE_CHANGE, NOTE_ADDED, INTERVIEW_SCHEDULED, OFFER_RECEIVED, PLACEMENT_CONFIRMED, RESUME_UPDATED
    description TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 14. System Audit Logs Table (Tamper-evident logs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_email TEXT NOT NULL,
    action TEXT NOT NULL, -- INSERT, UPDATE, DELETE, STAGE_CHANGE, ROLE_CHANGE, EXPORT
    entity_type TEXT NOT NULL, -- candidate, company, job_opening, interview, placement, user
    entity_id TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- Triggers: Automatic updated_at timestamps
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER trg_training_programs_updated_at BEFORE UPDATE ON public.training_programs FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER trg_candidates_updated_at BEFORE UPDATE ON public.candidates FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER trg_job_openings_updated_at BEFORE UPDATE ON public.job_openings FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER trg_job_applications_updated_at BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER trg_interviews_updated_at BEFORE UPDATE ON public.interviews FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER trg_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER trg_placements_updated_at BEFORE UPDATE ON public.placements FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- Triggers: Database-Enforced Bypass-Proof Audit Logging (Phase 5)
-- Automatically captures INSERT, UPDATE, DELETE on sensitive business tables
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
    actor_uid UUID;
    actor_mail TEXT;
    entity_id_val TEXT;
    details_val JSONB;
BEGIN
    actor_uid := auth.uid();
    IF actor_uid IS NOT NULL THEN
        SELECT email INTO actor_mail FROM public.profiles WHERE id = actor_uid;
    END IF;
    IF actor_mail IS NULL THEN
        actor_mail := 'system@vinfonette.com';
    END IF;

    IF TG_OP = 'DELETE' THEN
        entity_id_val := OLD.id::text;
        details_val := to_jsonb(OLD);
    ELSE
        entity_id_val := NEW.id::text;
        details_val := to_jsonb(NEW);
    END IF;

    INSERT INTO public.audit_logs (
        actor_id,
        actor_email,
        action,
        entity_type,
        entity_id,
        details,
        created_at
    ) VALUES (
        actor_uid,
        actor_mail,
        TG_OP,
        TG_TABLE_NAME,
        entity_id_val,
        details_val,
        timezone('utc'::text, now())
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_candidates AFTER INSERT OR UPDATE OR DELETE ON public.candidates FOR EACH ROW EXECUTE PROCEDURE public.handle_audit_log_trigger();
CREATE TRIGGER trg_audit_placements AFTER INSERT OR UPDATE OR DELETE ON public.placements FOR EACH ROW EXECUTE PROCEDURE public.handle_audit_log_trigger();
CREATE TRIGGER trg_audit_offers AFTER INSERT OR UPDATE OR DELETE ON public.offers FOR EACH ROW EXECUTE PROCEDURE public.handle_audit_log_trigger();
CREATE TRIGGER trg_audit_interviews AFTER INSERT OR UPDATE OR DELETE ON public.interviews FOR EACH ROW EXECUTE PROCEDURE public.handle_audit_log_trigger();
CREATE TRIGGER trg_audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_audit_log_trigger();

-- ------------------------------------------------------------------------------
-- Indexes for High Performance Queries and Lookups
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_candidates_stage ON public.candidates(current_stage);
CREATE INDEX IF NOT EXISTS idx_candidates_batch ON public.candidates(batch);
CREATE INDEX IF NOT EXISTS idx_candidates_coordinator ON public.candidates(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_candidates_trainer ON public.candidates(trainer_id);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON public.candidates(email);

CREATE INDEX IF NOT EXISTS idx_job_apps_candidate ON public.job_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_apps_job ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_apps_status ON public.job_applications(status);

CREATE INDEX IF NOT EXISTS idx_interviews_scheduled ON public.interviews(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON public.interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate ON public.interviews(candidate_id);

CREATE INDEX IF NOT EXISTS idx_tasks_owner_status ON public.tasks(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_candidate_activities_cid ON public.candidate_activities(candidate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
