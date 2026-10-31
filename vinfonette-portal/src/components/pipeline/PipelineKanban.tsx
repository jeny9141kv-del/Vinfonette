import React, { useState } from 'react';
import { Candidate, CandidateStage } from '../../lib/types';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { StageChangeModal } from '../candidates/StageChangeModal';
import {
  MoreHorizontal,
  GraduationCap,
  Sparkles,
  ChevronRight,
  User,
  Filter,
  CheckCircle2,
  Clock,
  Briefcase,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStageColor, getReadinessBadge } from '../../lib/utils';

const KANBAN_STAGES: { stage: CandidateStage; label: string; description: string }[] = [
  { stage: 'Registered', label: '1. Registered', description: 'Onboarded into portal' },
  { stage: 'Training in Progress', label: '2. In Training', description: 'Active curriculum' },
  { stage: 'Training Completed', label: '3. Training Done', description: 'Passed coursework' },
  { stage: 'Resume Ready', label: '4. Resume Ready', description: 'Profile formatted' },
  { stage: 'Placement Ready', label: '5. Placement Ready', description: 'Cleared mock reviews' },
  { stage: 'Applications Submitted', label: '6. Applied', description: 'Submitted to jobs' },
  { stage: 'Interview Scheduled', label: '7. Interview Scheduled', description: 'Awaiting round' },
  { stage: 'Interview Completed', label: '8. Interview Done', description: 'Awaiting feedback' },
  { stage: 'Offer Received', label: '9. Offer Received', description: 'Extended offer' },
  { stage: 'Placed Successfully', label: '10. Placed ★', description: 'Confirmed hired' },
];

