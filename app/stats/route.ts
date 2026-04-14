// Route for grade viewing

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // 1. Get query parameters from the URL (e.g., /stats?course=CS422)
  const { searchParams } = new URL(request.url);
  const courseCode = searchParams.get('course');

  if (!courseCode) {
    return NextResponse.json({ error: 'Course code is required' }, { status: 400 });
  }

  try {
    // 2. Fetch the data from Peyton's FastAPI backend
    // Use an environment variable for the URL to keep it flexible
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
    const res = await fetch(`${backendUrl}/api/stats/course/${courseCode}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Optional: Set a revalidation time if the data doesn't change often
      next: { revalidate: 3600 } 
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch from backend' }, { status: res.status });
    }

    const data = await res.json();

    // 3. Return the sanitized data to your frontend
    return NextResponse.json(data);
  } catch (error) {
    console.error('Stats Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}