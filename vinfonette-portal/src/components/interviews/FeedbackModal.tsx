import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Interview, InterviewResult } from '../../lib/types';
import { useData } from '../../contexts/DataContext';

export interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: Interview | null;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, interview }) => {
  const { recordInterviewFeedback, candidates, companies } = useData();

  const [feedback, setFeedback] = useState(interview?.feedback || '');
  const [result, setResult] = useState<InterviewResult>(interview?.result || 'PASSED');
  const [nextRound, setNextRound] = useState(interview?.next_round || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!interview) return null;

  const candidate = candidates.find((c) => c.id === interview.candidate_id);
  const company = companies.find((c) => c.id === interview.company_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await recordInterviewFeedback(interview.id, feedback, result, nextRound);
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
      title="Record Interview Evaluation"
      description={`Record official interviewer feedback for ${candidate?.full_name || 'Candidate'} at ${company?.name || 'Company'}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-charcoal-700 mb-1">Interview Outcome *</label>
          <select
            value={result}
            onChange={(e) => setResult(e.target.value as InterviewResult)}
            className="w-full text-xs p-2.5 rounded-lg border border-charcoal-300 bg-white font-medium"
          >
            <option value="STRONG_HIRE">Strong Hire (Exceptional Performance)</option>
            <option value="PASSED">Passed / Cleared to Next Round</option>
            <option value="ON_HOLD">On Hold / Borderline</option>
            <option value="FAILED">Failed / Rejected</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-700 mb-1">Evaluator Feedback & Notes *</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            required
            placeholder="Key strengths, code quality assessment, algorithmic problem solving, domain proficiency, communication skills..."
            className="w-full text-xs p-3 rounded-xl border border-charcoal-300 bg-white placeholder-charcoal-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {['PASSED', 'STRONG_HIRE'].includes(result) && (
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Next Step / Next Round</label>
            <input
              type="text"
              value={nextRound}
              onChange={(e) => setNextRound(e.target.value)}
              placeholder="e.g. System Design Round 2 or Director HR Round"
              className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-charcoal-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            Save Evaluation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