export const PipelineKanban: React.FC = () => {
  const { candidates, updateCandidateStage, team } = useData();
  const { canEditCandidate } = useAuth();

  const [selectedCandidateForStage, setSelectedCandidateForStage] = useState<Candidate | null>(null);
  const [filterBatch, setFilterBatch] = useState<string>('ALL');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [draggedCandidateId, setDraggedCandidateId] = useState<string | null>(null);

  // Available batches
  const batches = Array.from(new Set(candidates.map((c) => c.batch))).sort();

  // Filter candidates
  const filteredCandidates = candidates.filter((c) => {
    if (filterBatch !== 'ALL' && c.batch !== filterBatch) return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      const matchName = c.full_name.toLowerCase().includes(q);
      const matchId = c.candidate_id.toLowerCase().includes(q);
      const matchSkill = c.technical_skills.some((s) => s.toLowerCase().includes(q));
      if (!matchName && !matchId && !matchSkill) return false;
    }
    return true;
  });

  const handleDragStart = (candidateId: string) => {
    setDraggedCandidateId(candidateId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetStage: CandidateStage) => {
    if (!draggedCandidateId) return;
    const candidate = candidates.find((c) => c.id === draggedCandidateId);
    if (!candidate || candidate.current_stage === targetStage) {
      setDraggedCandidateId(null);
      return;
    }

    // If moving to Placed Successfully, trigger the modal so mandatory employer/joining details can be validated
    if (targetStage === 'Placed Successfully') {
      setSelectedCandidateForStage(candidate);
      setDraggedCandidateId(null);
      return;
    }

    try {
      await updateCandidateStage(candidate.id, targetStage, 'Moved via pipeline Kanban drag');
    } catch (err) {
      console.error(err);
    }
    setDraggedCandidateId(null);
  };

  return (
    <div className="space-y-4">
      {/* Search and Batch Filter Controls */}
      <div className="bg-white p-3.5 rounded-xl border border-charcoal-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <input
            type="text"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder="Search candidate name, ID, or skill..."
            className="w-full text-xs p-2 rounded-lg border border-charcoal-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-charcoal-400" />
          <span className="text-xs text-charcoal-600 font-medium">Batch:</span>
          <select
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            className="text-xs p-1.5 rounded-lg border border-charcoal-200 bg-surface-50 font-medium text-charcoal-800"
          >
            <option value="ALL">All Batches ({candidates.length})</option>
            {batches.map((b) => (
              <option key={b} value={b}>
                Batch {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex gap-3.5 overflow-x-auto pb-6 pt-1 snap-x min-h-[640px]">
        {KANBAN_STAGES.map((col) => {
          const colCandidates = filteredCandidates.filter((c) => c.current_stage === col.stage);
          const stageStyle = getStageColor(col.stage);

          return (
            <div
              key={col.stage}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(col.stage)}
              className="flex-shrink-0 w-72 rounded-2xl bg-surface-50 border border-charcoal-200 flex flex-col max-h-[820px] shadow-xs snap-start transition-colors"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-charcoal-200 bg-white rounded-t-2xl">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-bold text-charcoal-900 truncate">{col.label}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${stageStyle.bg} ${stageStyle.text}`}
                  >
                    {colCandidates.length}
                  </span>
                </div>
                <p className="text-[10px] text-charcoal-400 truncate">{col.description}</p>
              </div>

              {/* Cards List */}
              <div className="flex-1 p-2 space-y-2.5 overflow-y-auto">
                {colCandidates.length === 0 ? (
                  <div className="h-28 flex items-center justify-center border border-dashed border-charcoal-200 rounded-xl text-center p-3 text-[11px] text-charcoal-400">
                    Drop candidate here
                  </div>
                ) : (
                  colCandidates.map((cand) => {
                    const badge = getReadinessBadge(cand.readiness_assessment);
                    const coordinator = team.find((t) => t.id === cand.coordinator_id);
                    const canEdit = canEditCandidate(cand);

                    return (
                      <div
                        key={cand.id}
                        draggable={canEdit}
                        onDragStart={() => handleDragStart(cand.id)}
                        className="p-3 rounded-xl bg-white border border-charcoal-200 shadow-card hover:shadow-card-hover transition-all cursor-grab active:cursor-grabbing group relative"
                      >
                        {/* Header: Name and ID */}
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <div>
                            <Link
                              to={`/candidates/${cand.id}`}
                              className="text-xs font-bold text-charcoal-900 hover:text-brand-600 transition-colors line-clamp-1"
                            >
                              {cand.full_name}
                            </Link>
                            <span className="text-[10px] text-charcoal-400 font-mono">
                              {cand.candidate_id} · {cand.batch}
                            </span>
                          </div>

                          {canEdit && (
                            <button
                              onClick={() => setSelectedCandidateForStage(cand)}
                              className="p-1 rounded text-charcoal-400 hover:text-charcoal-800 hover:bg-slate-100 transition-colors"
                              title="Change stage"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Education and Skills */}
                        <p className="text-[11px] text-charcoal-600 truncate mb-2">
                          {cand.education} · {cand.specialization}
                        </p>

                        <div className="flex flex-wrap gap-1 mb-2.5">
                          {cand.technical_skills.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-charcoal-700 font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {cand.technical_skills.length > 3 && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-slate-100 text-charcoal-500 font-medium">
                              +{cand.technical_skills.length - 3}
                            </span>
                          )}
                        </div>

                        {/* Footer: Progress & Assessment */}
                        <div className="pt-2 border-t border-charcoal-100 flex items-center justify-between text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded font-medium ${badge.color}`}>
                            {cand.readiness_score > 0 ? `${cand.readiness_score}%` : badge.label}
                          </span>

                          <button
                            onClick={() => setSelectedCandidateForStage(cand)}
                            className="text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
                          >
                            Move <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stage Change Modal */}
      {selectedCandidateForStage && (
        <StageChangeModal
          isOpen={Boolean(selectedCandidateForStage)}
          onClose={() => setSelectedCandidateForStage(null)}
          candidate={selectedCandidateForStage}
        />
      )}
    </div>
  );
};
