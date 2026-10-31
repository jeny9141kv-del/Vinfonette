import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, getStageColor, getReadinessBadge } from '../src/lib/utils';

describe('VinfoNette Utilities', () => {
  it('formats INR currency in Lakhs (LPA) correctly', () => {
    expect(formatCurrency(1200000)).toBe('₹12 LPA');
    expect(formatCurrency(850000)).toBe('₹8.5 LPA');
    expect(formatCurrency(50000)).toBe('₹50,000');
    expect(formatCurrency(null)).toBe('N/A');
  });

  it('formats dates cleanly', () => {
    expect(formatDate('2026-02-15')).toBe('Feb 15, 2026');
    expect(formatDate(null)).toBe('—');
  });

  it('returns appropriate theme styling for pipeline stages', () => {
    const placedStyle = getStageColor('Placed Successfully');
    expect(placedStyle.text).toContain('emerald');

    const inTrainingStyle = getStageColor('Training in Progress');
    expect(inTrainingStyle.text).toContain('amber');
  });

  it('returns correct readiness badge styles', () => {
    const highPot = getReadinessBadge('HIGH_POTENTIAL');
    expect(highPot.label).toContain('High Potential');

    const ready = getReadinessBadge('READY');
    expect(ready.label).toBe('Placement Ready');
  });
});
