'use client';

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Lock, 
  Search, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  LogOut, 
  RefreshCw, 
  Users, 
  Award, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  FileSpreadsheet, 
  X,
  Edit3,
  Plus,
  Trash2,
  Save,
  HelpCircle,
  Check,
  AlertOctagon
} from 'lucide-react';

interface QuestionConfig {
  id: string;
  question: string;
  type: 'single_choice' | 'multiple_choice' | 'text';
  options: string[];
  correctAnswer: string;
  marks: number;
}

interface AnswerRecord {
  id: string;
  questionId: string;
  questionText: string;
  participantAnswer: string | string[];
  correctAnswer: string | string[];
  marksAwarded: number;
  maxMarks: number;
  isCorrect: boolean;
}

interface SubmissionRecord {
  id: string;
  participantName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  submittedAt: string;
  answers: AnswerRecord[];
}

interface QuizConfig {
  id: string;
  title: string;
  instructions: string;
  questions: QuestionConfig[];
}

interface AppSettings {
  showResultsToParticipants: boolean;
}

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Data states
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null);
  const [settings, setSettings] = useState<AppSettings>({ showResultsToParticipants: false });
  const [loading, setLoading] = useState<boolean>(false);

  // Filter & Sort states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'score_desc' | 'score_asc' | 'name_asc'>('date_desc');
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionRecord | null>(null);

  // Quiz Editor State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editQuizData, setEditQuizData] = useState<QuizConfig | null>(null);
  const [isSavingQuiz, setIsSavingQuiz] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Fetch admin data
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/submissions');
      if (res.status === 401) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      setSubmissions(data.submissions || []);
      setQuizConfig(data.quiz || null);
      setSettings(data.settings || { showResultsToParticipants: false });
      setIsAuthenticated(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) return;
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || 'Invalid password');
        setIsLoggingIn(false);
        return;
      }

      setIsAuthenticated(true);
      setPasswordInput('');
      fetchAdminData();
    } catch (err: any) {
      setLoginError('Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsAuthenticated(false);
  };

  const handleToggleShowResults = async () => {
    const newValue = !settings.showResultsToParticipants;
    setSettings((prev) => ({ ...prev, showResultsToParticipants: newValue }));

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showResultsToParticipants: newValue }),
      });
      if (!res.ok) throw new Error('Setting update failed');
    } catch (err) {
      alert('Error updating setting');
      setSettings((prev) => ({ ...prev, showResultsToParticipants: !newValue }));
    }
  };

  const handleExportExcel = () => {
    window.open('/api/admin/export', '_blank');
  };

  // Delete Individual Submission
  const handleDeleteSubmission = async (id: string, participantName: string) => {
    if (confirm(`Are you sure you want to delete the submission for "${participantName}"? This action cannot be undone.`)) {
      try {
        const res = await fetch(`/api/admin/submissions?id=${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete submission');

        setSubmissions((prev) => prev.filter((s) => s.id !== id));
        if (selectedSubmission?.id === id) {
          setSelectedSubmission(null);
        }
      } catch (err: any) {
        alert('Error deleting submission: ' + err.message);
      }
    }
  };

  // Clear All Submissions
  const handleClearAllSubmissions = async () => {
    if (submissions.length === 0) {
      alert('There are no submissions to clear.');
      return;
    }

    if (confirm(`⚠️ WARNING: Are you sure you want to DELETE ALL ${submissions.length} quiz submissions? This will permanently erase all participant responses!`)) {
      try {
        const res = await fetch('/api/admin/submissions?clearAll=true', {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to clear submissions');

        setSubmissions([]);
        setSelectedSubmission(null);
      } catch (err: any) {
        alert('Error clearing submissions: ' + err.message);
      }
    }
  };

  // Open Quiz Editor Modal
  const handleOpenQuizEditor = () => {
    if (quizConfig) {
      setEditQuizData(JSON.parse(JSON.stringify(quizConfig)));
      setIsEditModalOpen(true);
      setSaveSuccessMsg('');
    }
  };

  // Quiz Editor Handlers
  const handleQuizTitleChange = (val: string) => {
    if (editQuizData) setEditQuizData({ ...editQuizData, title: val });
  };

  const handleQuizInstructionsChange = (val: string) => {
    if (editQuizData) setEditQuizData({ ...editQuizData, instructions: val });
  };

  const handleQuestionTextChange = (qIdx: number, val: string) => {
    if (!editQuizData) return;
    const questions = [...editQuizData.questions];
    questions[qIdx].question = val;
    setEditQuizData({ ...editQuizData, questions });
  };

  const handleQuestionMarksChange = (qIdx: number, marks: number) => {
    if (!editQuizData) return;
    const questions = [...editQuizData.questions];
    questions[qIdx].marks = marks;
    setEditQuizData({ ...editQuizData, questions });
  };

  const handleQuestionTypeChange = (qIdx: number, type: 'single_choice' | 'text') => {
    if (!editQuizData) return;
    const questions = [...editQuizData.questions];
    questions[qIdx].type = type;
    if (type === 'single_choice' && questions[qIdx].options.length === 0) {
      questions[qIdx].options = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
      questions[qIdx].correctAnswer = 'Option 1';
    }
    setEditQuizData({ ...editQuizData, questions });
  };

  const handleOptionTextChange = (qIdx: number, oIdx: number, val: string) => {
    if (!editQuizData) return;
    const questions = [...editQuizData.questions];
    const oldOptionText = questions[qIdx].options[oIdx];
    questions[qIdx].options[oIdx] = val;

    if (questions[qIdx].correctAnswer === oldOptionText) {
      questions[qIdx].correctAnswer = val;
    }
    setEditQuizData({ ...editQuizData, questions });
  };

  const handleSetCorrectAnswer = (qIdx: number, correctVal: string) => {
    if (!editQuizData) return;
    const questions = [...editQuizData.questions];
    questions[qIdx].correctAnswer = correctVal;
    setEditQuizData({ ...editQuizData, questions });
  };

  const handleAddOption = (qIdx: number) => {
    if (!editQuizData) return;
    const questions = [...editQuizData.questions];
    const newOptName = `Option ${questions[qIdx].options.length + 1}`;
    questions[qIdx].options.push(newOptName);
    setEditQuizData({ ...editQuizData, questions });
  };

  const handleRemoveOption = (qIdx: number, oIdx: number) => {
    if (!editQuizData) return;
    const questions = [...editQuizData.questions];
    if (questions[qIdx].options.length <= 2) {
      alert('A question must have at least 2 choices.');
      return;
    }
    const removedOpt = questions[qIdx].options[oIdx];
    questions[qIdx].options.splice(oIdx, 1);

    if (questions[qIdx].correctAnswer === removedOpt) {
      questions[qIdx].correctAnswer = questions[qIdx].options[0] || '';
    }
    setEditQuizData({ ...editQuizData, questions });
  };

  const handleAddQuestion = () => {
    if (!editQuizData) return;
    const newId = 'q_' + Date.now();
    const newQ: QuestionConfig = {
      id: newId,
      question: 'Enter new question text here...',
      type: 'single_choice',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      marks: 1,
    };
    setEditQuizData({
      ...editQuizData,
      questions: [...editQuizData.questions, newQ],
    });
  };

  const handleDeleteQuestion = (qIdx: number) => {
    if (!editQuizData) return;
    if (editQuizData.questions.length <= 1) {
      alert('Quiz must contain at least 1 question.');
      return;
    }
    if (confirm('Are you sure you want to delete this question?')) {
      const questions = [...editQuizData.questions];
      questions.splice(qIdx, 1);
      setEditQuizData({ ...editQuizData, questions });
    }
  };

  const handleSaveQuizConfig = async () => {
    if (!editQuizData) return;
    setIsSavingQuiz(true);
    setSaveSuccessMsg('');

    try {
      const res = await fetch('/api/admin/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editQuizData),
      });

      if (!res.ok) throw new Error('Failed to save quiz config');

      const data = await res.json();
      setQuizConfig(data.quiz);
      setSaveSuccessMsg('Quiz questions & answers updated successfully!');
      setTimeout(() => {
        setIsEditModalOpen(false);
      }, 1200);
    } catch (err: any) {
      alert('Error saving quiz configuration: ' + err.message);
    } finally {
      setIsSavingQuiz(false);
    }
  };

  // Filter & Sort Logic
  const filteredSubmissions = submissions
    .filter((s) => s.participantName.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      if (sortBy === 'date_asc') return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      if (sortBy === 'score_desc') return b.score - a.score;
      if (sortBy === 'score_asc') return a.score - b.score;
      if (sortBy === 'name_asc') return a.participantName.localeCompare(b.participantName);
      return 0;
    });

  // Calculate Overview Metrics
  const totalCount = submissions.length;
  const avgScore = totalCount > 0 ? (submissions.reduce((acc, curr) => acc + curr.score, 0) / totalCount).toFixed(1) : 0;
  const avgPercentage = totalCount > 0 ? (submissions.reduce((acc, curr) => acc + curr.percentage, 0) / totalCount).toFixed(1) : 0;
  const highestScore = totalCount > 0 ? Math.max(...submissions.map((s) => s.score)) : 0;
  const maxMarks = quizConfig?.questions.reduce((acc, q) => acc + (q.marks || 1), 0) || 10;

  // Render Login View if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="glass-panel max-w-md w-full p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-2">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">Administrator Portal</h2>
            <p className="text-xs text-slate-400">Please enter administrator credentials to access quiz results and settings.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Admin Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password (default: admin123)"
                className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-500 outline-none transition-all"
                autoFocus
              />
              {loginError && <p className="text-xs text-red-400 mt-2">{loginError}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full gradient-btn py-3 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              {isLoggingIn ? 'Authenticating...' : 'Log In to Dashboard'}
            </button>
          </form>

          <div className="text-center pt-4 border-t border-slate-800">
            <a href="/" className="text-xs text-slate-500 hover:text-indigo-400 transition-colors">
              ← Return to Participant Examination
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Admin Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white flex items-center gap-2">
                Teacher & Administrator Dashboard
              </h1>
              <p className="text-xs text-slate-400">{quizConfig?.title || 'Physics Quiz'} Submissions Overview</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleOpenQuizEditor}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
            >
              <Edit3 className="w-4 h-4" />
              Edit Quiz & Answer Key
            </button>

            <button
              onClick={fetchAdminData}
              className="p-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Refresh Submissions"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* MAIN ADMIN CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Total Participants</div>
              <div className="text-2xl font-extrabold text-white">{totalCount}</div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Average Score</div>
              <div className="text-2xl font-extrabold text-white">
                {avgScore} / {maxMarks} <span className="text-xs font-normal text-slate-400">({avgPercentage}%)</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Highest Score</div>
              <div className="text-2xl font-extrabold text-white">{highestScore} / {maxMarks}</div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium mb-1">Participant Score Visibility</div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  settings.showResultsToParticipants
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {settings.showResultsToParticipants ? 'VISIBLE (ON)' : 'HIDDEN (OFF)'}
                </span>
              </div>
            </div>

            <button
              onClick={handleToggleShowResults}
              className={`p-3 rounded-xl border transition-all ${
                settings.showResultsToParticipants
                  ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-600/30'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Toggle result visibility for participants"
            >
              {settings.showResultsToParticipants ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Action Controls & Excel Download Bar */}
        <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search & Sort */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search participant name..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500 w-full sm:w-auto"
            >
              <option value="date_desc">Latest Submission First</option>
              <option value="date_asc">Oldest Submission First</option>
              <option value="score_desc">Highest Score First</option>
              <option value="score_asc">Lowest Score First</option>
              <option value="name_asc">Participant Name (A-Z)</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={handleOpenQuizEditor}
              className="bg-indigo-600/20 border border-indigo-500/40 hover:bg-indigo-600/30 text-indigo-300 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all"
            >
              <Edit3 className="w-4 h-4" />
              Edit Questions ({quizConfig?.questions.length || 0})
            </button>

            {/* EXCEL EXPORT BUTTON */}
            <button
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download Excel (.xlsx)
            </button>

            {/* CLEAR ALL SUBMISSIONS BUTTON */}
            {submissions.length > 0 && (
              <button
                onClick={handleClearAllSubmissions}
                className="bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-400 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                title="Delete all participant responses"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Responses
              </button>
            )}
          </div>
        </div>

        {/* SUBMISSIONS TABLE */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Quiz Submissions Log ({filteredSubmissions.length})
            </h3>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Participant Name</th>
                  <th className="py-3.5 px-4">Submission Date & Time</th>
                  <th className="py-3.5 px-4 text-center">Score</th>
                  <th className="py-3.5 px-4 text-center">Percentage</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-500">
                      No quiz submissions found. Participant entries will appear here automatically.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((sub) => {
                    const dateStr = new Date(sub.submittedAt).toLocaleString();
                    return (
                      <tr key={sub.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-4 px-4 sm:px-6 font-semibold text-white">
                          {sub.participantName}
                        </td>
                        <td className="py-4 px-4 text-slate-400">{dateStr}</td>
                        <td className="py-4 px-4 text-center font-bold text-indigo-400">
                          {sub.score} / {sub.totalMarks}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-xs ${
                            sub.percentage >= 70
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : sub.percentage >= 50
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}>
                            {sub.percentage}%
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                          <button
                            onClick={() => setSelectedSubmission(sub)}
                            className="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 text-xs font-medium transition-all"
                          >
                            View Details
                          </button>

                          <button
                            onClick={() => handleDeleteSubmission(sub.id, sub.participantName)}
                            className="p-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500 transition-all inline-flex items-center"
                            title="Delete this submission"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* ADMIN QUIZ EDITOR MODAL */}
      {isEditModalOpen && editQuizData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-4xl w-full max-h-[92vh] rounded-3xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Quiz & Answer Key Editor</h3>
                  <p className="text-xs text-slate-400">Modify questions, answer choices, and correct answer keys.</p>
                </div>
              </div>

              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quiz General Settings */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {saveSuccessMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {saveSuccessMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Quiz Title</label>
                  <input
                    type="text"
                    value={editQuizData.title}
                    onChange={(e) => handleQuizTitleChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Instructions / Subtitle</label>
                  <input
                    type="text"
                    value={editQuizData.instructions}
                    onChange={(e) => handleQuizInstructionsChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Questions List ({editQuizData.questions.length})
                  </h4>

                  <button
                    onClick={handleAddQuestion}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1 shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    Add Question
                  </button>
                </div>

                {editQuizData.questions.map((q, qIdx) => (
                  <div key={q.id || qIdx} className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 space-y-4 relative">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                          {qIdx + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">Question Item</span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <label className="text-xs text-slate-400">Type:</label>
                          <select
                            value={q.type}
                            onChange={(e: any) => handleQuestionTypeChange(qIdx, e.target.value)}
                            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1 outline-none"
                          >
                            <option value="single_choice">Multiple Choice (MCQ)</option>
                            <option value="text">Short Text Answer</option>
                          </select>
                        </div>

                        <div className="flex items-center space-x-1">
                          <label className="text-xs text-slate-400">Marks:</label>
                          <input
                            type="number"
                            min={1}
                            value={q.marks || 1}
                            onChange={(e) => handleQuestionMarksChange(qIdx, parseInt(e.target.value) || 1)}
                            className="w-12 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 text-center outline-none"
                          />
                        </div>

                        <button
                          onClick={() => handleDeleteQuestion(qIdx)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                          title="Delete question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Question Text */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Question Prompt</label>
                      <textarea
                        rows={2}
                        value={q.question}
                        onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 outline-none"
                      ></textarea>
                    </div>

                    {/* Option Editor for Single Choice */}
                    {q.type === 'single_choice' && (
                      <div className="space-y-3 pt-2">
                        <label className="block text-xs text-slate-400 font-medium">
                          Answer Options & Correct Key (Select radio to set correct answer):
                        </label>

                        <div className="space-y-2">
                          {q.options.map((opt, oIdx) => {
                            const isCorrect = q.correctAnswer === opt;
                            return (
                              <div key={oIdx} className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSetCorrectAnswer(qIdx, opt)}
                                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                    isCorrect
                                      ? 'border-emerald-500 bg-emerald-600 text-white'
                                      : 'border-slate-600 bg-slate-800 text-transparent hover:border-emerald-500'
                                  }`}
                                  title="Set as correct answer"
                                >
                                  <Check className="w-3 h-3" />
                                </button>

                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => handleOptionTextChange(qIdx, oIdx, e.target.value)}
                                  placeholder={`Option ${oIdx + 1}`}
                                  className={`flex-1 bg-slate-950 border rounded-xl px-3 py-2 text-xs outline-none ${
                                    isCorrect
                                      ? 'border-emerald-500/60 text-emerald-300 font-semibold bg-emerald-950/20'
                                      : 'border-slate-800 text-slate-300'
                                  }`}
                                />

                                {isCorrect && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    CORRECT KEY
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleRemoveOption(qIdx, oIdx)}
                                  className="p-1 text-slate-500 hover:text-red-400"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddOption(qIdx)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 pt-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Option Choice
                        </button>
                      </div>
                    )}

                    {/* Correct Answer Input for Text */}
                    {q.type === 'text' && (
                      <div className="pt-2">
                        <label className="block text-xs text-slate-400 mb-1">Expected Correct Answer Text</label>
                        <input
                          type="text"
                          value={q.correctAnswer || ''}
                          onChange={(e) => handleSetCorrectAnswer(qIdx, e.target.value)}
                          placeholder="e.g. q=ne"
                          className="w-full bg-slate-950 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-emerald-300 font-semibold outline-none"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-all"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveQuizConfig}
                disabled={isSavingQuiz}
                className="gradient-btn px-6 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSavingQuiz ? 'Saving Changes...' : 'Save Quiz & Answer Key'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INDIVIDUAL SUBMISSION BREAKDOWN MODAL */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-3xl w-full max-h-[90vh] rounded-3xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Submission Breakdown: <span className="text-indigo-400">{selectedSubmission.participantName}</span>
                </h3>
                <p className="text-xs text-slate-400">Submitted on {new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
              </div>

              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Summary Box */}
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-slate-400">Total Score</div>
                <div className="text-xl font-bold text-white">{selectedSubmission.score} / {selectedSubmission.totalMarks}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Percentage</div>
                <div className="text-xl font-bold text-indigo-400">{selectedSubmission.percentage}%</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Evaluation</div>
                <div className="text-xl font-bold text-emerald-400">
                  {selectedSubmission.percentage >= 50 ? 'PASSED' : 'NEEDS IMPROVEMENT'}
                </div>
              </div>
            </div>

            {/* Answers Table */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Itemized Question Results</h4>

              <div className="space-y-4">
                {selectedSubmission.answers.map((ans, idx) => (
                  <div
                    key={ans.id || idx}
                    className={`p-4 rounded-2xl border ${
                      ans.isCorrect
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-red-950/20 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="text-sm font-semibold text-white">
                        <span className="text-indigo-400 mr-1.5">Q{idx + 1}.</span>
                        {ans.questionText}
                      </div>

                      <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
                        ans.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {ans.isCorrect ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {ans.marksAwarded} / {ans.maxMarks} Mark
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Participant Answer:</span>
                        <span className={`font-medium ${ans.isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                          {Array.isArray(ans.participantAnswer) ? ans.participantAnswer.join(', ') : ans.participantAnswer || '[No Answer]'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-0.5">Correct Answer Key:</span>
                        <span className="text-slate-200 font-medium">
                          {Array.isArray(ans.correctAnswer) ? ans.correctAnswer.join(', ') : ans.correctAnswer}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
              <button
                onClick={() => handleDeleteSubmission(selectedSubmission.id, selectedSubmission.participantName)}
                className="bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Delete Submission
              </button>

              <button
                onClick={() => setSelectedSubmission(null)}
                className="gradient-btn px-5 py-2 rounded-xl text-xs font-bold text-white"
              >
                Close Modal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        <p>© 2026 Physics Examination Admin Dashboard • Results Management System</p>
      </footer>
    </div>
  );
}
