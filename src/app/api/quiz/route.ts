import { NextResponse } from 'next/server';
import { getPublicQuiz } from '@/lib/db';

export async function GET() {
  try {
    const quizData = getPublicQuiz();
    return NextResponse.json(quizData, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz details' },
      { status: 500 }
    );
  }
}
