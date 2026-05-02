import { describe, it, expect, beforeEach } from 'vitest';
import {
  addDraftItem,
  removeDraftItem,
  getDraftItems,
} from '@/app/lib/saved-plans';
import type { PlanItem } from '@/app/lib/saved-plans';

const gradeData = [{ grade: 'A', count: 10, percentage: 100 }];
const item = (code: string, instructor: string, avgGpa: number): PlanItem => ({
  code, instructor, avgGpa, gradeData,
});

const SUBJECT = 'CS';

beforeEach(() => {
  localStorage.clear();
});

describe('swap-all — draft mutation logic', () => {
  it('replaces all upgraded items while preserving others', () => {
    addDraftItem(item('CS 210', 'Dr. Low',  3.0), SUBJECT);
    addDraftItem(item('CS 313', 'Dr. Mid',  3.3), SUBJECT);
    addDraftItem(item('MATH 251', 'Dr. Same', 3.5), SUBJECT);

    const suggestions = [
      { code: 'CS 210', currentInstructor: 'Dr. Low',  betterItem: item('CS 210', 'Dr. High', 3.9) },
      { code: 'CS 313', currentInstructor: 'Dr. Mid',  betterItem: item('CS 313', 'Dr. Best', 3.8) },
    ];

    let updated: PlanItem[] = getDraftItems(SUBJECT);
    for (const s of suggestions) {
      removeDraftItem(s.code, s.currentInstructor, SUBJECT);
      updated = addDraftItem(s.betterItem, SUBJECT);
    }

    expect(updated).toHaveLength(3);
    expect(updated.find(i => i.code === 'CS 210')?.instructor).toBe('Dr. High');
    expect(updated.find(i => i.code === 'CS 313')?.instructor).toBe('Dr. Best');
    expect(updated.find(i => i.code === 'MATH 251')?.instructor).toBe('Dr. Same');
  });

  it('does not duplicate a course after a single swap', () => {
    addDraftItem(item('CS 210', 'Dr. Low', 3.0), SUBJECT);

    removeDraftItem('CS 210', 'Dr. Low', SUBJECT);
    const updated = addDraftItem(item('CS 210', 'Dr. High', 3.9), SUBJECT);

    const cs210Entries = updated.filter(i => i.code === 'CS 210');
    expect(cs210Entries).toHaveLength(1);
    expect(cs210Entries[0].instructor).toBe('Dr. High');
  });

  it('swapping all suggestions results in no remaining upgrade opportunities', () => {
    addDraftItem(item('CS 210', 'Dr. Low', 3.0), SUBJECT);
    addDraftItem(item('CS 313', 'Dr. Mid', 3.3), SUBJECT);

    const betterCS210 = item('CS 210', 'Dr. High', 3.9);
    const betterCS313 = item('CS 313', 'Dr. Best', 3.8);

    removeDraftItem('CS 210', 'Dr. Low', SUBJECT);
    addDraftItem(betterCS210, SUBJECT);
    removeDraftItem('CS 313', 'Dr. Mid', SUBJECT);
    const updated = addDraftItem(betterCS313, SUBJECT);

    // Simulate checking for remaining upgrades: best available = what we just swapped in
    const bestByCode: Record<string, number> = { 'CS 210': 3.9, 'CS 313': 3.8 };
    const remainingUpgrades = updated.filter(
      i => bestByCode[i.code] !== undefined && bestByCode[i.code] > i.avgGpa
    );
    expect(remainingUpgrades).toHaveLength(0);
  });

  it('handles swap-all when only one suggestion exists', () => {
    addDraftItem(item('CS 210', 'Dr. Low', 3.0), SUBJECT);

    removeDraftItem('CS 210', 'Dr. Low', SUBJECT);
    const updated = addDraftItem(item('CS 210', 'Dr. High', 3.9), SUBJECT);

    expect(updated).toHaveLength(1);
    expect(updated[0].instructor).toBe('Dr. High');
    expect(updated[0].avgGpa).toBe(3.9);
  });
});
