-- ==============================================================================
-- VINFONETTE INTERNAL PLACEMENT MANAGEMENT PORTAL
-- MIGRATION 02: Row Level Security (RLS) Policies and Helper Functions
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Helper functions to get current user role and permissions cleanly
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
DECLARE
    u_role TEXT;
BEGIN
    SELECT role INTO u_role FROM public.profiles WHERE id = auth.uid();
    RETURN COALESCE(u_role, 'ANONYMOUS');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT public.current_user_role() = 'ADMIN');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT public.current_user_role() IN ('ADMIN', 'PLACEMENT_COORDINATOR', 'MANAGEMENT', 'TRAINER'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- Enable Row Level Security (RLS) on all exposed tables
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. Profiles Table RLS Policies
-- ------------------------------------------------------------------------------
-- Everyone authenticated can view staff profiles for dropdowns/assignments
CREATE POLICY "Authenticated users can read staff profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Users can update their own profile info (e.g. name, phone, avatar) BUT CANNOT change their own role!
CREATE POLICY "Users can update their own non-role profile details"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND (
            -- Role must remain unchanged unless updated by an ADMIN
            role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) OR public.is_admin()
        )
    );

-- Only Admins can insert or delete profiles, or change user roles
CREATE POLICY "Only admins can insert profiles"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete profiles"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 2. Candidates Table RLS Policies
-- ------------------------------------------------------------------------------
-- Select: Admins and Management can see all. Coordinators can see assigned + unassigned. Trainers can see assigned.
CREATE POLICY "Candidate select policy"
    ON public.candidates FOR SELECT
    TO authenticated
    USING (
        public.current_user_role() IN ('ADMIN', 'MANAGEMENT')
        OR (public.current_user_role() = 'PLACEMENT_COORDINATOR' AND (coordinator_id = auth.uid() OR coordinator_id IS NULL))
        OR (public.current_user_role() = 'TRAINER' AND (trainer_id = auth.uid() OR trainer_id IS NULL))
    );

-- Insert: Admins and Coordinators can register candidates
CREATE POLICY "Candidate insert policy"
    ON public.candidates FOR INSERT
    TO authenticated
    WITH CHECK (
        public.current_user_role() IN ('ADMIN', 'PLACEMENT_COORDINATOR')
    );

-- Update: Admins can update any; Coordinators can update assigned; Trainers can update readiness score/assessment
CREATE POLICY "Candidate update policy"
    ON public.candidates FOR UPDATE
    TO authenticated
    USING (
        public.is_admin()
        OR (public.current_user_role() = 'PLACEMENT_COORDINATOR' AND coordinator_id = auth.uid())
        OR (public.current_user_role() = 'TRAINER' AND trainer_id = auth.uid())
    )
    WITH CHECK (
        public.is_admin()
        OR (public.current_user_role() = 'PLACEMENT_COORDINATOR' AND coordinator_id = auth.uid())
        OR (public.current_user_role() = 'TRAINER' AND trainer_id = auth.uid())
    );

-- Delete: Only Admins can archive/delete candidate records
CREATE POLICY "Candidate delete policy"
    ON public.candidates FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. Training & Candidate Training RLS Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Training programs readable by authenticated staff"
    ON public.training_programs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Training programs manageable by admin and trainer"
    ON public.training_programs FOR ALL TO authenticated
    USING (public.current_user_role() IN ('ADMIN', 'TRAINER'))
    WITH CHECK (public.current_user_role() IN ('ADMIN', 'TRAINER'));

CREATE POLICY "Candidate training select policy"
    ON public.candidate_training FOR SELECT TO authenticated
    USING (public.is_staff());

CREATE POLICY "Candidate training modification by admin or assigned trainer"
    ON public.candidate_training FOR ALL TO authenticated
    USING (
        public.is_admin()
        OR (public.current_user_role() = 'TRAINER' AND EXISTS (
            SELECT 1 FROM public.candidates c WHERE c.id = candidate_id AND c.trainer_id = auth.uid()
        ))
    );

-- ------------------------------------------------------------------------------
-- 4. Companies and Job Openings RLS Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Companies viewable by all authenticated staff"
    ON public.companies FOR SELECT TO authenticated USING (public.is_staff());

CREATE POLICY "Companies editable by admin and coordinators"
    ON public.companies FOR ALL TO authenticated
    USING (public.current_user_role() IN ('ADMIN', 'PLACEMENT_COORDINATOR'))
    WITH CHECK (public.current_user_role() IN ('ADMIN', 'PLACEMENT_COORDINATOR'));

