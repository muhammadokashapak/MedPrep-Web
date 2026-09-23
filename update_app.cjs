const fs = require('fs');
const path = require('path');

let content = fs.readFileSync(path.join(__dirname, 'src/App.jsx'), 'utf-8');

// 1. Add FCPS Groups and modify initial states
content = content.replace(
  `const MBBS_YEARS = {`,
  `const FCPS_GROUPS = {
  'Part 1 Basic Sciences': ['Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 'Pharmacology']
};

const MBBS_YEARS = {`
);

content = content.replace(
  `const [activeView, setActiveView] = useState('dashboard');`,
  `const [activeView, setActiveView] = useState('dashboard');

  // Theme & Saved
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('medprep_theme') === 'dark');
  const [savedQuestions, setSavedQuestions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('medprep_saved')) || []; } catch { return []; }
  });`
);

content = content.replace(
  `const [selectedMbbsSubjects, setSelectedMbbsSubjects] = useState(['Anatomy', 'Physiology', 'Biochemistry']);`,
  `const [selectedMbbsSubjects, setSelectedMbbsSubjects] = useState(['Anatomy', 'Physiology', 'Biochemistry']);
  
  // FCPS specific
  const [selectedFcpsGroup, setSelectedFcpsGroup] = useState('Part 1 Basic Sciences');
  const [selectedFcpsSubjects, setSelectedFcpsSubjects] = useState(['Anatomy', 'Physiology', 'Pathology']);
  
  const [timerDuration, setTimerDuration] = useState(10800);
  const [difficultyFilter, setDifficultyFilter] = useState('All');`
);

// Add Dark Mode & Saved useEffects
content = content.replace(
  `  // ---- History ----`,
  `  // ---- Theme & Saved Questions ----
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

  // ---- History ----`
);

// FCPS Auto Update
content = content.replace(
  `  // ---- Automatically update MBBS subjects when year changes ----`,
  `  useEffect(() => {
    if (selectedProgram === 'FCPS') {
      setSelectedFcpsSubjects(FCPS_GROUPS[selectedFcpsGroup] || []);
    }
  }, [selectedFcpsGroup, selectedProgram]);

  // ---- Automatically update MBBS subjects when year changes ----`
);

// Fix Test Generate Logic
content = content.replace(
  `const activeSubjects = selectedProgram === 'MDCAT' ? selectedSubjects : selectedMbbsSubjects;`,
  `const activeSubjects = selectedProgram === 'MDCAT' ? selectedSubjects : selectedProgram === 'MBBS' ? selectedMbbsSubjects : selectedFcpsSubjects;`
);

content = content.replace(
  `if (selectedProgram === 'MDCAT') {
        selectedSubjects.forEach(sub => { if (OFFLINE_DB[sub]) pool = [...pool, ...OFFLINE_DB[sub]]; });
      } else {
        selectedMbbsSubjects.forEach(sub => { if (OFFLINE_MBBS_DB[sub]) pool = [...pool, ...OFFLINE_MBBS_DB[sub]]; });
      }`,
  `if (selectedProgram === 'MDCAT') {
        selectedSubjects.forEach(sub => { if (OFFLINE_DB[sub]) pool = [...pool, ...OFFLINE_DB[sub]]; });
      } else if (selectedProgram === 'MBBS') {
        selectedMbbsSubjects.forEach(sub => { if (OFFLINE_MBBS_DB[sub]) pool = [...pool, ...OFFLINE_MBBS_DB[sub].filter(q => q.examType === 'MBBS')]; });
      } else {
        selectedFcpsSubjects.forEach(sub => { if (OFFLINE_MBBS_DB[sub]) pool = [...pool, ...OFFLINE_MBBS_DB[sub].filter(q => q.examType === 'FCPS')]; });
      }
      
      if (difficultyFilter !== 'All') {
        pool = pool.filter(q => q.difficulty.toLowerCase() === difficultyFilter.toLowerCase());
      }`
);

content = content.replace(
  `const sourceString = selectedProgram === 'MDCAT' 
      ? \`MDCAT - \${selectedBoard}\` 
      : \`MBBS - \${selectedYear}\`;`,
  `const sourceString = selectedProgram === 'MDCAT' 
      ? \`MDCAT - \${selectedBoard}\` 
      : selectedProgram === 'MBBS' 
        ? \`MBBS - \${selectedYear}\`
        : \`FCPS - \${selectedFcpsGroup}\`;`
);

