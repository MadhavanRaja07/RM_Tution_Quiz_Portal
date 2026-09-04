import { NextRequest, NextResponse } from 'next/server';
import { addSubmission } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { participantName, answers } = body;

    if (!participantName || typeof participantName !== 'string' || !participantName.trim()) {
      return NextResponse.json(
        { error: 'Participant name is required' },
        { status: 400 }
      );
    }

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Invalid answers payload' },
        { status: 400 }
      );
    }

    const { submission, showResults } = addSubmission(participantName, answers);

    if (!showResults) {
      // STRICT SCORE PRIVACY: Do NOT return score, percentage, or answer key
      return NextResponse.json(
        {
          success: true,
          submissionId: submission.id,
          showResults: false,
          message: 'Quiz submitted successfully. Your result is currently hidden. Please contact the administrator for your result.',
          submittedAt: submission.submittedAt,
        },
        { status: 200 }
      );
    } else {
      // Admin turned result visibility ON
      return NextResponse.json(
        {
          success: true,
          submissionId: submission.id,
          showResults: true,
          score: submission.score,
          totalMarks: submission.totalMarks,
          percentage: submission.percentage,
          submittedAt: submission.submittedAt,
          message: 'Quiz submitted successfully.',
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error('Error handling submission:', error);
    return NextResponse.json(
      { error: 'Failed to process quiz submission' },
      { status: 500 }
    );
  }
}
