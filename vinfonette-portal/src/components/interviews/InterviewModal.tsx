import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Interview, InterviewMode, InterviewStatus } from '../../lib/types';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { Calendar, Video, Clock, AlertTriangle } from 'lucide-react';

export interface InterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInterview?: Interview | null;
  candidateId?: string;
}

export const InterviewModal: React.FC<InterviewModalProps> = ({
  isOpen,
  onClose,
  initialInterview,
  candidateId,
}) => {
  const { candidates, companies, jobs, applications, scheduleInterview, updateInterview, interviews } = useData();
  const { warning } = useToast();

  const [selectedCandidateId, setSelectedCandidateId] = useState(
    initialInterview?.candidate_id || candidateId || candidates[0]?.id || ''
  );
  const [selectedCompanyId, setSelectedCompanyId] = useState(
    initialInterview?.company_id || companies[0]?.id || ''
  );
  const [selectedJobId, setSelectedJobId] = useState(
    initialInterview?.job_id || jobs[0]?.id || ''
  );
  const [roundNumber, setRoundNumber] = useState(initialInterview?.round_number || 1);
  const [roundName, setRoundName] = useState(initialInterview?.round_name || 'Technical Round 1');
  const [scheduledAt, setScheduledAt] = useState(
    initialInterview?.scheduled_at
      ? new Date(initialInterview.scheduled_at).toISOString().slice(0, 16)
      : new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );
  const [durationMinutes, setDurationMinutes] = useState(initialInterview?.duration_minutes || 45);
  const [mode, setMode] = useState<InterviewMode>(initialInterview?.mode || 'VIRTUAL');
  const [meetingLink, setMeetingLink] = useState(initialInterview?.meeting_link || 'https://meet.google.com/vn-interview');
  const [interviewerNames, setInterviewerNames] = useState(initialInterview?.interviewer_names || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter jobs for selected company
  const companyJobs = jobs.filter((j) => j.company_id === selectedCompanyId);

  // Check schedule conflict
  const hasConflict = React.useMemo(() => {
    if (!scheduledAt) return false;
    const targetTime = new Date(scheduledAt).getTime();
    return interviews.some((i) => {
      if (initialInterview && i.id === initialInterview.id) return false;
      if (i.candidate_id === selectedCandidateId && ['scheduled', 'confirmed'].includes(i.status)) {
        const iTime = new Date(i.scheduled_at).getTime();
        return Math.abs(targetTime - iTime) < 3600000; // Within 1 hour
      }
      return false;
    });
  }, [scheduledAt, selectedCandidateId, interviews, initialInterview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (initialInterview) {
        await updateInterview(initialInterview.id, {
          company_id: selectedCompanyId,
          job_id: selectedJobId,
          round_number: Number(roundNumber),
          round_name: roundName,
          scheduled_at: new Date(scheduledAt).toISOString(),
          duration_minutes: Number(durationMinutes),
          mode,
          meeting_link: meetingLink,
          interviewer_names: interviewerNames,
        });
      } else {
        const matchedApp = applications.find(
          (a) => a.candidate_id === selectedCandidateId && a.job_id === selectedJobId
        );

        await scheduleInterview({
          candidate_id: selectedCandidateId,
          company_id: selectedCompanyId,
          job_id: selectedJobId,
          application_id: matchedApp?.id,
          round_number: Number(roundNumber),
          round_name: roundName,
          scheduled_at: new Date(scheduledAt).toISOString(),
          duration_minutes: Number(durationMinutes),
          timezone: 'Asia/Kolkata',
          mode,
          meeting_link: meetingLink,
          interviewer_names: interviewerNames,
          status: 'scheduled',
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialInterview ? 'Edit Interview Schedule' : 'Schedule Interview Round'}
      description="Book an interview slot and record meeting logistics for candidates."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {hasConflict && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-2 text-xs text-amber-800 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Schedule Conflict Warning:</strong> This candidate already has another interview within 60 minutes of the selected time slot.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Candidate *</label>
            <select
              value={selectedCandidateId}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              disabled={Boolean(candidateId || initialInterview)}
              className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.candidate_id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Company / Hiring Partner *</label>
            <select
              value={selectedCompanyId}
              onChange={(e) => {
                setSelectedCompanyId(e.target.value);
                const firstJob = jobs.find((j) => j.company_id === e.target.value);
                if (firstJob) setSelectedJobId(firstJob.id);
              }}
              className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.office_location})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Job Opening *</label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
            >
              {companyJobs.length === 0 ? (
                <option value="">No active openings for this company</option>
              ) : (
                companyJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.job_id})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Round #</label>
              <input
                type="number"
                min={1}
                max={10}
                value={roundNumber}
                onChange={(e) => setRoundNumber(Number(e.target.value))}
                className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Round Name *</label>
              <input
                type="text"
                value={roundName}
                onChange={(e) => setRoundName(e.target.value)}
                placeholder="e.g. Technical Round 1"
                className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Date & Time *</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Duration (Min)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as InterviewMode)}
                className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
              >
                <option value="VIRTUAL">Virtual (Google Meet / Teams)</option>
                <option value="IN_PERSON">In-Person Office</option>
                <option value="TELEPHONIC">Telephonic</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-700 mb-1">Meeting Link / Room Details</label>
          <input
            type="text"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
            placeholder="e.g. https://meet.google.com/xyz-abc or Conference Room 3B"
            className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-700 mb-1">Interviewer Name(s) / Panelists</label>
          <input
            type="text"
            value={interviewerNames}
            onChange={(e) => setInterviewerNames(e.target.value)}
            placeholder="e.g. Rohan Mehta, Lead Tech Evaluator"
            className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-charcoal-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            {initialInterview ? 'Save Changes' : 'Confirm & Schedule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
