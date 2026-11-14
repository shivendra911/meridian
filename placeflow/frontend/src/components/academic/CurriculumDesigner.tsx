import React, { useState } from 'react';
import {
  GraduationCap,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  Plus,
  FileCheck2} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { toast } from 'sonner';
import { SlideOverDrawer } from '../ui/SlideOverDrawer';

interface CourseItem {
  code: string;
  title: string;
  l: number;
  t: number;
  p: number;
  s: number;
  credits: number;
  type: 'CORE' | 'ELECTIVE' | 'LAB' | 'AEC';
  prereq?: string;
}

interface TermStructure {
  id: number;
  name: string;
  targetCredits: number;
  courses: CourseItem[];
}

export const CurriculumDesigner: React.FC = () => {
  const [selectedProgram, setSelectedProgram] = useState('CSE-BTECH-2026');
  const [selectedTermId, setSelectedTermId] = useState(3);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Curriculum terms model
  const [terms, _setTerms] = useState<TermStructure[]>([
    {
      id: 1,
      name: 'Semester 1',
      targetCredits: 20.0,
      courses: [
        { code: 'MA101', title: 'Calculus & Linear Algebra', l: 3, t: 1, p: 0, s: 0, credits: 4.0, type: 'CORE' },
        { code: 'PH101', title: 'Engineering Physics', l: 3, t: 0, p: 2, s: 0, credits: 4.0, type: 'CORE' },
        { code: 'CS101', title: 'Programming Fundamentals (C/Python)', l: 3, t: 0, p: 2, s: 0, credits: 4.0, type: 'CORE' },
        { code: 'AEC101', title: 'Technical English & Ethics', l: 2, t: 0, p: 0, s: 0, credits: 2.0, type: 'AEC' },
        { code: 'ME101', title: 'Engineering Graphics & CAD', l: 1, t: 0, p: 4, s: 0, credits: 3.0, type: 'LAB' },
        { code: 'MDC101', title: 'Environmental Science', l: 3, t: 0, p: 0, s: 0, credits: 3.0, type: 'CORE' },
      ],
    },
    {
      id: 2,
      name: 'Semester 2',
      targetCredits: 20.0,
      courses: [
        { code: 'MA102', title: 'Differential Equations & Transforms', l: 3, t: 1, p: 0, s: 0, credits: 4.0, type: 'CORE', prereq: 'MA101' },
        { code: 'CS102', title: 'Data Structures Foundations', l: 3, t: 0, p: 2, s: 0, credits: 4.0, type: 'CORE', prereq: 'CS101' },
        { code: 'EC101', title: 'Basic Electronics & IoT Devices', l: 3, t: 0, p: 2, s: 0, credits: 4.0, type: 'CORE' },
        { code: 'CH101', title: 'Engineering Chemistry & Materials', l: 3, t: 0, p: 2, s: 0, credits: 4.0, type: 'CORE' },
        { code: 'AEC102', title: 'Constitution of India', l: 2, t: 0, p: 0, s: 0, credits: 2.0, type: 'AEC' },
        { code: 'CS102L', title: 'Advanced Linux & Git Tools', l: 0, t: 0, p: 4, s: 0, credits: 2.0, type: 'LAB' },
      ],
    },
    {
      id: 3,
      name: 'Semester 3',
      targetCredits: 22.0,
      courses: [
        { code: 'CS201', title: 'Data Structures & Algorithms', l: 3, t: 1, p: 2, s: 0, credits: 5.0, type: 'CORE', prereq: 'CS101 (Hard)' },
        { code: 'CS202', title: 'Discrete Mathematics & Graph Theory', l: 3, t: 1, p: 0, s: 0, credits: 4.0, type: 'CORE' },
        { code: 'CS203', title: 'Computer Organization & Architecture', l: 3, t: 0, p: 2, s: 0, credits: 4.0, type: 'CORE' },
        { code: 'CS204', title: 'Object-Oriented Programming (Java/C++)', l: 3, t: 0, p: 2, s: 0, credits: 4.0, type: 'CORE', prereq: 'CS101' },
        { code: 'CSE_EL1', title: 'Program Elective 1 (Web / Python / Mobile)', l: 3, t: 0, p: 0, s: 0, credits: 3.0, type: 'ELECTIVE' },
        { code: 'AEC201', title: 'Design Thinking & Innovation', l: 2, t: 0, p: 0, s: 0, credits: 2.0, type: 'AEC' },
      ],
    },
    {
      id: 4,
      name: 'Semester 4',
      targetCredits: 21.0,
      courses: [
        { code: 'CS205', title: 'Operating Systems & Concurrency', l: 3, t: 0, p: 2, s: 0, credits: 4.0, type: 'CORE', prereq: 'CS203' },
        { code: 'CS206', title: 'Database Management Systems', l: 3, t: 0, p: 2, s: 0, credits: 4.0, type: 'CORE', prereq: 'CS201' },
        { code: 'CS207', title: 'Theory of Computation & Automata', l: 3, t: 1, p: 0, s: 0, credits: 4.0, type: 'CORE', prereq: 'CS202' },
        { code: 'MA201', title: 'Probability & Statistics for AI', l: 3, t: 1, p: 0, s: 0, credits: 4.0, type: 'CORE' },
        { code: 'CSE_EL2', title: 'Program Elective 2 (Cloud / DevOps)', l: 3, t: 0, p: 0, s: 0, credits: 3.0, type: 'ELECTIVE' },
        { code: 'AEC202', title: 'Universal Human Values', l: 2, t: 0, p: 0, s: 0, credits: 2.0, type: 'AEC' },
      ],
    },
    { id: 5, name: 'Semester 5', targetCredits: 21.0, courses: [] },
    { id: 6, name: 'Semester 6', targetCredits: 20.0, courses: [] },
    { id: 7, name: 'Semester 7', targetCredits: 18.0, courses: [] },
    { id: 8, name: 'Semester 8 (Internship/Capstone)', targetCredits: 18.0, courses: [] },
  ]);

  const activeTerm = terms.find((t) => t.id === selectedTermId) || terms[0];

  // Calculate allocated credits for active term
  const termTotalCredits = activeTerm.courses.reduce((sum, c) => sum + c.credits, 0);

  // Total program credits
  const totalProgramCredits = terms.reduce(
    (sum, t) => sum + t.courses.reduce((cSum, c) => cSum + c.credits, 0),
    0
  );

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setSimulationResult({
        cohortImpacted: 'Batch 2026 & Batch 2027 (480 enrolled candidates)',
        creditBalanceStatus: 'COMPLIANT (160.0 Credits across 8 Semesters)',
        removedCourses: [
          'CS105: Legacy Assembly Programming (Replaced by CS102L Linux & Git Tools)',
        ],
        newMandatoryCourses: [
          'CS201: Data Structures expanded from 4.0 to 5.0 credits with embedded lab',
          'AEC201: Design Thinking & Innovation (UGC NCrF mandatory requirement)',
        ],
        potentialCreditShortfalls: [
          '3 lateral-entry diploma students in Batch 2026 will need bridge credit for CS202',
        ],
        brokenPrerequisites: 0,
        transitionAdvice:
          'Issue waiver credit for AEC201 to Batch 2026 if they completed earlier Open Elective 1.',
        readyForGazette: true,
      });
      setIsSimulating(false);
      setIsDrawerOpen(true);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border-l-4 border-l-cardinal border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold tracking-widest uppercase text-slate-500 font-mono mb-1">
            CAMP-03 &bull; AUTONOMOUS CURRICULUM ARCHITECT
          </div>
          <h2 className="text-xl font-bold  text-slate-900 m-0 flex items-center gap-2">
            <Layers size={20} className="text-cardinal" />
            Curriculum Designer &amp; Progression Simulator
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Arrange course baskets by term, validate L-T-P-S credit weights, connect prerequisite DAGs, and simulate transition impact on enrolled cohorts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunSimulation}
            leftIcon={<Sparkles size={13} className="text-cardinal" />}
            loading={isSimulating}
          >
            Run Curriculum Simulation
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => toast.success('Gazette version B.Tech CSE v2026.1 published successfully!')}
            leftIcon={<FileCheck2 size={13} />}
          >
            Publish Gazette Version
          </Button>
        </div>
      </div>

      {/* 3-Panel Visual Curriculum Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* PANEL 1: Structure (Term Navigator) */}
        <div className="lg:col-span-3 space-y-3">
          <Card className="p-4 space-y-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Program Offering &amp; Version
              </span>
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="w-full text-xs font-semibold border border-slate-300 rounded p-2 bg-white"
              >
                <option value="CSE-BTECH-2026">B.Tech Computer Science (v2026.1)</option>
                <option value="ECE-BTECH-2026">B.Tech Electronics &amp; Comm (v2026.1)</option>
                <option value="MBA-FIN-2026">MBA Financial Management (v2026)</option>
              </select>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Terms &amp; Semesters
              </span>
              <div className="space-y-1">
                {terms.map((t) => {
                  const isSelected = t.id === selectedTermId;
                  const creditSum = t.courses.reduce((s, c) => s + c.credits, 0);
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTermId(t.id)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-cardinal text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-semibold">{t.name}</span>
                      <span
                        className={`text-xs font-mono ${
                          isSelected ? 'text-white/90' : 'text-slate-500'
                        }`}
                      >
                        {creditSum.toFixed(1)} / {t.targetCredits.toFixed(0)} cr
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* PANEL 2: Selected Term Workspace (Course Basket) */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold  text-slate-900">
                    {activeTerm.name} Course Basket
                  </h3>
                  <Badge variant="info" size="xs">
                    {activeTerm.courses.length} Courses
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Autonomous syllabus offering with credit breakdown and prerequisite links
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-500">Term Credits</div>
                <div className="text-xl font-bold  text-cardinal">
                  {termTotalCredits.toFixed(1)} Cr
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {activeTerm.courses.map((course, _idx) => (
                <div
                  key={course.code}
                  className="p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-all text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cardinal">{course.code}</span>
                        <span className="font-semibold text-slate-900">{course.title}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded">
                          L-T-P-S: {course.l}-{course.t}-{course.p}-{course.s}
                        </span>
                        {course.prereq && (
                          <span className="text-amber-700 font-medium flex items-center gap-1">
                            <GitBranch size={11} /> Prereq: {course.prereq}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2 py-1 rounded">
                        {course.credits.toFixed(1)} Cr
                      </span>
                      <Badge
                        variant={
                          course.type === 'CORE'
                            ? 'neutral'
                            : course.type === 'ELECTIVE'
                            ? 'info'
                            : 'success'
                        }
                        size="xs"
                      >
                        {course.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <Button
                variant="outline"
                size="xs"
                onClick={() =>
                  toast.info('Add Course to Term: Institutional course catalogue modal.')
                }
                leftIcon={<Plus size={12} />}
              >
                Add Course to {activeTerm.name}
              </Button>
              <span className="text-xs text-slate-400">
                Minimum autonomous credit requirement: 160.0 Credits
              </span>
            </div>
          </Card>
        </div>

        {/* PANEL 3: Credit Overview, Constraints & Pre-publication Simulation */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap size={16} className="text-cardinal" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Autonomous Graduation Meter
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <div className="text-xs text-slate-500 font-medium">Program Total Credits</div>
              <div className="text-3xl  font-bold text-slate-900 mt-0.5">
                {totalProgramCredits.toFixed(1)}
              </div>
              <div className="text-xs text-slate-500">Target: 160.0 Credits (UGC NCrF)</div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-cardinal h-full rounded-full transition-all"
                  style={{ width: `${Math.min((totalProgramCredits / 160) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 pt-1">
              <div className="flex justify-between">
                <span>Major Core Credits:</span>
                <span className="font-mono font-semibold text-slate-900">88.0 Cr</span>
              </div>
              <div className="flex justify-between">
                <span>Program Electives:</span>
                <span className="font-mono font-semibold text-slate-900">24.0 Cr</span>
              </div>
              <div className="flex justify-between">
                <span>Multidisciplinary / AEC:</span>
                <span className="font-mono font-semibold text-slate-900">18.0 Cr</span>
              </div>
              <div className="flex justify-between">
                <span>Internship &amp; Capstone:</span>
                <span className="font-mono font-semibold text-slate-900">18.0 Cr</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={handleRunSimulation}
                leftIcon={<Sparkles size={13} />}
                loading={isSimulating}
              >
                Simulate Cohort Impact
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Pre-publication Simulation Drawer (Section 6.2) */}
      <SlideOverDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Curriculum Transition & Cohort Simulation"
        subtitle="Deterministic evaluation of proposed syllabus revision against enrolled students"
        width="lg"
      >
        {simulationResult && (
          <div className="space-y-5">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-emerald-950 block">
                  Curriculum Structure Validated &amp; Ready
                </span>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Degree credit requirements conform to UGC autonomous criteria. {simulationResult.cohortImpacted}.
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Syllabus Version Diff Highlights
              </h4>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-red-50/50 border border-red-200 rounded-lg">
                  <span className="font-bold text-red-900 block">Courses Removed:</span>
                  <ul className="list-disc pl-4 mt-1 text-xs text-red-800 space-y-0.5">
                    {simulationResult.removedCourses.map((c: string, idx: number) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg">
                  <span className="font-bold text-blue-900 block">New Mandatory Offerings:</span>
                  <ul className="list-disc pl-4 mt-1 text-xs text-blue-800 space-y-0.5">
                    {simulationResult.newMandatoryCourses.map((c: string, idx: number) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Potential Transition Arrangements
              </h4>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <AlertTriangle size={14} className="text-amber-700" />
                  Lateral Entry Advisory
                </div>
                <p className="text-amber-800 text-xs leading-relaxed">
                  {simulationResult.potentialCreditShortfalls[0]}
                </p>
                <p className="text-amber-900 font-medium text-xs pt-1">
                  <strong>Recommendation:</strong> {simulationResult.transitionAdvice}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <Button variant="outline" size="sm" onClick={() => setIsDrawerOpen(false)}>
                Dismiss
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsDrawerOpen(false);
                  toast.success('Gazetted version v2026.1 published!');
                }}
              >
                Approve &amp; Gazette v2026.1
              </Button>
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
};

