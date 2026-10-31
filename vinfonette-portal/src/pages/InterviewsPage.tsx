import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { InterviewModal } from '../components/interviews/InterviewModal';
import { FeedbackModal } from '../components/interviews/FeedbackModal';
import { Interview, InterviewStatus } from '../lib/types';
import {
  Calendar,
  CalendarCheck2,
  Clock,
  Video,
  MapPin,
  Phone,
  Plus,
  Search,
  CheckCircle2,
  Edit,
  ExternalLink,
  List,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDateTime, formatDate, getInterviewStatusBadge } from '../lib/utils';

export const InterviewsPage: React.FC = () => {
  const { interviews, candidates, companies, jobs, team } = useData();
  const { isCoordinator, isAdmin, isTrainer } = useAuth();

  const [viewMode, setViewMode] = useState<'agenda' | 'table'>('agenda');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedInterviewForFeedback, setSelectedInterviewForFeedback] = useState<Interview | null>(null);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);

  const statuses: InterviewStatus[] = [
    'scheduled',
    'confirmed',
    'completed',
    'rescheduled',
    'cancelled',
    'no-show',
    'awaiting-feedback',
  ];

  const filteredInterviews = interviews
    .filter((int) => {
      if (selectedStatus !== 'ALL' && int.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cand = candidates.find((c) => c.id === int.candidate_id);
        const comp = companies.find((c) => c.id === int.company_id);
        return (
          (cand && cand.full_name.toLowerCase().includes(q)) ||
          (comp && comp.name.toLowerCase().includes(q)) ||
          int.round_name.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  const canManage = isAdmin || isCoordinator || isTrainer;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Corporate Interview Desk"
        subtitle={`Scheduled and completed candidate interview sessions (${interviews.length} total sessions).`}
        actions={
          canManage && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setScheduleModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Schedule Interview
            </Button>
          )
        }
      />

      {/* Filter and View Toggles */}
      <Card className="p-4 border border-charcoal-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate, company, or round..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-charcoal-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs p-2 rounded-lg border border-charcoal-200 bg-surface-50 font-medium text-charcoal-800"
            >
              <option value="ALL">All Statuses ({interviews.length})</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-charcoal-200">
              <button
                onClick={() => setViewMode('agenda')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                  viewMode === 'agenda' ? 'bg-white text-brand-600 shadow-xs' : 'text-charcoal-500 hover:text-charcoal-800'
                }`}
              >
                <CalendarCheck2 className="w-3.5 h-3.5" /> Agenda View
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                  viewMode === 'table' ? 'bg-white text-brand-600 shadow-xs' : 'text-charcoal-500 hover:text-charcoal-800'
                }`}
              >
                <List className="w-3.5 h-3.5" /> Table View
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Agenda Cards View */}
      {viewMode === 'agenda' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInterviews.length === 0 ? (
            <div className="col-span-full py-12 text-center text-charcoal-400 bg-white rounded-xl border border-charcoal-200">
              No interview sessions match the current criteria.
            </div>
          ) : (
            filteredInterviews.map((int) => {
              const cand = candidates.find((c) => c.id === int.candidate_id);
              const comp = companies.find((c) => c.id === int.company_id);
              const job = jobs.find((j) => j.id === int.job_id);
              const statusBadge = getInterviewStatusBadge(int.status);

              return (
                <Card key={int.id} className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider block">
                          Round {int.round_number} · {int.round_name}
                        </span>
                        <Link
                          to={`/candidates/${int.candidate_id}`}
                          className="text-base font-bold text-charcoal-900 hover:text-brand-600 transition-colors"
                        >
                          {cand?.full_name || 'Candidate'}
                        </Link>
                        <p className="text-xs text-charcoal-500 font-medium">
                          {comp?.name} · {job?.title}
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadge.bg} ${statusBadge.text}`}
                      >
                        {int.status}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-50 border border-charcoal-100 space-y-1.5 text-xs text-charcoal-600 my-3">
                      <div className="flex items-center gap-2 font-medium text-charcoal-800">
                        <Clock className="w-3.5 h-3.5 text-brand-500" />
                        <span>{formatDateTime(int.scheduled_at)}</span>
                        <span className="text-charcoal-400 font-normal">({int.duration_minutes} min)</span>
                      </div>

                      {int.meeting_link && (
                        <div className="flex items-center gap-2 text-brand-600">
                          <Video className="w-3.5 h-3.5" />
                          <a
                            href={int.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline truncate max-w-xs"
                          >
                            {int.meeting_link}
                          </a>
                        </div>
                      )}

                      {int.interviewer_names && (
                        <p className="text-[11px] text-charcoal-500 pt-1">
                          Evaluator: <strong>{int.interviewer_names}</strong>
                        </p>
                      )}
                    </div>

                    {int.feedback && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-charcoal-200 text-xs text-charcoal-700 mb-3">
                        <span className="font-bold text-charcoal-900 block mb-0.5">
                          Outcome: {int.result}
                        </span>
                        <p className="italic">{int.feedback}</p>
                        {int.next_round && (
                          <span className="text-[10px] text-brand-600 font-medium block mt-1">
                            Next Round: {int.next_round}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {canManage && (
                    <div className="pt-3 border-t border-charcoal-100 flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingInterview(int)}
                        leftIcon={<Edit className="w-3 h-3" />}
                      >
                        Edit Details
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedInterviewForFeedback(int)}
                      >
                        {int.feedback ? 'Update Feedback' : 'Record Evaluation'}
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Card className="overflow-hidden border border-charcoal-200 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-charcoal-700">
              <thead className="bg-surface-50 border-b border-charcoal-200 text-charcoal-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Company & Role</th>
                  <th className="py-3 px-4">Round</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {filteredInterviews.map((int) => {
                  const cand = candidates.find((c) => c.id === int.candidate_id);
                  const comp = companies.find((c) => c.id === int.company_id);
                  const job = jobs.find((j) => j.id === int.job_id);
                  const statusBadge = getInterviewStatusBadge(int.status);

                  return (
                    <tr key={int.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-charcoal-900">
                        <Link to={`/candidates/${int.candidate_id}`} className="hover:text-brand-600">
                          {cand?.full_name}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-charcoal-800">{comp?.name}</p>
                        <p className="text-[11px] text-charcoal-400">{job?.title}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-charcoal-800">R{int.round_number}</span> · {int.round_name}
                      </td>
                      <td className="py-3 px-4 text-charcoal-600">
                        {formatDateTime(int.scheduled_at)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge.bg} ${statusBadge.text}`}>
                          {int.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-charcoal-800">
                        {int.result || 'Pending'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedInterviewForFeedback(int)}
                        >
                          Feedback
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modals */}
      <InterviewModal
        isOpen={scheduleModalOpen || Boolean(editingInterview)}
        onClose={() => {
          setScheduleModalOpen(false);
          setEditingInterview(null);
        }}
        initialInterview={editingInterview}
      />

      <FeedbackModal
        isOpen={Boolean(selectedInterviewForFeedback)}
        onClose={() => setSelectedInterviewForFeedback(null)}
        interview={selectedInterviewForFeedback}
      />
    </div>
  );
};
