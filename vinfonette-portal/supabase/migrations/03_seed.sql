-- ==============================================================================
-- VINFONETTE INTERNAL PLACEMENT MANAGEMENT PORTAL
-- MIGRATION 03: Development Seed Script (Phase 14)
-- Fictional data: 20 Candidates, 5 Companies, 8 Jobs, 10 Interviews, 15 Tasks, Programs, Offers, Placements
-- ==============================================================================

-- 1. Insert Demo Profiles
INSERT INTO public.profiles (id, email, full_name, role, title, phone, status)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'admin@vinfonette.com', 'Rajesh Sharma', 'ADMIN', 'Director of Placements', '+91 98765 43210', 'ACTIVE'),
    ('a0000000-0000-0000-0000-000000000002', 'priya.nair@vinfonette.com', 'Priya Nair', 'PLACEMENT_COORDINATOR', 'Senior Placement Lead', '+91 98765 43211', 'ACTIVE'),
    ('a0000000-0000-0000-0000-000000000003', 'vikram.seth@vinfonette.com', 'Vikram Seth', 'MANAGEMENT', 'VP Operations', '+91 98765 43212', 'ACTIVE'),
    ('a0000000-0000-0000-0000-000000000004', 'anita.desai@vinfonette.com', 'Anita Desai', 'TRAINER', 'Lead Technical Mentor', '+91 98765 43213', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

-- 2. Training Programs
INSERT INTO public.training_programs (id, code, name, track, description, duration_weeks, status)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'FSWD-2026', 'Full Stack Web Engineering', 'Software Engineering', 'React, TypeScript, Node.js, PostgreSQL, Cloud Architecture', 16, 'ACTIVE'),
    ('b0000000-0000-0000-0000-000000000002', 'DATA-2026', 'Data Engineering & AI/ML', 'Data Science', 'Python, Spark, SQL, TensorFlow, AWS Data Lakes', 14, 'ACTIVE'),
    ('b0000000-0000-0000-0000-000000000003', 'CLOUD-2026', 'Cloud & DevOps Engineering', 'Infrastructure', 'Docker, Kubernetes, Terraform, AWS, CI/CD pipelines', 12, 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

-- 3. Companies (5 Synthetic Companies)
INSERT INTO public.companies (id, company_id, name, industry, website, office_location, contact_person, contact_email, contact_phone, relationship_owner_id, tier, status, notes)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'CMP-001', 'Nexis Cloud Solutions', 'Enterprise Software', 'https://nexiscloud.io', 'Bengaluru, India', 'Rohan Mehta', 'rohan.m@nexiscloud.io', '+91 98200 11223', 'a0000000-0000-0000-0000-000000000002', 'ENTERPRISE', 'ACTIVE', 'Top hiring partner with annual campus drives and hackathons.'),
    ('c0000000-0000-0000-0000-000000000002', 'CMP-002', 'AeroFin Technologies', 'Fintech', 'https://aerofin.tech', 'Mumbai, India', 'Sneha Kapoor', 'recruiting@aerofin.tech', '+91 98300 44556', 'a0000000-0000-0000-0000-000000000002', 'TIER_1', 'ACTIVE', 'High-growth payments infrastructure company.'),
    ('c0000000-0000-0000-0000-000000000003', 'CMP-003', 'ZetaHealth AI', 'Healthtech', 'https://zetahealth.ai', 'Hyderabad, India', 'Dr. Arvind Rao', 'arvind.rao@zetahealth.ai', '+91 98400 77889', 'a0000000-0000-0000-0000-000000000001', 'TIER_1', 'ACTIVE', 'AI diagnostic imaging startup backed by Sequoia.'),
    ('c0000000-0000-0000-0000-000000000004', 'CMP-004', 'OmniSecure Cyber', 'Cybersecurity', 'https://omnisecure.com', 'Pune, India', 'Kavita Menon', 'hiring@omnisecure.com', '+91 98500 99001', 'a0000000-0000-0000-0000-000000000002', 'TIER_2', 'ACTIVE', 'Specialized in endpoint detection and SOC operations.'),
    ('c0000000-0000-0000-0000-000000000005', 'CMP-005', 'StrataLogix Global', 'Logistics & Supply Chain', 'https://stratalogix.com', 'Chennai, India', 'Manoj Swaminathan', 'manoj@stratalogix.com', '+91 98600 22334', 'a0000000-0000-0000-0000-000000000001', 'ENTERPRISE', 'ACTIVE', 'Global freight forwarding tracking tech provider.')
ON CONFLICT (company_id) DO NOTHING;

