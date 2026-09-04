import fs from 'fs';
import path from 'path';

export interface QuestionConfig {
  id: string;
  question: string;
  type: 'single_choice' | 'multiple_choice' | 'text';
  options: string[];
  correctAnswer: string | string[];
  marks: number;
}

export interface QuizConfig {
  id: string;
  title: string;
  instructions: string;
  questions: QuestionConfig[];
}

export interface AnswerRecord {
  id: string;
  submissionId: string;
  questionId: string;
  questionText: string;
  participantAnswer: string | string[];
  correctAnswer: string | string[];
  marksAwarded: number;
  maxMarks: number;
  isCorrect: boolean;
}

export interface SubmissionRecord {
  id: string;
  quizId: string;
  participantName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  submittedAt: string;
  answers: AnswerRecord[];
}

export interface AppSettings {
  showResultsToParticipants: boolean;
  adminPasswordHash: string;
}

interface DatabaseSchema {
  settings: AppSettings;
  submissions: SubmissionRecord[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const QUIZ_CONFIG_PATH = path.join(DATA_DIR, 'quiz_config.json');
const DB_STORE_PATH = path.join(DATA_DIR, 'db_store.json');

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDbStore(): DatabaseSchema {
  ensureDataDirectory();
  if (!fs.existsSync(DB_STORE_PATH)) {
    const defaultStore: DatabaseSchema = {
      settings: {
        showResultsToParticipants: false,
        adminPasswordHash: 'admin123', // Default admin password
      },
      submissions: [],
    };
    fs.writeFileSync(DB_STORE_PATH, JSON.stringify(defaultStore, null, 2), 'utf-8');
    return defaultStore;
  }

  try {
    const content = fs.readFileSync(DB_STORE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading db_store.json:', err);
    return {
      settings: { showResultsToParticipants: false, adminPasswordHash: 'admin123' },
      submissions: [],
    };
  }
}

function saveDbStore(store: DatabaseSchema): void {
  ensureDataDirectory();
  fs.writeFileSync(DB_STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

export function getQuizConfig(): QuizConfig {
  ensureDataDirectory();
  if (!fs.existsSync(QUIZ_CONFIG_PATH)) {
    throw new Error('quiz_config.json file missing in data folder');
  }
  const content = fs.readFileSync(QUIZ_CONFIG_PATH, 'utf-8');
  return JSON.parse(content);
}

export function updateQuizConfig(newConfig: QuizConfig): QuizConfig {
  ensureDataDirectory();
  fs.writeFileSync(QUIZ_CONFIG_PATH, JSON.stringify(newConfig, null, 2), 'utf-8');
  return newConfig;
}

// Returns quiz structure WITHOUT correct answers for participants
export function getPublicQuiz() {
  const fullQuiz = getQuizConfig();
  const settings = getSettings();
  return {
    id: fullQuiz.id,
    title: fullQuiz.title,
    instructions: fullQuiz.instructions,
    showResultsToParticipants: settings.showResultsToParticipants,
    questions: fullQuiz.questions.map((q) => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: q.options,
      marks: q.marks,
    })),
  };
}

export function getSettings(): AppSettings {
  const db = loadDbStore();
  return db.settings;
}

export function updateSettings(newSettings: Partial<AppSettings>): AppSettings {
  const db = loadDbStore();
  db.settings = { ...db.settings, ...newSettings };
  saveDbStore(db);
  return db.settings;
}

export function addSubmission(
  participantName: string,
  participantAnswers: Record<string, string | string[]>
): { submission: SubmissionRecord; showResults: boolean } {
  const quiz = getQuizConfig();
  const db = loadDbStore();
  const settings = db.settings;

  let totalScore = 0;
  let maxTotalMarks = 0;

  const answerRecords: AnswerRecord[] = quiz.questions.map((q) => {
    maxTotalMarks += q.marks || 1;
    const rawAnswer = participantAnswers[q.id];
    let isCorrect = false;

    if (q.type === 'single_choice') {
      const pAns = typeof rawAnswer === 'string' ? rawAnswer.trim() : '';
      const cAns = typeof q.correctAnswer === 'string' ? q.correctAnswer.trim() : '';
      isCorrect = pAns.toLowerCase() === cAns.toLowerCase();
    } else if (q.type === 'text') {
      const pAns = typeof rawAnswer === 'string' ? rawAnswer.trim() : '';
      const cAns = typeof q.correctAnswer === 'string' ? q.correctAnswer.trim() : '';
      // Flexible matching for text (e.g. q=ne or q = ne)
      const pNormalized = pAns.replace(/\s+/g, '').toLowerCase();
      const cNormalized = cAns.replace(/\s+/g, '').toLowerCase();
      isCorrect = pNormalized.length > 0 && (pNormalized === cNormalized || pNormalized.includes(cNormalized));
    } else if (q.type === 'multiple_choice') {
      const pAnsArr = Array.isArray(rawAnswer) ? rawAnswer.sort() : [];
      const cAnsArr = Array.isArray(q.correctAnswer) ? q.correctAnswer.sort() : [];
      isCorrect = JSON.stringify(pAnsArr) === JSON.stringify(cAnsArr);
    }

    const marksAwarded = isCorrect ? q.marks || 1 : 0;
    totalScore += marksAwarded;

    return {
      id: 'ans_' + Math.random().toString(36).substring(2, 9),
      submissionId: '', // Set below
      questionId: q.id,
      questionText: q.question,
      participantAnswer: rawAnswer || '',
      correctAnswer: q.correctAnswer,
      marksAwarded,
      maxMarks: q.marks || 1,
      isCorrect,
    };
  });

  const percentage = Math.round((totalScore / (maxTotalMarks || 1)) * 100 * 100) / 100;
  const submissionId = 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

  answerRecords.forEach((a) => (a.submissionId = submissionId));

  const submission: SubmissionRecord = {
    id: submissionId,
    quizId: quiz.id,
    participantName: participantName.trim(),
    score: totalScore,
    totalMarks: maxTotalMarks,
    percentage,
    submittedAt: new Date().toISOString(),
    answers: answerRecords,
  };

  db.submissions.unshift(submission);
  saveDbStore(db);

  return {
    submission,
    showResults: settings.showResultsToParticipants,
  };
}

export function getAllSubmissions(): SubmissionRecord[] {
  const db = loadDbStore();
  return db.submissions;
}

export function getSubmissionById(id: string): SubmissionRecord | undefined {
  const db = loadDbStore();
  return db.submissions.find((s) => s.id === id);
}

export function deleteSubmission(id: string): boolean {
  const db = loadDbStore();
  const initialLength = db.submissions.length;
  db.submissions = db.submissions.filter((s) => s.id !== id);
  if (db.submissions.length !== initialLength) {
    saveDbStore(db);
    return true;
  }
  return false;
}

export function deleteAllSubmissions(): void {
  const db = loadDbStore();
  db.submissions = [];
  saveDbStore(db);
}
