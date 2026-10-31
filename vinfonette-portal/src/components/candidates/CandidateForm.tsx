import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Candidate,
  CandidateStage,
  ReadinessAssessment,
  PaymentStatus,
  PFStatus,
  ServiceHistoryItem,
} from '../../lib/types';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { uploadCandidateDocument } from '../../lib/storage';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useNavigate } from 'react-router-dom';
import {
  User,
  GraduationCap,
  CreditCard,
  Building2,
  Briefcase,
  Plus,
  Trash2,
  Upload,
  FileCheck,
  ShieldCheck,
  FileText,
} from 'lucide-react';

const candidateSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  education: z.string().min(2, 'Education level is required'),
  specialization: z.string().min(2, 'Specialization / Major is required'),
  graduation_year: z.coerce.number().min(2020).max(2030),
  batch: z.string().min(2, 'Batch name is required (e.g. 2026-A)'),
  technical_skills_str: z.string().min(2, 'Enter at least one skill (comma-separated)'),
  certifications_str: z.string().optional(),
  training_program_id: z.string().optional(),
  training_progress: z.coerce.number().min(0).max(100),
  preferred_roles_str: z.string().optional(),
  preferred_locations_str: z.string().optional(),
  current_stage: z.string(),
  coordinator_id: z.string().optional(),
  trainer_id: z.string().optional(),
  readiness_assessment: z.string(),
  readiness_score: z.coerce.number().min(0).max(100),
  internal_notes: z.string().optional(),

  // Payment Status
  payment_status: z.enum(['PAID', 'PENDING', 'PARTIAL', 'WAIVED']),
  payment_amount: z.coerce.number().min(0).default(25000),
  amount_paid: z.coerce.number().min(0).default(0),
  payment_date: z.string().optional(),
  payment_reference: z.string().optional(),
  payment_notes: z.string().optional(),

  // PF Details
  pf_status: z.enum(['NOT_APPLICABLE', 'APPLICABLE', 'EXEMPT']).default('NOT_APPLICABLE'),
  pf_uan: z.string().optional(),
  pf_number: z.string().optional(),
  pf_notes: z.string().optional(),

  // Experience
  has_experience: z.boolean().default(false),
  total_experience_years: z.coerce.number().min(0).default(0),
});

type CandidateFormData = z.infer<typeof candidateSchema>;

export interface CandidateFormProps {
  initialData?: Candidate;
  onSubmitSuccess?: (candidate: Candidate) => void;
}

