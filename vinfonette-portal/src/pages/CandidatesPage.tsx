import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StageChangeModal } from '../components/candidates/StageChangeModal';
import { ResumeViewerModal } from '../components/candidates/ResumeViewerModal';
import { Candidate, CandidateStage } from '../lib/types';
import {
  Users,
  Search,
  Filter,
  Eye,
  FileText,
  ArrowUpDown,
  MoreVertical,
  CheckCircle2,
  Calendar,
  Sparkles,
  CreditCard,
  Plus,
  Briefcase,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { getStageColor, getReadinessBadge, getPaymentStatusBadge, formatDate } from '../lib/utils';

export const CandidatesPage: React.FC = () => {
  const { candidates, team } = useData();
  const { canEditCandidate } = useAuth();
  const [searchParams] = useSearchParams();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>(searchParams.get('stage') || 'ALL');
  const [selectedBatch, setSelectedBatch] = useState<string>('ALL');
  const [selectedReadiness, setSelectedReadiness] = useState<string>('ALL');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'full_name' | 'registration_date' | 'readiness_score'>('registration_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [stageModalCandidate, setStageModalCandidate] = useState<Candidate | null>(null);
  const [resumeModalCandidate, setResumeModalCandidate] = useState<Candidate | null>(null);

  // Batches
  const batches = useMemo(() => Array.from(new Set(candidates.map((c) => c.batch))).sort(), [candidates]);

  // Filter & Sort
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter((c) => {
        if (selectedStage !== 'ALL' && c.current_stage !== selectedStage) return false;
        if (selectedBatch !== 'ALL' && c.batch !== selectedBatch) return false;
        if (selectedReadiness !== 'ALL' && c.readiness_assessment !== selectedReadiness) return false;
        if (selectedPaymentStatus !== 'ALL' && c.payment_status !== selectedPaymentStatus) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = c.full_name.toLowerCase().includes(q);
          const matchId = c.candidate_id.toLowerCase().includes(q);
          const matchEmail = c.email.toLowerCase().includes(q);
          const matchSkill = c.technical_skills.some((s) => s.toLowerCase().includes(q));
          if (!matchName && !matchId && !matchEmail && !matchSkill) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'full_name') {
          return sortOrder === 'asc' ? a.full_name.localeCompare(b.full_name) : b.full_name.localeCompare(a.full_name);
        }
        if (sortField === 'readiness_score') {
          return sortOrder === 'asc' ? a.readiness_score - b.readiness_score : b.readiness_score - a.readiness_score;
        }
        return sortOrder === 'asc'
          ? new Date(a.registration_date).getTime() - new Date(b.registration_date).getTime()
          : new Date(b.registration_date).getTime() - new Date(a.registration_date).getTime();
      });
  }, [candidates, selectedStage, selectedBatch, selectedReadiness, selectedPaymentStatus, searchQuery, sortField, sortOrder]);

  // Paginated records
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage) || 1;
  const paginatedCandidates = filteredCandidates.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Directory"
        subtitle={`Total registered candidates: ${candidates.length} · Currently matching active openings.`}
        actions={
          <Link to="/candidates/new">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Register Candidate
            </Button>
          </Link>
        }
      />

      {/* Filter Toolbar */}
      <Card className="p-4 border border-charcoal-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, ID, email, or skill..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-charcoal-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => {
                setSelectedPaymentStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs p-2 rounded-lg border border-charcoal-200 bg-surface-50 text-charcoal-800 font-medium"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partially Paid</option>
              <option value="PENDING">Pending</option>
              <option value="WAIVED">Waived</option>
            </select>
          </div>

          {/* Stage Filter */}
          <div>
            <select
              value={selectedStage}
              onChange={(e) => {
                setSelectedStage(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs p-2 rounded-lg border border-charcoal-200 bg-surface-50 text-charcoal-800"
            >
              <option value="ALL">All Pipeline Stages</option>
              <option value="Registered">Registered</option>
              <option value="Training in Progress">Training in Progress</option>
              <option value="Training Completed">Training Completed</option>
              <option value="Resume Ready">Resume Ready</option>
              <option value="Placement Ready">Placement Ready</option>
              <option value="Applications Submitted">Applications Submitted</option>
              <option value="Interview Scheduled">Interview Scheduled</option>
              <option value="Interview Completed">Interview Completed</option>
              <option value="Offer Received">Offer Received</option>
              <option value="Placed Successfully">Placed Successfully ★</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          {/* Batch Filter */}
          <div>
            <select
              value={selectedBatch}
              onChange={(e) => {
                setSelectedBatch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs p-2 rounded-lg border border-charcoal-200 bg-surface-50 text-charcoal-800"
            >
              <option value="ALL">All Batches</option>
              {batches.map((b) => (
                <option key={b} value={b}>
                  Batch {b}
                </option>
              ))}
            </select>
          </div>

          {/* Readiness Filter */}
          <div>
            <select
              value={selectedReadiness}
              onChange={(e) => {
                setSelectedReadiness(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs p-2 rounded-lg border border-charcoal-200 bg-surface-50 text-charcoal-800"
            >
              <option value="ALL">All Readiness Levels</option>
              <option value="HIGH_POTENTIAL">High Potential ★</option>
              <option value="READY">Placement Ready</option>
              <option value="NEEDS_WORK">Needs Work</option>
              <option value="NOT_EVALUATED">Not Evaluated</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Candidate Table */}
      <Card className="overflow-hidden border border-charcoal-200 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-charcoal-700">
            <thead className="bg-surface-50 border-b border-charcoal-200 text-charcoal-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Candidate & ID</th>
                <th className="py-3 px-4">Academic & Batch</th>
                <th className="py-3 px-4">Key Skills</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4">Pipeline Stage</th>
                <th className="py-3 px-4">Readiness</th>
                <th className="py-3 px-4">Staff Owner</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-100">
              {paginatedCandidates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-charcoal-400">
                    No candidates matched the current search and filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedCandidates.map((cand) => {
                  const stageStyle = getStageColor(cand.current_stage);
                  const readinessBadge = getReadinessBadge(cand.readiness_assessment);
                  const paymentBadge = getPaymentStatusBadge(cand.payment_status);
                  const coordinator = team.find((t) => t.id === cand.coordinator_id);
                  const canEdit = canEditCandidate(cand);

                  return (
                    <tr key={cand.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & ID */}
                      <td className="py-3.5 px-4">
                        <div>
                          <Link
                            to={`/candidates/${cand.id}`}
                            className="font-bold text-charcoal-900 hover:text-brand-600 transition-colors text-xs"
                          >
                            {cand.full_name}
                          </Link>
                          <div className="flex items-center gap-1.5 text-[10px] text-charcoal-400 font-mono mt-0.5">
                            <span>{cand.candidate_id}</span>
                            <span>•</span>
                            <span>{cand.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Education & Batch */}
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-charcoal-800">{cand.education} · {cand.specialization}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-charcoal-400 mt-0.5">
                          <span>Batch {cand.batch} ({cand.graduation_year})</span>
                          <span>•</span>
                          <span className={cand.has_experience ? 'text-amber-700 font-semibold' : 'text-charcoal-500'}>
                            {cand.has_experience ? `${cand.total_experience_years || 0} yrs exp` : 'Fresher'}
                          </span>
                        </div>
                      </td>

                      {/* Skills */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {cand.technical_skills.slice(0, 2).map((s) => (
                            <span
                              key={s}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-charcoal-700 font-medium"
                            >
                              {s}
                            </span>
                          ))}
                          {cand.technical_skills.length > 2 && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-slate-100 text-charcoal-500">
                              +{cand.technical_skills.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${paymentBadge.color}`}
                          >
                            {paymentBadge.label}
                          </span>
                          <p className="text-[10px] text-charcoal-400 mt-0.5">
                            ₹{Number(cand.amount_paid || 0).toLocaleString('en-IN')} / ₹{Number(cand.payment_amount || 25000).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </td>

                      {/* Stage */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${stageStyle.bg} ${stageStyle.text} ${stageStyle.border}`}
                        >
                          {cand.current_stage}
                        </span>
                      </td>

                      {/* Readiness */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${readinessBadge.color}`}
                        >
                          {cand.readiness_score > 0 ? `${cand.readiness_score}% (${readinessBadge.label})` : readinessBadge.label}
                        </span>
                      </td>

                      {/* Coordinator */}
                      <td className="py-3.5 px-4 text-charcoal-600">
                        {coordinator?.full_name || 'Unassigned'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/candidates/${cand.id}`}
                            className="p-1.5 rounded-lg text-charcoal-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                            title="View full candidate profile"
                            aria-label={`View ${cand.full_name}'s full candidate profile`}
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => setResumeModalCandidate(cand)}
                            className="p-1.5 rounded-lg text-charcoal-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                            title="Candidate resume vault"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {canEdit && (
                            <button
                              onClick={() => setStageModalCandidate(cand)}
                              className="p-1.5 rounded-lg text-charcoal-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                              title="Change stage"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 bg-surface-50 border-t border-charcoal-100 flex items-center justify-between text-xs text-charcoal-500">
          <span>
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredCandidates.length)} of {filteredCandidates.length} candidates
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </Button>
            <span className="px-2 font-semibold text-charcoal-800">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Modals */}
      {stageModalCandidate && (
        <StageChangeModal
          isOpen={Boolean(stageModalCandidate)}
          onClose={() => setStageModalCandidate(null)}
          candidate={stageModalCandidate}
        />
      )}

      {resumeModalCandidate && (
        <ResumeViewerModal
          isOpen={Boolean(resumeModalCandidate)}
          onClose={() => setResumeModalCandidate(null)}
          candidate={resumeModalCandidate}
        />
      )}
    </div>
  );
};
