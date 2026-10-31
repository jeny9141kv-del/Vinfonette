import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { InterviewModal } from '../components/interviews/InterviewModal';
import { JobApplication, ApplicationStatus } from '../lib/types';
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  CheckCircle2,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { jobs, companies, candidates, applications, applyToJob, updateApplicationStatus } = useData();
  const { canManageCompanies } = useAuth();

  const [scheduleModalCandidateId, setScheduleModalCandidateId] = useState<string | null>(null);

  const job = jobs.find((j) => j.id === id);

  if (!job) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-bold text-charcoal-900">Job Opening Not Found</h2>
        <Link to="/jobs" className="mt-4 inline-block">
          <Button variant="primary" size="sm">Back to Openings</Button>
        </Link>
      </div>
    );
  }

  const comp = companies.find((c) => c.id === job.company_id);
  const jobApplications = applications.filter((a) => a.job_id === job.id);
  const appliedCandidateIds = new Set(jobApplications.map((a) => a.candidate_id));

  // Matched candidate recommendations (who haven't applied yet)
  const candidateRecommendations = candidates
    .filter((c) => !appliedCandidateIds.has(c.id) && c.placement_status === 'ACTIVE')
    .map((c) => {
      // Calculate matching skills
      const matched = c.technical_skills.filter((skill) =>
        job.required_skills.some((req) => req.toLowerCase() === skill.toLowerCase())
      );
      const matchScore = Math.min(100, Math.round(50 + (matched.length / Math.max(job.required_skills.length, 1)) * 50));
      return { candidate: c, matchScore, matchedSkills: matched };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  const handleQuickSubmit = async (candidateId: string) => {
    await applyToJob(candidateId, job.id, 'Candidate submitted via automated skill match');
  };

  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    await updateApplicationStatus(appId, newStatus);
  };

  const appStatuses: ApplicationStatus[] = [
    'Identified',
    'Shortlisted',
    'Submitted',
    'Screening',
    'Interviewing',
    'Offered',
    'Hired',
    'Rejected',
    'Withdrawn',
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={job.title}
        subtitle={`${job.job_id} · ${comp?.name} · ${job.work_location} (${job.work_mode})`}
        breadcrumbs={[
          { label: 'Job Openings', href: '/jobs' },
          { label: job.title },
        ]}
      />

      {/* Overview Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono text-charcoal-400 uppercase tracking-wider block">
              {job.job_id} · {comp?.name}
            </span>
            <h2 className="text-xl font-bold text-charcoal-900 mt-0.5">{job.title}</h2>
            <div className="flex items-center gap-4 text-xs text-charcoal-500 mt-2 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                {formatCurrency(job.salary_min)} - {formatCurrency(job.salary_max)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-charcoal-400" />
                {job.work_location} ({job.work_mode})
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-charcoal-400" />
                {job.vacancies} Vacancies
              </span>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              job.status === 'OPEN'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {job.status}
          </span>
        </div>

        <div className="mt-4 pt-4 border-t border-charcoal-100 space-y-3">
          <p className="text-xs text-charcoal-700 leading-relaxed">{job.description}</p>
          <div>
            <span className="text-xs font-semibold text-charcoal-800 block mb-1.5">Required Skills:</span>
            <div className="flex flex-wrap gap-1.5">
              {job.required_skills.map((s) => (
                <span key={s} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Grid: Existing Applicants & Matching Shortlist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Existing Applications */}
        <Card className="p-5">
          <div className="pb-3 border-b border-charcoal-100 mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-charcoal-900">
              Submitted Candidates ({jobApplications.length})
            </h3>
            <span className="text-xs text-charcoal-400">Application Pipeline</span>
          </div>

          <div className="space-y-3">
            {jobApplications.length === 0 ? (
              <p className="text-xs text-charcoal-400 py-8 text-center">No applicants submitted yet</p>
            ) : (
              jobApplications.map((app) => {
                const cand = candidates.find((c) => c.id === app.candidate_id);
                return (
                  <div key={app.id} className="p-3.5 rounded-xl bg-surface-50 border border-charcoal-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <Link
                        to={`/candidates/${app.candidate_id}`}
                        className="text-xs font-bold text-charcoal-900 hover:text-brand-600 transition-colors"
                      >
                        {cand?.full_name} ({cand?.candidate_id})
                      </Link>
                      <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                        {app.match_score}% Match
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                      <span className="text-[11px] text-charcoal-500">
                        Status: <strong className="text-charcoal-800">{app.status}</strong>
                      </span>

                      {canManageCompanies && (
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                          className="text-[11px] p-1 rounded-lg border border-charcoal-300 bg-white"
                        >
                          {appStatuses.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* AI Skill-Matched Candidate Recommendations */}
        <Card className="p-5">
          <div className="pb-3 border-b border-charcoal-100 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <h3 className="text-sm font-bold text-charcoal-900">Recommended Candidates</h3>
            </div>
            <span className="text-[10px] text-brand-600 font-semibold bg-brand-50 px-2 py-0.5 rounded">
              High Skill Match
            </span>
          </div>

          <div className="space-y-3">
            {candidateRecommendations.length === 0 ? (
              <p className="text-xs text-charcoal-400 py-8 text-center">All matching candidates have already been submitted.</p>
            ) : (
              candidateRecommendations.map(({ candidate, matchScore, matchedSkills }) => (
                <div key={candidate.id} className="p-3.5 rounded-xl bg-surface-50 border border-charcoal-200 flex items-center justify-between gap-3">
                  <div>
                    <Link
                      to={`/candidates/${candidate.id}`}
                      className="text-xs font-bold text-charcoal-900 hover:text-brand-600"
                    >
                      {candidate.full_name}
                    </Link>
                    <p className="text-[11px] text-charcoal-500">{candidate.education} · {candidate.batch}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {matchedSkills.map((s) => (
                        <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium">
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold text-brand-600 block mb-1.5">{matchScore}%</span>
                    {canManageCompanies && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleQuickSubmit(candidate.id)}
                      >
                        Submit
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {scheduleModalCandidateId && (
        <InterviewModal
          isOpen={Boolean(scheduleModalCandidateId)}
          onClose={() => setScheduleModalCandidateId(null)}
          candidateId={scheduleModalCandidateId}
        />
      )}
    </div>
  );
};