-- 4. Job Openings (8 Synthetic Openings)
INSERT INTO public.job_openings (id, job_id, company_id, title, description, required_skills, experience_min_years, education_requirements, eligible_batches, work_location, work_mode, salary_min, salary_max, currency, vacancies, application_deadline, recruiter_name, recruiter_email, interview_process, status)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'JOB-2026-01', 'c0000000-0000-0000-0000-000000000001', 'Full Stack Developer', 'Building modern React and Node.js microservices with real-time streaming.', ARRAY['React', 'TypeScript', 'Node.js', 'PostgreSQL'], 0, 'B.Tech / B.E / MCA', ARRAY['2026-A', '2025-B'], 'Bengaluru', 'HYBRID', 800000, 1200000, 'INR', 4, CURRENT_DATE + 30, 'Rohan Mehta', 'rohan.m@nexiscloud.io', 'OA -> Tech 1 -> Tech 2 -> Culture Fit', 'OPEN'),
    ('d0000000-0000-0000-0000-000000000002', 'JOB-2026-02', 'c0000000-0000-0000-0000-000000000001', 'Cloud Infrastructure Associate', 'Managing AWS terraform scripts and Kubernetes deployment pipelines.', ARRAY['AWS', 'Docker', 'Kubernetes', 'Linux'], 0, 'B.Tech CS / IT', ARRAY['2026-A'], 'Bengaluru', 'ON_SITE', 750000, 1050000, 'INR', 2, CURRENT_DATE + 20, 'Rohan Mehta', 'rohan.m@nexiscloud.io', 'Coding -> System Design -> HR', 'OPEN'),
    ('d0000000-0000-0000-0000-000000000003', 'JOB-2026-03', 'c0000000-0000-0000-0000-000000000002', 'Frontend Software Engineer', 'Create high-speed financial dashboards and interactive transactional charts.', ARRAY['React', 'Next.js', 'Tailwind CSS', 'Redux'], 0, 'B.Tech / BCA / MCA', ARRAY['2026-A', '2025-B'], 'Mumbai', 'REMOTE', 900000, 1400000, 'INR', 3, CURRENT_DATE + 25, 'Sneha Kapoor', 'recruiting@aerofin.tech', 'Take-home assessment -> Live coding -> Director interview', 'OPEN'),
    ('d0000000-0000-0000-0000-000000000004', 'JOB-2026-04', 'c0000000-0000-0000-0000-000000000002', 'Backend Systems Engineer', 'Go and PostgreSQL high-throughput ledger services.', ARRAY['Go', 'PostgreSQL', 'Kafka', 'Redis'], 1, 'B.Tech CS / ECE', ARRAY['2025-A', '2025-B'], 'Mumbai', 'HYBRID', 1100000, 1600000, 'INR', 2, CURRENT_DATE + 15, 'Sneha Kapoor', 'recruiting@aerofin.tech', 'Architecture Round -> Problem Solving -> HR', 'OPEN'),
    ('d0000000-0000-0000-0000-000000000005', 'JOB-2026-05', 'c0000000-0000-0000-0000-000000000003', 'Junior Machine Learning Engineer', 'Train computer vision models for clinical radiogram classification.', ARRAY['Python', 'PyTorch', 'Computer Vision', 'Docker'], 0, 'M.Tech / B.Tech CS/Data', ARRAY['2026-A'], 'Hyderabad', 'HYBRID', 850000, 1300000, 'INR', 2, CURRENT_DATE + 18, 'Dr. Arvind Rao', 'arvind.rao@zetahealth.ai', 'ML challenge -> Presentation -> Technical deep dive', 'OPEN'),
    ('d0000000-0000-0000-0000-000000000006', 'JOB-2026-06', 'c0000000-0000-0000-0000-000000000004', 'SOC Security Analyst', 'Monitor SIEM feeds and analyze potential intrusion patterns.', ARRAY['Network Security', 'Wireshark', 'Python', 'Splunk'], 0, 'B.Tech / B.Sc IT', ARRAY['2026-A', '2025-B'], 'Pune', 'ON_SITE', 650000, 950000, 'INR', 5, CURRENT_DATE + 40, 'Kavita Menon', 'hiring@omnisecure.com', 'Aptitude & Security round -> Interview', 'OPEN'),
    ('d0000000-0000-0000-0000-000000000007', 'JOB-2026-07', 'c0000000-0000-0000-0000-000000000005', 'QA Automation Engineer', 'Develop automated Playwright and Cypress test suites for logistics ERP.', ARRAY['Selenium', 'Playwright', 'JavaScript', 'CI/CD'], 0, 'Any Graduate in Engineering', ARRAY['2026-A', '2025-B'], 'Chennai', 'HYBRID', 600000, 850000, 'INR', 3, CURRENT_DATE + 12, 'Manoj Swaminathan', 'manoj@stratalogix.com', 'Automation task -> Lead interview -> Offer', 'OPEN'),
    ('d0000000-0000-0000-0000-000000000008', 'JOB-2026-08', 'c0000000-0000-0000-0000-000000000005', 'Data Analyst - Supply Chain', 'Build SQL data models and PowerBI executive operational dashboards.', ARRAY['SQL', 'PowerBI', 'Excel', 'Python'], 0, 'B.Tech / B.Com / B.Sc', ARRAY['2026-A'], 'Chennai', 'REMOTE', 550000, 800000, 'INR', 2, CURRENT_DATE + 5, 'Manoj Swaminathan', 'manoj@stratalogix.com', 'SQL test -> Business case interview', 'OPEN')
