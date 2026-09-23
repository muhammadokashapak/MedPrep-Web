import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen, Sliders, PlayCircle, CheckCircle2, ChevronRight,
  Clock, FileText, X, Trash2, ChevronLeft, Award, Target,
  TrendingUp, Library, GraduationCap, Zap, BarChart3,
  Loader, Pause, Play, Database, Atom, FlaskConical, Dna,
  Stethoscope, Activity
} from 'lucide-react';
import './index.css';

// --- MDCAT Imports ---
import physicsData from './data/physics.json';
import chemistryData from './data/chemistry.json';
import biologyData from './data/biology.json';

// --- MBBS Imports ---
import anatomyData from './data/mbbs/anatomy.json';
import physiologyData from './data/mbbs/physiology.json';
import biochemistryData from './data/mbbs/biochemistry.json';
import pathologyData from './data/mbbs/pathology.json';
import pharmacologyData from './data/mbbs/pharmacology.json';
import medicineData from './data/mbbs/medicine.json';
import surgeryData from './data/mbbs/surgery.json';
import paediatricsData from './data/mbbs/paediatrics.json';
import gynaecologyData from './data/mbbs/gynaecology.json';

const OFFLINE_DB = {
  Physics: physicsData,
  Chemistry: chemistryData,
  Biology: biologyData,
};

const OFFLINE_MBBS_DB = {
  Anatomy: anatomyData,
  Physiology: physiologyData,
  Biochemistry: biochemistryData,
  Pathology: pathologyData,
  Pharmacology: pharmacologyData,
  Medicine: medicineData,
  Surgery: surgeryData,
  Paediatrics: paediatricsData,
  Gynaecology: gynaecologyData,
};

