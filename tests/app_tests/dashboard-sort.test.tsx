import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/page';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock the dependencies
vi.mock('@/app/lib/saved-plans', () => ({
  savePlan: vi.fn(),
  getDraftItems: vi.fn(() => []),
  addDraftItem: vi.fn((x) => [x]),
  removeDraftItem: vi.fn(() => []),
  clearDraft: vi.fn(),
}));

vi.mock('@/app/lib/requirements', () => ({
  isGroupMet: vi.fn(() => false),
  allGroupsMet: vi.fn(() => false),
  groupBySequence: vi.fn(() => ({})),
}));

const mockRequirements = [
  {
    groupId: 'lower',
    groupName: 'Lower Div',
    type: 'all',
    courses: [{ code: 'CS 210', id: 1 }, { code: 'CS 211', id: 2 }],
  },
];

const mockCourses = [
  {
    code: 'CS 211',
    name: 'Intro 2',
    avgGpa: 3.8,
    gradeData: [{ grade: 'A', count: 50, percentage: 100 }],
  },
  {
    code: 'CS 210',
    name: 'Intro 1',
    avgGpa: 3.2,
    gradeData: [{ grade: 'A', count: 100, percentage: 100 }],
  },
];

const getCourseCodes = () => screen.getAllByTestId('course-card-title')
  .map(h => h.textContent?.trim() || '');

describe('Dashboard Sorting', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/requirements')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRequirements),
        });
      }
      if (url.includes('/api/courses')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCourses),
        });
      }
      if (url.includes('/api/instructors')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(['Dr. Smith']),
        });
      }
      if (url.includes('/api/course-instructors')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      if (url.includes('/api/academic-years')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(['2023-24', '2022-23']),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sorts by default (order in requirements)', async () => {
    render(<DashboardPage />);
    
    // Wait for course cards specifically
    await waitFor(() => expect(screen.queryAllByTestId('course-card-title').length).toBeGreaterThan(0));
    
    const codes = getCourseCodes();
    expect(codes[0]).toBe('CS 210');
    expect(codes[1]).toBe('CS 211');
  });

  it('sorts by GPA ascending', async () => {
    render(<DashboardPage />);
    await waitFor(() => expect(screen.queryAllByTestId('course-card-title').length).toBeGreaterThan(0));

    const select = screen.getByDisplayValue('Default Sort');
    fireEvent.change(select, { target: { value: 'gpa-asc' } });

    const codes = getCourseCodes();
    expect(codes[0]).toBe('CS 210');
    expect(codes[1]).toBe('CS 211');
  });

  it('sorts by GPA descending', async () => {
    render(<DashboardPage />);
    await waitFor(() => expect(screen.queryAllByTestId('course-card-title').length).toBeGreaterThan(0));

    const select = screen.getByDisplayValue('Default Sort');
    fireEvent.change(select, { target: { value: 'gpa-desc' } });

    const codes = getCourseCodes();
    expect(codes[0]).toBe('CS 211');
    expect(codes[1]).toBe('CS 210');
  });

  it('sorts by student count descending', async () => {
    render(<DashboardPage />);
    await waitFor(() => expect(screen.queryAllByTestId('course-card-title').length).toBeGreaterThan(0));

    const select = screen.getByDisplayValue('Default Sort');
    fireEvent.change(select, { target: { value: 'students-desc' } });

    const codes = getCourseCodes();
    expect(codes[0]).toBe('CS 210');
    expect(codes[1]).toBe('CS 211');
  });

  it('sorts by student count ascending', async () => {
    render(<DashboardPage />);
    await waitFor(() => expect(screen.queryAllByTestId('course-card-title').length).toBeGreaterThan(0));

    const select = screen.getByDisplayValue('Default Sort');
    fireEvent.change(select, { target: { value: 'students-asc' } });

    const codes = getCourseCodes();
    expect(codes[0]).toBe('CS 211');
    expect(codes[1]).toBe('CS 210');
  });
});
