import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Briefcase,
  Users,
  Award,
  Calendar,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';
import { getRemainingVacancies, isJobCurrentlyAvailable } from '../lib/job-availability';

export const CompanyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { companies, jobs, placements, candidates, interviews, applications } = useData();

  const company = companies.find((c) => c.id === id);

  if (!company) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-bold text-charcoal-900">Company Not Found</h2>
        <Link to="/companies" className="mt-4 inline-block">
          <Button variant="primary" size="sm">Back to Companies</Button>
        </Link>
      </div>
    );
  }

  const companyJobs = jobs.filter((j) => j.company_id === company.id);
  const companyPlacements = placements.filter((p) => p.company_id === company.id);
  const companyInterviews = interviews.filter((i) => i.company_id === company.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={company.name}
        subtitle={`${company.company_id} · ${company.industry} · ${company.office_location}`}
        breadcrumbs={[
          { label: 'Companies', href: '/companies' },
          { label: company.name },
        ]}
      />

      {/* Overview Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 font-bold text-xl shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-charcoal-900">{company.name}</h2>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
                  {company.tier}
                </span>
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {company.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-charcoal-500 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-charcoal-400" />
                  {company.office_location}
                </span>
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-brand-600 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {company.website.replace('https://', '')}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="bg-surface-50 p-3.5 rounded-xl border border-charcoal-100 text-xs text-charcoal-700">
            <p className="text-[10px] text-charcoal-400 uppercase font-semibold">Primary POC</p>
            <p className="font-bold text-charcoal-900">{company.contact_person}</p>
            <p className="text-[11px] text-charcoal-500">{company.contact_email}</p>
          </div>
        </div>

        {company.notes && (
          <div className="mt-4 pt-4 border-t border-charcoal-100 text-xs text-charcoal-600">
            <span className="font-semibold text-charcoal-800 block mb-0.5">Corporate Relationship Notes:</span>
            {company.notes}
          </div>
        )}
      </Card>

      {/* Grid: Openings & Placed Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Jobs */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-charcoal-100 mb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-charcoal-900">Company Job Openings ({companyJobs.length})</h3>
            </div>
            <Link to="/jobs">
              <Button variant="outline" size="sm">Browse all</Button>
            </Link>
          </div>

          <div className="space-y-3">
            {companyJobs.length === 0 ? (
              <p className="text-xs text-charcoal-400 py-6 text-center">No openings have been recorded for this company.</p>
            ) : (
              companyJobs.map((job) => (
                <div key={job.id} className="p-3.5 rounded-xl bg-surface-50 border border-charcoal-200 flex items-center justify-between gap-3">
                  <div>
                    <Link to={`/jobs/${job.id}`} className="text-xs font-bold text-charcoal-900 hover:text-brand-600">
                      {job.title}
                    </Link>
                    <p className="text-[11px] text-charcoal-500 mt-0.5">
                      {job.work_location} · {job.work_mode} · {job.vacancies} listed vacancies
                    </p>
                    <p className={`text-[10px] font-semibold mt-1 ${isJobCurrentlyAvailable(job, company, applications) ? 'text-emerald-700' : 'text-charcoal-500'}`}>
                      {isJobCurrentlyAvailable(job, company, applications)
                        ? `${getRemainingVacancies(job, applications)} vacancies available`
                        : `Not accepting applications (${job.status})`}
                    </p>
                    <p className="text-[11px] font-semibold text-emerald-700 mt-1">
                      {formatCurrency(job.salary_min)} - {formatCurrency(job.salary_max)}
                    </p>
                  </div>
                  <Link to={`/jobs/${job.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Confirmed Placements */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-charcoal-100 mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-charcoal-900">Placed Candidates ({companyPlacements.length})</h3>
            </div>
          </div>

          <div className="space-y-3">
            {companyPlacements.length === 0 ? (
              <p className="text-xs text-charcoal-400 py-6 text-center">No candidates placed at this company yet</p>
            ) : (
              companyPlacements.map((plc) => {
                const cand = candidates.find((c) => c.id === plc.candidate_id);
                return (
                  <div key={plc.id} className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 flex items-center justify-between gap-3">
                    <div>
                      <Link to={`/candidates/${plc.candidate_id}`} className="text-xs font-bold text-emerald-950 hover:underline">
                        {cand?.full_name || 'Candidate'}
                      </Link>
                      <p className="text-[11px] text-emerald-800">{plc.designation}</p>
                      <p className="text-[10px] text-charcoal-400 mt-1">Joined: {formatDate(plc.joining_date)}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-emerald-800">{formatCurrency(plc.ctc)}</span>
                      <span className="block text-[10px] text-emerald-600 uppercase font-semibold">Verified</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