ON CONFLICT (job_id) DO NOTHING;

-- 5. Candidates (20 Synthetic Candidates Across Different Stages)
INSERT INTO public.candidates (
    id, candidate_id, full_name, email, phone, education, specialization, graduation_year, batch,
    technical_skills, certifications, training_program_id, training_progress, resume_filename,
    preferred_roles, preferred_locations, current_stage, placement_status, coordinator_id, trainer_id,
    readiness_assessment, readiness_score, registration_date, internal_notes
) VALUES
-- 1: Placed candidate
('e0000000-0000-0000-0000-000000000001', 'VN-2026-001', 'Aarav Patel', 'aarav.patel@example.com', '+91 91234 00001', 'B.Tech', 'Computer Science', 2026, '2026-A',
 ARRAY['React', 'Node.js', 'PostgreSQL', 'TypeScript'], ARRAY['AWS Certified Cloud Practitioner'], 'b0000000-0000-0000-0000-000000000001', 100, 'Aarav_Patel_Resume.pdf',
 ARRAY['Full Stack Developer', 'Backend Developer'], ARRAY['Bengaluru', 'Pune'], 'Placed Successfully', 'PLACED', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'HIGH_POTENTIAL', 95, '2026-01-15', 'Accepted offer at Nexis Cloud Solutions.'),

-- 2: Offer Received
('e0000000-0000-0000-0000-000000000002', 'VN-2026-002', 'Diya Sen', 'diya.sen@example.com', '+91 91234 00002', 'B.Tech', 'Information Technology', 2026, '2026-A',
 ARRAY['React', 'Redux', 'Tailwind CSS', 'JavaScript'], ARRAY['Meta Frontend Developer Professional'], 'b0000000-0000-0000-0000-000000000001', 100, 'Diya_Sen_Resume.pdf',
 ARRAY['Frontend Engineer', 'UI Developer'], ARRAY['Mumbai', 'Remote'], 'Offer Received', 'ACTIVE', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'READY', 90, '2026-01-18', 'Received offer from AeroFin. Evaluating benefits.'),

-- 3: Interview Scheduled
('e0000000-0000-0000-0000-000000000003', 'VN-2026-003', 'Karthik Iyer', 'karthik.iyer@example.com', '+91 91234 00003', 'M.Tech', 'Data Science', 2026, '2026-A',
 ARRAY['Python', 'PyTorch', 'TensorFlow', 'SQL'], ARRAY['TensorFlow Developer Certificate'], 'b0000000-0000-0000-0000-000000000002', 92, 'Karthik_Iyer_Resume.pdf',
 ARRAY['ML Engineer', 'Data Scientist'], ARRAY['Hyderabad', 'Bengaluru'], 'Interview Scheduled', 'ACTIVE', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'HIGH_POTENTIAL', 88, '2026-02-01', 'Technical round scheduled with ZetaHealth AI.'),

-- 4: Interview Completed
('e0000000-0000-0000-0000-000000000004', 'VN-2026-004', 'Meera Krishnan', 'meera.k@example.com', '+91 91234 00004', 'B.Tech', 'Computer Science', 2026, '2026-A',
 ARRAY['Docker', 'Kubernetes', 'AWS', 'Linux'], ARRAY['CKA Kubernetes Administrator'], 'b0000000-0000-0000-0000-000000000003', 100, 'Meera_K_Resume.pdf',
 ARRAY['DevOps Engineer', 'Cloud Engineer'], ARRAY['Bengaluru', 'Chennai'], 'Interview Completed', 'ACTIVE', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'READY', 86, '2026-02-05', 'Completed final round at Nexis Cloud. Awaiting feedback.'),

-- 5: Applications Submitted
('e0000000-0000-0000-0000-000000000005', 'VN-2026-005', 'Rohan Verma', 'rohan.verma@example.com', '+91 91234 00005', 'MCA', 'Computer Applications', 2025, '2025-B',
 ARRAY['React', 'Node.js', 'MongoDB', 'Express'], ARRAY['MongoDB Associate Developer'], 'b0000000-0000-0000-0000-000000000001', 100, 'Rohan_Verma_Resume.pdf',
 ARRAY['Full Stack Developer'], ARRAY['Delhi NCR', 'Pune'], 'Applications Submitted', 'ACTIVE', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'READY', 82, '2026-01-20', 'Applied to OmniSecure and Nexis Cloud.'),

