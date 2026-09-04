import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { getAllSubmissions, getQuizConfig } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const submissions = getAllSubmissions();
    const quiz = getQuizConfig();

    // Sheet 1: Submissions Overview
    const overviewRows = submissions.map((sub) => {
      const dateObj = new Date(sub.submittedAt);
      const subDate = dateObj.toLocaleDateString();
      const subTime = dateObj.toLocaleTimeString();

      const rowData: Record<string, any> = {
        'Participant Name': sub.participantName,
        'Submission Date': subDate,
        'Submission Time': subTime,
        'Total Questions': quiz.questions.length,
        'Total Marks': sub.totalMarks,
        'Marks Obtained': sub.score,
        'Percentage (%)': sub.percentage,
      };

      // Add each question answer dynamically
      quiz.questions.forEach((q, idx) => {
        const ansRec = sub.answers.find((a) => a.questionId === q.id);
        const ansVal = ansRec ? (Array.isArray(ansRec.participantAnswer) ? ansRec.participantAnswer.join(', ') : ansRec.participantAnswer) : '';
        rowData[`Q${idx + 1}: ${q.question.substring(0, 30)}...`] = ansVal || '[No Answer]';
      });

      return rowData;
    });

    // Sheet 2: Answer Details
    const detailRows: Record<string, any>[] = [];
    submissions.forEach((sub) => {
      quiz.questions.forEach((q, idx) => {
        const ansRec = sub.answers.find((a) => a.questionId === q.id);
        const pAns = ansRec ? (Array.isArray(ansRec.participantAnswer) ? ansRec.participantAnswer.join(', ') : ansRec.participantAnswer) : '';
        const cAns = Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer;
        const isCorrect = ansRec ? ansRec.isCorrect : false;
        const marks = ansRec ? ansRec.marksAwarded : 0;

        detailRows.push({
          'Participant Name': sub.participantName,
          'Question Number': idx + 1,
          'Question Text': q.question,
          'Participant Answer': pAns || '[No Answer]',
          'Correct Answer': cAns,
          'Marks Awarded': marks,
          'Max Marks': q.marks || 1,
          'Result': isCorrect ? 'CORRECT' : 'INCORRECT',
        });
      });
    });

    // Create workbook and worksheets
    const workbook = XLSX.utils.book_new();

    const overviewSheet = XLSX.utils.json_to_sheet(overviewRows.length > 0 ? overviewRows : [{ 'No Data': 'No submissions recorded yet' }]);
    const detailsSheet = XLSX.utils.json_to_sheet(detailRows.length > 0 ? detailRows : [{ 'No Data': 'No submission details recorded yet' }]);

    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Submissions Overview');
    XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Answer Details');

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    const filename = `Physics_Quiz_Results_${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating Excel file:', error);
    return NextResponse.json({ error: 'Failed to generate Excel export' }, { status: 500 });
  }
}
