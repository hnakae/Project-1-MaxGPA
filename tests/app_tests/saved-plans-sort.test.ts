import { describe, it, expect, beforeEach } from 'vitest';
import { getSavedPlans, savePlan, SavedPlan } from '@/app/lib/saved-plans';

describe('Saved Plans Sorting', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should sort plans with the newest createdDate first', () => {
    const oldPlan: Omit<SavedPlan, 'id'> = {
      planName: 'Old Plan',
      subject: 'CS',
      subjectLabel: 'Computer Science',
      createdDate: '2023-01-01T00:00:00.000Z',
      items: [],
      avgGpa: 3.5,
    };

    const newPlan: Omit<SavedPlan, 'id'> = {
      planName: 'New Plan',
      subject: 'MATH',
      subjectLabel: 'Mathematics',
      createdDate: '2024-01-01T00:00:00.000Z',
      items: [],
      avgGpa: 3.8,
    };

    const middlePlan: Omit<SavedPlan, 'id'> = {
      planName: 'Middle Plan',
      subject: 'BA',
      subjectLabel: 'Business',
      createdDate: '2023-06-01T00:00:00.000Z',
      items: [],
      avgGpa: 3.6,
    };

    // Save them in a non-sorted order
    savePlan(oldPlan);
    savePlan(newPlan);
    savePlan(middlePlan);

    const plans = getSavedPlans();

    expect(plans).toHaveLength(3);
    expect(plans[0].planName).toBe('New Plan');
    expect(plans[1].planName).toBe('Middle Plan');
    expect(plans[2].planName).toBe('Old Plan');
  });

  it('should handle same-day plans correctly based on full ISO string', () => {
    const plan1 = {
      planName: 'Earlier Today',
      subject: 'CS',
      subjectLabel: 'Computer Science',
      createdDate: '2026-05-02T10:00:00.000Z',
      items: [],
      avgGpa: 3.5,
    };

    const plan2 = {
      planName: 'Later Today',
      subject: 'CS',
      subjectLabel: 'Computer Science',
      createdDate: '2026-05-02T14:00:00.000Z',
      items: [],
      avgGpa: 3.5,
    };

    savePlan(plan1);
    savePlan(plan2);

    const plans = getSavedPlans();
    expect(plans[0].planName).toBe('Later Today');
    expect(plans[1].planName).toBe('Earlier Today');
  });
});
