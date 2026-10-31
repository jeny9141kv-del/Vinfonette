import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { JobOpening, WorkMode } from '../lib/types';
import { Briefcase, Search, Plus, MapPin, DollarSign, Calendar, Users, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../lib/utils';

export const JobsPage: React.FC = () => {
  const { jobs, companies, addJob, applications } = useData();
  const { canManageCompanies } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [addModalOpen, setAddModalOpen] = useState(false);

  // New Job Form State
  const [companyId, setCompanyId] = useState(companies[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillsStr, setSkillsStr] = useState('React, TypeScript, Node.js');
  const [workLocation, setWorkLocation] = useState('Bengaluru');
  const [workMode, setWorkMode] = useState<WorkMode>('HYBRID');
  const [salaryMin, setSalaryMin] = useState(800000);
  const [salaryMax, setSalaryMax] = useState(1200000);
  const [vacancies, setVacancies] = useState(2);
  const [deadline, setDeadline] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredJobs = jobs.filter((j) => {
    if (selectedMode !== 'ALL' && j.work_mode !== selectedMode) return false;
    if (selectedStatus !== 'ALL' && j.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const comp = companies.find((c) => c.id === j.company_id);
      return (
        j.title.toLowerCase().includes(q) ||
        j.job_id.toLowerCase().includes(q) ||
        (comp && comp.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !companyId) return;

    setIsSubmitting(true);
    try {
      await addJob({
        company_id: companyId,
        title,
        description,
        required_skills: skillsStr.split(',').map((s) => s.trim()).filter(Boolean),
        experience_min_years: 0,
        eligible_batches: ['2026-A', '2025-B'],
        work_location: workLocation,
        work_mode: workMode,
        salary_min: Number(salaryMin),
        salary_max: Number(salaryMax),
        currency: 'INR',
        vacancies: Number(vacancies),
        application_deadline: deadline,
        recruiter_name: recruiterName,
        recruiter_email: recruiterEmail,
        status: 'OPEN',
      });

      setTitle('');
      setDescription('');
      setAddModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Corporate Job Openings"
        subtitle={`Total active positions: ${jobs.length} · Matching students with suitable opportunities.`}
        actions={
          canManageCompanies && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setAddModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Post Job Opening
            </Button>
          )
        }
      />

      {/* Filter Bar */}
      <Card className="p-4 border border-charcoal-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, role ID, or company..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-charcoal-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-charcoal-200 bg-surface-50 text-charcoal-800"
            >
              <option value="ALL">All Work Modes</option>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ON_SITE">On-Site Office</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-charcoal-200 bg-surface-50 text-charcoal-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open (Accepting Applications)</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="CLOSED">Closed / Filled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredJobs.map((job) => {
          const comp = companies.find((c) => c.id === job.company_id);
          const jobApps = applications.filter((a) => a.job_id === job.id);

          return (
            <Card key={job.id} hoverable className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono text-charcoal-400 uppercase tracking-wider block">
                      {job.job_id} · {comp?.name}
                    </span>
                    <Link
                      to={`/jobs/${job.id}`}
                      className="text-base font-bold text-charcoal-900 hover:text-brand-600 transition-colors"
                    >
                      {job.title}
                    </Link>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      job.status === 'OPEN'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-charcoal-500 mb-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-charcoal-400" />
                    {job.work_location} ({job.work_mode})
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-700">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    {formatCurrency(job.salary_min)} - {formatCurrency(job.salary_max)}
                  </span>
                </div>

                <p className="text-xs text-charcoal-600 line-clamp-2 mb-3 leading-relaxed">
                  {job.description}
                </p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {job.required_skills.map((s) => (
                    <span
                      key={s}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-charcoal-700 font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-charcoal-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-charcoal-500 text-[11px]">
                  <span>{job.vacancies} Vacancies</span>
                  <span>•</span>
                  <span>{jobApps.length} Applicants</span>
                </div>

                <Link to={`/jobs/${job.id}`}>
                  <Button variant="outline" size="sm">
                    View & Match Applicants →
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Post Job Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Post Corporate Job Opening"
        description="Create an open vacancy linked to a partner company."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateJob} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Company *</label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
                required
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.office_location})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Job Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                required
                className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Work Location *</label>
              <input
                type="text"
                value={workLocation}
                onChange={(e) => setWorkLocation(e.target.value)}
                placeholder="e.g. Bengaluru"
                required
                className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Work Mode</label>
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
              >
                <option value="HYBRID">Hybrid</option>
                <option value="ON_SITE">On-Site Office</option>
                <option value="REMOTE">Remote</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Salary Min (INR)</label>
              <input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(Number(e.target.value))}
                className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Salary Max (INR)</label>
              <input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(Number(e.target.value))}
                className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Number of Vacancies</label>
              <input
                type="number"
                min={1}
                value={vacancies}
                onChange={(e) => setVacancies(Number(e.target.value))}
                className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Application Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Required Skills (comma-separated)</label>
            <input
              type="text"
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              placeholder="React, TypeScript, Node.js, PostgreSQL"
              className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Job Description & Responsibilities</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detailed description of responsibilities, technical stack, and eligibility..."
              className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-charcoal-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
              Publish Opening
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
