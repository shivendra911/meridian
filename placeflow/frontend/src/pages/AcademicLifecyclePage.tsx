import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  UserCheck,
  Award,
  Layers,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Plus,
  GitBranch,
  Search,
} from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { CurriculumDesigner } from '../components/academic/CurriculumDesigner';

export const AcademicLifecyclePage: React.FC = () => {
  const { activeTenant, activeInstitution } = useTenant();

  const [activeTab, setActiveTab] = useState<'programs' | 'courses' | 'designer' | 'calendars' | 'students' | 'progression'>('programs');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Demo datasets reflecting CAMP-03 MongoDB collections
  const [qualifications] = useState([
    { code: 'BTECH', title: 'Bachelor of Technology', level: 6.0, category: 'UNDERGRADUATE', authority: 'UNIVERSITY' },
    { code: 'MBA', title: 'Master of Business Administration', level: 7.0, category: 'POSTGRADUATE', authority: 'UNIVERSITY' },
    { code: 'DIP_ENG', title: 'Diploma in Engineering', level: 5.0, category: 'DIPLOMA', authority: 'TECHNICAL_BOARD' },
  ]);

  const [programs] = useState([
    { code: 'CSE-BTECH', title: 'Computer Science & Engineering', qual: 'BTECH', duration: '8 Semesters', mode: 'REGULAR_FULL_TIME', version: '2026.1 (Active)' },
    { code: 'MBA-FIN', title: 'MBA Financial Management', qual: 'MBA', duration: '6 Trimesters', mode: 'REGULAR_FULL_TIME', version: '2026.1 (Active)' },
    { code: 'ECE-BTECH', title: 'Electronics & Communication', qual: 'BTECH', duration: '8 Semesters', mode: 'REGULAR_FULL_TIME', version: '2025.2 (Superseded)' },
  ]);

  const [courses] = useState([
    { code: 'CS101', title: 'Programming Fundamentals', L: 3, T: 1, P: 2, S: 0, credits: 5.0, cat: 'MAJOR_CORE', prereq: 'None' },
    { code: 'CS201', title: 'Data Structures & Algorithms', L: 3, T: 1, P: 2, S: 0, credits: 5.0, cat: 'MAJOR_CORE', prereq: 'CS101 (Hard)' },
    { code: 'CS201L', title: 'Data Structures Lab', L: 0, T: 0, P: 4, S: 0, credits: 2.0, cat: 'MAJOR_CORE', prereq: 'CS201 (Co-req)' },
    { code: 'AEC101', title: 'Technical Communication & Ethics', L: 2, T: 0, P: 0, S: 0, credits: 2.0, cat: 'ABILITY_ENHANCEMENT_AEC', prereq: 'None' },
    { code: 'MDC102', title: 'Introduction to Macroeconomics', L: 3, T: 0, P: 0, S: 0, credits: 3.0, cat: 'MULTIDISCIPLINARY_MDC', prereq: 'None' },
  ]);

  const [calendars] = useState([
    { name: 'Faculty of Technology Calendar', type: 'SEMESTER', terms: ['2026-SEM1 (Odd)', '2027-SEM2 (Even)'], status: 'ACTIVE' },
    { name: 'School of Management Calendar', type: 'TRIMESTER', terms: ['2026-T1 (Fall)', '2026-T2 (Winter)', '2027-T3 (Spring)'], status: 'ACTIVE' },
  ]);

  const [students] = useState([
    { id: 'stu_01', name: 'Aarav Sharma', reg: 'REG2026001', roll: '26CS001', apaar: '123456789012', prog: 'CSE-BTECH', cohort: '2026-2030', status: 'ACTIVE' },
    { id: 'stu_02', name: 'Diya Patel', reg: 'REG2026002', roll: '26CS002', apaar: '987654321098', prog: 'CSE-BTECH', cohort: '2026-2030', status: 'ACTIVE' },
    { id: 'stu_03', name: 'Vikram Malhotra', reg: 'REG2026003', roll: '26MBA01', apaar: '554433221100', prog: 'MBA-FIN', cohort: '2026-2028', status: 'ACTIVE' },
  ]);

  // Progression simulator state
  const [selectedStudent, setSelectedStudent] = useState('stu_01');
  const [simEarnedCredits, setSimEarnedCredits] = useState(24.0);
  const [simCGPA, setSimCGPA] = useState(8.4);
  const [simBacklogs, setSimBacklogs] = useState(0);
  const [progressionDecision, setProgressionDecision] = useState<any>(null);

  const runProgressionSimulator = () => {
    const minCredits = 20.0;
    const maxBacklogs = 4;
    const creditsPassed = simEarnedCredits >= minCredits;
    const backlogsPassed = simBacklogs <= maxBacklogs;

    let decision = 'RETAINED_YEAR_REPEAT';
    let standing = 'CRITICAL_PROBATION';

    if (creditsPassed && backlogsPassed) {
      if (simBacklogs === 0) {
        decision = 'ELIGIBLE_PROMOTED';
        standing = simCGPA >= 5.0 ? 'GOOD_STANDING' : 'ACADEMIC_WARNING';
      } else {
        decision = 'PROBATIONARY_PROMOTED';
        standing = 'PROBATION';
      }
    }

    setProgressionDecision({
      student_id: selectedStudent,
      from_sequence: 1,
      to_sequence: 2,
      decision,
      standing,
      credits_earned: simEarnedCredits,
      cgpa: simCGPA,
      backlogs: simBacklogs,
      rules: [
        { rule: 'Annual Earned Credits Threshold (Min 20.0)', passed: creditsPassed, val: `${simEarnedCredits} / 20.0` },
        { rule: 'Max Concurrent Backlogs Allowed (<= 4)', passed: backlogsPassed, val: `${simBacklogs} backlogs` },
        { rule: 'Minimum CGPA for Good Standing (>= 5.0)', passed: simCGPA >= 5.0, val: `${simCGPA} CGPA` },
      ],
    });
  };

  useEffect(() => {
    runProgressionSimulator();
  }, [selectedStudent, simEarnedCredits, simCGPA, simBacklogs]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                CAMP-03 Academic Core
              </span>
              <span className="text-xs text-slate-400">NEP 2020 & UGC CCFUG Architecture</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Academic Structure & Student Lifecycle</h1>
            <p className="text-slate-400 text-sm mt-1">
              Multi-model qualifications, L-T-P-S credit breakdown, prerequisite DAGs, immutable ledger, and 6-step progression pipeline.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => runProgressionSimulator()}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync Academic State
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800">
          {[
            { id: 'programs', label: 'Programs & Offerings', icon: GraduationCap },
            { id: 'courses', label: 'Curriculum & Prerequisite DAG', icon: BookOpen },
            { id: 'designer', label: 'Curriculum Designer (3-Panel)', icon: Layers },
            { id: 'calendars', label: 'Multi-Model Calendars', icon: Calendar },
            { id: 'students', label: 'Student Enrollments', icon: UserCheck },
            { id: 'progression', label: 'Credit Ledger & Progression', icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Programs & Qualifications */}
      {activeTab === 'programs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {qualifications.map((q) => (
              <div key={q.code} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                    {q.code}
                  </span>
                  <span className="text-xs font-semibold text-emerald-400">NCrF Level {q.level}</span>
                </div>
                <h3 className="font-semibold text-white text-sm">{q.title}</h3>
                <p className="text-xs text-slate-400 mt-1">Authority: {q.authority} • {q.category}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Academic Programs Catalogue</h2>
              <span className="text-xs text-slate-400">3 Active Pathways</span>
            </div>
            <div className="divide-y divide-slate-800">
              {programs.map((p) => (
                <div key={p.code} className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-blue-400">{p.code}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">{p.duration}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                        {p.version}
                      </span>
                    </div>
                    <h4 className="text-white font-medium text-sm mt-1">{p.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Mode: {p.mode} • Credential: {p.qual}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700">
                      Branch Version
                    </button>
                    <button className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded">
                      Manage Offerings
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Course Registry & Prerequisite DAG */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white">Master Course Registry with L-T-P-S Breakdown</h2>
                <p className="text-xs text-slate-400">NEP 2020 Credit Formula: L + T + P/2 + S/3</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('designer')}
                  className="px-3 py-1.5 bg-cardinal hover:bg-cardinal-dark text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Open 3-Panel Curriculum Designer &rarr;</span>
                </button>
                <span className="text-xs px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full font-mono">
                  DAG Cycle Check: Active (0 Cycles)
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 uppercase font-mono">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Course Title</th>
                    <th className="px-4 py-3">L-T-P-S</th>
                    <th className="px-4 py-3">Credits</th>
                    <th className="px-4 py-3">NEP Category</th>
                    <th className="px-4 py-3">Prerequisite Rule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {courses.map((c) => (
                    <tr key={c.code} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-semibold text-blue-400">{c.code}</td>
                      <td className="px-4 py-3 text-white font-medium">{c.title}</td>
                      <td className="px-4 py-3 font-mono">{c.L}-{c.T}-{c.P}-{c.S}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-400">{c.credits.toFixed(1)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                          {c.cat}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${
                          c.prereq === 'None' ? 'text-slate-500' : 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                        }`}>
                          {c.prereq}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Visual Curriculum Designer (3-Panel) */}
      {activeTab === 'designer' && <CurriculumDesigner />}

      {/* Tab 3: Multi-Model Calendars */}
      {activeTab === 'calendars' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {calendars.map((cal) => (
            <div key={cal.name} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800 font-mono">
                  {cal.type}
                </span>
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Concurrent
                </span>
              </div>
              <h3 className="text-base font-semibold text-white">{cal.name}</h3>
              <p className="text-xs text-slate-400 mt-1">Status: {cal.status}</p>

              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-300 block mb-2">Configured Academic Terms:</span>
                {cal.terms.map((t) => (
                  <div key={t} className="p-2.5 rounded bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
                    <span className="text-white font-medium">{t}</span>
                    <span className="text-[11px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                      Window Open
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Student Enrollments */}
      {activeTab === 'students' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Student Academic Records & APAAR Bindings</h2>
            <span className="text-xs text-slate-400">{students.length} Enrolled Students</span>
          </div>
          <div className="divide-y divide-slate-800">
            {students.map((s) => (
              <div key={s.id} className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{s.name}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-blue-400">{s.roll}</span>
                    <span className="text-xs font-mono text-slate-400">Reg: {s.reg}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Program: <span className="text-slate-300">{s.prog}</span> • Cohort: {s.cohort} • APAAR ID: <span className="font-mono text-emerald-400">{s.apaar}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Credit Ledger & Progression Simulator */}
      {activeTab === 'progression' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-400" />
              Progression Pipeline Simulator
            </h3>
            <p className="text-xs text-slate-400">
              Simulates the 6-step deterministic progression decision for student promotion.
            </p>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Select Student</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.roll}) - {s.prog}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Cumulative Credits Earned: <span className="text-emerald-400 font-mono">{simEarnedCredits} cr</span>
              </label>
              <input
                type="range"
                min="0"
                max="40"
                step="1"
                value={simEarnedCredits}
                onChange={(e) => setSimEarnedCredits(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
              <span className="text-[11px] text-slate-500">Min 20.0 credits required for year promotion</span>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Cumulative Grade Point Average (CGPA): <span className="text-blue-400 font-mono">{simCGPA.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={simCGPA}
                onChange={(e) => setSimCGPA(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Active Backlogs Count: <span className="text-amber-400 font-mono">{simBacklogs}</span>
              </label>
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={simBacklogs}
                onChange={(e) => setSimBacklogs(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600"
              />
              <span className="text-[11px] text-slate-500">&gt; 4 backlogs triggers retention / year repeat</span>
            </div>
          </div>

          {/* Simulator Outcome Display */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono text-slate-400">STAGE: Sequence 1 (Year 1) → Sequence 2 (Year 2)</span>
              <span
                className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                  progressionDecision?.decision === 'ELIGIBLE_PROMOTED'
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    : progressionDecision?.decision === 'PROBATIONARY_PROMOTED'
                    ? 'bg-amber-950 text-amber-400 border-amber-800'
                    : 'bg-rose-950 text-rose-400 border-rose-800'
                }`}
              >
                {progressionDecision?.decision}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <span className="text-[11px] text-slate-400 block">Computed Academic Standing</span>
                <span className="text-sm font-semibold text-white mt-1 block">
                  {progressionDecision?.standing}
                </span>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <span className="text-[11px] text-slate-400 block">Placement Eligibility Feed</span>
                <span className="text-sm font-semibold text-emerald-400 mt-1 block">
                  Authoritative Facts Emitted
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-semibold text-slate-300">Deterministic Policy Evaluation Matrix:</h4>
              {progressionDecision?.rules.map((r: any) => (
                <div key={r.rule} className="p-3 rounded-lg bg-slate-800/30 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {r.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <span className="text-slate-200">{r.rule}</span>
                  </div>
                  <span className={`font-mono font-medium ${r.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {r.val}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-900/60 text-xs text-blue-300">
              💡 <strong>Audit Invariant:</strong> Decisions are immutable and written directly to <code>progression_decisions</code> with full policy rule traces and credit balance snapshots.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

