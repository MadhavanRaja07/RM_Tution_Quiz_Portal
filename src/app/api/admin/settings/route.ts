import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { updateSettings } from '@/lib/db';

export async function POST(req: NextRequest) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { showResultsToParticipants } = await req.json();
    if (typeof showResultsToParticipants !== 'boolean') {
      return NextResponse.json({ error: 'Invalid setting value' }, { status: 400 });
    }

    const updated = updateSettings({ showResultsToParticipants });
    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