const FCPS_GROUPS = {
  'Part 1 Basic Sciences': ['Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 'Pharmacology']
};

const MBBS_YEARS = {
  '1st Year': ['Anatomy', 'Physiology', 'Biochemistry'],
  '2nd Year': ['Anatomy', 'Physiology', 'Biochemistry'],
  '3rd Year': ['Pathology', 'Pharmacology'],
  'Final Year': ['Medicine', 'Surgery', 'Paediatrics', 'Gynaecology']
};

// ---------- Timer Hook ----------
function useTimer(initialSeconds, isRunning, isPaused, resetKey, onExpire) {
  const [seconds, setSeconds] = useState(() => {
    const saved = sessionStorage.getItem('medprep_timer');
    return saved ? Number(saved) : initialSeconds;
  });

  useEffect(() => {
    const saved = sessionStorage.getItem('medprep_timer');
    if (saved) { setSeconds(Number(saved)); return; }
    setSeconds(initialSeconds);
  }, [initialSeconds, resetKey]);

  useEffect(() => {
    if (isRunning) sessionStorage.setItem('medprep_timer', seconds);
  }, [seconds, isRunning]);

  useEffect(() => {
    if (!isRunning || isPaused) return;
    if (seconds <= 0) {
      if (onExpire) onExpire();
      return;
    }
    const interval = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning, isPaused, seconds]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return {
    display: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
    raw: seconds,
  };
}

// ============ MAIN APP ============
function App() {
  // ---- Views ----
  const [activeView, setActiveView] = useState('dashboard');

  // Theme & Saved
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('medprep_theme') === 'dark');
  const [savedQuestions, setSavedQuestions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('medprep_saved')) || []; } catch { return []; }
  });

  // ---- Paper Config ----
  const [selectedProgram, setSelectedProgram] = useState('MDCAT'); // 'MDCAT' or 'MBBS'
  
  // MDCAT specific
  const [selectedBoard, setSelectedBoard] = useState('FBISE');
  const [selectedSubjects, setSelectedSubjects] = useState(['Physics', 'Chemistry', 'Biology']);
  
  // MBBS specific
  const [selectedYear, setSelectedYear] = useState('1st Year');
  const [selectedMbbsSubjects, setSelectedMbbsSubjects] = useState(['Anatomy', 'Physiology', 'Biochemistry']);
  
  // FCPS specific
  const [selectedFcpsGroup, setSelectedFcpsGroup] = useState('Part 1 Basic Sciences');
  const [selectedFcpsSubjects, setSelectedFcpsSubjects] = useState(['Anatomy', 'Physiology', 'Pathology']);
  
  const [timerDuration, setTimerDuration] = useState(10800);
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  const [questionCount, setQuestionCount] = useState(200);

  // ---- Generation State ----
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateStatus, setGenerateStatus] = useState('');

  // ---- Test State ----
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [totalExpectedQuestions, setTotalExpectedQuestions] = useState(0);
  const [testResetKey, setTestResetKey] = useState(0);

  // ---- Theme & Saved Questions ----
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('medprep_theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('medprep_theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('medprep_saved', JSON.stringify(savedQuestions));
  }, [savedQuestions]);

  // ---- History ----
  const [testHistory, setTestHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('medprep_history')) || []; } catch { return []; }
  });

  const [attemptedMCQs, setAttemptedMCQs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('medprep_attempted')) || []; } catch { return []; }
  });

  const isShowingDialog = useRef(false);

  // ---- Persist History ----
  useEffect(() => {
    localStorage.setItem('medprep_history', JSON.stringify(testHistory));
  }, [testHistory]);

  useEffect(() => {
    localStorage.setItem('medprep_attempted', JSON.stringify(attemptedMCQs));
  }, [attemptedMCQs]);

  // ---- Session Backup ----
  useEffect(() => {
    if (isTestRunning) {
      sessionStorage.setItem('medprep_active_test', JSON.stringify({
        questions, answers, flagged, currentQ, testResetKey, isPaused,
        selectedProgram, selectedBoard, selectedSubjects, selectedYear, selectedMbbsSubjects, totalExpectedQuestions, timestamp: Date.now()
      }));
    } else {
      sessionStorage.removeItem('medprep_active_test');
    }
  }, [questions, answers, flagged, currentQ, isTestRunning, testResetKey, isPaused, selectedProgram, selectedBoard, selectedSubjects, selectedYear, selectedMbbsSubjects, totalExpectedQuestions]);

  // ---- Restore Session ----
  useEffect(() => {
    const savedTest = sessionStorage.getItem('medprep_active_test');
    if (savedTest && !isTestRunning && activeView === 'dashboard') {
      const data = JSON.parse(savedTest);
      if (window.confirm('Aap ka in-progress paper mehfooz hai. Kya aap resume karna chahte hen?')) {
        setQuestions(data.questions || []);
        setAnswers(data.answers || {});
        setFlagged(data.flagged || {});
        setCurrentQ(data.currentQ || 0);
        setSelectedProgram(data.selectedProgram || 'MDCAT');
        setSelectedBoard(data.selectedBoard || 'FBISE');
        setSelectedSubjects(data.selectedSubjects || []);
        setSelectedYear(data.selectedYear || '1st Year');
        setSelectedMbbsSubjects(data.selectedMbbsSubjects || []);
        setTotalExpectedQuestions(data.totalExpectedQuestions || (data.questions || []).length);
        setIsPaused(true);
        setIsTestRunning(true);
        setTestResetKey(data.testResetKey || 0);
        setActiveView('test');
      } else {
        sessionStorage.removeItem('medprep_active_test');
        sessionStorage.removeItem('medprep_timer');
      }
    }
  }, []);

  useEffect(() => {
    if (selectedProgram === 'FCPS') {
      setSelectedFcpsSubjects(FCPS_GROUPS[selectedFcpsGroup] || []);
    }
  }, [selectedFcpsGroup, selectedProgram]);

  // ---- Automatically update MBBS subjects when year changes ----
  useEffect(() => {
    if (selectedProgram === 'MBBS') {
      setSelectedMbbsSubjects(MBBS_YEARS[selectedYear] || []);
    }
  }, [selectedYear, selectedProgram]);

  // ---- Keyboard Shortcuts ----
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeView !== 'test' || isPaused || !isTestRunning) return;
      const key = e.key.toUpperCase();
      if (key === 'A' || key === '1') selectAnswer(currentQ, 0);
      else if (key === 'B' || key === '2') selectAnswer(currentQ, 1);
      else if (key === 'C' || key === '3') selectAnswer(currentQ, 2);
      else if (key === 'D' || key === '4') selectAnswer(currentQ, 3);
      else if (key === 'ARROWLEFT') setCurrentQ(c => Math.max(0, c - 1));
      else if (key === 'ARROWRIGHT') setCurrentQ(c => Math.min(questions.length - 1, c + 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView, isPaused, isTestRunning, currentQ, questions.length]);

  // ---- Anti-Cheat ----
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (isTestRunning && !isPaused && document.hidden && !isShowingDialog.current) {
        alert('🚨 Anti-Cheat Violation: Aap ne test k doran naya tab open kiya ya window minimize ki. Paper cancel kar diya gaya!');
        setIsTestRunning(false);
        setIsPaused(false);
        setActiveView('dashboard');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isTestRunning, isPaused]);

  // ---- Generate Test (Offline) ----
  const handleGenerateTest = () => {
    if (isTestRunning) {
      alert('⚠️ Aik test pehle se chal raha hai. Pehle usay finish karen.');
      return;
    }
    
    const activeSubjects = selectedProgram === 'MDCAT' ? selectedSubjects : selectedProgram === 'MBBS' ? selectedMbbsSubjects : selectedFcpsSubjects;
    
    if (activeSubjects.length === 0) {
      alert('⚠️ Kam az kam aik subject select karen!');
      return;
    }

    setIsGenerating(true);
    setGenerateStatus('🚀 Preparing Offline Paper...');

    setTimeout(() => {
      let pool = [];
      if (selectedProgram === 'MDCAT') {
        selectedSubjects.forEach(sub => { if (OFFLINE_DB[sub]) pool = [...pool, ...OFFLINE_DB[sub]]; });
      } else if (selectedProgram === 'MBBS') {
        selectedMbbsSubjects.forEach(sub => { if (OFFLINE_MBBS_DB[sub]) pool = [...pool, ...OFFLINE_MBBS_DB[sub].filter(q => q.examType === 'MBBS')]; });
      } else {
        selectedFcpsSubjects.forEach(sub => { if (OFFLINE_MBBS_DB[sub]) pool = [...pool, ...OFFLINE_MBBS_DB[sub].filter(q => q.examType === 'FCPS')]; });
      }
      
      if (difficultyFilter !== 'All') {
        pool = pool.filter(q => q.difficulty.toLowerCase() === difficultyFilter.toLowerCase());
      }

      // Filter unattempted
      let unattemptedPool = pool.filter(q => !attemptedMCQs.includes(q.id));
      let finalPool = [];
      
      if (unattemptedPool.length >= questionCount) {
        // We have enough unattempted questions
        for (let i = unattemptedPool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [unattemptedPool[i], unattemptedPool[j]] = [unattemptedPool[j], unattemptedPool[i]];
        }
        finalPool = unattemptedPool.slice(0, questionCount);
      } else {
        // Not enough unattempted, take all unattempted
        finalPool = [...unattemptedPool];
        
        let attemptedPool = pool.filter(q => attemptedMCQs.includes(q.id));
        for (let i = attemptedPool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [attemptedPool[i], attemptedPool[j]] = [attemptedPool[j], attemptedPool[i]];
        }
        
        const remainingNeeded = questionCount - finalPool.length;
        finalPool = [...finalPool, ...attemptedPool.slice(0, remainingNeeded)];
        
        // Shuffle the final pool one last time so unattempted are not always at the beginning
        for (let i = finalPool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [finalPool[i], finalPool[j]] = [finalPool[j], finalPool[i]];
        }
      }

      const selected = finalPool;

      if (selected.length === 0) {
        setIsGenerating(false);
        alert('⚠️ Selected subjects mein koi question nahi mila.');
        return;
      }

      setQuestions(selected);
      setTotalExpectedQuestions(selected.length);
      setAnswers({});
      setFlagged({});
      setCurrentQ(0);
      setShowResults(false);
      setIsPaused(false);
      setIsTestRunning(true);
      setTestResetKey(k => k + 1);
      setActiveView('test');
      setIsGenerating(false);
    }, 600);
  };

  // ---- Submit Test ----
  const handleSubmitTest = () => {
    setIsTestRunning(false);
    setShowResults(true);
    setActiveView('results');
    sessionStorage.removeItem('medprep_active_test');
    sessionStorage.removeItem('medprep_timer');
    const correct = questions.reduce((acc, q, i) => answers[i] === q.correct ? acc + 1 : acc, 0);
    
    const sourceString = selectedProgram === 'MDCAT' 
      ? `MDCAT - ${selectedBoard}` 
      : selectedProgram === 'MBBS' 
        ? `MBBS - ${selectedYear}`
        : `FCPS - ${selectedFcpsGroup}`;

    setTestHistory(prev => [{
      id: Date.now(),
      source: sourceString,
      date: new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) + ' at ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      total: questions.length,
      correct,
      score: Math.round((correct / questions.length) * 100),
    }, ...prev]);

    // Save attempted MCQs
    const newAttemptedIds = questions.map(q => q.id);
    setAttemptedMCQs(prev => Array.from(new Set([...prev, ...newAttemptedIds])));
  };

  const selectAnswer = (qIndex, optIndex) => {
    if (answers[qIndex] !== undefined) return;
    setAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const answeredCount = Object.keys(answers).length;
  const correctCount = questions.reduce((acc, q, i) => answers[i] === q.correct ? acc + 1 : acc, 0);

  // 3 hours = 10800 seconds
  const timerDisplay = useTimer(timerDuration, isTestRunning, isPaused, testResetKey, () => {
    alert("⏰ Time's up! Aap ka paper auto-submit ho gaya.");
    handleSubmitTest();
  });
  const isTimeLow = timerDisplay.raw > 0 && timerDisplay.raw <= 600;

  // ---- Navigation ----
  const navItems = [
    { id: 'saved', label: 'Saved Questions', icon: <Library size={20} /> },
    { id: 'dashboard', label: 'Dashboard', icon: <GraduationCap size={20} /> },
    { id: 'generate', label: 'Generate Paper', icon: <Sliders size={20} /> },
    { id: 'history', label: 'Test History', icon: <BarChart3 size={20} /> },
  ];

  const navigateTo = (view) => {
    if (isTestRunning && view !== 'test' && view !== 'results') {
      if (!isPaused) {
        isShowingDialog.current = true;
        const ok = window.confirm('Test chal raha hai! Navigate karne se pehle pause kar len. Continue anyway?');
        isShowingDialog.current = false;
        if (!ok) return;
      }
    } else {
      if (['dashboard', 'generate'].includes(view)) setShowResults(false);
    }
    setActiveView(view);
  };

  const toggleMdcatSubject = (sub) => setSelectedSubjects(prev => prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]);
  const toggleMbbsSubject = (sub) => setSelectedMbbsSubjects(prev => prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]);

  // Derived properties for UI
  const activeSubjects = selectedProgram === 'MDCAT' ? selectedSubjects : selectedMbbsSubjects;
  const totalAvailable = selectedProgram === 'MDCAT'
    ? selectedSubjects.reduce((acc, sub) => acc + (OFFLINE_DB[sub]?.length || 0), 0)
    : selectedProgram === 'MBBS'
      ? selectedMbbsSubjects.reduce((acc, sub) => acc + ((OFFLINE_MBBS_DB[sub] || []).filter(q => q.examType === 'MBBS').length || 0), 0)
      : selectedFcpsSubjects.reduce((acc, sub) => acc + ((OFFLINE_MBBS_DB[sub] || []).filter(q => q.examType === 'FCPS').length || 0), 0);
  const totalAllMCQs = 
    Object.values(OFFLINE_DB).reduce((acc, arr) => acc + arr.length, 0) + 
    Object.values(OFFLINE_MBBS_DB).reduce((acc, arr) => acc + arr.length, 0);

  // =========================================================
  return (
    <div className="app-container">

      {/* ======= SIDEBAR ======= */}
      {activeView !== 'test' && (
        <aside className="sidebar">
          <div className="brand" onClick={() => navigateTo('dashboard')} style={{ cursor: 'pointer' }}>
            <BookOpen size={28} color="var(--accent-primary)" />
            <span>Med<span style={{ color: 'var(--accent-primary)' }}>Prep</span> Academy</span>
          </div>

          <nav className="nav-menu" style={{ marginTop: '2rem' }}>
            {navItems.map(item => (
              <div
                key={item.id}
                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                onClick={() => navigateTo(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}
          </nav>

          <div className="sidebar-card" style={{ marginTop: 'auto' }}>
            <div className="flex items-center gap-2 mb-2">
              <Database size={18} color="var(--accent-secondary)" />
              <h4 style={{ fontSize: '0.9rem' }}>Comprehensive DB</h4>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {totalAllMCQs}+ MCQs available offline — for both MDCAT aspirants and MBBS students!
            </p>
            <button 
              className="btn btn-outline" 
              style={{ width: '100%', marginBottom: '1rem', justifyContent: 'center' }}
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
            </button>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${Math.min(testHistory.length * 10, 100)}%` }}></div>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{testHistory.length} tests completed</p>
          </div>
        </aside>
      )}

      {/* ======= MAIN ======= */}
      <main className="main-content">

        {/* ========== DASHBOARD ========== */}
        {activeView === 'dashboard' && (
          <div className="animate-fade-in">
            {isTestRunning && (
              <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--accent-warning)', background: 'var(--bg-surface-hover)' }}>
                <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ color: 'var(--accent-warning)', marginBottom: '0.25rem' }}>⚠️ Active Test in Progress</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Aap ka paper background mein active hai.</p>
                  </div>
                  <button className="btn btn-primary" onClick={() => navigateTo('test')}>
                    <PlayCircle size={18} /> Resume Paper
                  </button>
                </div>
              </div>
            )}

            <header className="page-header">
              <h1 className="page-title">Welcome to MedPrep Academy 👋</h1>
              <p className="page-subtitle">Pakistan k top medical colleges aur boards ka offline MCQ database. MDCAT aur MBBS Profs ki mukammal tayyari.</p>
            </header>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}><Database size={24} color="var(--accent-primary)" /></div>
                <div><p className="stat-label">Total Offline MCQs</p><h2 className="stat-value">{totalAllMCQs}+</h2></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}><Target size={24} color="var(--accent-secondary)" /></div>
                <div><p className="stat-label">Tests Taken</p><h2 className="stat-value">{testHistory.length}</h2></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}><TrendingUp size={24} color="var(--accent-warning)" /></div>
                <div><p className="stat-label">Avg. Score</p><h2 className="stat-value">{testHistory.length > 0 ? Math.round(testHistory.reduce((a, t) => a + t.score, 0) / testHistory.length) + '%' : '—'}</h2></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)' }}><Award size={24} color="#8B5CF6" /></div>
                <div><p className="stat-label">Best Score</p><h2 className="stat-value">{testHistory.length > 0 ? Math.max(...testHistory.map(t => t.score)) + '%' : '—'}</h2></div>
              </div>
            </div>

            <div className="quick-actions">
              <h3 style={{ marginBottom: '1.5rem' }}>Programs</h3>
              <div className="grid-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="action-card" onClick={() => { setSelectedProgram('MDCAT'); navigateTo('generate'); }}>
                  <Zap size={32} color="var(--accent-primary)" />
                  <h4>MDCAT Preparation</h4>
                  <p>FBISE, Punjab, Sindh boards ke pre-medical MCQs se practice karen.</p>
                </div>
                <div className="action-card" onClick={() => { setSelectedProgram('MBBS'); navigateTo('generate'); }}>
                  <Stethoscope size={32} color="var(--accent-secondary)" />
                  <h4>MBBS Prof Exams</h4>
                  <p>Medical students ke liye 1st Year se Final Year tak ke clinical aur basic sciences MCQs.</p>
                </div>
                <div className="action-card" onClick={() => { setSelectedProgram('FCPS'); navigateTo('generate'); }}>
                  <Activity size={32} color="#8B5CF6" />
                  <h4>FCPS Part 1</h4>
                  <p>Postgraduate residents ke liye basic sciences aur clinical pattern MCQs.</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2.5rem', marginBottom: '1rem' }}>
                <h3>Recent Results</h3>
                <button className="btn btn-outline" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#EF4444', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => { if(window.confirm('Clear all progress and attempted MCQs history?')) { setTestHistory([]); localStorage.setItem('medprep_attempted', '[]'); window.location.reload(); } }}>
                  <Trash2 size={14} /> Reset All Progress
                </button>
              </div>
              {testHistory.length > 0 && (
              <div style={{ marginTop: '2.5rem' }}>
                
                {testHistory.slice(0, 3).map(test => (
                  <div key={test.id} className="history-row">
                    <div className="flex items-center gap-4">
                      <div className="icon-box"><FileText size={20} /></div>
                      <div>
                        <h4 style={{ fontSize: '0.95rem' }}>{test.source}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{test.date} · {test.total} MCQs</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`score-pill ${test.score >= 80 ? 'score-high' : test.score >= 50 ? 'score-mid' : 'score-low'}`}>
                        {test.score}%
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{test.correct}/{test.total} correct</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== GENERATE PAPER ========== */}
        {activeView === 'generate' && (
          <div className="animate-fade-in">
            <header className="page-header">
              <h1 className="page-title">🎯 Generate Offline Paper</h1>
              <p className="page-subtitle">Select your program and subjects to generate a standard 3-Hour paper instantly.</p>
            </header>

            {/* Program Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <button
                className={`btn ${selectedProgram === 'MDCAT' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSelectedProgram('MDCAT')}
                style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }}
              >
                <Zap size={20} /> MDCAT Pre-Medical
              </button>
              <button
                className={`btn ${selectedProgram === 'MBBS' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSelectedProgram('MBBS')}
                style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }}
              >
                <Stethoscope size={20} /> MBBS Profs / Blocks
              </button>
              <button
                className={`btn ${selectedProgram === 'FCPS' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSelectedProgram('FCPS')}
                style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }}
              >
                <Activity size={20} /> FCPS Part 1
              </button>
            </div>

            <div className="grid-2">
              {/* Left: Config */}
              <div className="flex" style={{ flexDirection: 'column', gap: '1.5rem' }}>
                <div className="card">
                  <h3 style={{ marginBottom: '1.5rem' }}>📋 {selectedProgram} Configuration</h3>

                  {selectedProgram === 'MDCAT' && (
                    <div className="input-group animate-fade-in">
                      <label className="input-label">🎓 Select Board</label>
                      <select className="input-field" value={selectedBoard} onChange={e => setSelectedBoard(e.target.value)}>
                        <option value="FBISE">FBISE (Federal Board)</option>
                        <option value="Punjab">Punjab Boards</option>
                        <option value="Sindh">Sindh Boards</option>
                        <option value="KPK">KPK Boards</option>
                      </select>
                    </div>
                  )}

                  {selectedProgram === 'FCPS' && (
                    <div className="input-group animate-fade-in">
                      <label className="input-label">🎓 Select Group</label>
                      <select className="input-field" value={selectedFcpsGroup} onChange={e => setSelectedFcpsGroup(e.target.value)}>
                        {Object.keys(FCPS_GROUPS).map(grp => (
                          <option key={grp} value={grp}>{grp}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedProgram === 'MBBS' && (
                    <div className="input-group animate-fade-in">
                      <label className="input-label">🎓 Select Year / Level</label>
                      <select className="input-field" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                        {Object.keys(MBBS_YEARS).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="input-group" style={{ marginTop: '1.5rem' }}>
                    <label className="input-label">📚 Select Subjects</label>
                    <div className="flex" style={{ gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                      {selectedProgram === 'MDCAT' 
                        ? ['Physics', 'Chemistry', 'Biology'].map((name) => {
                          const isChecked = selectedSubjects.includes(name);
                          const color = name === 'Physics' ? '#3B82F6' : name === 'Chemistry' ? '#10B981' : '#8B5CF6';
                          return (
                            <button
                              key={name} onClick={() => toggleMdcatSubject(name)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '10px', cursor: 'pointer',
                                fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', background: isChecked ? color + '20' : 'var(--bg-surface-hover)',
                                border: isChecked ? `2px solid ${color}` : '2px solid transparent', color: isChecked ? color : 'var(--text-secondary)',
                              }}
                            >
                              {name} {isChecked && <CheckCircle2 size={14} />}
                            </button>
                          )
                        })
                        : selectedProgram === 'MBBS' ? (MBBS_YEARS[selectedYear] || []).map((name) => {
                          const isChecked = selectedMbbsSubjects.includes(name);
                          const color = '#3B82F6';
                          return (
                            <button
                              key={name} onClick={() => toggleMbbsSubject(name)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '10px', cursor: 'pointer',
                                fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', background: isChecked ? color + '20' : 'var(--bg-surface-hover)',
                                border: isChecked ? `2px solid ${color}` : '2px solid transparent', color: isChecked ? color : 'var(--text-secondary)',
                              }}
                            >
                              {name} {isChecked && <CheckCircle2 size={14} />}
                            </button>
                          )
                        }) : (FCPS_GROUPS[selectedFcpsGroup] || []).map((name) => {
                          const isChecked = selectedFcpsSubjects.includes(name);
                          const color = '#8B5CF6';
                          return (
                            <button
                              key={name} onClick={() => { setSelectedFcpsSubjects(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]) }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '10px', cursor: 'pointer',
                                fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', background: isChecked ? color + '20' : 'var(--bg-surface-hover)',
                                border: isChecked ? `2px solid ${color}` : '2px solid transparent', color: isChecked ? color : 'var(--text-secondary)',
                              }}
                            >
                              {name} {isChecked && <CheckCircle2 size={14} />}
                            </button>
                          )
                        })
                      }
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      {totalAvailable} questions available from selected subjects
                    </p>
                  </div>

                  <div className="grid-2" style={{ gap: '1rem', marginTop: '1.5rem' }}>
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">⏱️ Timer Duration</label>
                        <select className="input-field" value={timerDuration} onChange={e => setTimerDuration(Number(e.target.value))}>
                          <option value={1800}>30 Minutes</option>
                          <option value={3600}>1 Hour</option>
                          <option value={7200}>2 Hours</option>
                          <option value={10800}>3 Hours</option>
                        </select>
                      </div>
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">⭐ Difficulty Level</label>
                        <select className="input-field" value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value)}>
                          <option value="All">All Mix</option>
                          <option value="Easy">Easy Only</option>
                          <option value="Medium">Medium Only</option>
                          <option value="Hard">Hard Only</option>
                        </select>
                      </div>
                    </div>

                  <div className="input-group" style={{ marginTop: '1.5rem' }}>
                    <label className="input-label">📝 Number of Questions</label>
                    <input
                      type="number" className="input-field"
                      value={questionCount} min={5} max={200}
                      onChange={e => setQuestionCount(Math.max(5, Math.min(200, Number(e.target.value))))}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Min 5, Max 200 questions</p>
                  </div>
                </div>
              </div>

              {/* Right: Summary */}
              <div className="flex" style={{ flexDirection: 'column', gap: '1.5rem' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.08) 100%)' }}>
                  <h4 style={{ marginBottom: '1rem' }}>📊 Paper Summary</h4>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '2' }}>
                    <div className="flex justify-between">
                      <span>🎯 Program</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{selectedProgram}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>🎓 Category</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{selectedProgram === 'MDCAT' ? selectedBoard : selectedProgram === 'MBBS' ? selectedYear : selectedFcpsGroup}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>📚 Subjects</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{activeSubjects.length > 0 ? activeSubjects.join(', ') : 'None'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>📝 Questions</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{Math.min(questionCount, totalAvailable)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>⏱️ Duration</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{timerDuration / 60} Mins</strong>
                    </div>
                  </div>
                </div>

                {activeSubjects.length === 0 && (
                  <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.85rem', color: '#EF4444', textAlign: 'center' }}>
                    ⚠️ Kam az kam aik subject select karen
                  </div>
                )}

                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleGenerateTest}
                  disabled={isGenerating || activeSubjects.length === 0 || totalAvailable === 0}
                  style={(isGenerating || activeSubjects.length === 0 || totalAvailable === 0) ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                >
                  {isGenerating
                    ? <><Loader size={22} className="spin-animation" /> {generateStatus}</>
                    : <><PlayCircle size={22} /> Generate &amp; Start Paper</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========== TEST VIEW ========== */}
        {activeView === 'test' && isTestRunning && (
          <div className="animate-fade-in test-view">
            {/* Top Bar */}
            <div className="test-topbar">
              <button className="btn btn-outline" onClick={() => { setIsPaused(true); navigateTo('dashboard'); }}>
                <ChevronLeft size={18} /> Back to Home
              </button>
              <div className="test-progress-info">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {answeredCount}/{totalExpectedQuestions} answered
                </span>
                <div
                  className="timer-pill"
                  style={{
                    opacity: isPaused ? 0.5 : 1,
                    background: isTimeLow ? 'rgba(239, 68, 68, 0.1)' : '',
                    color: isTimeLow ? '#EF4444' : '',
                    animation: isTimeLow && !isPaused ? 'pulse 2s infinite' : 'none'
                  }}
                >
                  <Clock size={18} color={isTimeLow ? '#EF4444' : 'var(--accent-primary)'} />
                  <span style={{ fontWeight: isTimeLow ? 'bold' : 'normal' }}>{timerDisplay.display}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-outline" onClick={() => setIsPaused(!isPaused)}>
                  {isPaused ? <><Play size={18} /> Resume</> : <><Pause size={18} /> Pause</>}
                </button>
                <button className="btn btn-primary" onClick={() => {
                  if (answeredCount < totalExpectedQuestions) {
                    isShowingDialog.current = true;
                    const ok = window.confirm(`⚠️ ${totalExpectedQuestions - answeredCount} questions attempt nahi kiye. Submit karna chahte hain?`);
                    isShowingDialog.current = false;
                    if (ok) handleSubmitTest();
                  } else {
                    handleSubmitTest();
                  }
                }}>
                  Submit Paper <CheckCircle2 size={18} />
                </button>
              </div>
            </div>

            {isPaused ? (
              <div className="empty-state card" style={{ marginTop: '4rem' }}>
                <Pause size={48} color="var(--accent-warning)" />
                <h3 style={{ marginTop: '1rem', fontSize: '1.5rem' }}>Test is Paused</h3>
                <p>Timer ruk gaya hai. Jab tayyar hon, Resume par click karen.</p>
                <button className="btn btn-primary btn-lg" style={{ marginTop: '2rem' }} onClick={() => setIsPaused(false)}>
                  <Play size={20} /> Resume Paper
                </button>
              </div>
            ) : (
              <>
                {/* Progress bar */}
                <div className="test-progress-bar">
                  <div className="test-progress-fill" style={{ width: `${(answeredCount / totalExpectedQuestions) * 100}%` }}></div>
                </div>

                {/* Question Area */}
                <div className="test-question-area">
                  <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                    <span className="badge">Question {currentQ + 1} of {totalExpectedQuestions}</span>
                    <div className="flex gap-2">
                      <button
                        className={`btn ${flagged[currentQ] ? 'btn-primary' : 'btn-outline'}`}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', minHeight: 'unset' }}
                        onClick={() => setFlagged(p => ({ ...p, [currentQ]: !p[currentQ] }))}
                      >
                        🚩 {flagged[currentQ] ? 'Flagged' : 'Flag'}
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', minHeight: 'unset', color: savedQuestions.some(q => q.id === questions[currentQ]?.id) ? 'var(--accent-warning)' : 'inherit', borderColor: savedQuestions.some(q => q.id === questions[currentQ]?.id) ? 'var(--accent-warning)' : 'var(--border-light)' }}
                        onClick={() => {
                          const q = questions[currentQ];
                          if (savedQuestions.some(sq => sq.id === q.id)) {
                            setSavedQuestions(prev => prev.filter(sq => sq.id !== q.id));
                          } else {
                            setSavedQuestions(prev => [...prev, q]);
                          }
                        }}
                      >
                        ⭐ {savedQuestions.some(q => q.id === questions[currentQ]?.id) ? 'Saved' : 'Save'}
                      </button>
                      <span className={`badge ${questions[currentQ]?.difficulty === 'easy' ? 'badge-easy' : questions[currentQ]?.difficulty === 'medium' ? 'badge-medium' : questions[currentQ]?.difficulty === 'hard' ? 'badge-hard' : 'badge-technical'}`}>
                        {questions[currentQ]?.difficulty?.charAt(0).toUpperCase() + questions[currentQ]?.difficulty?.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Question text */}
                  <h2 className="question-text">{questions[currentQ]?.text || questions[currentQ]?.q}</h2>

                  {/* Options */}
                  <div className="options-list">
                    {(questions[currentQ]?.options || questions[currentQ]?.opts || []).map((opt, i) => {
                      const isAnswered = answers[currentQ] !== undefined;
                      const isSelected = answers[currentQ] === i;
                      const isCorrect = questions[currentQ]?.correct === i;

                      let optClass = 'option-card';
                      if (isAnswered) {
                        if (isCorrect) optClass += ' option-correct';
                        else if (isSelected) optClass += ' option-wrong';
                        else optClass += ' option-disabled';
                      } else if (isSelected) {
                        optClass += ' option-selected';
                      }

                      return (
                        <label
                          key={i}
                          className={optClass}
                          onClick={() => selectAnswer(currentQ, i)}
                          style={{ cursor: isAnswered ? 'default' : 'pointer' }}
                        >
                          <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                          <span className="option-text">{opt}</span>
                          {isAnswered && isCorrect && <CheckCircle2 size={18} color="#22C55E" style={{ marginLeft: 'auto' }} />}
                          {isAnswered && isSelected && !isCorrect && <X size={18} color="#EF4444" style={{ marginLeft: 'auto' }} />}
                        </label>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {answers[currentQ] !== undefined && (
                    <div className="explanation-box animate-fade-in">
                      <h4>💡 Explanation</h4>
                      <p>{questions[currentQ]?.explanation}</p>
                      {questions[currentQ]?.source && (
                        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem' }}>
                          📌 Source: <strong>{questions[currentQ]?.source}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="test-nav">
                  <button className="btn btn-outline" disabled={currentQ === 0} onClick={() => setCurrentQ(c => c - 1)}>
                    <ChevronLeft size={18} /> Previous
                  </button>

                  {totalExpectedQuestions > 50 ? (
                    <select
                      className="input-field"
                      style={{ width: 'auto', padding: '0.4rem 0.8rem', height: 'auto', fontSize: '0.85rem' }}
                      value={currentQ}
                      onChange={e => setCurrentQ(Number(e.target.value))}
                    >
                      {questions.map((_, i) => (
                        <option key={i} value={i}>Q{i + 1} {answers[i] !== undefined ? '✓' : ''} {flagged[i] ? '🚩' : ''}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="question-dots">
                      {questions.map((_, i) => (
                        <button
                          key={i}
                          className={`q-dot ${i === currentQ ? 'q-dot-active' : ''} ${answers[i] !== undefined ? 'q-dot-answered' : ''} ${flagged[i] ? 'q-dot-flagged' : ''}`}
                          onClick={() => setCurrentQ(i)}
                          title={`Q${i + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  <button
                    className="btn btn-primary"
                    disabled={currentQ === questions.length - 1}
                    onClick={() => setCurrentQ(c => c + 1)}
                  >
                    Next <ChevronRight size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========== RESULTS ========== */}
        {activeView === 'results' && showResults && (
          <div className="animate-fade-in results-view">
            <div className="results-header">
              <div className="results-score-circle">
                <svg viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border-light)" strokeWidth="8" />
                  <circle cx="60" cy="60" r="52" fill="none"
                    stroke={correctCount / questions.length >= 0.8 ? 'var(--accent-secondary)' : correctCount / questions.length >= 0.5 ? 'var(--accent-warning)' : '#EF4444'}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${(correctCount / questions.length) * 327} 327`}
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div className="score-center-text">
                  <span className="score-big">{Math.round((correctCount / questions.length) * 100)}%</span>
                  <span className="score-sub">Score</span>
                </div>
              </div>

              <h1 className="page-title" style={{ marginTop: '1.5rem' }}>
                {correctCount / questions.length >= 0.8 ? '🎉 Excellent!' : correctCount / questions.length >= 0.5 ? '👍 Good effort!' : '💪 Keep practicing!'}
              </h1>
              <p className="page-subtitle" style={{ maxWidth: 'none' }}>
                Aap ne {questions.length} MCQs mein se <strong>{correctCount} correct</strong> aur <strong>{questions.length - correctCount} incorrect</strong> kiye.
              </p>

              <div className="flex gap-4" style={{ marginTop: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => {
                  setAnswers({});
                  setFlagged({});
                  setCurrentQ(0);
                  setShowResults(false);
                  setIsPaused(false);
                  setIsTestRunning(true);
                  setTestResetKey(k => k + 1);
                  sessionStorage.removeItem('medprep_timer');
                  setActiveView('test');
                }}>Retake Same Paper</button>
                <button className="btn btn-outline" onClick={() => window.print()}>🖨️ Print as PDF</button>
                <button className="btn btn-outline" onClick={() => navigateTo('generate')}>New Paper Generate</button>
                <button className="btn btn-outline" onClick={() => navigateTo('dashboard')}>Dashboard</button>
              </div>

              <div className="grid-2" style={{ marginTop: '3rem', marginBottom: '2rem' }}>
                <div className="card">
                  <h4 style={{ marginBottom: '1rem' }}>📊 Performance by Difficulty</h4>
                  {['easy', 'medium', 'hard', 'technical'].map(diff => {
                    const qIds = questions.map((q, i) => q.difficulty === diff ? i : -1).filter(i => i !== -1);
                    if (qIds.length === 0) return null;
                    const cCount = qIds.reduce((acc, id) => answers[id] === questions[id].correct ? acc + 1 : acc, 0);
                    return (
                      <div key={diff} className="flex justify-between items-center" style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        <span>{diff.charAt(0).toUpperCase() + diff.slice(1)}</span>
                        <strong style={{ color: cCount / qIds.length >= 0.5 ? 'var(--accent-secondary)' : '#EF4444' }}>{cCount} / {qIds.length}</strong>
                      </div>
                    );
                  })}
                </div>
                <div className="card" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                  <h4 style={{ marginBottom: '1rem' }}>🚩 Flagged Questions</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Aap ne test k doran <strong>{Object.values(flagged).filter(Boolean).length}</strong> questions flag kiye thay. Niche detailed review mein unhe dekhein.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '3rem' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>📋 Detailed Review</h3>
              {questions.map((q, i) => {
                const userAns = answers[i];
                const isCorrect = userAns === q.correct;
                const isUnanswered = userAns === undefined;
                return (
                  <div key={i} className={`review-card ${isCorrect ? 'review-correct' : 'review-incorrect'}`}>
                    <div className="review-header">
                      <span className="badge">Q{i + 1}</span>
                      {flagged[i] && <span className="badge" style={{ background: 'var(--accent-warning)', color: '#fff', border: 'none' }}>🚩 Flagged</span>}
                      <span className={`badge ${q.difficulty === 'easy' ? 'badge-easy' : q.difficulty === 'medium' ? 'badge-medium' : q.difficulty === 'hard' ? 'badge-hard' : 'badge-technical'}`}>
                        {q.difficulty?.charAt(0).toUpperCase() + q.difficulty?.slice(1)}
                      </span>
                      {isCorrect
                        ? <span className="review-status review-status-correct"><CheckCircle2 size={16} /> Correct</span>
                        : <span className="review-status review-status-wrong"><X size={16} /> {isUnanswered ? 'Not Attempted' : 'Incorrect'}</span>
                      }
                    </div>
                    <p className="review-question">{q.text || q.q}</p>
                    <div className="review-options">
                      {(q.options || q.opts || []).map((opt, j) => (
                        <div key={j} className={`review-opt ${j === q.correct ? 'review-opt-correct' : ''} ${j === userAns && j !== q.correct ? 'review-opt-wrong' : ''}`}>
                          <span className="option-letter-sm">{String.fromCharCode(65 + j)}</span>
                          <span>{opt}</span>
                          {j === q.correct && <CheckCircle2 size={14} color="var(--accent-secondary)" style={{ marginLeft: 'auto' }} />}
                          {j === userAns && j !== q.correct && <X size={14} color="#EF4444" style={{ marginLeft: 'auto' }} />}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <div className="explanation-box" style={{ marginTop: '1rem', padding: '1rem' }}>
                        <h4 style={{ marginBottom: '0.25rem', fontSize: '0.9rem' }}>💡 Explanation</h4>
                        <p style={{ fontSize: '0.85rem' }}>{q.explanation}</p>
                        {q.source && (
                          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem' }}>
                            📌 Source: <strong>{q.source}</strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========== SAVED QUESTIONS ========== */}
        {activeView === 'saved' && (
          <div className="animate-fade-in">
            <header className="page-header">
              <h1 className="page-title">⭐ Saved Questions</h1>
              <p className="page-subtitle">Aap ne jo questions save kiye thay wo yahan mojood hain.</p>
            </header>
            
            {savedQuestions.length === 0 ? (
              <div className="empty-state card">
                <Library size={48} color="var(--text-muted)" />
                <h3>No saved questions</h3>
                <p>Test ke doran kisi bhi mushkil sawal ko 'Save' karein taa ke baad mein revise kar sakein.</p>
              </div>
            ) : (
              <div style={{ marginTop: '2rem' }}>
                {savedQuestions.map((q, i) => (
                  <div key={i} className="review-card" style={{ borderLeftColor: 'var(--accent-warning)' }}>
                    <div className="review-header">
                      <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>{q.subject || q.examType || 'Saved'}</span>
                      <span className={`badge ${q.difficulty === 'easy' ? 'badge-easy' : q.difficulty === 'medium' ? 'badge-medium' : q.difficulty === 'hard' ? 'badge-hard' : 'badge-technical'}`}>
                        {q.difficulty?.charAt(0).toUpperCase() + q.difficulty?.slice(1)}
                      </span>
                      <button className="btn btn-outline" style={{ marginLeft: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.8rem', color: '#EF4444', borderColor: 'transparent' }} onClick={() => setSavedQuestions(prev => prev.filter(sq => sq.id !== q.id))}>
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                    <p className="review-question">{q.text || q.q}</p>
                    <div className="review-options">
                      {(q.options || q.opts || []).map((opt, j) => (
                        <div key={j} className={`review-opt ${j === q.correct ? 'review-opt-correct' : ''}`}>
                          <span className="option-letter-sm">{String.fromCharCode(65 + j)}</span>
                          <span>{opt}</span>
                          {j === q.correct && <CheckCircle2 size={14} color="var(--accent-secondary)" style={{ marginLeft: 'auto' }} />}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <div className="explanation-box" style={{ marginTop: '1rem', padding: '1rem' }}>
                        <h4 style={{ marginBottom: '0.25rem', fontSize: '0.9rem' }}>💡 Explanation</h4>
                        <p style={{ fontSize: '0.85rem' }}>{q.explanation}</p>
                        {q.source && (
                          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem' }}>
                            📌 Source: <strong>{q.source}</strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== TEST HISTORY ========== */}
        {activeView === 'history' && (
          <div className="animate-fade-in">
            <header className="page-header flex justify-between items-end" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 className="page-title">📊 Test History</h1>
                <p className="page-subtitle">Apni sab tests ka record aur performance track karen.</p>
              </div>
              {testHistory.length > 0 && (
                <button
                  className="btn btn-outline"
                  onClick={() => { if (window.confirm('Kya aap waqai sari history delete karna chahte hain?')) setTestHistory([]); }}
                  style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                >
                  <Trash2 size={16} /> Clear All
                </button>
              )}
            </header>

            {testHistory.length === 0 ? (
              <div className="empty-state card">
                <BarChart3 size={48} color="var(--text-muted)" />
                <h3>No tests taken yet</h3>
                <p>Pehla paper generate kar k attempt karen — phir yahan aap ka record show hoga.</p>
                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigateTo('generate')}>
                  <PlayCircle size={18} /> Generate Paper
                </button>
              </div>
            ) : (
              <div className="books-list">
                {testHistory.map(test => (
                  <div key={test.id} className="book-item">
                    <div className="flex items-center gap-4">
                      <div className="book-icon"><FileText size={22} /></div>
                      <div>
                        <h4 style={{ fontSize: '0.95rem' }}>{test.source}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{test.date} · {test.total} MCQs</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`score-pill ${test.score >= 80 ? 'score-high' : test.score >= 50 ? 'score-mid' : 'score-low'}`}>{test.score}%</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{test.correct}/{test.total}</span>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.3rem', border: 'none' }}
                        onClick={() => setTestHistory(p => p.filter(t => t.id !== test.id))}
                      >
                        <X size={16} color="var(--text-muted)" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* ======= MOBILE BOTTOM NAV ======= */}
      {activeView !== 'test' && activeView !== 'results' && (
        <nav className="mobile-nav">
          {navItems.map(item => (
            <div
              key={item.id}
              className={`mobile-nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => navigateTo(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      )}

    </div>
  );
}

export default App;
