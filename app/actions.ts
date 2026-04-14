// Server actions to talk to FastAPI

'use server'

export async function fetchCourseStats(courseCode: string) {
  const res = await fetch(`http://127.0.0.1:8000/api/stats/course/${courseCode}`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}