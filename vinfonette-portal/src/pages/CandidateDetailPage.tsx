import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StageChangeModal } from '../components/candidates/StageChangeModal';
import { ResumeViewerModal } from '../components/candidates/ResumeViewerModal';
import { PaymentStatusModal } from '../components/candidates/PaymentStatusModal';
import { DocumentUploadModal, CandidateDocType } from '../components/candidates/DocumentUploadModal';
import { InterviewModal } from '../components/interviews/InterviewModal';
import { TaskModal } from '../components/tasks/TaskModal';
import {
  User,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  Building2,
  FileText,
  Briefcase,
  CheckCircle2,
  Award,
  Sparkles,
  Edit,
  Clock,
  ArrowRight,
  ShieldCheck,
  Download,
  Plus,
  BookOpen,
  Search,
  AlertTriangle,
  CreditCard,
  IndianRupee,
  ExternalLink,
  FileCheck,
  Upload,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getStageColor,
  getReadinessBadge,
  getPaymentStatusBadge,
  getPFStatusBadge,
  getInterviewStatusBadge,
} from '../lib/utils';
import { getSecureDocumentUrl } from '../lib/storage';
import { getRemainingVacancies, isJobCurrentlyAvailable } from '../lib/job-availability';

export const CandidateDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { candidates, applications, interviews, offers, placements, tasks, activities, programs, companies, jobs, team, applyToJob } = useData();
  const { canEditCandidate, canManageCompanies, isAdmin, isCoordinator } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'training' | 'applications' | 'interviews' | 'offers' | 'placement' | 'tasks' | 'documents' | 'activity'
  >('overview');

  // Modals state
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadDocType, setUploadDocType] = useState<CandidateDocType>('education_certificate');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');
  const [submittingJobId, setSubmittingJobId] = useState<string | null>(null);

  const candidate = candidates.find((c) => c.id === id);

  if (!candidate) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-bold text-charcoal-900">Candidate Not Found</h2>
        <p className="text-xs text-charcoal-500 mt-1">The candidate profile you requested does not exist.</p>
        <Link to="/candidates" className="mt-4 inline-block">
          <Button variant="primary" size="sm">Back to Candidates</Button>
        </Link>
      </div>
    );
  }

  const canEdit = canEditCandidate(candidate);
  const stageStyle = getStageColor(candidate.current_stage);
  const readinessBadge = getReadinessBadge(candidate.readiness_assessment);
  const paymentBadge = getPaymentStatusBadge(candidate.payment_status);
  const pfBadge = getPFStatusBadge(candidate.pf_status);
  const coordinator = team.find((t) => t.id === candidate.coordinator_id);
  const trainer = team.find((t) => t.id === candidate.trainer_id);
  const program = programs.find((p) => p.id === candidate.training_program_id);

  const handleDownloadDoc = async (docType: CandidateDocType) => {
    let url = '';
    if (docType === 'education_certificate') {
      url = candidate.education_certificate_url || `/api/documents/download/${candidate.id}/education_certificate`;
    } else if (docType === 'experience_certificate') {
      url = candidate.experience_certificate_url || `/api/documents/download/${candidate.id}/experience_certificate`;
    } else {
      url = candidate.resume_url || `/api/documents/download/${candidate.id}/resume`;
    }
    const downloadUrl = await getSecureDocumentUrl(url, candidate.id, docType);
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  // Filtered child records
  const candidateApps = applications.filter((a) => a.candidate_id === candidate.id);
  const candidateInterviews = interviews.filter((i) => i.candidate_id === candidate.id);
  const candidateOffers = offers.filter((o) => o.candidate_id === candidate.id);
  const candidatePlacement = placements.find((p) => p.candidate_id === candidate.id);
  const candidateTasks = tasks.filter((t) => t.related_candidate_id === candidate.id);
  const candidateActivities = activities.filter((a) => a.candidate_id === candidate.id);
  const roleMatches = roleSearch.trim()
    ? jobs.filter((job) => job.title.toLocaleLowerCase().includes(roleSearch.trim().toLocaleLowerCase()))
    : [];
  const availableRoleMatches = roleMatches.filter((job) =>
    isJobCurrentlyAvailable(job, companies.find((company) => company.id === job.company_id), applications),
  );

  const handleApplyToOpening = async (jobId: string) => {
    setSubmittingJobId(jobId);
    try {
      await applyToJob(candidate.id, jobId, `Candidate role search: ${roleSearch.trim()}`);
    } catch {
      // DataContext displays the API error to the user.
    } finally {
      setSubmittingJobId(null);
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'training', label: 'Training & Skills' },
    { key: 'applications', label: `Applications (${candidateApps.length})` },
    { key: 'interviews', label: `Interviews (${candidateInterviews.length})` },
    { key: 'offers', label: `Offers (${candidateOffers.length})` },
    { key: 'placement', label: candidatePlacement ? 'Placement ★' : 'Placement' },
    { key: 'tasks', label: `Tasks (${candidateTasks.length})` },
    { key: 'documents', label: 'Documents Vault' },
    { key: 'activity', label: 'Activity' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={candidate.full_name}
        subtitle={`${candidate.candidate_id} · ${candidate.education} in ${candidate.specialization} (${candidate.batch})`}
        breadcrumbs={[
          { label: 'Candidates', href: '/candidates' },
          { label: candidate.full_name },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {canEdit && (
              <Link to={`/candidates/${candidate.id}/edit`}>
                <Button variant="outline" size="sm" leftIcon={<Edit className="w-4 h-4" />}>
                  Edit Profile
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaymentModalOpen(true)}
              leftIcon={<CreditCard className="w-4 h-4 text-emerald-600" />}
            >
              Payment Status
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUploadDocType('education_certificate');
                setUploadModalOpen(true);
              }}
              leftIcon={<Upload className="w-4 h-4 text-brand-600" />}
            >
              Upload Document
            </Button>
            {canEdit && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStageModalOpen(true)}
                leftIcon={<ArrowRight className="w-4 h-4" />}
              >
                Change Stage
              </Button>
            )}
          </div>
        }
      />

      {/* Top Profile Summary Card */}
      <Card className="p-6 border border-charcoal-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 font-bold text-xl shrink-0">
              {candidate.full_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-charcoal-900">{candidate.full_name}</h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${stageStyle.bg} ${stageStyle.text} ${stageStyle.border}`}
                >
                  {candidate.current_stage}
                </span>
                <span className={`px-2.5 py-0.5 rounded text-xs font-medium border ${readinessBadge.color}`}>
                  {readinessBadge.label}
                </span>
                <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${paymentBadge.color} flex items-center gap-1`}>
                  <CreditCard className="w-3 h-3" />
                  Payment: {paymentBadge.label}
                </span>
                <span className="px-2.5 py-0.5 rounded text-xs font-medium border bg-amber-50 text-amber-800 border-amber-200 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-amber-600" />
                  {candidate.has_experience ? `${candidate.total_experience_years || 0} Yrs Experience` : 'Fresher'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-charcoal-500 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-charcoal-400" />
                  {candidate.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-charcoal-400" />
                  {candidate.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-charcoal-400" />
                  Registered: {formatDate(candidate.registration_date)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-surface-50 p-3 rounded-xl border border-charcoal-100 text-xs">
            <div>
              <p className="text-[10px] text-charcoal-400 font-semibold uppercase">Coordinator</p>
              <p className="font-bold text-charcoal-800">{coordinator?.full_name || 'Unassigned'}</p>
            </div>
            <div className="h-6 w-px bg-charcoal-200" />
            <div>
              <p className="text-[10px] text-charcoal-400 font-semibold uppercase">Technical Mentor</p>
              <p className="font-bold text-charcoal-800">{trainer?.full_name || 'Unassigned'}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 9 Tab Navigation */}
      <div className="border-b border-charcoal-200 flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
              activeTab === tab.key
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-charcoal-500 hover:text-charcoal-800 hover:border-charcoal-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Payment Status & Fee Management Card */}
            <Card className="p-5 border-l-4 border-l-emerald-500 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-charcoal-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider">
                      Fee & Payment Status
                    </h3>
                    <p className="text-[11px] text-charcoal-400">Candidate enrollment & training fee account</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${paymentBadge.color}`}>
                    {paymentBadge.label}
                  </span>
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentModalOpen(true)}
                    >
                      Update Payment
                    </Button>
                  )}
                </div>
              </div>

              {/* Financial Numbers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-surface-50 border border-charcoal-100 text-center mb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-charcoal-400 block mb-0.5">Total Course Fee</span>
                  <span className="text-base font-extrabold text-charcoal-900">
                    ₹{Number(candidate.payment_amount || 25000).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-charcoal-400 block mb-0.5">Amount Paid</span>
                  <span className="text-base font-extrabold text-emerald-600">
                    ₹{Number(candidate.amount_paid || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-charcoal-400 block mb-0.5">Balance Remaining</span>
                  <span className={`text-base font-extrabold ${Math.max(0, (candidate.payment_amount || 25000) - (candidate.amount_paid || 0)) > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                    ₹{Math.max(0, (candidate.payment_amount || 25000) - (candidate.amount_paid || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-[11px] text-charcoal-500 mb-1">
                  <span>Payment Fulfillment</span>
                  <span className="font-bold text-charcoal-700">
                    {Math.round(((candidate.amount_paid || 0) / (candidate.payment_amount || 25000)) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-charcoal-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round(((candidate.amount_paid || 0) / (candidate.payment_amount || 25000)) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Transaction Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-charcoal-400 text-[11px] block">Payment Date</span>
                  <span className="font-semibold text-charcoal-800">{formatDate(candidate.payment_date)}</span>
                </div>
                <div>
                  <span className="text-charcoal-400 text-[11px] block">Receipt / UTR Reference</span>
                  <span className="font-mono font-semibold text-charcoal-800">{candidate.payment_reference || '—'}</span>
                </div>
                {candidate.payment_notes && (
                  <div className="sm:col-span-2 bg-slate-50 p-2.5 rounded-lg border border-charcoal-100">
                    <span className="text-charcoal-400 text-[11px] block mb-0.5">Billing Notes</span>
                    <span className="text-charcoal-700">{candidate.payment_notes}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* 2. Service & Employment History Card */}
            <Card className="p-5 border-l-4 border-l-amber-500 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-charcoal-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider">
                      Service History & Prior Experience
                    </h3>
                    <p className="text-[11px] text-charcoal-400">Past employment, organizations, and relieving credentials</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  {candidate.has_experience ? `${candidate.total_experience_years || 0} Years Experience` : 'Fresher / Entry Level'}
                </span>
              </div>

              {/* Experience Certificate Box */}
              <div className="p-3.5 rounded-xl border border-charcoal-200 bg-surface-50 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-charcoal-900">
                      {candidate.experience_certificate_filename || 'No Experience Certificate uploaded yet'}
                    </p>
                    <p className="text-[11px] text-charcoal-500">
                      {candidate.experience_certificate_filename
                        ? 'Official Relieving / Service Certificate on file'
                        : 'Relieving letter or previous work proof document'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {candidate.experience_certificate_filename ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadDoc('experience_certificate')}
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                    >
                      Download
                    </Button>
                  ) : null}
                  {canEdit && (
                    <Button
                      variant={candidate.experience_certificate_filename ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => {
                        setUploadDocType('experience_certificate');
                        setUploadModalOpen(true);
                      }}
                      leftIcon={<Upload className="w-3.5 h-3.5" />}
                    >
                      {candidate.experience_certificate_filename ? 'Replace' : 'Upload Certificate'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Service Records List */}
              {candidate.service_history && candidate.service_history.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                    Past Employment Records ({candidate.service_history.length})
                  </h4>
                  <div className="divide-y divide-charcoal-100 border border-charcoal-100 rounded-xl overflow-hidden bg-white">
                    {candidate.service_history.map((record, idx) => (
                      <div key={record.id || idx} className="p-3.5 space-y-1.5 hover:bg-slate-50/60 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h5 className="text-xs font-bold text-charcoal-900 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-charcoal-500" />
                              {record.company_name}
                            </h5>
                            <p className="text-xs font-semibold text-brand-600">{record.designation}</p>
                          </div>
                          <span className="text-[11px] text-charcoal-500 font-medium px-2 py-0.5 rounded bg-slate-100 shrink-0">
                            {formatDate(record.start_date, 'MMM yyyy')} — {record.end_date ? formatDate(record.end_date, 'MMM yyyy') : (record.is_current ? 'Present' : '—')}
                          </span>
                        </div>
                        {record.location && (
                          <p className="text-[11px] text-charcoal-500">Location: {record.location}</p>
                        )}
                        {record.last_drawn_salary && (
                          <p className="text-[11px] text-charcoal-600 font-medium">Last Drawn CTC: {record.last_drawn_salary}</p>
                        )}
                        {record.roles_responsibilities && (
                          <p className="text-xs text-charcoal-600 bg-surface-50 p-2 rounded-lg mt-1 border border-charcoal-100">
                            {record.roles_responsibilities}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-slate-50 rounded-xl border border-charcoal-100">
                  <p className="text-xs text-charcoal-500">
                    Candidate is a Fresher with no prior company service history recorded.
                  </p>
                  {canEdit && (
                    <Link to={`/candidates/${candidate.id}/edit`} className="inline-block mt-2">
                      <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                        Add Prior Work Experience
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </Card>

            {/* 3. Skills & Technical Competencies */}
            <Card className="p-5">
              <h3 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider mb-3">
                Skills & Technical Competencies
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {candidate.technical_skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {candidate.certifications.length > 0 && (
                <div className="mt-4 pt-4 border-t border-charcoal-100">
                  <h4 className="text-xs font-semibold text-charcoal-700 mb-2">Verified Certifications</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.certifications.map((cert) => (
                      <span
                        key={cert}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* 4. Career Preferences */}
            <Card className="p-5">
              <h3 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider mb-3">
                Career Preferences
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-charcoal-400 block mb-1">Target Roles</span>
                  <div className="flex flex-wrap gap-1">
                    {candidate.preferred_roles.map((r) => (
                      <span key={r} className="px-2 py-0.5 rounded bg-slate-100 text-charcoal-800 font-medium">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-charcoal-400 block mb-1">Preferred Locations</span>
                  <div className="flex flex-wrap gap-1">
                    {candidate.preferred_locations.map((loc) => (
                      <span key={loc} className="px-2 py-0.5 rounded bg-slate-100 text-charcoal-800 font-medium">
                        {loc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {/* 1. Academic Dossier & Educational Certificate */}
            <Card className="p-5 border-l-4 border-l-indigo-500 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-charcoal-100 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider">
                    Academic Qualifications
                  </h3>
                </div>
              </div>

              <dl className="space-y-2.5 text-xs mb-4">
                <div className="flex justify-between py-1 border-b border-charcoal-100">
                  <dt className="text-charcoal-400">Education Degree</dt>
                  <dd className="font-semibold text-charcoal-800">{candidate.education}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-charcoal-100">
                  <dt className="text-charcoal-400">Specialization</dt>
                  <dd className="font-semibold text-charcoal-800">{candidate.specialization}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-charcoal-100">
                  <dt className="text-charcoal-400">Graduation Year</dt>
                  <dd className="font-semibold text-charcoal-800">{candidate.graduation_year}</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-charcoal-400">Cohort Batch</dt>
                  <dd className="font-semibold text-charcoal-800">Batch {candidate.batch}</dd>
                </div>
              </dl>

              {/* Educational Certificate Document Box */}
              <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-200">
                <div className="flex items-start gap-2.5 mb-2">
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-charcoal-900">Educational Certificate</p>
                    <p className="text-[11px] text-charcoal-500">
                      {candidate.education_certificate_filename || 'No certificate uploaded yet'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  {candidate.education_certificate_filename ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadDoc('education_certificate')}
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                    >
                      Download
                    </Button>
                  ) : null}
                  {canEdit && (
                    <Button
                      variant={candidate.education_certificate_filename ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => {
                        setUploadDocType('education_certificate');
                        setUploadModalOpen(true);
                      }}
                      leftIcon={<Upload className="w-3.5 h-3.5" />}
                    >
                      {candidate.education_certificate_filename ? 'Replace' : 'Upload Certificate'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* 2. Provident Fund (PF) Details Card */}
            <Card className="p-5 border-l-4 border-l-blue-500 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-charcoal-100 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider">
                    Provident Fund (PF) Info
                  </h3>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${pfBadge.color}`}>
                  {pfBadge.label}
                </span>
              </div>

              <dl className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-charcoal-100">
                  <dt className="text-charcoal-400">PF Status</dt>
                  <dd className="font-semibold text-charcoal-800">{candidate.pf_status || 'NOT_APPLICABLE'}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-charcoal-100">
                  <dt className="text-charcoal-400">UAN Number</dt>
                  <dd className="font-mono font-bold text-charcoal-800">{candidate.pf_uan || '—'}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-charcoal-100">
                  <dt className="text-charcoal-400">PF Member ID</dt>
                  <dd className="font-mono text-charcoal-800">{candidate.pf_number || '—'}</dd>
                </div>
                {candidate.pf_notes && (
                  <div className="py-1">
                    <dt className="text-charcoal-400 mb-0.5">PF Notes</dt>
                    <dd className="text-charcoal-700 bg-slate-50 p-2 rounded border border-charcoal-100">{candidate.pf_notes}</dd>
                  </div>
                )}
              </dl>
            </Card>

            {/* 3. Coordinator Notes */}
            {candidate.internal_notes && (
              <Card className="p-5 bg-amber-50/40 border-amber-200">
                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
                  Coordinator & Mentor Notes
                </h3>
                <p className="text-xs text-amber-800 leading-relaxed">{candidate.internal_notes}</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Training */}
      {activeTab === 'training' && (
        <Card className="p-6">
          <h3 className="text-sm font-bold text-charcoal-900 mb-4">Training Curriculum & Mock Review</h3>
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-surface-50 border border-charcoal-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-sm font-bold text-charcoal-900">{program?.name || 'General Placement Track'}</h4>
                  <p className="text-xs text-charcoal-500">{program?.track} · {program?.duration_weeks} Weeks Comprehensive</p>
                </div>
                <span className="text-sm font-bold text-brand-600">{candidate.training_progress}% Complete</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-brand-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${candidate.training_progress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-charcoal-200 bg-white">
                <span className="text-xs text-charcoal-400 block mb-1">Readiness Score</span>
                <span className="text-2xl font-extrabold text-charcoal-900">{candidate.readiness_score}%</span>
                <p className="text-[11px] text-charcoal-500 mt-1">Based on technical & soft skill vetting</p>
              </div>

              <div className="p-4 rounded-xl border border-charcoal-200 bg-white">
                <span className="text-xs text-charcoal-400 block mb-1">Evaluation Assessment</span>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${readinessBadge.color}`}>
                  {readinessBadge.label}
                </span>
                <p className="text-[11px] text-charcoal-500 mt-1">Mentor verdict for corporate drives</p>
              </div>

              <div className="p-4 rounded-xl border border-charcoal-200 bg-white">
                <span className="text-xs text-charcoal-400 block mb-1">Mentor Lead</span>
                <span className="text-sm font-bold text-charcoal-800">{trainer?.full_name || 'Anita Desai'}</span>
                <p className="text-[11px] text-charcoal-500 mt-1">{trainer?.title || 'Lead Technical Mentor'}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 3: Applications */}
      {activeTab === 'applications' && (
        <Card className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-charcoal-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">Submitted Job Applications</h3>
              <p className="text-xs text-charcoal-500">Track company submissions and status updates</p>
            </div>
            <Link to="/jobs">
              <Button variant="outline" size="sm" leftIcon={<Briefcase className="w-3.5 h-3.5" />}>
                Browse Job Openings
              </Button>
            </Link>
          </div>

          {canManageCompanies && canEdit && (
            <div className="mb-5 rounded-xl border border-brand-200 bg-brand-50/50 p-4">
              <h4 className="text-xs font-bold text-charcoal-900">Find a company opening for this candidate</h4>
              <p className="mt-1 text-[11px] text-charcoal-600">
                Search a job title to check current openings recorded under your companies.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
                  <input
                    type="search"
                    value={roleSearch}
                    onChange={(event) => setRoleSearch(event.target.value)}
                    placeholder="Enter a role, e.g. Data Analyst"
                    className="w-full rounded-lg border border-charcoal-200 bg-white py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                    aria-label="Search company openings by job title"
                  />
                </div>
                <Link to="/jobs">
                  <Button variant="outline" size="sm" type="button" leftIcon={<Briefcase className="h-3.5 w-3.5" />}>
                    Browse all openings
                  </Button>
                </Link>
              </div>

              {roleSearch.trim() && availableRoleMatches.length > 0 && (
                <div className="mt-3 space-y-2" aria-live="polite">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {availableRoleMatches.length} available {availableRoleMatches.length === 1 ? 'opening' : 'openings'} found
                  </p>
                  {availableRoleMatches.map((job) => {
                    const company = companies.find((item) => item.id === job.company_id);
                    const remaining = getRemainingVacancies(job, applications);
                    const previouslyApplied = candidateApps.some((application) => application.job_id === job.id);
                    return (
                      <div key={job.id} className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <Link to={`/jobs/${job.id}`} className="text-xs font-bold text-charcoal-900 hover:text-brand-600">
                            {job.title}
                          </Link>
                          <p className="text-[11px] text-charcoal-600">{company?.name} · {job.work_location}</p>
                          <p className="mt-0.5 text-[10px] font-medium text-emerald-700">
                            {remaining} {remaining === 1 ? 'vacancy' : 'vacancies'} available
                          </p>
                        </div>
                        <Button
                          variant={previouslyApplied ? 'secondary' : 'primary'}
                          size="sm"
                          type="button"
                          disabled={previouslyApplied}
                          isLoading={submittingJobId === job.id}
                          onClick={() => handleApplyToOpening(job.id)}
                        >
                          {previouslyApplied ? 'Already applied' : 'Submit candidate'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {roleSearch.trim() && availableRoleMatches.length === 0 && (
                <p className="mt-3 flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] font-semibold text-amber-900" aria-live="polite">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  This position is not available in any company right now.
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            {candidateApps.length === 0 ? (
              <p className="text-xs text-charcoal-400 py-6 text-center">No active job applications found</p>
            ) : (
              candidateApps.map((app) => {
                const job = jobs.find((j) => j.id === app.job_id);
                const comp = job ? companies.find((c) => c.id === job.company_id) : null;
                return (
                  <div key={app.id} className="p-4 rounded-xl bg-surface-50 border border-charcoal-200 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-charcoal-900">{job?.title || 'Job Opening'}</h4>
                      <p className="text-[11px] text-charcoal-600">{comp?.name} · {job?.work_location}</p>
                      <p className="text-[10px] text-charcoal-400 mt-1">Applied: {formatDate(app.applied_at)}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                        {app.status}
                      </span>
                      <p className="text-[10px] text-charcoal-400 mt-1">Match Score: {app.match_score}%</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      )}

      {/* Tab 4: Interviews */}
      {activeTab === 'interviews' && (
        <Card className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-charcoal-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">Interview Rounds History</h3>
              <p className="text-xs text-charcoal-500">Past evaluations and upcoming schedule</p>
            </div>
            {canEdit && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setScheduleModalOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Schedule Round
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {candidateInterviews.length === 0 ? (
              <p className="text-xs text-charcoal-400 py-6 text-center">No interviews logged yet</p>
            ) : (
              candidateInterviews.map((int) => {
                const comp = companies.find((c) => c.id === int.company_id);
                const statusBadge = getInterviewStatusBadge(int.status);
                return (
                  <div key={int.id} className="p-4 rounded-xl bg-surface-50 border border-charcoal-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-charcoal-900">
                          Round {int.round_number}: {int.round_name}
                        </span>
                        <span className="text-xs text-charcoal-500">at {comp?.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                        {int.status}
                      </span>
                    </div>

                    <p className="text-xs text-charcoal-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-brand-500" />
                      {formatDateTime(int.scheduled_at)} ({int.duration_minutes} min) · {int.mode}
                    </p>

                    {int.interviewer_names && (
                      <p className="text-xs text-charcoal-500">Interviewer(s): {int.interviewer_names}</p>
                    )}

                    {int.feedback && (
                      <div className="p-2.5 rounded-lg bg-white border border-charcoal-100 text-xs text-charcoal-700">
                        <span className="font-semibold text-charcoal-900 block mb-0.5">
                          Evaluation Outcome: {int.result}
                        </span>
                        {int.feedback}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>
      )}

      {/* Tab 5: Offers */}
      {activeTab === 'offers' && (
        <Card className="p-6">
          <div className="pb-4 border-b border-charcoal-100 mb-4">
            <h3 className="text-sm font-bold text-charcoal-900">Formal Job Offers</h3>
            <p className="text-xs text-charcoal-500">Documented offers extended by hiring partners</p>
          </div>

          <div className="space-y-4">
            {candidateOffers.length === 0 ? (
              <p className="text-xs text-charcoal-400 py-6 text-center">No offers recorded for this candidate yet</p>
            ) : (
              candidateOffers.map((off) => {
                const comp = companies.find((c) => c.id === off.company_id);
                const job = jobs.find((j) => j.id === off.job_id);
                return (
                  <div key={off.id} className="p-4 rounded-xl bg-surface-50 border border-charcoal-200 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-charcoal-900 block">{comp?.name}</span>
                      <p className="text-xs text-charcoal-600">{job?.title}</p>
                      <p className="text-[11px] text-charcoal-400 mt-1">Offer Date: {formatDate(off.offer_date)}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-emerald-700 block">
                        Base: {formatCurrency(off.base_salary)}
                      </span>
                      <span className="text-xs text-charcoal-500 block">
                        + Variable {formatCurrency(off.variable_salary)}
                      </span>
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {off.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      )}

      {/* Tab 6: Placement Details */}
      {activeTab === 'placement' && (
        <Card className="p-6">
          <div className="pb-4 border-b border-charcoal-100 mb-4">
            <h3 className="text-sm font-bold text-charcoal-900">Placement Confirmation Details</h3>
            <p className="text-xs text-charcoal-500">Official employment record verified by VinfoNette Placements</p>
          </div>

          {!candidatePlacement ? (
            <div className="text-center py-8">
              <Award className="w-10 h-10 text-charcoal-300 mx-auto mb-2" />
              <p className="text-xs text-charcoal-600 font-semibold">Candidate has not been placed yet.</p>
              <p className="text-xs text-charcoal-400 mt-1 max-w-sm mx-auto">
                Once a candidate receives and accepts an offer, mark them as Placed Successfully through the Stage Change dialog to record employer and joining details.
              </p>
              {canEdit && (
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-4"
                  onClick={() => setStageModalOpen(true)}
                >
                  Record Placement
                </Button>
              )}
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-white border border-emerald-300 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Official Confirmed Placement
                  </span>
                  <h4 className="text-xl font-extrabold text-emerald-950 mt-0.5">
                    {candidatePlacement.designation}
                  </h4>
                  <p className="text-xs text-emerald-800">
                    at {companies.find((c) => c.id === candidatePlacement.company_id)?.name}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-charcoal-500 block">Annual Compensation</span>
                  <span className="text-2xl font-black text-emerald-800">
                    {formatCurrency(candidatePlacement.ctc)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-emerald-200 text-xs">
                <div>
                  <span className="text-emerald-700 block text-[11px]">Joining Date</span>
                  <span className="font-bold text-emerald-950">{formatDate(candidatePlacement.joining_date)}</span>
                </div>
                <div>
                  <span className="text-emerald-700 block text-[11px]">Placement Status</span>
                  <span className="font-bold text-emerald-950">{candidatePlacement.status}</span>
                </div>
              </div>

              <div className="p-3 bg-white/80 rounded-xl border border-emerald-200 text-xs text-charcoal-700">
                <span className="font-semibold text-emerald-900 block mb-0.5">Verification & Background Check:</span>
                {candidatePlacement.confirmation_details}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Tab 7: Tasks */}
      {activeTab === 'tasks' && (
        <Card className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-charcoal-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">Candidate Action Items</h3>
              <p className="text-xs text-charcoal-500">Mentoring follow-ups, background verification, document submissions</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setTaskModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Task
            </Button>
          </div>

          <div className="space-y-3">
            {candidateTasks.length === 0 ? (
              <p className="text-xs text-charcoal-400 py-6 text-center">No tasks assigned to this candidate</p>
            ) : (
              candidateTasks.map((t) => (
                <div key={t.id} className="p-3.5 rounded-xl bg-surface-50 border border-charcoal-200 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-charcoal-900">{t.title}</h4>
                    {t.description && <p className="text-[11px] text-charcoal-500 mt-0.5">{t.description}</p>}
                    <p className="text-[10px] text-charcoal-400 mt-1">Due: {formatDate(t.due_date)}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Tab 8: Documents Vault */}
      {activeTab === 'documents' && (
        <Card className="p-6 space-y-6">
          <div className="pb-4 border-b border-charcoal-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">Protected Document Vault</h3>
              <p className="text-xs text-charcoal-500">
                Resumes, verified educational certificates, and past service / experience credentials
              </p>
            </div>
            {canEdit && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setUploadDocType('education_certificate');
                  setUploadModalOpen(true);
                }}
                leftIcon={<Upload className="w-3.5 h-3.5" />}
              >
                Upload Document
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Resume Document Card */}
            <div className="p-4 rounded-xl border border-charcoal-200 bg-surface-50 flex flex-col justify-between space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-brand-600 tracking-wider">Candidate Resume</span>
                  <p className="text-xs font-bold text-charcoal-900 break-all">
                    {candidate.resume_filename || `${candidate.full_name}_Resume.pdf`}
                  </p>
                  <p className="text-[11px] text-charcoal-400">Private candidate document storage · Sign-in required</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-charcoal-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDoc('resume')}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  className="w-full text-xs"
                >
                  Download
                </Button>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUploadDocType('resume');
                      setUploadModalOpen(true);
                    }}
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                    className="w-full text-xs"
                  >
                    Replace
                  </Button>
                )}
              </div>
            </div>

            {/* 2. Educational Certificate Card */}
            <div className="p-4 rounded-xl border border-charcoal-200 bg-surface-50 flex flex-col justify-between space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-indigo-600 tracking-wider">Educational Certificate</span>
                  <p className="text-xs font-bold text-charcoal-900 break-all">
                    {candidate.education_certificate_filename || 'No Certificate Uploaded'}
                  </p>
                  <p className="text-[11px] text-charcoal-400">
                    {candidate.education_certificate_filename ? 'Verified Degree / Marksheet' : 'Degree / Diploma document'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-charcoal-200">
                {candidate.education_certificate_filename ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadDoc('education_certificate')}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    className="w-full text-xs"
                  >
                    Download
                  </Button>
                ) : null}
                {canEdit && (
                  <Button
                    variant={candidate.education_certificate_filename ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => {
                      setUploadDocType('education_certificate');
                      setUploadModalOpen(true);
                    }}
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                    className="w-full text-xs"
                  >
                    {candidate.education_certificate_filename ? 'Replace' : 'Upload'}
                  </Button>
                )}
              </div>
            </div>

            {/* 3. Experience Certificate Card */}
            <div className="p-4 rounded-xl border border-charcoal-200 bg-surface-50 flex flex-col justify-between space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-amber-600 tracking-wider">Experience Certificate</span>
                  <p className="text-xs font-bold text-charcoal-900 break-all">
                    {candidate.experience_certificate_filename || 'No Certificate Uploaded'}
                  </p>
                  <p className="text-[11px] text-charcoal-400">
                    {candidate.experience_certificate_filename ? 'Relieving Letter / Service Proof' : 'Work experience credential'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-charcoal-200">
                {candidate.experience_certificate_filename ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadDoc('experience_certificate')}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    className="w-full text-xs"
                  >
                    Download
                  </Button>
                ) : null}
                {canEdit && (
                  <Button
                    variant={candidate.experience_certificate_filename ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => {
                      setUploadDocType('experience_certificate');
                      setUploadModalOpen(true);
                    }}
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                    className="w-full text-xs"
                  >
                    {candidate.experience_certificate_filename ? 'Replace' : 'Upload'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 9: Activity */}
      {activeTab === 'activity' && (
        <Card className="p-6">
          <div className="pb-4 border-b border-charcoal-100 mb-4">
            <h3 className="text-sm font-bold text-charcoal-900">Complete Historical Activity Log</h3>
            <p className="text-xs text-charcoal-500">Immutable trace of every stage transition, note, and outcome</p>
          </div>

          <div className="space-y-4">
            {candidateActivities.length === 0 ? (
              <p className="text-xs text-charcoal-400 py-6 text-center">No activity entries recorded yet</p>
            ) : (
              candidateActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />
                  <div className="flex-1 pb-3 border-b border-charcoal-100 last:border-b-0">
                    <p className="font-semibold text-charcoal-900">{act.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-charcoal-400 mt-1">
                      <span>Logged by {act.actor_name}</span>
                      <span>•</span>
                      <span>{formatDateTime(act.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Modals */}
      <StageChangeModal
        isOpen={stageModalOpen}
        onClose={() => setStageModalOpen(false)}
        candidate={candidate}
      />

      <ResumeViewerModal
        isOpen={resumeModalOpen}
        onClose={() => setResumeModalOpen(false)}
        candidate={candidate}
      />

      <PaymentStatusModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        candidate={candidate}
      />

      <DocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        candidate={candidate}
        defaultDocType={uploadDocType}
      />

      <InterviewModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        candidateId={candidate.id}
      />

      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        initialTask={{
          id: '',
          title: '',
          related_candidate_id: candidate.id,
          owner_id: candidate.coordinator_id || '',
          priority: 'Medium',
          due_date: new Date(Date.now() + 86400000).toISOString(),
          status: 'To Do',
        }}
      />
    </div>
  );
};