export const CandidateForm: React.FC<CandidateFormProps> = ({ initialData, onSubmitSuccess }) => {
  const { addCandidate, updateCandidate, programs, team } = useData();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const coordinators = team.filter((t) => t.role === 'ADMIN' || t.role === 'PLACEMENT_COORDINATOR');
  const trainers = team.filter((t) => t.role === 'ADMIN' || t.role === 'TRAINER');

  // Dynamic Service History state
  const [serviceHistory, setServiceHistory] = useState<ServiceHistoryItem[]>(
    initialData?.service_history || []
  );

  // File states for immediate upload
  const [eduFile, setEduFile] = useState<File | null>(null);
  const [expFile, setExpFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      full_name: initialData?.full_name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      education: initialData?.education || 'B.Tech',
      specialization: initialData?.specialization || 'Computer Science',
      graduation_year: initialData?.graduation_year || 2026,
      batch: initialData?.batch || '2026-A',
      technical_skills_str: initialData?.technical_skills?.join(', ') || 'React, TypeScript, Node.js',
      certifications_str: initialData?.certifications?.join(', ') || '',
      training_program_id: initialData?.training_program_id || programs[0]?.id || '',
      training_progress: initialData?.training_progress || 0,
      preferred_roles_str: initialData?.preferred_roles?.join(', ') || 'Full Stack Developer',
      preferred_locations_str: initialData?.preferred_locations?.join(', ') || 'Bengaluru, Pune, Remote',
      current_stage: initialData?.current_stage || 'Registered',
      coordinator_id: initialData?.coordinator_id || coordinators[0]?.id || '',
      trainer_id: initialData?.trainer_id || trainers[0]?.id || '',
      readiness_assessment: initialData?.readiness_assessment || 'NOT_EVALUATED',
      readiness_score: initialData?.readiness_score || 0,
      internal_notes: initialData?.internal_notes || '',

      payment_status: initialData?.payment_status || 'PENDING',
      payment_amount: initialData?.payment_amount ?? 25000,
      amount_paid: initialData?.amount_paid ?? 0,
      payment_date: initialData?.payment_date || '',
      payment_reference: initialData?.payment_reference || '',
      payment_notes: initialData?.payment_notes || '',

      pf_status: initialData?.pf_status || 'NOT_APPLICABLE',
      pf_uan: initialData?.pf_uan || '',
      pf_number: initialData?.pf_number || '',
      pf_notes: initialData?.pf_notes || '',

      has_experience: initialData?.has_experience || (initialData?.service_history && initialData.service_history.length > 0) || false,
      total_experience_years: initialData?.total_experience_years ?? 0,
    },
  });

  const watchHasExperience = watch('has_experience');
  const watchPaymentStatus = watch('payment_status');
  const watchPaymentAmount = watch('payment_amount');
  const watchAmountPaid = watch('amount_paid');

  const addServiceRow = () => {
    const newRow: ServiceHistoryItem = {
      id: `sh-${Date.now()}`,
      company_name: '',
      designation: '',
      start_date: '',
      end_date: '',
      is_current: false,
      location: '',
      roles_responsibilities: '',
      last_drawn_salary: '',
    };
    setServiceHistory([...serviceHistory, newRow]);
    setValue('has_experience', true);
  };

  const updateServiceRow = (index: number, field: keyof ServiceHistoryItem, value: any) => {
    const updated = [...serviceHistory];
    updated[index] = { ...updated[index], [field]: value };
    setServiceHistory(updated);
  };

  const removeServiceRow = (index: number) => {
    const updated = serviceHistory.filter((_, i) => i !== index);
    setServiceHistory(updated);
    if (updated.length === 0) {
      setValue('has_experience', false);
    }
  };

  const onSubmit = async (data: CandidateFormData) => {
    try {
      const formattedData: Omit<Candidate, 'id' | 'candidate_id' | 'created_at' | 'updated_at' | 'last_activity_at'> = {
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        education: data.education,
        specialization: data.specialization,
        graduation_year: Number(data.graduation_year),
        batch: data.batch,
        technical_skills: data.technical_skills_str.split(',').map((s) => s.trim()).filter(Boolean),
        certifications: data.certifications_str ? data.certifications_str.split(',').map((s) => s.trim()).filter(Boolean) : [],
        training_program_id: data.training_program_id,
        training_progress: Number(data.training_progress),
        preferred_roles: data.preferred_roles_str ? data.preferred_roles_str.split(',').map((s) => s.trim()).filter(Boolean) : [],
        preferred_locations: data.preferred_locations_str ? data.preferred_locations_str.split(',').map((s) => s.trim()).filter(Boolean) : [],
        current_stage: data.current_stage as CandidateStage,
        placement_status: (initialData?.placement_status || 'ACTIVE') as any,
        coordinator_id: data.coordinator_id,
        trainer_id: data.trainer_id,
        readiness_assessment: data.readiness_assessment as ReadinessAssessment,
        readiness_score: Number(data.readiness_score),
        registration_date: initialData?.registration_date || new Date().toISOString().split('T')[0],
        internal_notes: data.internal_notes,

        // Payment status
        payment_status: data.payment_status as PaymentStatus,
        payment_amount: Number(data.payment_amount),
        amount_paid: Number(data.amount_paid),
        payment_date: data.payment_date || undefined,
        payment_reference: data.payment_reference || undefined,
        payment_notes: data.payment_notes || undefined,

        // PF Details
        pf_status: data.pf_status as PFStatus,
        pf_uan: data.pf_uan || undefined,
        pf_number: data.pf_number || undefined,
        pf_notes: data.pf_notes || undefined,

        // Experience & Service History
        has_experience: Boolean(data.has_experience),
        total_experience_years: Number(data.total_experience_years || 0),
        service_history: serviceHistory.filter((s) => s.company_name.trim().length > 0),

        // Certificates existing preservation
        education_certificate_url: initialData?.education_certificate_url,
        education_certificate_filename: initialData?.education_certificate_filename,
        experience_certificate_url: initialData?.experience_certificate_url,
        experience_certificate_filename: initialData?.experience_certificate_filename,
        resume_url: initialData?.resume_url,
        resume_filename: initialData?.resume_filename,
      };

      let candidateResult: Candidate;
      if (initialData) {
        await updateCandidate(initialData.id, formattedData);
        candidateResult = { ...initialData, ...formattedData };
      } else {
        candidateResult = await addCandidate(formattedData);
      }

      // Handle any pending document uploads
      if (eduFile) {
        try {
          const res = await uploadCandidateDocument(candidateResult.id, 'education_certificate', eduFile);
          if (res.success && res.filePath) {
            await updateCandidate(candidateResult.id, {
              education_certificate_url: res.filePath,
              education_certificate_filename: res.filename || eduFile.name,
            });
          }
        } catch (e) {
          console.warn('Edu upload error:', e);
        }
      }

      if (expFile) {
        try {
          const res = await uploadCandidateDocument(candidateResult.id, 'experience_certificate', expFile);
          if (res.success && res.filePath) {
            await updateCandidate(candidateResult.id, {
              experience_certificate_url: res.filePath,
              experience_certificate_filename: res.filename || expFile.name,
            });
          }
        } catch (e) {
          console.warn('Exp upload error:', e);
        }
      }

      if (resumeFile) {
        try {
          const res = await uploadCandidateDocument(candidateResult.id, 'resume', resumeFile);
          if (res.success && res.filePath) {
            await updateCandidate(candidateResult.id, {
              resume_url: res.filePath,
              resume_filename: res.filename || resumeFile.name,
            });
          }
        } catch (e) {
          console.warn('Resume upload error:', e);
        }
      }

      success(
        initialData ? 'Candidate Profile Saved' : 'Candidate Registered',
        `Details for ${data.full_name} have been saved successfully.`
      );

      if (onSubmitSuccess) onSubmitSuccess(candidateResult);
      navigate(`/candidates/${candidateResult.id}`);
    } catch (err: any) {
      toastError('Save Failed', err.message || 'Could not save candidate.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 1. Basic Personal Info */}
      <div className="bg-white p-6 rounded-2xl border border-charcoal-200 shadow-card space-y-4">
        <div className="flex items-center gap-2 border-b border-charcoal-100 pb-2">
          <User className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-bold text-charcoal-900">Personal & Academic Profile</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="Full Name"
            placeholder="e.g. Aarav Patel"
            required
            {...register('full_name')}
            error={errors.full_name?.message}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. aarav.patel@example.com"
            required
            {...register('email')}
            error={errors.email?.message}
          />

          <Input
            label="Phone Number"
            placeholder="e.g. +91 98765 43210"
            required
            {...register('phone')}
            error={errors.phone?.message}
          />

          <Input
            label="Degree / Highest Education"
            placeholder="e.g. B.Tech / MCA / B.Sc"
            required
            {...register('education')}
            error={errors.education?.message}
          />

          <Input
            label="Branch / Specialization"
            placeholder="e.g. Computer Science"
            required
            {...register('specialization')}
            error={errors.specialization?.message}
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Graduation Year"
              type="number"
              placeholder="2026"
              required
              {...register('graduation_year')}
              error={errors.graduation_year?.message}
            />
            <Input
              label="Batch"
              placeholder="2026-A"
              required
              {...register('batch')}
              error={errors.batch?.message}
            />
          </div>
        </div>
      </div>

      {/* 2. Educational Certificate Section */}
      <div className="bg-white p-6 rounded-2xl border border-charcoal-200 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-charcoal-100 pb-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-charcoal-900">Educational Certificate (Degree / Marksheet)</h3>
          </div>
          {initialData?.education_certificate_filename && (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Certificate On File: {initialData.education_certificate_filename}
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-700 mb-1.5">
            Upload Educational Certificate (PDF, DOC, DOCX, JPG, PNG)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setEduFile(e.target.files?.[0] || null)}
              className="text-xs text-charcoal-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
            {eduFile && (
              <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                <FileCheck className="w-4 h-4 text-emerald-600" /> {eduFile.name}
              </span>
            )}
          </div>
          <p className="text-[11px] text-charcoal-400 mt-1">
            Official degree certificate, consolidated marksheet, or provisional certificate.
          </p>
        </div>
      </div>

      {/* 3. Payment Status & Fee Management */}
      <div className="bg-white p-6 rounded-2xl border border-charcoal-200 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-charcoal-100 pb-2">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-charcoal-900">Payment Status & Fee Details</h3>
          </div>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              watchPaymentStatus === 'PAID'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : watchPaymentStatus === 'PARTIAL'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : watchPaymentStatus === 'WAIVED'
                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}
          >
            {watchPaymentStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Payment Status</label>
            <select
              {...register('payment_status')}
              className="w-full text-xs p-2.5 rounded-lg border border-charcoal-300 bg-white font-medium"
            >
              <option value="PENDING">Pending (Payment Awaited)</option>
              <option value="PARTIAL">Partial (Installment Paid)</option>
              <option value="PAID">Paid (Fully Cleared)</option>
              <option value="WAIVED">Waived (Fee Exempted)</option>
            </select>
          </div>

          <Input
            label="Total Course / Registration Fee (₹)"
            type="number"
            min={0}
            {...register('payment_amount')}
            error={errors.payment_amount?.message}
          />

          <Input
            label="Amount Paid So Far (₹)"
            type="number"
            min={0}
            {...register('amount_paid')}
            error={errors.amount_paid?.message}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Payment / Transaction Date"
            type="date"
            {...register('payment_date')}
          />

          <Input
            label="Transaction ID / UTR / Receipt Ref"
            placeholder="e.g. UPI/VN2026-9921 or REC-1049"
            {...register('payment_reference')}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-700 mb-1">
            Payment Notes / Installment Details
          </label>
          <textarea
            {...register('payment_notes')}
            rows={2}
            placeholder="e.g. First installment of ₹15,000 paid via Google Pay. Balance due before mock interviews."
            className="w-full text-xs p-2.5 rounded-xl border border-charcoal-300 bg-white placeholder-charcoal-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* 4. Provident Fund (PF) Details */}
      <div className="bg-white p-6 rounded-2xl border border-charcoal-200 shadow-card space-y-4">
        <div className="flex items-center gap-2 border-b border-charcoal-100 pb-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-charcoal-900">Provident Fund (PF) Details</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">PF Status</label>
            <select
              {...register('pf_status')}
              className="w-full text-xs p-2.5 rounded-lg border border-charcoal-300 bg-white"
            >
              <option value="NOT_APPLICABLE">Not Applicable (Fresher)</option>
              <option value="APPLICABLE">Applicable / Active PF Account</option>
              <option value="EXEMPT">Exempted</option>
            </select>
          </div>

          <Input
            label="UAN (Universal Account Number)"
            placeholder="12-digit UAN (e.g. 101234567890)"
            maxLength={12}
            {...register('pf_uan')}
          />

          <Input
            label="PF Account / Member Number"
            placeholder="e.g. MH/BAN/0012345/000/0001234"
            {...register('pf_number')}
          />
        </div>

        <div>
          <Input
            label="PF Remarks / Previous Employer Details"
            placeholder="e.g. Previous employer EPFO transferred; ready for member transfer on new joining."
            {...register('pf_notes')}
          />
        </div>
      </div>

      {/* 5. Service & Employment History */}
      <div className="bg-white p-6 rounded-2xl border border-charcoal-200 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-charcoal-100 pb-2">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-charcoal-900">Service History & Past Experience</h3>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addServiceRow}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Past Employer
          </Button>
        </div>

        {/* Experience Checkbox & Years */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-surface-50 p-3 rounded-xl border border-charcoal-200">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-charcoal-300"
              {...register('has_experience')}
            />
            <span className="text-xs font-bold text-charcoal-900">
              Candidate has prior work experience / service history
            </span>
          </label>

          <Input
            label="Total Work Experience (Years)"
            type="number"
            step="0.1"
            min={0}
            placeholder="e.g. 1.5"
            {...register('total_experience_years')}
          />
        </div>

        {/* Experience Certificate Upload */}
        <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-amber-900">
              Experience Certificate / Relieving Letter
            </label>
            {initialData?.experience_certificate_filename && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300">
                On File: {initialData.experience_certificate_filename}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setExpFile(e.target.files?.[0] || null)}
              className="text-xs text-charcoal-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
            />
            {expFile && (
              <span className="text-xs font-semibold text-amber-800 flex items-center gap-1">
                <FileCheck className="w-4 h-4 text-emerald-600" /> {expFile.name}
              </span>
            )}
          </div>
          <p className="text-[11px] text-amber-700">
            Upload service certificate, relieving letter, or last company work experience proof.
          </p>
        </div>

        {/* Repeater for Service History */}
        {serviceHistory.length === 0 ? (
          <p className="text-xs text-charcoal-400 py-2 italic text-center">
            No service history records added yet. If this candidate has prior work experience, click "+ Add Past Employer" above.
          </p>
        ) : (
          <div className="space-y-4 pt-1">
            {serviceHistory.map((row, idx) => (
              <div
                key={row.id || idx}
                className="p-4 rounded-xl border border-charcoal-200 bg-surface-50 space-y-3 relative"
              >
                <div className="flex items-center justify-between border-b border-charcoal-200/60 pb-2">
                  <span className="text-xs font-bold text-charcoal-700">
                    Employer #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeServiceRow(idx)}
                    className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Company / Employer Name"
                    placeholder="e.g. TechNova Solutions"
                    value={row.company_name}
                    onChange={(e) => updateServiceRow(idx, 'company_name', e.target.value)}
                    required
                  />

                  <Input
                    label="Job Designation / Role"
                    placeholder="e.g. Software Engineer"
                    value={row.designation}
                    onChange={(e) => updateServiceRow(idx, 'designation', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Start Date"
                    type="date"
                    value={row.start_date}
                    onChange={(e) => updateServiceRow(idx, 'start_date', e.target.value)}
                  />

                  <Input
                    label="End Date"
                    type="date"
                    value={row.end_date || ''}
                    onChange={(e) => updateServiceRow(idx, 'end_date', e.target.value)}
                  />

                  <Input
                    label="Work Location"
                    placeholder="e.g. Bengaluru / Remote"
                    value={row.location || ''}
                    onChange={(e) => updateServiceRow(idx, 'location', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Last Drawn CTC / Salary"
                    placeholder="e.g. ₹5,00,000 / year"
                    value={row.last_drawn_salary || ''}
                    onChange={(e) => updateServiceRow(idx, 'last_drawn_salary', e.target.value)}
                  />

                  <Input
                    label="Roles & Key Responsibilities"
                    placeholder="Brief description of tech stack, team, or achievements"
                    value={row.roles_responsibilities || ''}
                    onChange={(e) => updateServiceRow(idx, 'roles_responsibilities', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Skills, Training & Preferences */}
      <div className="bg-white p-6 rounded-2xl border border-charcoal-200 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-charcoal-900 border-b border-charcoal-100 pb-2">
          Skills, Training & Preferences
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Technical Skills (comma-separated)"
            placeholder="React, TypeScript, PostgreSQL, Docker"
            required
            {...register('technical_skills_str')}
            error={errors.technical_skills_str?.message}
            helperText="Separate multiple skills with commas."
          />

          <Input
            label="Certifications (comma-separated)"
            placeholder="AWS Certified Cloud Practitioner, ISTQB"
            {...register('certifications_str')}
            helperText="Optional certifications or credentials."
          />

          <Input
            label="Preferred Job Roles"
            placeholder="Full Stack Developer, Backend Developer"
            {...register('preferred_roles_str')}
          />

          <Input
            label="Preferred Work Locations"
            placeholder="Bengaluru, Pune, Remote, Hyderabad"
            {...register('preferred_locations_str')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Assigned Training Program</label>
            <select
              {...register('training_program_id')}
              className="w-full text-xs p-2.5 rounded-lg border border-charcoal-300 bg-white"
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Curriculum Progress (0-100%)"
            type="number"
            min={0}
            max={100}
            {...register('training_progress')}
            error={errors.training_progress?.message}
          />

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Readiness Assessment</label>
            <select
              {...register('readiness_assessment')}
              className="w-full text-xs p-2.5 rounded-lg border border-charcoal-300 bg-white"
            >
              <option value="NOT_EVALUATED">Not Evaluated</option>
              <option value="NEEDS_WORK">Needs Work / Tutoring</option>
              <option value="READY">Placement Ready</option>
              <option value="HIGH_POTENTIAL">High Potential ★</option>
            </select>
          </div>
        </div>

        {/* Optional Resume File Input */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-charcoal-700 mb-1">
            Resume Document (PDF, DOCX)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              className="text-xs text-charcoal-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
            />
            {resumeFile && (
              <span className="text-xs font-semibold text-brand-700 flex items-center gap-1">
                <FileCheck className="w-4 h-4 text-emerald-600" /> {resumeFile.name}
              </span>
            )}
            {initialData?.resume_filename && !resumeFile && (
              <span className="text-[11px] text-charcoal-500">
                Current file: {initialData.resume_filename}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 7. Staff Assignments & Pipeline Stage */}
      <div className="bg-white p-6 rounded-2xl border border-charcoal-200 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-charcoal-900 border-b border-charcoal-100 pb-2">
          Staff Ownership & Placement Workflow
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Placement Coordinator</label>
            <select
              {...register('coordinator_id')}
              className="w-full text-xs p-2.5 rounded-lg border border-charcoal-300 bg-white"
            >
              {coordinators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.title || c.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Technical Trainer / Mentor</label>
            <select
              {...register('trainer_id')}
              className="w-full text-xs p-2.5 rounded-lg border border-charcoal-300 bg-white"
            >
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name} ({t.title || t.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Initial Pipeline Stage</label>
            <select
              {...register('current_stage')}
              className="w-full text-xs p-2.5 rounded-lg border border-charcoal-300 bg-white"
            >
              <option value="Registered">Registered</option>
              <option value="Training in Progress">Training in Progress</option>
              <option value="Training Completed">Training Completed</option>
              <option value="Resume Ready">Resume Ready</option>
              <option value="Placement Ready">Placement Ready</option>
              <option value="Applications Submitted">Applications Submitted</option>
              <option value="Interview Scheduled">Interview Scheduled</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-700 mb-1">Internal Coordinator Notes</label>
          <textarea
            {...register('internal_notes')}
            rows={3}
            placeholder="Private mentoring observations, interview readiness feedback, or special placement requirements..."
            className="w-full text-xs p-3 rounded-xl border border-charcoal-300 bg-white placeholder-charcoal-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Form Submission Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="outline" size="md" type="button" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button variant="primary" size="md" type="submit" isLoading={isSubmitting}>
          {initialData ? 'Save Candidate Details' : 'Register Candidate'}
        </Button>
      </div>
    </form>
  );
};