content = content.replace(
  `const timerDisplay = useTimer(10800, isTestRunning, isPaused, testResetKey, () => {`,
  `const timerDisplay = useTimer(timerDuration, isTestRunning, isPaused, testResetKey, () => {`
);

// Nav Items - add Saved
content = content.replace(
  `const navItems = [`,
  `const navItems = [
    { id: 'saved', label: 'Saved Questions', icon: <Library size={20} /> },`
);

// Sidebar theme toggle
content = content.replace(
  `<div className="progress-bar-container">`,
  `<button 
              className="btn btn-outline" 
              style={{ width: '100%', marginBottom: '1rem', justifyContent: 'center' }}
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
            </button>
            <div className="progress-bar-container">`
);

// Dashboard FCPS button
content = content.replace(
  `<div className="grid-2">
                <div className="action-card" onClick={() => { setSelectedProgram('MDCAT'); navigateTo('generate'); }}>`,
  `<div className="grid-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="action-card" onClick={() => { setSelectedProgram('MDCAT'); navigateTo('generate'); }}>`
);

content = content.replace(
  `<div className="action-card" onClick={() => { setSelectedProgram('MBBS'); navigateTo('generate'); }}>
                  <Stethoscope size={32} color="var(--accent-secondary)" />
                  <h4>MBBS Prof Exams</h4>
                  <p>Medical students ke liye 1st Year se Final Year tak ke clinical aur basic sciences MCQs.</p>
                </div>
              </div>`,
  `<div className="action-card" onClick={() => { setSelectedProgram('MBBS'); navigateTo('generate'); }}>
                  <Stethoscope size={32} color="var(--accent-secondary)" />
                  <h4>MBBS Prof Exams</h4>
                  <p>Medical students ke liye 1st Year se Final Year tak ke clinical aur basic sciences MCQs.</p>
                </div>
                <div className="action-card" onClick={() => { setSelectedProgram('FCPS'); navigateTo('generate'); }}>
                  <Activity size={32} color="#8B5CF6" />
                  <h4>FCPS Part 1</h4>
                  <p>Postgraduate residents ke liye basic sciences aur clinical pattern MCQs.</p>
                </div>
              </div>`
);

// Total Available fix
content = content.replace(
  `const totalAvailable = selectedProgram === 'MDCAT'`,
  `const totalAvailable = selectedProgram === 'MDCAT'
    ? selectedSubjects.reduce((acc, sub) => acc + (OFFLINE_DB[sub]?.length || 0), 0)
    : selectedProgram === 'MBBS'
      ? selectedMbbsSubjects.reduce((acc, sub) => acc + ((OFFLINE_MBBS_DB[sub] || []).filter(q => q.examType === 'MBBS').length || 0), 0)
      : selectedFcpsSubjects.reduce((acc, sub) => acc + ((OFFLINE_MBBS_DB[sub] || []).filter(q => q.examType === 'FCPS').length || 0), 0);
  
  // const _ignore_totalAvailable = selectedProgram === 'MDCAT'` // trick to comment out old one
);

// We need to properly replace `totalAvailable`
// Let's use Regex for cleaner replacement of totalAvailable block
content = content.replace(
  /const totalAvailable = selectedProgram === 'MDCAT'[\s\S]*?(?=const totalAllMCQs =)/,
  `const totalAvailable = selectedProgram === 'MDCAT'
    ? selectedSubjects.reduce((acc, sub) => acc + (OFFLINE_DB[sub]?.length || 0), 0)
    : selectedProgram === 'MBBS'
      ? selectedMbbsSubjects.reduce((acc, sub) => acc + ((OFFLINE_MBBS_DB[sub] || []).filter(q => q.examType === 'MBBS').length || 0), 0)
      : selectedFcpsSubjects.reduce((acc, sub) => acc + ((OFFLINE_MBBS_DB[sub] || []).filter(q => q.examType === 'FCPS').length || 0), 0);
  `
);


// Dashboard weak topics & reset button
content = content.replace(
  `{testHistory.length > 0 && (`,
  `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2.5rem', marginBottom: '1rem' }}>
                <h3>Recent Results</h3>
                <button className="btn btn-outline" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#EF4444', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => { if(window.confirm('Clear all progress and attempted MCQs history?')) { setTestHistory([]); localStorage.setItem('medprep_attempted', '[]'); window.location.reload(); } }}>
                  <Trash2 size={14} /> Reset All Progress
                </button>
              </div>
              {testHistory.length > 0 && (`
);

