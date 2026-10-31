import { describe, it, expect } from 'vitest';
import { Placement } from '../src/lib/types';

describe('VinfoNette Placement Validation Logic', () => {
  function validatePlacementCreation(
    existingPlacements: Placement[],
    candidateId: string,
    details: {
      company_id?: string;
      job_id?: string;
      ctc?: number;
      joining_date?: string;
      confirmation_details?: string;
    }
  ) {
    if (!details.company_id || !details.job_id || !details.ctc || !details.joining_date || !details.confirmation_details) {
      throw new Error('Mandatory placement details missing');
    }

    const hasActive = existingPlacements.some(
      (p) => p.candidate_id === candidateId && p.status === 'CONFIRMED'
    );
    if (hasActive) {
      throw new Error('Candidate already has active placement');
    }

    return true;
  }

  it('rejects placement without employer, ctc, or joining date', () => {
    expect(() =>
      validatePlacementCreation([], 'cand-1', {
        company_id: 'comp-1',
        job_id: 'job-1',
        // missing ctc, joining date, confirmation details
      })
    ).toThrow('Mandatory placement details missing');
  });

  it('rejects duplicate active placement for the same candidate', () => {
    const existing: Placement[] = [
      {
        id: 'p-1',
        candidate_id: 'cand-1',
        company_id: 'comp-1',
        job_id: 'job-1',
        designation: 'Engineer',
        ctc: 1200000,
        currency: 'INR',
        joining_date: '2026-07-01',
        confirmation_details: 'Signed LOI',
        placed_at: '2026-02-12',
        status: 'CONFIRMED',
      },
    ];

    expect(() =>
      validatePlacementCreation(existing, 'cand-1', {
        company_id: 'comp-2',
        job_id: 'job-2',
        ctc: 1500000,
        joining_date: '2026-08-01',
        confirmation_details: 'Second offer',
      })
    ).toThrow('Candidate already has active placement');
  });

  it('accepts valid placement when all fields provided and no prior active placement exists', () => {
    const isValid = validatePlacementCreation([], 'cand-2', {
      company_id: 'comp-1',
      job_id: 'job-1',
      ctc: 1000000,
      joining_date: '2026-07-01',
      confirmation_details: 'Verified degree and signed offer letter.',
    });
    expect(isValid).toBe(true);
  });
});
