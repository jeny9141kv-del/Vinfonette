// ==============================================================================
// VINFONETTE INTERNAL PLACEMENT MANAGEMENT PORTAL
// Domain Types and Interfaces
// ==============================================================================

export type UserRole = 'ADMIN' | 'PLACEMENT_COORDINATOR' | 'MANAGEMENT' | 'TRAINER';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  title?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  created_at?: string;
  updated_at?: string;
}

export type CandidateStage =
  | 'Registered'
  | 'Training in Progress'
  | 'Training Completed'
  | 'Resume Ready'
  | 'Placement Ready'
  | 'Applications Submitted'
  | 'Interview Scheduled'
  | 'Interview Completed'
  | 'Offer Received'
  | 'Placed Successfully'
  | 'On Hold'
  | 'Not Interested'
  | 'Rejected'
  | 'Withdrawn';

export type PlacementStatus = 'ACTIVE' | 'PLACED' | 'OPTED_OUT' | 'ARCHIVED';

export type ReadinessAssessment = 'NOT_EVALUATED' | 'NEEDS_WORK' | 'READY' | 'HIGH_POTENTIAL';

export type PaymentStatus = 'PAID' | 'PENDING' | 'PARTIAL' | 'WAIVED';

export type PFStatus = 'APPLICABLE' | 'NOT_APPLICABLE' | 'EXEMPT';

export interface ServiceHistoryItem {
  id: string;
  company_name: string;
  designation: string;
  start_date: string;
  end_date?: string;
  is_current?: boolean;
  location?: string;
  roles_responsibilities?: string;
  last_drawn_salary?: string;
}

export interface Candidate {
  id: string;
  candidate_id: string; // e.g. VN-2026-001
  full_name: string;
  email: string;
  phone: string;
  education: string;
  specialization: string;
  graduation_year: number;
  batch: string;
  technical_skills: string[];
  certifications: string[];
  training_program_id?: string;
  training_progress: number; // 0-100
  resume_url?: string;
  resume_filename?: string;
  preferred_roles: string[];
  preferred_locations: string[];
  current_stage: CandidateStage;
  placement_status: PlacementStatus;
  coordinator_id?: string;
  trainer_id?: string;
  readiness_assessment: ReadinessAssessment;
  readiness_score: number; // 0-100
  registration_date: string;
  last_activity_at: string;
  next_followup_at?: string;
  internal_notes?: string;

  // Payment Status & Billing Details
  payment_status: PaymentStatus;
  payment_amount?: number;
  amount_paid?: number;
  payment_date?: string;
  payment_reference?: string;
  payment_notes?: string;

  // Educational Certificate
  education_certificate_url?: string;
  education_certificate_filename?: string;

  // Provident Fund (PF) Details
  pf_status?: PFStatus;
  pf_uan?: string;
  pf_number?: string;
  pf_notes?: string;

  // Service History & Experience Certificate
  has_experience?: boolean;
  total_experience_years?: number;
  service_history?: ServiceHistoryItem[];
  experience_certificate_url?: string;
  experience_certificate_filename?: string;

  created_at?: string;
  updated_at?: string;
}

export interface TrainingProgram {
  id: string;
  code: string;
  name: string;
  track: string;
  description?: string;
  duration_weeks: number;
  status: 'ACTIVE' | 'ARCHIVED';
  created_at?: string;
  updated_at?: string;
}