content = content.replace(
  `<h3 style={{ marginBottom: '1rem' }}>Recent Results</h3>`,
  ``
);

// FCPS Generate Tabs
content = content.replace(
  `<Stethoscope size={20} /> MBBS Profs / Blocks
              </button>
            </div>`,
  `<Stethoscope size={20} /> MBBS Profs / Blocks
              </button>
              <button
                className={\`btn \${selectedProgram === 'FCPS' ? 'btn-primary' : 'btn-outline'}\`}
                onClick={() => setSelectedProgram('FCPS')}
                style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }}
              >
                <Activity size={20} /> FCPS Part 1
              </button>
            </div>`
);

// FCPS config UI
content = content.replace(
  `{selectedProgram === 'MBBS' && (
                    <div className="input-group animate-fade-in">`,
  `{selectedProgram === 'FCPS' && (
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
                    <div className="input-group animate-fade-in">`
);

// Subject buttons logic
content = content.replace(
  `: (MBBS_YEARS[selectedYear] || []).map((name) => {
                          const isChecked = selectedMbbsSubjects.includes(name);`,
  `: selectedProgram === 'MBBS' ? (MBBS_YEARS[selectedYear] || []).map((name) => {
                          const isChecked = selectedMbbsSubjects.includes(name);`
);

content = content.replace(
  `</button>
                          )
                        })
                      }`,
  `</button>
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
                                border: isChecked ? \`2px solid \${color}\` : '2px solid transparent', color: isChecked ? color : 'var(--text-secondary)',
                              }}
                            >
                              {name} {isChecked && <CheckCircle2 size={14} />}
                            </button>
                          )
                        })
                      }`
);

// Add Timer and Difficulty dropdowns
content = content.replace(
  `<div className="input-group" style={{ marginTop: '1.5rem' }}>
                    <label className="input-label">📝 Number of Questions</label>`,
  `<div className="grid-2" style={{ gap: '1rem', marginTop: '1.5rem' }}>
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
                    <label className="input-label">📝 Number of Questions</label>`
);

content = content.replace(
  `<strong style={{ color: 'var(--text-primary)' }}>{selectedProgram === 'MDCAT' ? selectedBoard : selectedYear}</strong>`,
  `<strong style={{ color: 'var(--text-primary)' }}>{selectedProgram === 'MDCAT' ? selectedBoard : selectedProgram === 'MBBS' ? selectedYear : selectedFcpsGroup}</strong>`
);

content = content.replace(
  `<strong style={{ color: 'var(--text-primary)' }}>3 Hours</strong>`,
  `<strong style={{ color: 'var(--text-primary)' }}>{timerDuration / 60} Mins</strong>`
);

// Save question button in test view
content = content.replace(
  `🚩 {flagged[currentQ] ? 'Flagged' : 'Flag'}
                      </button>`,
  `🚩 {flagged[currentQ] ? 'Flagged' : 'Flag'}
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
                      </button>`
);

// Saved questions view
content = content.replace(
  `{/* ========== TEST HISTORY ========== */}`,
  `{/* ========== SAVED QUESTIONS ========== */}
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
                      <span className={\`badge \${q.difficulty === 'easy' ? 'badge-easy' : q.difficulty === 'medium' ? 'badge-medium' : q.difficulty === 'hard' ? 'badge-hard' : 'badge-technical'}\`}>
                        {q.difficulty?.charAt(0).toUpperCase() + q.difficulty?.slice(1)}
                      </span>
                      <button className="btn btn-outline" style={{ marginLeft: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.8rem', color: '#EF4444', borderColor: 'transparent' }} onClick={() => setSavedQuestions(prev => prev.filter(sq => sq.id !== q.id))}>
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                    <p className="review-question">{q.text || q.q}</p>
                    <div className="review-options">
                      {(q.options || q.opts || []).map((opt, j) => (
                        <div key={j} className={\`review-opt \${j === q.correct ? 'review-opt-correct' : ''}\`}>
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

        {/* ========== TEST HISTORY ========== */}`
);

// Print PDF button in Results View
content = content.replace(
  `Retake Same Paper</button>`,
  `Retake Same Paper</button>
                <button className="btn btn-outline" onClick={() => window.print()}>🖨️ Print as PDF</button>`
);

fs.writeFileSync(path.join(__dirname, 'src/App.jsx'), content);
console.log('App.jsx updated successfully with robust string replacement.');