-- 6: Placement Ready
('e0000000-0000-0000-0000-000000000006', 'VN-2026-006', 'Ananya Sharma', 'ananya.s@example.com', '+91 91234 00006', 'B.Tech', 'Electronics', 2026, '2026-A',
 ARRAY['Python', 'SQL', 'Tableau', 'Excel'], ARRAY['Google Data Analytics Professional'], 'b0000000-0000-0000-0000-000000000002', 100, 'Ananya_Sharma_Resume.pdf',
 ARRAY['Data Analyst', 'BI Developer'], ARRAY['Chennai', 'Bengaluru'], 'Placement Ready', 'ACTIVE', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'READY', 85, '2026-02-10', 'Mock interviews cleared with 88%. Resume approved.'),

-- 7: Resume Ready
('e0000000-0000-0000-0000-000000000007', 'VN-2026-007', 'Vivek Singhania', 'vivek.s@example.com', '+91 91234 00007', 'B.Tech', 'Information Technology', 2026, '2026-A',
 ARRAY['Java', 'Spring Boot', 'MySQL', 'Git'], ARRAY['Oracle Certified Java Associate'], 'b0000000-0000-0000-0000-000000000001', 100, 'Vivek_Singhania_Resume.pdf',
 ARRAY['Backend Developer', 'Software Engineer'], ARRAY['Hyderabad', 'Mumbai'], 'Resume Ready', 'ACTIVE', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'NEEDS_WORK', 72, '2026-02-12', 'Vetting mock interview scheduled this Friday.'),

-- 8: Training Completed
('e0000000-0000-0000-0000-000000000008', 'VN-2026-008', 'Pooja Hegde', 'pooja.h@example.com', '+91 91234 00008', 'B.Tech', 'Computer Science', 2026, '2026-A',
 ARRAY['Playwright', 'Selenium', 'JavaScript', 'Postman'], ARRAY['ISTQB Certified Tester'], 'b0000000-0000-0000-0000-000000000001', 100, 'Pooja_Hegde_Resume.pdf',
 ARRAY['QA Automation Engineer', 'SDET'], ARRAY['Bengaluru', 'Chennai'], 'Training Completed', 'ACTIVE', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'READY', 80, '2026-02-14', 'Training program completed with distinction.'),

-- 9: Training in Progress
('e0000000-0000-0000-0000-000000000009', 'VN-2026-009', 'Devansh Mukherjee', 'devansh.m@example.com', '+91 91234 00009', 'B.Tech', 'Computer Science', 2026, '2026-B',
 ARRAY['HTML', 'CSS', 'JavaScript', 'React'], ARRAY[]::text[], 'b0000000-0000-0000-0000-000000000001', 65, NULL,
 ARRAY['Frontend Developer'], ARRAY['Kolkata', 'Bengaluru'], 'Training in Progress', 'ACTIVE', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'NEEDS_WORK', 60, '2026-02-20', 'Module 4 completed. Good progress in React state management.'),

-- 10: Training in Progress
('e0000000-0000-0000-0000-000000000010', 'VN-2026-010', 'Shruti Chawla', 'shruti.c@example.com', '+91 91234 00010', 'B.Sc', 'Computer Science', 2026, '2026-B',
 ARRAY['Python', 'SQL', 'Data Analysis'], ARRAY[]::text[], 'b0000000-0000-0000-0000-000000000002', 50, NULL,
 ARRAY['Data Analyst'], ARRAY['Delhi NCR', 'Chandigarh'], 'Training in Progress', 'ACTIVE', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'NOT_EVALUATED', 45, '2026-02-25', 'Active participation in live lab exercises.'),

-- 11: Registered
('e0000000-0000-0000-0000-000000000011', 'VN-2026-011', 'Aditya Joshi', 'aditya.j@example.com', '+91 91234 00011', 'B.Tech', 'Information Technology', 2026, '2026-B',
 ARRAY['C++', 'Data Structures', 'OOP'], ARRAY[]::text[], 'b0000000-0000-0000-0000-000000000001', 10, NULL,
 ARRAY['Software Engineer'], ARRAY['Pune', 'Mumbai'], 'Registered', 'ACTIVE', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'NOT_EVALUATED', 0, '2026-03-01', 'Orientation scheduled next Monday.'),

-- 12: Registered
('e0000000-0000-0000-0000-000000000012', 'VN-2026-012', 'Bhavna Reddy', 'bhavna.r@example.com', '+91 91234 00012', 'B.Tech', 'ECE', 2026, '2026-B',
 ARRAY['Embedded C', 'Python', 'Networking'], ARRAY[]::text[], 'b0000000-0000-0000-0000-000000000003', 15, NULL,
 ARRAY['Network Engineer', 'Cloud Associate'], ARRAY['Hyderabad', 'Bengaluru'], 'Registered', 'ACTIVE', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'NOT_EVALUATED', 0, '2026-03-02', 'Onboarding docs verified.'),