export interface CandidateTraining {
  id: string;
  candidate_id: string;
  program_id: string;
  attendance_rate: number;
  mock_interview_score: number;
  technical_assessment_score: number;
  soft_skills_score: number;
  trainer_feedback?: string;
  completion_status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DROPPED';
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Company {
  id: string;
  company_id: string; // CMP-001
  name: string;
  industry: string;
  website?: string;
  office_location: string;
  contact_person: string;
  contact_email: string;
  contact_phone?: string;
  relationship_owner_id?: string;
  tier: 'TIER_1' | 'TIER_2' | 'ENTERPRISE' | 'STARTUP';
  status: 'ACTIVE' | 'PARTNERED' | 'INACTIVE' | 'ARCHIVED';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type WorkMode = 'ON_SITE' | 'HYBRID' | 'REMOTE';
export type JobStatus = 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'ARCHIVED';

export interface JobOpening {
  id: string;
  job_id: string; // JOB-2026-01
  company_id: string;
  title: string;
  description: string;
  required_skills: string[];
  experience_min_years: number;
  education_requirements?: string;
  eligible_batches: string[];
  work_location: string;
  work_mode: WorkMode;
  salary_min?: number;
  salary_max?: number;
  currency: string;
  vacancies: number;
  application_deadline?: string;
  recruiter_name?: string;
  recruiter_email?: string;
  interview_process?: string;
  status: JobStatus;
  created_at?: string;
  updated_at?: string;
}

export type ApplicationStatus =
  | 'Identified'
  | 'Shortlisted'
  | 'Submitted'
  | 'Screening'
  | 'Interviewing'
  | 'Offered'
  | 'Hired'
  | 'Rejected'
  | 'Withdrawn';

export interface JobApplication {
  id: string;
  candidate_id: string;
  job_id: string;
  status: ApplicationStatus;
  match_score: number;
  applied_at: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type InterviewStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'rescheduled'
  | 'cancelled'
  | 'no-show'
  | 'awaiting-feedback';

export type InterviewMode = 'VIRTUAL' | 'IN_PERSON' | 'TELEPHONIC';
export type InterviewResult = 'PASSED' | 'FAILED' | 'ON_HOLD' | 'STRONG_HIRE' | 'PENDING';

export interface Interview {
  id: string;
  candidate_id: string;
  application_id?: string;
  job_id: string;
  company_id: string;
  round_number: number;
  round_name: string;
  scheduled_at: string;
  duration_minutes: number;
  timezone: string;
  mode: InterviewMode;
  meeting_link?: string;
  location_details?: string;
  interviewer_names?: string;
  status: InterviewStatus;
  feedback?: string;
  result?: InterviewResult;
  next_round?: string;
  followup_owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Offer {
  id: string;
  candidate_id: string;
  application_id: string;
  job_id: string;
  company_id: string;
  offer_date: string;
  joining_date?: string;
  base_salary: number;
  variable_salary: number;
  currency: string;
  offer_letter_url?: string;
  status: 'RECEIVED' | 'ACCEPTED' | 'REJECTED' | 'NEGOTIATING' | 'EXPIRED';
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Placement {
  id: string;
  candidate_id: string;
  company_id: string;
  job_id: string;
  offer_id?: string;
  application_id?: string;
  designation: string;
  ctc: number;
  currency: string;
  joining_date: string;
  confirmation_details: string;
  placed_at: string;
  coordinator_id?: string;
  status: 'CONFIRMED' | 'JOINED' | 'BACKED_OUT' | 'REVOKED';
  created_at?: string;
  updated_at?: string;
}

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'To Do' | 'In Progress' | 'Completed' | 'Cancelled';

export interface Task {
  id: string;
  title: string;
  description?: string;
  related_candidate_id?: string;
  related_company_id?: string;
  related_job_id?: string;
  related_interview_id?: string;
  owner_id: string;
  priority: TaskPriority;
  due_date: string;
  status: TaskStatus;
  notes?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'PLACEMENT' | 'INTERVIEW' | 'TASK' | 'APPLICATION' | 'SYSTEM';
  link?: string;
  read: boolean;
  created_at: string;
}

export interface CandidateActivity {
  id: string;
  candidate_id: string;
  actor_id?: string;
  actor_name: string;
  type: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface DashboardMetrics {
  totalRegistered: number;
  inTraining: number;
  trainingCompleted: number;
  placementReady: number;
  activeApplications: number;
  upcomingInterviews: number;
  offersReceived: number;
  placedSuccessfully: number;
  pendingFeedback: number;
  overdueTasks: number;
  averageCtc: number;
}
