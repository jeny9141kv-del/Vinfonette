import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Task, TaskPriority, TaskStatus } from '../../lib/types';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

export interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTask?: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, initialTask }) => {
  const { user } = useAuth();
  const { createTask, updateTask, candidates, companies, jobs, team } = useData();

  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [relatedCandidateId, setRelatedCandidateId] = useState(initialTask?.related_candidate_id || '');
  const [relatedCompanyId, setRelatedCompanyId] = useState(initialTask?.related_company_id || '');
  const [ownerId, setOwnerId] = useState(initialTask?.owner_id || user?.id || team[0]?.id || '');
  const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority || 'Medium');
  const [dueDate, setDueDate] = useState(
    initialTask?.due_date
      ? new Date(initialTask.due_date).toISOString().slice(0, 10)
      : new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [status, setStatus] = useState<TaskStatus>(initialTask?.status || 'To Do');
  const [notes, setNotes] = useState(initialTask?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      if (initialTask) {
        await updateTask(initialTask.id, {
          title,
          description,
          related_candidate_id: relatedCandidateId || undefined,
          related_company_id: relatedCompanyId || undefined,
          owner_id: ownerId,
          priority,
          due_date: new Date(dueDate).toISOString(),
          status,
          notes,
        });
      } else {
        await createTask({
          title,
          description,
          related_candidate_id: relatedCandidateId || undefined,
          related_company_id: relatedCompanyId || undefined,
          owner_id: ownerId,
          priority,
          due_date: new Date(dueDate).toISOString(),
          status,
          notes,
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
      title={initialTask ? 'Edit Action Item' : 'Create Task / Follow-up'}
      description="Track recruitment follow-ups, interview preps, mock sessions, and partner reminders."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-charcoal-700 mb-1">Task Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Follow up on offer acceptance with Diya Sen"
            required
            className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Context, background details, specific points to cover..."
            className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Related Candidate</label>
            <select
              value={relatedCandidateId}
              onChange={(e) => setRelatedCandidateId(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
            >
              <option value="">None / General Task</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.candidate_id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Related Employer</label>
            <select
              value={relatedCompanyId}
              onChange={(e) => setRelatedCompanyId(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
            >
              <option value="">None / Internal Task</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Assigned Staff Owner</label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
            >
              {team.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name} ({t.title || t.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Due Date *</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white font-medium"
            >
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority</option>
              <option value="Urgent">Urgent Priority</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white font-medium"
            >
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-700 mb-1">Follow-up Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Candidate confirmed interview prep attendance"
            className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-charcoal-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            {initialTask ? 'Save Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