-- 13: On Hold
('e0000000-0000-0000-0000-000000000013', 'VN-2026-013', 'Gaurav Kulkarni', 'gaurav.k@example.com', '+91 91234 00013', 'B.Tech', 'Mechanical Engineering', 2025, '2025-A',
 ARRAY['Python', 'Django', 'PostgreSQL'], ARRAY[]::text[], 'b0000000-0000-0000-0000-000000000001', 85, 'Gaurav_K_Resume.pdf',
 ARRAY['Backend Developer'], ARRAY['Pune'], 'On Hold', 'ACTIVE', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'NEEDS_WORK', 65, '2026-01-10', 'Paused training due to family medical emergency. Resuming next month.'),

-- 14: Not Interested
('e0000000-0000-0000-0000-000000000014', 'VN-2026-014', 'Tara Bhattacharya', 'tara.b@example.com', '+91 91234 00014', 'B.Tech', 'Computer Science', 2025, '2025-A',
 ARRAY['Java', 'Spring', 'AWS'], ARRAY['AWS Solutions Architect Associate'], 'b0000000-0000-0000-0000-000000000001', 100, 'Tara_B_Resume.pdf',
 ARRAY['Cloud Engineer'], ARRAY['Bengaluru'], 'Not Interested', 'OPTED_OUT', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'HIGH_POTENTIAL', 89, '2026-01-08', 'Accepted admission for Master degree abroad.'),

-- 15: Placed Successfully (Second placed candidate)
('e0000000-0000-0000-0000-000000000015', 'VN-2026-015', 'Nikhil Saxena', 'nikhil.s@example.com', '+91 91234 00015', 'B.Tech', 'Information Science', 2026, '2026-A',
 ARRAY['React', 'TypeScript', 'Node.js', 'GraphQL'], ARRAY['GraphQL Certified Developer'], 'b0000000-0000-0000-0000-000000000001', 100, 'Nikhil_Saxena_Resume.pdf',
 ARRAY['Full Stack Developer'], ARRAY['Mumbai', 'Bengaluru'], 'Placed Successfully', 'PLACED', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'HIGH_POTENTIAL', 94, '2026-01-12', 'Joined AeroFin Technologies as Frontend Engineer.'),

-- 16: Interview Scheduled (Second active interview)
('e0000000-0000-0000-0000-000000000016', 'VN-2026-016', 'Ishita Kapoor', 'ishita.k@example.com', '+91 91234 00016', 'B.Tech', 'Computer Science', 2026, '2026-A',
 ARRAY['Cybersecurity', 'SIEM', 'Python', 'Linux'], ARRAY['CompTIA Security+'], 'b0000000-0000-0000-0000-000000000003', 95, 'Ishita_Kapoor_Resume.pdf',
 ARRAY['Security Analyst'], ARRAY['Pune', 'Remote'], 'Interview Scheduled', 'ACTIVE', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'READY', 84, '2026-02-08', 'Round 2 scheduled with OmniSecure.'),

-- 17: Applications Submitted
('e0000000-0000-0000-0000-000000000017', 'VN-2026-017', 'Siddharth Rao', 'siddharth.r@example.com', '+91 91234 00017', 'B.Tech', 'Data Science', 2026, '2026-A',
 ARRAY['Python', 'SQL', 'PowerBI', 'Tableau'], ARRAY[]::text[], 'b0000000-0000-0000-0000-000000000002', 100, 'Siddharth_R_Resume.pdf',
 ARRAY['Data Analyst', 'BI Analyst'], ARRAY['Chennai'], 'Applications Submitted', 'ACTIVE', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'READY', 79, '2026-02-15', 'Applied to StrataLogix Data Analyst role.'),

-- 18: Rejected (Candidate who failed a round)
('e0000000-0000-0000-0000-000000000018', 'VN-2026-018', 'Ritika Bansal', 'ritika.b@example.com', '+91 91234 00018', 'B.Tech', 'Information Technology', 2025, '2025-B',
 ARRAY['React', 'CSS', 'JavaScript'], ARRAY[]::text[], 'b0000000-0000-0000-0000-000000000001', 90, 'Ritika_Bansal_Resume.pdf',
 ARRAY['Frontend Developer'], ARRAY['Delhi NCR'], 'Rejected', 'ACTIVE', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'NEEDS_WORK', 68, '2026-01-25', 'Rejected in technical coding round. Re-enrolled in mentoring.'),

-- 19: Withdrawn
('e0000000-0000-0000-0000-000000000019', 'VN-2026-019', 'Harsh Vardhan', 'harsh.v@example.com', '+91 91234 00019', 'B.Tech', 'Computer Science', 2026, '2026-A',
 ARRAY['Python', 'Django', 'React'], ARRAY[]::text[], 'b0000000-0000-0000-0000-000000000001', 80, 'Harsh_V_Resume.pdf',
 ARRAY['Full Stack Developer'], ARRAY['Bengaluru'], 'Withdrawn', 'OPTED_OUT', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'READY', 78, '2026-02-02', 'Withdrew candidature due to family business relocation.'),

