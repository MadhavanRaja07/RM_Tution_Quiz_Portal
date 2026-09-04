import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { getQuizConfig, updateQuizConfig, QuizConfig } from '@/lib/db';

export async function GET() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const quiz = getQuizConfig();
    return NextResponse.json(quiz, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load quiz config' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const newConfig: QuizConfig = await req.json();

    if (!newConfig.title || !Array.isArray(newConfig.questions)) {
      return NextResponse.json({ error: 'Invalid quiz configuration payload' }, { status: 400 });
    }

    const updated = updateQuizConfig(newConfig);
    return NextResponse.json({ success: true, quiz: updated });
  } catch (error) {
    console.error('Error saving quiz config:', error);
    return NextResponse.json({ error: 'Failed to update quiz config' }, { status: 500 });
  }
}