CREATE POLICY "Job openings viewable by all authenticated staff"
    ON public.job_openings FOR SELECT TO authenticated USING (public.is_staff());

CREATE POLICY "Job openings editable by admin and coordinators"
    ON public.job_openings FOR ALL TO authenticated
    USING (public.current_user_role() IN ('ADMIN', 'PLACEMENT_COORDINATOR'))
    WITH CHECK (public.current_user_role() IN ('ADMIN', 'PLACEMENT_COORDINATOR'));

-- ------------------------------------------------------------------------------
-- 5. Applications, Interviews, Offers, and Placements RLS Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Job applications viewable by staff"
    ON public.job_applications FOR SELECT TO authenticated USING (public.is_staff());

CREATE POLICY "Job applications manageable by admin and coordinators"
    ON public.job_applications FOR ALL TO authenticated
    USING (public.current_user_role() IN ('ADMIN', 'PLACEMENT_COORDINATOR'))
    WITH CHECK (public.current_user_role() IN ('ADMIN', 'PLACEMENT_COORDINATOR'));

CREATE POLICY "Interviews viewable by staff"
    ON public.interviews FOR SELECT TO authenticated USING (public.is_staff());

CREATE POLICY "Interviews manageable by admin and coordinators"
    ON public.interviews FOR ALL TO authenticated
    USING (public.current_user_role() IN ('ADMIN', 'PLACEMENT_COORDINATOR', 'TRAINER'))
    WITH CHECK (public.current_user_role() IN ('ADMIN', 'PLACEMENT_COORDINATOR', 'TRAINER'));

CREATE POLICY "Offers viewable by staff"
    ON public.offers FOR SELECT TO authenticated USING (public.is_staff());

CREATE POLICY "Offers manageable by admin and coordinators"
    ON public.offers FOR ALL TO authenticated
    USING (public.current_user_role() IN ('ADMIN', 'PLACEMENT_COORDINATOR'))
    WITH CHECK (public.current_user_role() IN ('ADMIN', 'PLACEMENT_COORDINATOR'));

CREATE POLICY "Placements viewable by all staff"
    ON public.placements FOR SELECT TO authenticated USING (public.is_staff());

CREATE POLICY "Placements manageable by admin and coordinators"
    ON public.placements FOR ALL TO authenticated
    USING (public.current_user_role() IN ('ADMIN', 'PLACEMENT_COORDINATOR'))
    WITH CHECK (public.current_user_role() IN ('ADMIN', 'PLACEMENT_COORDINATOR'));

-- ------------------------------------------------------------------------------
-- 6. Tasks RLS Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Tasks viewable by staff"
    ON public.tasks FOR SELECT TO authenticated USING (public.is_staff());

CREATE POLICY "Tasks editable by creator or admin"
    ON public.tasks FOR ALL TO authenticated
    USING (owner_id = auth.uid() OR public.is_admin())
    WITH CHECK (owner_id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. Notifications RLS Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can only see and update their own notifications"
    ON public.notifications FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 8. Candidate Activity and Audit Logs RLS Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Candidate activities viewable by staff"
    ON public.candidate_activities FOR SELECT TO authenticated USING (public.is_staff());

CREATE POLICY "Candidate activities insertable by staff"
    ON public.candidate_activities FOR INSERT TO authenticated WITH CHECK (public.is_staff());

CREATE POLICY "Audit logs viewable only by ADMIN and MANAGEMENT"
    ON public.audit_logs FOR SELECT TO authenticated
    USING (public.current_user_role() IN ('ADMIN', 'MANAGEMENT'));

CREATE POLICY "Audit logs insertable by system/authenticated staff"
    ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (public.is_staff());

-- ------------------------------------------------------------------------------
-- 9. Private Storage Bucket Setup for Resumes
-- ------------------------------------------------------------------------------
-- Create bucket 'resumes' if not exists via Supabase storage extension
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Only authenticated staff can download resumes
CREATE POLICY "Authenticated staff can view resumes"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'resumes' AND public.is_staff());

CREATE POLICY "Authenticated coordinators and admins can upload resumes"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'resumes' AND public.current_user_role() IN ('ADMIN', 'PLACEMENT_COORDINATOR'));

CREATE POLICY "Admins can delete resumes"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'resumes' AND public.is_admin());
