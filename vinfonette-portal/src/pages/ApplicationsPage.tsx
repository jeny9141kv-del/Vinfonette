import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ApplicationStatus } from '../lib/types';
import { Search, Filter, Briefcase, User, Calendar, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../lib/utils';

export const ApplicationsPage: React.FC = () => {
  const { applications, candidates, jobs, companies, updateApplicationStatus } = useData();
  const { canManageCompanies } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const statuses: ApplicationStatus[] = [
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

  const filteredApps = applications.filter((app) => {
    if (selectedStatus !== 'ALL' && app.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const cand = candidates.find((c) => c.id === app.candidate_id);
      const job = jobs.find((j) => j.id === app.job_id);
      const comp = job ? companies.find((c) => c.id === job.company_id) : null;
      return (
        (cand && cand.full_name.toLowerCase().includes(q)) ||
        (job && job.title.toLowerCase().includes(q)) ||
        (comp && comp.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Applications Registry"
        subtitle={`Tracking ${applications.length} corporate submissions across all candidate profiles.`}
      />

      {/* Filter Bar */}
      <Card className="p-4 border border-charcoal-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate, job title, or company..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-charcoal-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-charcoal-600 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs p-2 rounded-lg border border-charcoal-200 bg-surface-50 font-medium text-charcoal-800"
            >
              <option value="ALL">All Statuses ({applications.length})</option>
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Applications Table */}
      <Card className="overflow-hidden border border-charcoal-200 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-charcoal-700">
            <thead className="bg-surface-50 border-b border-charcoal-200 text-charcoal-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Job Opening & Company</th>
                <th className="py-3 px-4">Match Score</th>
                <th className="py-3 px-4">Submitted Date</th>
                <th className="py-3 px-4">Application Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-100">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-charcoal-400">
                    No applications matched the filter.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const cand = candidates.find((c) => c.id === app.candidate_id);
                  const job = jobs.find((j) => j.id === app.job_id);
                  const comp = job ? companies.find((c) => c.id === job.company_id) : null;

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-charcoal-900">
                        <Link to={`/candidates/${app.candidate_id}`} className="hover:text-brand-600">
                          {cand?.full_name || 'Candidate'}
                        </Link>
                        <span className="block text-[10px] text-charcoal-400 font-mono mt-0.5">
                          {cand?.candidate_id} · {cand?.batch}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <Link to={`/jobs/${app.job_id}`} className="font-semibold text-charcoal-800 hover:text-brand-600">
                          {job?.title || 'Job Opening'}
                        </Link>
                        <span className="block text-[11px] text-charcoal-500">{comp?.name}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded font-extrabold text-[11px] bg-brand-50 text-brand-700 border border-brand-200">
                          {app.match_score}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-charcoal-500">
                        {formatDate(app.applied_at)}
                      </td>

                      <td className="py-3.5 px-4">
                        {canManageCompanies ? (
                          <select
                            value={app.status}
                            onChange={(e) => updateApplicationStatus(app.id, e.target.value as ApplicationStatus)}
                            className="text-xs p-1.5 rounded-lg border border-charcoal-300 bg-white font-medium"
                          >
                            {statuses.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-charcoal-800">
                            {app.status}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link to={`/candidates/${app.candidate_id}`}>
                          <Button variant="ghost" size="sm">
                            View Profile
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