-- 20: Placement Ready
('e0000000-0000-0000-0000-000000000020', 'VN-2026-020', 'Tanvi Gupta', 'tanvi.g@example.com', '+91 91234 00020', 'B.Tech', 'Computer Science', 2026, '2026-A',
 ARRAY['React', 'Node.js', 'PostgreSQL', 'Docker'], ARRAY['AWS Certified Developer'], 'b0000000-0000-0000-0000-000000000001', 100, 'Tanvi_Gupta_Resume.pdf',
 ARRAY['Full Stack Developer'], ARRAY['Bengaluru', 'Remote'], 'Placement Ready', 'ACTIVE', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'HIGH_POTENTIAL', 92, '2026-02-18', 'Ready for client dispatch. Outstanding portfolio.')
ON CONFLICT (candidate_id) DO NOTHING;

-- 6. Job Applications
INSERT INTO public.job_applications (id, candidate_id, job_id, status, match_score, applied_at, notes)
VALUES
    ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Hired', 96, '2026-01-25', 'Candidate accepted offer.'),
    ('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', 'Offered', 94, '2026-02-01', 'Offer extended 12 LPA.'),
    ('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000005', 'Interviewing', 91, '2026-02-05', 'Round 2 scheduled.'),
    ('f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'Interviewing', 88, '2026-02-08', 'Final round completed.'),
    ('f0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000001', 'Submitted', 84, '2026-02-14', 'Resume forwarded to recruiter.'),
    ('f0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000003', 'Hired', 95, '2026-01-20', 'Placed at AeroFin.'),
    ('f0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000016', 'd0000000-0000-0000-0000-000000000006', 'Interviewing', 87, '2026-02-10', 'SOC round underway.'),
    ('f0000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000017', 'd0000000-0000-0000-0000-000000000008', 'Shortlisted', 82, '2026-02-18', 'Shortlisted by hiring manager.')
ON CONFLICT (candidate_id, job_id) DO NOTHING;

-- 7. Offers
INSERT INTO public.offers (id, candidate_id, application_id, job_id, company_id, offer_date, joining_date, base_salary, variable_salary, currency, status)
VALUES
    ('80000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '2026-02-10', '2026-07-01', 1050000, 150000, 'INR', 'ACCEPTED'),
    ('80000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', '2026-02-22', '2026-06-15', 1200000, 200000, 'INR', 'RECEIVED'),
    ('80000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000015', 'f0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', '2026-02-05', '2026-06-01', 1150000, 100000, 'INR', 'ACCEPTED')
ON CONFLICT (id) DO NOTHING;

-- 8. Placements (Confirmed placements with all required fields)
INSERT INTO public.placements (id, candidate_id, company_id, job_id, offer_id, application_id, designation, ctc, currency, joining_date, confirmation_details, coordinator_id, status)
VALUES
    ('90000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Associate Full Stack Developer', 1200000, 'INR', '2026-07-01', 'Official offer letter countersigned on Feb 12, 2026. Background verification completed.', 'a0000000-0000-0000-0000-000000000002', 'CONFIRMED'),
    ('90000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000006', 'Frontend Software Engineer', 1250000, 'INR', '2026-06-01', 'Signed LOI and verified college degree certificate. Assigned to payments team.', 'a0000000-0000-0000-0000-000000000002', 'CONFIRMED')
ON CONFLICT (candidate_id) DO NOTHING;

-- 9. Interviews (10 Synthetic Interviews)
INSERT INTO public.interviews (
    id, candidate_id, application_id, job_id, company_id, round_number, round_name,
    scheduled_at, duration_minutes, timezone, mode, meeting_link, interviewer_names,
    status, feedback, result, followup_owner_id
) VALUES
('10000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003', 2, 'Technical ML Deep Dive', now() + interval '2 days', 60, 'Asia/Kolkata', 'VIRTUAL', 'https://meet.google.com/vn-zeta-tech', 'Dr. Arvind Rao, S. Balan', 'scheduled', NULL, 'PENDING', 'a0000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000016', 'f0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000004', 1, 'SOC Aptitude & Network Concepts', now() + interval '3 days', 45, 'Asia/Kolkata', 'VIRTUAL', 'https://teams.microsoft.com/vn-omni-soc', 'Kavita Menon', 'confirmed', NULL, 'PENDING', 'a0000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 2, 'System Architecture & Linux', now() - interval '1 day', 60, 'Asia/Kolkata', 'VIRTUAL', 'https://meet.google.com/vn-nexis-infra', 'Rohan Mehta', 'completed', 'Candidate demonstrated solid knowledge of containerization and VPC networks.', 'PASSED', 'a0000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 3, 'Director & Culture Fit Round', now() - interval '5 days', 45, 'Asia/Kolkata', 'VIRTUAL', 'https://zoom.us/j/aerofin-exec', 'Sneha Kapoor, VP Eng', 'completed', 'Exceptional communication and high React mastery. Recommended for hire.', 'STRONG_HIRE', 'a0000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 3, 'Final HR Negotiation Round', now() - interval '14 days', 30, 'Asia/Kolkata', 'VIRTUAL', 'https://meet.google.com/vn-hr-close', 'Priya Rao (HR Head)', 'completed', 'Offer discussion settled at 12 LPA CTC. Candidate accepted.', 'PASSED', 'a0000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000018', NULL, 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 1, 'Technical Coding Screen', now() - interval '8 days', 60, 'Asia/Kolkata', 'VIRTUAL', 'https://coderpad.io/nexis-screen', 'Kunal S', 'completed', 'Struggled with tree traversal recursion. Recommended revision.', 'FAILED', 'a0000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000006', NULL, 'd0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000005', 1, 'Initial Exploratory Call', now() + interval '4 days', 30, 'Asia/Kolkata', 'TELEPHONIC', NULL, 'Manoj Swaminathan', 'scheduled', NULL, 'PENDING', 'a0000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000007', NULL, 'd0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 1, 'System Design Interview', now() + interval '5 days', 60, 'Asia/Kolkata', 'VIRTUAL', 'https://meet.google.com/vn-backend-design', 'Saurabh T', 'rescheduled', 'Candidate requested postponement due to college exams.', 'PENDING', 'a0000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000009', 'e0000000-0000-0000-0000-000000000020', NULL, 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 1, 'Online Technical Evaluation', now() + interval '6 days', 45, 'Asia/Kolkata', 'VIRTUAL', 'https://meet.google.com/vn-tanvi-screen', 'Rohan Mehta', 'scheduled', NULL, 'PENDING', 'a0000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000005', NULL, 'd0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000005', 1, 'QA Technical Screening', now() - interval '2 days', 45, 'Asia/Kolkata', 'VIRTUAL', 'https://meet.google.com/vn-qa-round', 'Manoj Swaminathan', 'awaiting-feedback', 'Awaiting written evaluator score sheet.', 'PENDING', 'a0000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- 10. Tasks (15 Synthetic Tasks Across Different Priorities and Statuses)
INSERT INTO public.tasks (
    id, title, description, related_candidate_id, related_company_id, related_job_id,
    owner_id, priority, due_date, status, notes
) VALUES
('20000000-0000-0000-0000-000000000001', 'Follow up on Diya Sen Offer Acceptance', 'Call candidate to review AeroFin counteroffer terms and confirm start date.', 'e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'Urgent', now() + interval '1 day', 'To Do', 'High chance of conversion.'),
('20000000-0000-0000-0000-000000000002', 'Collect feedback for Meera Krishnan from Nexis', 'Reach out to Rohan regarding final round outcome.', 'e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'High', now() - interval '1 day', 'In Progress', 'Followed up via email yesterday.'),
('20000000-0000-0000-0000-000000000003', 'Conduct Technical Mock Interview for Vivek Singhania', 'Assess Spring Boot microservices and SQL query optimization.', 'e0000000-0000-0000-0000-000000000007', NULL, NULL, 'a0000000-0000-0000-0000-000000000004', 'Medium', now() + interval '3 days', 'To Do', 'Prepare 3 coding challenges.'),
('20000000-0000-0000-0000-000000000004', 'Verify Aarav Patel BGV Documents', 'Check degree certificate and ID credentials before onboarding.', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', NULL, 'a0000000-0000-0000-0000-000000000001', 'Low', now() - interval '5 days', 'Completed', 'All documents verified and uploaded to portal.'),
('20000000-0000-0000-0000-000000000005', 'Resume Review for Batch 2026-B Onboarding', 'Review initial draft resumes submitted by 12 new registrants.', NULL, NULL, NULL, 'a0000000-0000-0000-0000-000000000004', 'Medium', now() + interval '4 days', 'In Progress', '5 of 12 reviewed so far.'),
('20000000-0000-0000-0000-000000000006', 'Coordinate On-Campus Drive with OmniSecure', 'Finalize date and virtual testing room links for 20 candidates.', NULL, 'c0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000006', 'High', now() + interval '5 days', 'To Do', 'Draft agreement sent to Kavita.'),
('20000000-0000-0000-0000-000000000007', 'Dispatch Shortlist to StrataLogix for QA Role', 'Send top 5 profiles matching Playwright and JS requirements.', NULL, 'c0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000007', 'Urgent', now(), 'In Progress', 'Pooja Hegde and Rohan Verma profiles included.'),
('20000000-0000-0000-0000-000000000008', 'Prepare Monthly Placement Board Presentation', 'Generate quarterly analytics report and conversion metrics.', NULL, NULL, NULL, 'a0000000-0000-0000-0000-000000000003', 'Medium', now() + interval '7 days', 'To Do', 'Include salary band distribution.'),
('20000000-0000-0000-0000-000000000009', 'Schedule Remedial Training for Ritika Bansal', 'Provide 1-on-1 tutoring on algorithmic problem solving.', 'e0000000-0000-0000-0000-000000000018', NULL, NULL, 'a0000000-0000-0000-0000-000000000004', 'Medium', now() + interval '2 days', 'To Do', 'Assign LeetCode medium problem set.'),
('20000000-0000-0000-0000-000000000010', 'Send Prep Material to Karthik Iyer', 'Provide company research dossier on ZetaHealth AI diagnostic products.', 'e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', NULL, 'a0000000-0000-0000-0000-000000000002', 'High', now(), 'Completed', 'Dossier emailed and acknowledged by candidate.'),
('20000000-0000-0000-0000-000000000011', 'Setup Mock Environment for Cloud Track', 'Provision temporary AWS sandbox accounts for Batch 2026-A.', NULL, NULL, NULL, 'a0000000-0000-0000-0000-000000000004', 'Low', now() - interval '8 days', 'Completed', 'AWS IAM lab users active.'),
('20000000-0000-0000-0000-000000000012', 'Collect Offer Letter for Nikhil Saxena', 'Upload confirmed signed offer letter to records.', 'e0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000002', NULL, 'a0000000-0000-0000-0000-000000000002', 'Low', now() - interval '10 days', 'Completed', 'Filed in candidate record.'),
('20000000-0000-0000-0000-000000000013', 'Check in with Harsh Vardhan regarding withdrawal', 'Clarify future enrollment options or alumni status.', 'e0000000-0000-0000-0000-000000000019', NULL, NULL, 'a0000000-0000-0000-0000-000000000002', 'Low', now() + interval '10 days', 'To Do', 'Gentle check-in.'),
('20000000-0000-0000-0000-000000000014', 'Send Employer Survey to Nexis HR', 'Collect recruiter satisfaction feedback on hired candidates.', NULL, 'c0000000-0000-0000-0000-000000000001', NULL, 'a0000000-0000-0000-0000-000000000001', 'Medium', now() + interval '6 days', 'To Do', 'Form link generated.'),
('20000000-0000-0000-0000-000000000015', 'Update Batch 2026-A Readiness Scores', 'Synchronize trainer assessment cards into central registry.', NULL, NULL, NULL, 'a0000000-0000-0000-0000-000000000004', 'High', now() + interval '2 days', 'In Progress', '18 of 20 evaluations recorded.')
ON CONFLICT (id) DO NOTHING;

-- 11. Initial Candidate Activities
INSERT INTO public.candidate_activities (candidate_id, actor_name, type, description, created_at)
VALUES
('e0000000-0000-0000-0000-000000000001', 'Priya Nair', 'PLACEMENT_CONFIRMED', 'Candidate confirmed placement at Nexis Cloud Solutions as Associate Full Stack Developer (12 LPA CTC).', now() - interval '10 days'),
('e0000000-0000-0000-0000-000000000002', 'Priya Nair', 'OFFER_RECEIVED', 'Received written offer from AeroFin Technologies (14 LPA Total).', now() - interval '2 days'),
('e0000000-0000-0000-0000-000000000003', 'Anita Desai', 'INTERVIEW_SCHEDULED', 'Technical Round 2 scheduled with ZetaHealth AI for Junior ML Engineer role.', now() - interval '1 day'),
('e0000000-0000-0000-0000-000000000004', 'Priya Nair', 'INTERVIEW_COMPLETED', 'Candidate attended System Architecture & Linux round at Nexis Cloud.', now() - interval '1 day'),
('e0000000-0000-0000-0000-000000000006', 'Anita Desai', 'STAGE_CHANGE', 'Candidate promoted to Placement Ready stage with assessment score 85%.', now() - interval '5 days');

-- 12. Audit Logs
INSERT INTO public.audit_logs (actor_email, action, entity_type, entity_id, details, created_at)
VALUES
('admin@vinfonette.com', 'SEED_INITIALIZE', 'system', 'sys-001', '{"message": "VinfoNette enterprise database initialized with standard schema and seed data."}'::jsonb, now() - interval '10 days'),
('priya.nair@vinfonette.com', 'PLACEMENT_CREATED', 'placement', '90000000-0000-0000-0000-000000000001', '{"candidate": "Aarav Patel", "company": "Nexis Cloud Solutions", "ctc": 1200000}'::jsonb, now() - interval '10 days'),
('priya.nair@vinfonette.com', 'OFFER_LOGGED', 'offer', '80000000-0000-0000-0000-000000000002', '{"candidate": "Diya Sen", "company": "AeroFin Technologies", "base": 1200000}'::jsonb, now() - interval '2 days');
