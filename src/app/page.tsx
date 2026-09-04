'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  ShieldCheck, 
  User, 
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Lock,
  ArrowRight,
  RotateCcw,
  Share,
  Smartphone,
  PlusSquare,
  X
} from 'lucide-react';

interface Question {
  id: string;
  question: string;
  type: 'single_choice' | 'multiple_choice' | 'text';
  options: string[];
  marks: number;
}

interface QuizData {
  id: string;
  title: string;
  instructions: string;
  showResultsToParticipants: boolean;
  questions: Question[];
}

export default function ParticipantQuizPage() {
  // Screen state: 'welcome' | 'quiz' | 'submitted'
  const [screen, setScreen] = useState<'welcome' | 'quiz' | 'submitted'>('welcome');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // iOS PWA Detection State
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState<boolean>(false);

  // User input states
  const [participantName, setParticipantName] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  // Submission modal & submission state
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<{
    submissionId?: string;
    message?: string;
    showResults?: boolean;
    score?: number;
    totalMarks?: number;
    percentage?: number;
    submittedAt?: string;
  } | null>(null);

  // Fetch Quiz configuration & check iOS device status
  useEffect(() => {
    async function fetchQuiz() {
      try {
        setLoading(true);
        const res = await fetch('/api/quiz');
        if (!res.ok) throw new Error('Failed to load quiz data');
        const data = await res.json();
        setQuizData(data);
      } catch (err: any) {
        setError(err.message || 'Error loading quiz');
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();

    // Detect iOS Device (iPhone / iPad) & standalone state
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIPhoneDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandaloneMode = ('standalone' in window.navigator && (window.navigator as any).standalone) || window.matchMedia('(display-mode: standalone)').matches;

    if (isIPhoneDevice && !isStandaloneMode) {
      setIsIOS(true);
      setShowIOSPrompt(true);
    }

    // Restore saved sessionStorage
    const savedName = sessionStorage.getItem('physics_quiz_name');
    const savedAnswers = sessionStorage.getItem('physics_quiz_answers');
    if (savedName) setParticipantName(savedName);
    if (savedAnswers) {
      try {
        setAnswers(JSON.parse(savedAnswers));
      } catch (e) {}
    }
  }, []);

  // Save progress to sessionStorage
  useEffect(() => {
    if (participantName) {
      sessionStorage.setItem('physics_quiz_name', participantName);
    }
    if (Object.keys(answers).length > 0) {
      sessionStorage.setItem('physics_quiz_answers', JSON.stringify(answers));
    }
  }, [participantName, answers]);

  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantName.trim()) {
      setNameError('Please enter your full name to start the examination.');
      return;
    }
    setNameError('');
    setScreen('quiz');
  };

  const handleAnswerSelect = (questionId: string, answerValue: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerValue,
    }));
  };

  const handleClearAnswer = (questionId: string) => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  const handleSubmitQuiz = async () => {
    if (!quizData) return;
    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantName: participantName.trim(),
          answers,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setSubmissionResult(data);
      setScreen('submitted');
      
      sessionStorage.removeItem('physics_quiz_answers');
    } catch (err: any) {
      alert('Error submitting quiz: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNewUser = () => {
    sessionStorage.removeItem('physics_quiz_name');
    sessionStorage.removeItem('physics_quiz_answers');
    setParticipantName('');
    setAnswers({});
    setCurrentQuestionIdx(0);
    setSubmissionResult(null);
    setScreen('welcome');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <BookOpen className="w-6 h-6 text-indigo-400 absolute" />
        </div>
        <p className="text-slate-300 font-medium tracking-wide">Loading Examination Portal...</p>
      </div>
    );
  }

  if (error || !quizData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="glass-panel max-w-md w-full p-8 rounded-2xl text-center border border-red-500/30">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Unable to Load Quiz</h2>
          <p className="text-slate-400 text-sm mb-6">{error || 'Quiz setup not found.'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="gradient-btn px-6 py-2.5 rounded-xl font-semibold text-white text-sm"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const currentQ = quizData.questions[currentQuestionIdx];
  const totalQuestions = quizData.questions.length;
  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim().length > 0).length;
  const progressPercentage = Math.round(((currentQuestionIdx + 1) / totalQuestions) * 100);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white pt-safe pb-safe">
      {/* Top Banner Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-2">
                {quizData.title}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold hidden sm:inline-block">
                  PWA Portal
                </span>
              </h1>
              <p className="text-xs text-slate-400">{quizData.instructions}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {screen === 'quiz' && (
              <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs">
                <User className="w-4 h-4 text-indigo-400" />
                <span className="text-slate-200 font-medium">{participantName}</span>
              </div>
            )}

            <a
              href="/admin"
              className="text-xs font-medium text-slate-400 hover:text-indigo-400 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-indigo-500/30 transition-colors flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              Admin Access
            </a>
          </div>
        </div>
      </header>

      {/* iOS iPhone App Install Guide Banner */}
      {showIOSPrompt && screen === 'welcome' && (
        <div className="max-w-4xl mx-auto px-4 pt-4 w-full">
          <div className="bg-gradient-to-r from-indigo-900/80 via-purple-900/80 to-slate-900 border border-indigo-500/40 rounded-2xl p-4 flex items-center justify-between text-xs text-indigo-200 shadow-xl relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 text-white shadow-md">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white block text-sm mb-0.5">Install on iPhone / iPad App</span>
                <p className="text-indigo-300">
                  Tap Safari's <strong className="text-white">Share button</strong> <Share className="w-3.5 h-3.5 inline mx-0.5" /> and select <strong className="text-white">'Add to Home Screen'</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5" /> for full-screen PWA experience.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSPrompt(false)}
              className="p-1.5 text-indigo-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        
        {/* ================= SCREEN 1: WELCOME & NAME ENTRY ================= */}
        {screen === 'welcome' && (
          <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
            {/* Background glowing gradients */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20 mb-6">
                <Smartphone className="w-3.5 h-3.5" />
                iOS & Mobile Progressive Web App
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
                Welcome to <span className="gradient-text">{quizData.title}</span>
              </h2>
              <p className="text-slate-400 text-sm sm:text-base mb-8 leading-relaxed">
                Please enter your registered full name below to commence the examination. Ensure you have a stable internet connection before proceeding.
              </p>

              {/* Instructions Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="glass-panel-light p-4 rounded-2xl border border-slate-800/80">
                  <div className="text-slate-400 text-xs mb-1">Total Questions</div>
                  <div className="text-xl font-bold text-white">{totalQuestions} Items</div>
                </div>
                <div className="glass-panel-light p-4 rounded-2xl border border-slate-800/80">
                  <div className="text-slate-400 text-xs mb-1">Question Types</div>
                  <div className="text-xl font-bold text-white">MCQ & Short Ans</div>
                </div>
                <div className="glass-panel-light p-4 rounded-2xl border border-slate-800/80">
                  <div className="text-slate-400 text-xs mb-1">Result Notice</div>
                  <div className="text-xl font-bold text-indigo-400">Admin Managed</div>
                </div>
              </div>

              <form onSubmit={handleStartQuiz} className="space-y-5">
                <div>
                  <label htmlFor="participantName" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Participant Full Name <span className="text-indigo-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      id="participantName"
                      type="text"
                      value={participantName}
                      onChange={(e) => {
                        setParticipantName(e.target.value);
                        if (nameError) setNameError('');
                      }}
                      placeholder="e.g. Alexander Fleming"
                      className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white rounded-xl pl-11 pr-4 py-3 text-sm placeholder-slate-500 transition-all outline-none"
                      autoFocus
                    />
                  </div>
                  {nameError && (
                    <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {nameError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full gradient-btn text-white py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  Start Examination
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-800/60 flex items-center gap-2 text-slate-500 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Your responses are logged securely. Results remain private until released by the administrator.</span>
              </div>
            </div>
          </div>
        )}


        {/* ================= SCREEN 2: EXAM INTERFACE ================= */}
        {screen === 'quiz' && (
          <div className="space-y-6">
            {/* Top Examination Progress Header */}
            <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Question {currentQuestionIdx + 1} of {totalQuestions}
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    Participant: <strong className="text-slate-200">{participantName}</strong>
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-medium">
                    {answeredCount} of {totalQuestions} Answered
                  </span>
                </div>
              </div>

              {/* Progress bar line */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Question Card */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 relative">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg sm:text-xl font-semibold text-white leading-relaxed">
                  <span className="text-indigo-400 mr-2">Q{currentQuestionIdx + 1}.</span>
                  {currentQ.question}
                </h3>
                <span className="shrink-0 text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                  {currentQ.marks || 1} Mark
                </span>
              </div>

              {/* OPTIONS / INPUT AREA */}
              <div className="pt-2">
                {currentQ.type === 'single_choice' && (
                  <div className="space-y-3">
                    {currentQ.options.map((opt, oIdx) => {
                      const isSelected = answers[currentQ.id] === opt;
                      return (
                        <label
                          key={oIdx}
                          onClick={() => handleAnswerSelect(currentQ.id, opt)}
                          className={`flex items-center p-4 rounded-xl border text-sm font-medium cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                              : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 shrink-0 transition-colors ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-600 text-white'
                                : 'border-slate-600 bg-slate-800'
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                          </div>
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {currentQ.type === 'text' && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-2 font-medium">Type your answer below:</label>
                    <textarea
                      rows={3}
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => handleAnswerSelect(currentQ.id, e.target.value)}
                      placeholder="Enter formula, value, or definition..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    ></textarea>
                  </div>
                )}
              </div>

              {/* Clear Option Button */}
              {answers[currentQ.id] && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => handleClearAnswer(currentQ.id)}
                    className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Clear Choice
                  </button>
                </div>
              )}
            </div>

            {/* Question Navigation Palette & Action Bar */}
            <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-slate-800 flex flex-col gap-6">
              {/* Question numbers palette */}
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Question Quick Palette
                </div>
                <div className="flex flex-wrap gap-2">
                  {quizData.questions.map((q, idx) => {
                    const isAnswered = answers[q.id]?.trim().length > 0;
                    const isCurrent = idx === currentQuestionIdx;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIdx(idx)}
                        className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                          isCurrent
                            ? 'ring-2 ring-indigo-400 bg-indigo-600 text-white shadow-md'
                            : isAnswered
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-800/80 border border-slate-700/60 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Next / Previous / Submit Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestionIdx === 0}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                {currentQuestionIdx < totalQuestions - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIdx((prev) => Math.min(totalQuestions - 1, prev + 1))}
                    className="gradient-btn px-5 py-2.5 rounded-xl text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                  >
                    Next Question
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Submit Quiz
                  </button>
                )}
              </div>
            </div>
          </div>
        )}


        {/* ================= SCREEN 3: SUBMISSION SUCCESS (HIDDEN RESULTS) ================= */}
        {screen === 'submitted' && (
          <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 text-center max-w-xl mx-auto shadow-2xl relative overflow-hidden">
            {/* Success icon banner */}
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Quiz Submitted Successfully!
            </h2>

            {/* Score Privacy Notice Alert Box */}
            <div className="glass-panel-light p-4 rounded-2xl border border-indigo-500/30 text-left mb-6 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Lock className="w-4 h-4" />
                Score Privacy Enforced
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                Your result is currently hidden. Please contact the administrator for your result.
              </p>
              <p className="text-slate-400 text-xs leading-relaxed border-t border-slate-800/80 pt-2">
                {submissionResult?.message ||
                  'Your quiz has been submitted successfully. Your result will be announced by the administrator.'}
              </p>
            </div>

            {/* Submission metadata summary */}
            <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 text-xs text-left space-y-2.5 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Participant Name:</span>
                <span className="font-semibold text-white">{participantName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Submission Date & Time:</span>
                <span className="text-slate-300">{new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Submission Reference ID:</span>
                <span className="font-mono text-indigo-400">{submissionResult?.submissionId || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-800 pt-2">
                <span className="text-slate-400">Total Questions Processed:</span>
                <span className="font-semibold text-emerald-400">{totalQuestions} Items Saved</span>
              </div>
            </div>

            <button
              onClick={handleResetForNewUser}
              className="w-full gradient-btn py-3 px-6 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              Start New Attempt (Different Participant)
            </button>
          </div>
        )}

      </main>

      {/* CONFIRMATION SUBMISSION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="glass-panel max-w-md w-full p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Confirm Submission</h3>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed">
              Are you sure you want to submit your quiz? You will not be able to change your answers after submission.
            </p>

            <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Participant:</span>
                <span className="font-semibold text-white">{participantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Answered Questions:</span>
                <span className="font-semibold text-emerald-400">{answeredCount} of {totalQuestions}</span>
              </div>
              {totalQuestions - answeredCount > 0 && (
                <div className="flex justify-between text-amber-400 font-medium pt-1 border-t border-slate-800">
                  <span>Unanswered Questions:</span>
                  <span>{totalQuestions - answeredCount} Question(s)</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-all"
              >
                Back to Quiz
              </button>
              <button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Yes, Submit Quiz
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 text-center text-xs text-slate-500">
        <p>© 2026 Physics Examination Portal • Progressive Web Application</p>
      </footer>
    </div>
  );
}
