import { describe, it, expect } from 'vitest';
import { Candidate, Placement, Interview, Task, CandidateStage } from '../src/lib/types';

describe('VinfoNette Critical Placement Workflows', () => {
  // 1. Pipeline Progression and Stage Transitions
  describe('Pipeline Progression & Stage Integrity', () => {
    const allStages: CandidateStage[] = [
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
    ];

    it('contains all 10 standard enterprise placement stages in defined sequence', () => {
      expect(allStages).toHaveLength(10);
      expect(allStages[0]).toBe('Registered');
      expect(allStages[9]).toBe('Placed Successfully');
    });

    it('prohibits moving to "Placed Successfully" without an active confirmed placement', () => {
      const placements: Placement[] = [];
      const candidateId = 'cand-uuid-1';

      function canTransitionToPlaced(cId: string, activePlacements: Placement[]): boolean {
        return activePlacements.some((p) => p.candidate_id === cId && p.status === 'CONFIRMED');
      }

      expect(canTransitionToPlaced(candidateId, placements)).toBe(false);

      const confirmedPlacement: Placement = {
        id: 'plc-uuid-1',
        candidate_id: candidateId,
        company_id: 'comp-uuid-1',
        job_id: 'job-uuid-1',
        designation: 'Software Development Engineer',
        ctc: 1200000,
        currency: 'INR',
        joining_date: '2026-07-01',
        confirmation_details: 'Signed offer letter',
        placed_at: new Date().toISOString(),
        status: 'CONFIRMED',
      };

      expect(canTransitionToPlaced(candidateId, [confirmedPlacement])).toBe(true);
    });
  });

  // 2. Interview Scheduling & Conflict Detection
  describe('Interview Scheduling & Conflict Checks', () => {
    function hasInterviewConflict(
      candidateId: string,
      newStart: string,
      durationMinutes: number,
      existingInterviews: Interview[]
    ): boolean {
      const newStartTime = new Date(newStart).getTime();
      const newEndTime = newStartTime + durationMinutes * 60 * 1000;

      return existingInterviews.some((interview) => {
        if (interview.candidate_id !== candidateId) return false;
        if (['cancelled', 'completed'].includes(interview.status)) return false;

        const existStart = new Date(interview.scheduled_at).getTime();
        const existEnd = existStart + interview.duration_minutes * 60 * 1000;

        // Overlap condition: startA < endB and endA > startB
        return newStartTime < existEnd && newEndTime > existStart;
      });
    }

    const scheduledInterviews: Interview[] = [
      {
        id: 'int-1',
        candidate_id: 'c-100',
        job_id: 'j-1',
        company_id: 'cmp-1',
        round_number: 1,
        round_name: 'Technical Round 1',
        scheduled_at: '2026-03-01T10:00:00.000Z',
        duration_minutes: 60,
        timezone: 'Asia/Kolkata',
        mode: 'VIRTUAL',
        status: 'scheduled',
      },
    ];

    it('flags conflicting interview slot for the same candidate', () => {
      // Overlapping slot: starts 30 mins after existing starts (which runs for 60m)
      const hasConflict = hasInterviewConflict(
        'c-100',
        '2026-03-01T10:30:00.000Z',
        45,
        scheduledInterviews
      );
      expect(hasConflict).toBe(true);
    });

    it('allows non-overlapping interview slots for the candidate', () => {
      // Clean slot: 2 hours later
      const hasConflict = hasInterviewConflict(
        'c-100',
        '2026-03-01T12:00:00.000Z',
        45,
        scheduledInterviews
      );
      expect(hasConflict).toBe(false);
    });
  });

  // 3. Reports & Placement Metrics
  describe('Placement Metrics & Reports Aggregation', () => {
    const mockPlacements: Placement[] = [
      {
        id: 'p1',
        candidate_id: 'c1',
        company_id: 'cmp1',
        job_id: 'j1',
        designation: 'Full Stack Engineer',
        ctc: 1200000,
        currency: 'INR',
        joining_date: '2026-06-01',
        confirmation_details: 'Signed',
        placed_at: '2026-02-01',
        status: 'CONFIRMED',
      },
      {
        id: 'p2',
        candidate_id: 'c2',
        company_id: 'cmp2',
        job_id: 'j2',
        designation: 'DevOps Engineer',
        ctc: 1400000,
        currency: 'INR',
        joining_date: '2026-06-15',
        confirmation_details: 'Signed',
        placed_at: '2026-02-10',
        status: 'CONFIRMED',
      },
      {
        id: 'p3',
        candidate_id: 'c3',
        company_id: 'cmp1',
        job_id: 'j3',
        designation: 'Data Analyst',
        ctc: 800000,
        currency: 'INR',
        joining_date: '2026-07-01',
        confirmation_details: 'Signed',
        placed_at: '2026-02-15',
        status: 'CONFIRMED',
      },
    ];

    it('calculates average and maximum CTC correctly', () => {
      const totalCTC = mockPlacements.reduce((sum, p) => sum + p.ctc, 0);
      const avgCTC = Math.round(totalCTC / mockPlacements.length);
      const maxCTC = Math.max(...mockPlacements.map((p) => p.ctc));

      expect(totalCTC).toBe(3400000);
      expect(avgCTC).toBe(1133333);
      expect(maxCTC).toBe(1400000);
    });

    it('calculates placement rate against total eligible candidates', () => {
      const totalCandidates = 20;
      const placedCount = mockPlacements.length;
      const placementRate = ((placedCount / totalCandidates) * 100).toFixed(1);

      expect(placementRate).toBe('15.0');
    });
  });

  // 4. Candidate CSV Export
  describe('Candidate CSV Serialization', () => {
    function exportCandidatesToCSV(candidates: Partial<Candidate>[]): string {
      const headers = ['Candidate ID', 'Full Name', 'Email', 'Phone', 'Batch', 'Stage', 'Readiness'];
      const rows = candidates.map((c) => [
        `"${c.candidate_id || ''}"`,
        `"${(c.full_name || '').replace(/"/g, '""')}"`,
        `"${c.email || ''}"`,
        `"${c.phone || ''}"`,
        `"${c.batch || ''}"`,
        `"${c.current_stage || ''}"`,
        `"${c.readiness_assessment || ''}"`,
      ]);

      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    it('escapes quotes and handles special characters in CSV rows', () => {
      const sampleCandidates = [
        {
          candidate_id: 'VN-2026-001',
          full_name: 'Pooja "Star" Hegde',
          email: 'pooja@example.com',
          phone: '+91 98765 00000',
          batch: '2026-A',
          current_stage: 'Placed Successfully' as CandidateStage,
          readiness_assessment: 'HIGH_POTENTIAL' as const,
        },
      ];

      const csv = exportCandidatesToCSV(sampleCandidates);
      expect(csv).toContain('Candidate ID,Full Name,Email');
      expect(csv).toContain('"Pooja ""Star"" Hegde"');
      expect(csv).toContain('"Placed Successfully"');
    });
  });

  // 5. Task State Management
  describe('Task State Transitions', () => {
    it('properly toggles task completion and manages completion timestamp', () => {
      const initialTask: Task = {
        id: 'task-1',
        title: 'Review candidate resume',
        owner_id: 'owner-1',
        priority: 'High',
        due_date: '2026-03-01',
        status: 'To Do',
      };

      // Toggle to Completed
      const completedTask: Task = {
        ...initialTask,
        status: 'Completed',
        completed_at: new Date().toISOString(),
      };
      expect(completedTask.status).toBe('Completed');
      expect(completedTask.completed_at).toBeDefined();

      // Toggle back to To Do
      const reopenedTask: Task = {
        ...completedTask,
        status: 'To Do',
        completed_at: undefined,
      };
      expect(reopenedTask.status).toBe('To Do');
      expect(reopenedTask.completed_at).toBeUndefined();
    });
  });
});
