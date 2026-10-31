import { DatabaseInstance } from './db';
import { hashPassword } from './auth';

export async function seedDemoData(db: DatabaseInstance): Promise<void> {
  // Check if candidates already exist
  const candCount = (db.prepare('SELECT COUNT(*) as c FROM candidates').get() as any).c;
  if (candCount > 0) return; // Do not overwrite existing user records

  // 1. Demo Staff Profiles
  const adminPass = await hashPassword('admin123');
  const coordPass = await hashPassword('coord123');
  const mgmtPass = await hashPassword('mgmt123');
  const trainPass = await hashPassword('train123');
  const now = new Date().toISOString();

  const insertProfile = db.prepare(`
    INSERT OR REPLACE INTO profiles (id, email, password_hash, full_name, role, title, phone, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
  `);

  insertProfile.run('a0000000-0000-0000-0000-000000000001', 'admin@vinfonette.com', adminPass, 'Rajesh Sharma', 'ADMIN', 'Director of Placements', '+91 98765 43210', now, now);
  insertProfile.run('a0000000-0000-0000-0000-000000000002', 'priya.nair@vinfonette.com', coordPass, 'Priya Nair', 'PLACEMENT_COORDINATOR', 'Senior Placement Lead', '+91 98765 43211', now, now);
  insertProfile.run('a0000000-0000-0000-0000-000000000003', 'vikram.seth@vinfonette.com', mgmtPass, 'Vikram Seth', 'MANAGEMENT', 'VP Operations', '+91 98765 43212', now, now);
  insertProfile.run('a0000000-0000-0000-0000-000000000004', 'anita.desai@vinfonette.com', trainPass, 'Anita Desai', 'TRAINER', 'Lead Technical Mentor', '+91 98765 43213', now, now);

  // 2. Training Programs
  const insertProgram = db.prepare(`
    INSERT OR REPLACE INTO training_programs (id, code, name, track, description, duration_weeks, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
  `);

  insertProgram.run('b0000000-0000-0000-0000-000000000001', 'FSWD-2026', 'Full Stack Web Engineering', 'Software Engineering', 'React, TypeScript, Node.js, PostgreSQL, Cloud Architecture', 16, now, now);
  insertProgram.run('b0000000-0000-0000-0000-000000000002', 'DATA-2026', 'Data Engineering & AI/ML', 'Data Science', 'Python, Spark, SQL, TensorFlow, AWS Data Lakes', 14, now, now);
  insertProgram.run('b0000000-0000-0000-0000-000000000003', 'CLOUD-2026', 'Cloud & DevOps Engineering', 'Infrastructure', 'Docker, Kubernetes, Terraform, AWS, CI/CD pipelines', 12, now, now);

  // 3. Companies
  const insertCompany = db.prepare(`
    INSERT OR REPLACE INTO companies (id, company_id, name, industry, website, office_location, contact_person, contact_email, contact_phone, relationship_owner_id, tier, status, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)
  `);

  insertCompany.run('c0000000-0000-0000-0000-000000000001', 'CMP-001', 'Nexis Cloud Solutions', 'Enterprise Software', 'https://nexiscloud.io', 'Bengaluru, India', 'Rohan Mehta', 'rohan.m@nexiscloud.io', '+91 98200 11223', 'a0000000-0000-0000-0000-000000000002', 'ENTERPRISE', 'Top hiring partner with annual campus drives.', now, now);
  insertCompany.run('c0000000-0000-0000-0000-000000000002', 'CMP-002', 'AeroFin Technologies', 'Fintech', 'https://aerofin.tech', 'Mumbai, India', 'Sneha Kapoor', 'recruiting@aerofin.tech', '+91 98300 44556', 'a0000000-0000-0000-0000-000000000002', 'TIER_1', 'High-growth payments infrastructure company.', now, now);
  insertCompany.run('c0000000-0000-0000-0000-000000000003', 'CMP-003', 'ZetaHealth AI', 'Healthtech', 'https://zetahealth.ai', 'Hyderabad, India', 'Dr. Arvind Rao', 'arvind.rao@zetahealth.ai', '+91 98400 77889', 'a0000000-0000-0000-0000-000000000001', 'TIER_1', 'AI diagnostic imaging startup.', now, now);
  insertCompany.run('c0000000-0000-0000-0000-000000000004', 'CMP-004', 'OmniSecure Cyber', 'Cybersecurity', 'https://omnisecure.com', 'Pune, India', 'Kavita Menon', 'hiring@omnisecure.com', '+91 98500 99001', 'a0000000-0000-0000-0000-000000000002', 'TIER_2', 'Specialized in endpoint detection and SOC operations.', now, now);
  insertCompany.run('c0000000-0000-0000-0000-000000000005', 'CMP-005', 'StrataLogix Global', 'Logistics', 'https://stratalogix.com', 'Chennai, India', 'Manoj Swaminathan', 'manoj@stratalogix.com', '+91 98600 22334', 'a0000000-0000-0000-0000-000000000001', 'ENTERPRISE', 'Global freight forwarding tracking tech provider.', now, now);

  // 4. Job Openings
  const insertJob = db.prepare(`
    INSERT OR REPLACE INTO job_openings (
      id, job_id, company_id, title, description, required_skills, experience_min_years,
      education_requirements, eligible_batches, work_location, work_mode, salary_min, salary_max,
      currency, vacancies, application_deadline, recruiter_name, recruiter_email, interview_process,
      status, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      'OPEN', ?, ?
    )
  `);

  insertJob.run('d0000000-0000-0000-0000-000000000001', 'JOB-2026-01', 'c0000000-0000-0000-0000-000000000001', 'Full Stack Developer', 'Building modern React and Node microservices.', JSON.stringify(['React', 'TypeScript', 'Node.js', 'PostgreSQL']), 0, 'B.Tech / MCA', JSON.stringify(['2026-A', '2025-B']), 'Bengaluru', 'HYBRID', 800000, 1200000, 'INR', 4, '2026-04-30', 'Rohan Mehta', 'rohan.m@nexiscloud.io', 'OA -> Tech 1 -> Tech 2 -> HR', now, now);
  insertJob.run('d0000000-0000-0000-0000-000000000002', 'JOB-2026-02', 'c0000000-0000-0000-0000-000000000001', 'Cloud Infrastructure Associate', 'Managing AWS Terraform scripts and Kubernetes.', JSON.stringify(['AWS', 'Docker', 'Kubernetes', 'Linux']), 0, 'B.Tech CS / IT', JSON.stringify(['2026-A']), 'Bengaluru', 'ON_SITE', 750000, 1050000, 'INR', 2, '2026-04-15', 'Rohan Mehta', 'rohan.m@nexiscloud.io', 'Coding -> Design -> HR', now, now);
  insertJob.run('d0000000-0000-0000-0000-000000000003', 'JOB-2026-03', 'c0000000-0000-0000-0000-000000000002', 'Frontend Software Engineer', 'Create high-speed financial dashboards and transactional charts.', JSON.stringify(['React', 'Next.js', 'Tailwind CSS']), 0, 'B.Tech / BCA / MCA', JSON.stringify(['2026-A', '2025-B']), 'Mumbai', 'REMOTE', 900000, 1400000, 'INR', 3, '2026-04-25', 'Sneha Kapoor', 'recruiting@aerofin.tech', 'Assessment -> Coding -> Director', now, now);

  // 5. Candidates across stages
  const insertCand = db.prepare(`
    INSERT OR REPLACE INTO candidates (
      id, candidate_id, full_name, email, phone, education, specialization, graduation_year, batch,
      technical_skills, certifications, training_program_id, training_progress, preferred_roles,
      preferred_locations, current_stage, placement_status, coordinator_id, trainer_id,
      readiness_assessment, readiness_score, registration_date, last_activity_at, internal_notes,
      payment_status, payment_amount, amount_paid, payment_date, payment_reference, payment_notes,
      education_certificate_url, education_certificate_filename,
      pf_status, pf_uan, pf_number, pf_notes,
      has_experience, total_experience_years, service_history,
      experience_certificate_url, experience_certificate_filename,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?,
      ?, ?
    )
  `);

  // Candidate 1: Placed
  insertCand.run(
    'e0000000-0000-0000-0000-000000000001', 'VN-2026-001', 'Aarav Patel', 'aarav.patel@example.com', '+91 91234 00001',
    'B.Tech', 'Computer Science', 2026, '2026-A', JSON.stringify(['React', 'Node.js', 'PostgreSQL', 'TypeScript']),
    JSON.stringify(['AWS Certified Cloud Practitioner']), 'b0000000-0000-0000-0000-000000000001', 100,
    JSON.stringify(['Full Stack Developer']), JSON.stringify(['Bengaluru', 'Pune']), 'Placed Successfully', 'PLACED',
    'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'HIGH_POTENTIAL', 95,
    '2026-01-15', now, 'Accepted offer at Nexis Cloud Solutions.',
    'PAID', 25000, 25000, '2026-01-16', 'UPI/VN2026011601', 'Full tuition & placement fee paid.',
    '/sample-resumes/aarav_degree.pdf', 'Aarav_BTech_ComputerScience_Degree.pdf',
    'APPLICABLE', '101234567890', 'MH/BAN/0012345/000/0001234', 'EPFO account active from previous employment.',
    1, 1.5, JSON.stringify([
      {
        id: 'sh-1',
        company_name: 'TechNova Solutions',
        designation: 'Associate Software Engineer',
        start_date: '2024-06-01',
        end_date: '2025-11-30',
        is_current: false,
        location: 'Bengaluru',
        roles_responsibilities: 'Built React and TypeScript user interfaces and REST services with Node.js.',
        last_drawn_salary: '₹4,50,000 / year'
      }
    ]),
    '/sample-resumes/aarav_experience.pdf', 'TechNova_Relieving_Experience_Letter.pdf',
    now, now
  );

  // Candidate 2: Offer Received
  insertCand.run(
    'e0000000-0000-0000-0000-000000000002', 'VN-2026-002', 'Diya Sen', 'diya.sen@example.com', '+91 91234 00002',
    'B.Tech', 'Information Technology', 2026, '2026-A', JSON.stringify(['React', 'Redux', 'Tailwind CSS']),
    JSON.stringify(['Meta Frontend Developer']), 'b0000000-0000-0000-0000-000000000001', 100,
    JSON.stringify(['Frontend Engineer']), JSON.stringify(['Mumbai', 'Remote']), 'Offer Received', 'ACTIVE',
    'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'READY', 90,
    '2026-01-18', now, 'Evaluating AeroFin offer.',
    'PAID', 25000, 25000, '2026-01-18', 'NEFT/HDFC881923', 'Payment completed via NEFT bank transfer.',
    '/sample-resumes/diya_degree.pdf', 'Diya_Sen_Degree_Certificate.pdf',
    'NOT_APPLICABLE', null, null, 'Fresher candidate, first-time job seeker.',
    0, 0, '[]',
    null, null,
    now, now
  );

  // Candidate 3: Interview Scheduled
  insertCand.run(
    'e0000000-0000-0000-0000-000000000003', 'VN-2026-003', 'Karthik Iyer', 'karthik.iyer@example.com', '+91 91234 00003',
    'M.Tech', 'Data Science', 2026, '2026-A', JSON.stringify(['Python', 'PyTorch', 'TensorFlow', 'SQL']),
    JSON.stringify(['TensorFlow Certificate']), 'b0000000-0000-0000-0000-000000000002', 92,
    JSON.stringify(['ML Engineer']), JSON.stringify(['Hyderabad', 'Bengaluru']), 'Interview Scheduled', 'ACTIVE',
    'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'HIGH_POTENTIAL', 88,
    '2026-02-01', now, 'Round 2 scheduled with ZetaHealth.',
    'PARTIAL', 30000, 18000, '2026-02-02', 'UPI/VN9823141', 'First installment received. Second installment ₹12,000 pending.',
    '/sample-resumes/karthik_degree.pdf', 'Karthik_MTech_DataScience_Degree.pdf',
    'APPLICABLE', '101889922110', 'TS/HYD/0043210/000/0009876', 'EPFO member number verified.',
    1, 2.0, JSON.stringify([
      {
        id: 'sh-2',
        company_name: 'QuantX Intelligence',
        designation: 'Junior ML Researcher',
        start_date: '2023-08-01',
        end_date: '2025-07-31',
        is_current: false,
        location: 'Hyderabad',
        roles_responsibilities: 'Trained computer vision models with PyTorch and built data pipelines.',
        last_drawn_salary: '₹5,20,000 / year'
      }
    ]),
    '/sample-resumes/karthik_experience.pdf', 'QuantX_Experience_Relieving_Certificate.pdf',
    now, now
  );

  // Candidate 4: Placement Ready
  insertCand.run(
    'e0000000-0000-0000-0000-000000000004', 'VN-2026-004', 'Ananya Sharma', 'ananya.s@example.com', '+91 91234 00004',
    'B.Tech', 'Electronics', 2026, '2026-A', JSON.stringify(['Python', 'SQL', 'PowerBI']),
    JSON.stringify(['Google Data Analytics']), 'b0000000-0000-0000-0000-000000000002', 100,
    JSON.stringify(['Data Analyst']), JSON.stringify(['Chennai', 'Bengaluru']), 'Placement Ready', 'ACTIVE',
    'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'READY', 85,
    '2026-02-10', now, 'Mock interviews cleared with 88%. Resume ready.',
    'PAID', 25000, 25000, '2026-02-10', 'IMPS/9921381273', 'Full fees cleared.',
    '/sample-resumes/ananya_degree.pdf', 'Ananya_BTech_Degree.pdf',
    'NOT_APPLICABLE', null, null, 'No prior PF account.',
    0, 0, '[]',
    null, null,
    now, now
  );

  // Candidate 5: Training in Progress
  insertCand.run(
    'e0000000-0000-0000-0000-000000000005', 'VN-2026-005', 'Devansh Mukherjee', 'devansh.m@example.com', '+91 91234 00005',
    'B.Tech', 'Computer Science', 2026, '2026-B', JSON.stringify(['HTML', 'CSS', 'JavaScript', 'React']),
    JSON.stringify([]), 'b0000000-0000-0000-0000-000000000001', 65,
    JSON.stringify(['Frontend Developer']), JSON.stringify(['Kolkata', 'Bengaluru']), 'Training in Progress', 'ACTIVE',
    'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'NEEDS_WORK', 60,
    '2026-02-20', now, 'Module 4 completed. Good progress.',
    'PENDING', 25000, 0, null, null, 'Awaiting payment confirmation.',
    null, null,
    'NOT_APPLICABLE', null, null, null,
    0, 0, '[]',
    null, null,
    now, now
  );

  // 6. Confirmed Placement for Candidate 1 (Aarav Patel)
  db.prepare(`
    INSERT OR REPLACE INTO placements (
      id, candidate_id, company_id, job_id, designation, ctc, currency, joining_date,
      confirmation_details, placed_at, coordinator_id, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'INR', ?, ?, ?, ?, 'CONFIRMED', ?, ?)
  `).run(
    'p0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'Software Engineer - Full Stack',
    1200000,
    '2026-07-01',
    'Accepted offer letter signed on Feb 12, 2026.',
    '2026-02-12T10:00:00.000Z',
    'a0000000-0000-0000-0000-000000000002',
    now, now
  );

  // 7. Offer for Candidate 2 (Diya Sen)
  db.prepare(`
    INSERT OR REPLACE INTO offers (
      id, candidate_id, application_id, job_id, company_id, offer_date, joining_date,
      base_salary, variable_salary, currency, status, created_at, updated_at
    ) VALUES (?, ?, NULL, ?, ?, '2026-02-14', '2026-07-15', 1100000, 100000, 'INR', 'RECEIVED', ?, ?)
  `).run(
    'off00000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000002',
    now, now
  );

  // 8. Interview for Candidate 3 (Karthik Iyer)
  db.prepare(`
    INSERT OR REPLACE INTO interviews (
      id, candidate_id, job_id, company_id, round_number, round_name,
      scheduled_at, duration_minutes, timezone, mode, meeting_link, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 1, 'Technical Deep Dive', ?, 60, 'Asia/Kolkata', 'VIRTUAL', 'https://meet.google.com/xyz-demo', 'scheduled', ?, ?)
  `).run(
    'int00000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000003',
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000003',
    new Date(Date.now() + 86400000 * 2).toISOString(),
    now, now
  );

  // 9. Initial Tasks
  db.prepare(`
    INSERT OR REPLACE INTO tasks (
      id, title, description, related_candidate_id, owner_id, priority, due_date, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'High', ?, 'To Do', ?, ?)
  `).run(
    'tsk00000-0000-0000-0000-000000000001',
    'Collect joining documents for Aarav Patel',
    'Degree certificate, signed offer letter, and ID proof.',
    'e0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    new Date(Date.now() + 86400000 * 5).toISOString(),
    now, now
  );
}
