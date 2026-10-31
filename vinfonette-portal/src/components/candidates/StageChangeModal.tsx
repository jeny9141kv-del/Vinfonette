import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Candidate, CandidateStage } from '../../lib/types';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getStageColor } from '../../lib/utils';

export interface StageChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
}

const ALL_STAGES: CandidateStage[] = [
  'Registered',
  'Training in Progress',
  'Training Completed',
  'Resume Ready',
  'Placement Ready',
  'Applications Submitted',
  'Interview Scheduled',
  'Interview Completed',
  'Offer Received',
  'Placed Successfully',
  'On Hold',
  'Not Interested',
  'Rejected',
  'Withdrawn',
];

export const StageChangeModal: React.FC<StageChangeModalProps> = ({ isOpen, onClose, candidate }) => {
  const { updateCandidateStage, placements, companies, jobs, confirmPlacement } = useData();
  const { error } = useToast();

  const [selectedStage, setSelectedStage] = useState<CandidateStage>(
    candidate?.current_stage || 'Registered'
  );
  const [transitionNote, setTransitionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Placement Form fields if user selects 'Placed Successfully' and candidate doesn't have placement record
  const candidatePlacement = candidate ? placements.find((p) => p.candidate_id === candidate.id && p.status === 'CONFIRMED') : null;
  const [placementCompanyId, setPlacementCompanyId] = useState(companies[0]?.id || '');
  const [placementJobId, setPlacementJobId] = useState(jobs[0]?.id || '');
  const [placementCtc, setPlacementCtc] = useState(1000000);
  const [placementJoiningDate, setPlacementJoiningDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [placementDetails, setPlacementDetails] = useState('Signed offer letter and background verification cleared.');

  if (!candidate) return null;

  const currentStage = candidate.current_stage;
  const isTargetPlaced = selectedStage === 'Placed Successfully';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStage === currentStage) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      // If moving to Placed Successfully and candidate doesn't yet have a placement record, create one
      if (isTargetPlaced && !candidatePlacement) {
        if (!placementCompanyId || !placementJobId || !placementCtc || !placementJoiningDate || !placementDetails) {
          error('Incomplete Details', 'Employer, job, CTC, joining date, and confirmation notes are required to mark placed.');
          setIsSubmitting(false);
          return;
        }

        const selectedJob = jobs.find((j) => j.id === placementJobId);
        await confirmPlacement({
          candidate_id: candidate.id,
          company_id: placementCompanyId,
          job_id: placementJobId,
          designation: selectedJob?.title || 'Software Engineer',
          ctc: Number(placementCtc),
          currency: 'INR',
          joining_date: placementJoiningDate,
          confirmation_details: placementDetails,
          coordinator_id: candidate.coordinator_id,
          status: 'CONFIRMED',
        });
      } else {
        await updateCandidateStage(candidate.id, selectedStage, transitionNote);
      }

      onClose();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentColor = getStageColor(currentStage);
  const targetColor = getStageColor(selectedStage);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Placement Stage"
      description={`Move ${candidate.full_name} (${candidate.candidate_id}) to another pipeline stage.`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Stage Comparison Badge */}
        <div className="p-4 rounded-xl bg-surface-50 border border-charcoal-200 flex items-center justify-between gap-3">
          <div className="flex-1 text-center">
            <span className="text-[10px] text-charcoal-400 font-bold uppercase tracking-wider block mb-1">Current</span>
            <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${currentColor.bg} ${currentColor.text}`}>
              {currentStage}
            </span>
          </div>

          <ArrowRight className="w-5 h-5 text-charcoal-400 shrink-0" />

          <div className="flex-1 text-center">
            <span className="text-[10px] text-brand-600 font-bold uppercase tracking-wider block mb-1">New Stage</span>
            <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${targetColor.bg} ${targetColor.text}`}>
              {selectedStage}
            </span>
          </div>
        </div>

        {/* Stage Radio Grid */}
        <div>
          <label className="block text-xs font-bold text-charcoal-700 mb-2">Select Target Pipeline Stage</label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-charcoal-200 rounded-xl bg-slate-50/50">
            {ALL_STAGES.map((stg) => {
              const isSelected = selectedStage === stg;
              return (
                <button
                  key={stg}
                  type="button"
                  onClick={() => setSelectedStage(stg)}
                  className={`text-left px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                      : 'bg-white text-charcoal-700 border-charcoal-200 hover:border-brand-300 hover:bg-slate-50'
                  }`}
                >
                  {stg}
                </button>
              );
            })}
          </div>
        </div>

        {/* If marking placed without prior placement record, enforce mandatory placement form */}
        {isTargetPlaced && !candidatePlacement && (
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-300 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-emerald-900 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Placement Confirmation Details (Required by Policy)</span>
            </div>
            <p className="text-[11px] text-emerald-700">
              Under Phase 7 requirements, a candidate cannot be marked placed without employer, job, CTC, joining date, and confirmation credentials.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-charcoal-700 mb-1">Hiring Employer *</label>
                <select
                  value={placementCompanyId}
                  onChange={(e) => setPlacementCompanyId(e.target.value)}
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
                <label className="block text-[11px] font-bold text-charcoal-700 mb-1">Job Opening *</label>
                <select
                  value={placementJobId}
                  onChange={(e) => setPlacementJobId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
                  required
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.job_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-charcoal-700 mb-1">CTC (Annual INR) *</label>
                <input
                  type="number"
                  value={placementCtc}
                  onChange={(e) => setPlacementCtc(Number(e.target.value))}
                  placeholder="e.g. 1200000"
                  className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-charcoal-700 mb-1">Joining Date *</label>
                <input
                  type="date"
                  value={placementJoiningDate}
                  onChange={(e) => setPlacementJoiningDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-charcoal-700 mb-1">Confirmation Details & Verification Note *</label>
              <textarea
                value={placementDetails}
                onChange={(e) => setPlacementDetails(e.target.value)}
                rows={2}
                placeholder="Mention signed offer letter date, college NOC, BGV status..."
                className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
                required
              />
            </div>
          </div>
        )}

        {/* Transition Note */}
        <div>
          <label className="block text-xs font-bold text-charcoal-700 mb-1">Activity / Audit Note</label>
          <textarea
            value={transitionNote}
            onChange={(e) => setTransitionNote(e.target.value)}
            rows={2}
            placeholder="Add a context note for this transition (recorded in audit & activity log)..."
            className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white placeholder-charcoal-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-charcoal-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            Confirm Stage Change
          </Button>
        </div>
      </form>
    </Modal>
  );
};
