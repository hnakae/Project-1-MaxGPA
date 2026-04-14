import { expect, test, vi } from 'vitest';
import { fetchCourseStats } from '@/app/actions';

// Mocking the global fetch for Server Action testing
global.fetch = vi.fn();

test('fetchCourseStats returns data on success', async () => {
  const mockData = { labels: ['A'], data: [10] };
  
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    json: async () => mockData,
  } as Response);

  const result = await fetchCourseStats('CS422');
  expect(result).toEqual(mockData);
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/stats/course/CS422'));
});