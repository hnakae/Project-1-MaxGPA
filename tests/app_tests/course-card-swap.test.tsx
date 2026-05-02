import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CourseCard } from '@/app/components/course-card';
import type { PlanItem } from '@/app/lib/saved-plans';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const gradeData = [
  { grade: 'A', count: 10, percentage: 80 },
  { grade: 'B', count: 2,  percentage: 20 },
];

const mockInstructors = [
  { instructor: 'Dr. Smith', avgGpa: 3.8, gradeData },
  { instructor: 'Dr. Jones', avgGpa: 3.2, gradeData },
];

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve(mockInstructors),
    ok: true,
  } as unknown as Response);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderCard(planItems: PlanItem[], onAddToPlan = vi.fn(), onSwapInPlan = vi.fn()) {
  return render(
    <CourseCard
      code="CS 210"
      avgGpa={3.5}
      gradeData={gradeData}
      showInstructors={true}
      planItems={planItems}
      onAddToPlan={onAddToPlan}
      onSwapInPlan={onSwapInPlan}
    />
  );
}

describe('CourseCard — instructor button states', () => {
  it('shows Add for all instructors when no instructor for this course is in the plan', async () => {
    renderCard([]);
    await waitFor(() => expect(screen.getAllByRole('button', { name: /add/i })).toHaveLength(2));
    expect(screen.queryByRole('button', { name: /swap/i })).toBeNull();
    expect(screen.queryByText('Added')).toBeNull();
  });

  it('shows Added for the instructor already in the plan', async () => {
    const planItems: PlanItem[] = [
      { code: 'CS 210', instructor: 'Dr. Smith', avgGpa: 3.8, gradeData },
    ];
    renderCard(planItems);
    await waitFor(() => expect(screen.getByText('Added')).toBeInTheDocument());
  });

  it('shows Swap for other instructors when one instructor for the same course is in the plan', async () => {
    const planItems: PlanItem[] = [
      { code: 'CS 210', instructor: 'Dr. Smith', avgGpa: 3.8, gradeData },
    ];
    renderCard(planItems);
    await waitFor(() => {
      expect(screen.getByText('Added')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /swap/i })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /^add$/i })).toBeNull();
  });

  it('calls onSwapInPlan with the new item when Swap is clicked', async () => {
    const onSwapInPlan = vi.fn();
    const planItems: PlanItem[] = [
      { code: 'CS 210', instructor: 'Dr. Smith', avgGpa: 3.8, gradeData },
    ];
    renderCard(planItems, vi.fn(), onSwapInPlan);
    await waitFor(() => expect(screen.getByRole('button', { name: /swap/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /swap/i }));

    expect(onSwapInPlan).toHaveBeenCalledOnce();
    expect(onSwapInPlan).toHaveBeenCalledWith({
      code: 'CS 210',
      instructor: 'Dr. Jones',
      avgGpa: 3.2,
      gradeData,
    });
  });

  it('calls onAddToPlan with the correct item when Add is clicked', async () => {
    const onAddToPlan = vi.fn();
    renderCard([], onAddToPlan);
    await waitFor(() => expect(screen.getAllByRole('button', { name: /add/i })).toHaveLength(2));

    fireEvent.click(screen.getAllByRole('button', { name: /add/i })[0]);

    expect(onAddToPlan).toHaveBeenCalledOnce();
    expect(onAddToPlan).toHaveBeenCalledWith({
      code: 'CS 210',
      instructor: 'Dr. Smith',
      avgGpa: 3.8,
      gradeData,
    });
  });

  it('does not call onSwapInPlan when the already-added instructor row is clicked', async () => {
    const onSwapInPlan = vi.fn();
    const planItems: PlanItem[] = [
      { code: 'CS 210', instructor: 'Dr. Smith', avgGpa: 3.8, gradeData },
    ];
    renderCard(planItems, vi.fn(), onSwapInPlan);
    await waitFor(() => expect(screen.getByText('Added')).toBeInTheDocument());

    // "Added" is a span, not a button — clicking it should do nothing
    fireEvent.click(screen.getByText('Added'));
    expect(onSwapInPlan).not.toHaveBeenCalled();
  });
});
