import React, { useState } from 'react';
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Briefcase,
  Award,
  ArrowRight,
  TrendingUp,
  Sparkles,
  ChevronRight,
  FileCheck2,
  Users,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';

interface StudentWorkspaceProps {
  onNavigateTab?: (tabId: string) => void;
  onOpenCopilot?: () => void;
}

export const StudentWorkspace: React.FC<StudentWorkspaceProps> = ({
  onNavigateTab,
  onOpenCopilot,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'registration' | 'gaps' | 'career'>('overview');
  const [registeredCourses, setRegisteredCourses] = useState<string[]>(['CS301', 'CS302']);

  // Available offerings for course registration
  const availableCourses = [
    {
      code: 'CS401',
      title: 'Distributed Systems & Cloud Computing',
      category: 'MAJOR_CORE',
      credits: 4.0,
      ltps: 'L:3 T:1 P:0 S:0',
      instructor: 'Dr. Ramesh Kumar',
      enrolled: 42,
      capacity: 50,
      prereqMet: true,
      prereqLabel: 'CS201 Data Structures (Cleared: Grade A)',
    },
    {
      code: 'AI402',
      title: 'Deep Learning & Natural Language Processing',
      category: 'MAJOR_CORE',
      credits: 4.0,
      ltps: 'L:3 T:0 P:2 S:0',
      instructor: 'Dr. Sunita Rao',
      enrolled: 48,
      capacity: 50,
      prereqMet: true,
      prereqLabel: 'MA201 Linear Algebra (Cleared: Grade B+)',
    },
    {
      code: 'FIN301',
      title: 'Financial Engineering & Algorithmic Markets',
      category: 'MINOR_CORE',
      credits: 3.0,
      ltps: 'L:3 T:0 P:0 S:0',
      instructor: 'Prof. Arvind Patel',
      enrolled: 30,
      capacity: 40,
      prereqMet: true,
      prereqLabel: 'None (Open Elective)',
    },
    {
      code: 'ENV101',
      title: 'Environmental Sustainability & Climate Technology',
      category: 'MULTIDISCIPLINARY_MDC',
      credits: 2.0,
      ltps: 'L:2 T:0 P:0 S:0',
      instructor: 'Dr. Leela Nair',
      enrolled: 35,
      capacity: 60,
      prereqMet: true,
      prereqLabel: 'None (Mandatory MDC)',
    },
    {
      code: 'CS502',
      title: 'Advanced Compiler Optimization Techniques',
      category: 'MAJOR_CORE',
      credits: 4.0,
      ltps: 'L:3 T:0 P:2 S:0',
      instructor: 'Dr. V. Anand',
      enrolled: 15,
      capacity: 30,
      prereqMet: false,
      prereqLabel: 'CS302 Theory of Computation (Required before enrollment)',
    },
  ];

  const handleToggleCourse = (code: string) => {
    if (registeredCourses.includes(code)) {
      setRegisteredCourses(registeredCourses.filter((c) => c !== code));
    } else {
      setRegisteredCourses([...registeredCourses, code]);
    }
  };

  const totalRegisteredCredits = availableCourses
    .filter((c) => registeredCourses.includes(c.code))
    .reduce((acc, c) => acc + c.credits, 8.0); // 8 base credits from CS301 & CS302

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Student Identity & Status Ribbon */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs border-l-4 border-l-[#8C1515] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="institutional" size="xs">
              B.Tech CSE &bull; Semester 6
            </Badge>
            <span className="text-slate-300">&bull;</span>
            <span className="text-xs font-mono text-slate-500">Roll: STU001 &bull; Reg: 2023CSB001</span>
          </div>

          <h1 className="font-serif font-bold text-xl text-slate-900 mt-1 m-0">
            Welcome back, Rohan Sharma
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 m-0">
            School of Computing &bull; Department of Computer Science &amp; Engineering &bull; Main Campus
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">
              Academic Standing
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Eligible &bull; Normal Progression</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCopilot}
            leftIcon={<Sparkles size={13} className="text-[#8C1515]" />}
          >
            Ask Copilot
          </Button>
        </div>
      </div>

      {/* 2. Key Academic Metric Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Cumulative GPA"
          value="8.45"
          subValue="/ 10.0"
          change="Rank #4 in Batch"
          changeType="up"
          icon={GraduationCap}
          explainTooltip="UGC 10-point scale CGPA calculated across 132 completed credits."
        />
        <StatCard
          label="Credits Completed"
          value="132"
          subValue="/ 160 req"
          change="82.5% towards Honours"
          changeType="up"
          icon={BookOpen}
          explainTooltip="NEP 2020 Level 8.0 Honours Degree requires 160 credits."
        />
        <StatCard
          label="Active Placement Drives"
          value="4"
          subValue="Eligible for 4/4"
          change="Tier 1 & Super Dream"
          changeType="up"
          icon={Briefcase}
          explainTooltip="Student meets CGPA threshold (>= 7.5) with 0 active backlogs."
        />
        <StatCard
          label="APAAR Mobility ID"
          value="12-Digit"
          subValue="ABC Verified"
          change="Linked to Digilocker"
          changeType="neutral"
          icon={Award}
          explainTooltip="Academic Bank of Credits (ABC) repository linked to APAAR identity."
        />
      </div>

      {/* 3. Action Cards Grid (What needs attention?) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-900 flex items-center gap-1.5">
              <Clock size={13} className="text-amber-600" />
              <span>Registration Closing</span>
            </span>
            <Badge variant="warning" size="xs">48h Left</Badge>
          </div>
          <p className="text-xs text-amber-900/80 leading-relaxed m-0">
            Semester 7 course registration basket is active. Confirm your major electives before the window closes.
          </p>
          <div className="pt-1">
            <button
              onClick={() => setActiveSubTab('registration')}
              className="text-xs font-semibold text-amber-950 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Open Course Baskets</span>
              <ChevronRight size={12} />
            </button>
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
              <Calendar size={13} className="text-emerald-600" />
              <span>Interview Scheduled</span>
            </span>
            <Badge variant="success" size="xs">Tomorrow</Badge>
          </div>
          <p className="text-xs text-emerald-900/80 leading-relaxed m-0">
            Google India Technical Round 1 confirmed for tomorrow at 10:00 AM in Superday Lab 4.
          </p>
          <div className="pt-1">
            <button
              onClick={() => onNavigateTab?.('interviews')}
              className="text-xs font-semibold text-emerald-950 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Interview Slot</span>
              <ChevronRight size={12} />
            </button>
          </div>
        </div>

        <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-blue-900 flex items-center gap-1.5">
              <Sparkles size={13} className="text-blue-600" />
              <span>Remedial Study Signal</span>
            </span>
            <Badge variant="info" size="xs">AI Insight</Badge>
          </div>
          <p className="text-xs text-blue-900/80 leading-relaxed m-0">
            Campus AI detected foundational concept gaps in Graph Algorithms from previous course CS201.
          </p>
          <div className="pt-1">
            <button
              onClick={() => setActiveSubTab('gaps')}
              className="text-xs font-semibold text-blue-950 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Inspect Concept Gaps</span>
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Tabbed Sub-Workspaces */}
      <div className="space-y-4">
        <Tabs
          activeTab={activeSubTab}
          onChange={(tab) => setActiveSubTab(tab as any)}
          tabs={[
            { id: 'overview', label: 'Academic Overview & Schedule', icon: Calendar },
            { id: 'registration', label: 'Course Registration & Baskets', icon: BookOpen, count: availableCourses.length },
            { id: 'gaps', label: 'Prerequisite & Knowledge-Gap Analyzer', icon: Sparkles },
            { id: 'career', label: 'Placements & Career Opportunities', icon: Briefcase, count: 4 },
          ]}
        />

        {/* SUBTAB: Academic Overview */}
        {activeSubTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card title="Current Enrolled Courses (Semester 6)" subtitle="Active academic delivery terms">
                <div className="divide-y divide-slate-100">
                  <div className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-slate-900">CS301: Operating Systems &amp; Virtualization</div>
                      <div className="text-[11px] text-slate-500 font-mono">4.0 Credits &bull; Prof. K. V. Sharma &bull; Lecture Hall 3</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono">92% Attendance</span>
                    </div>
                  </div>

                  <div className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-slate-900">CS302: Database Management Systems &amp; Internals</div>
                      <div className="text-[11px] text-slate-500 font-mono">4.0 Credits &bull; Dr. Ananya Sen &bull; Lab 2</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono">88% Attendance</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card title="Degree Progression Milestones" subtitle="NEP 2020 Multi-Exit Architecture">
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">UG Certificate (40 cr)</span>
                    <Badge variant="success" size="xs">Cleared</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">UG Diploma (80 cr)</span>
                    <Badge variant="success" size="xs">Cleared</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">UG Degree (120 cr)</span>
                    <Badge variant="success" size="xs">Cleared</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 font-bold">UG Honours Degree (160 cr)</span>
                    <Badge variant="institutional" size="xs">132 / 160</Badge>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* SUBTAB: Course Registration */}
        {activeSubTab === 'registration' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded p-4 flex items-center justify-between text-xs shadow-xs">
              <div>
                <span className="text-slate-500">Selected Term Credits: </span>
                <span className="font-serif font-bold text-slate-900 text-sm">{totalRegisteredCredits} Credits</span>
                <span className="text-slate-400 font-mono text-[11px]"> (Min 18.0 &bull; Max 26.0 allowed)</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => alert(`Successfully confirmed registration for ${registeredCourses.length} courses (${totalRegisteredCredits} credits)!`)}
              >
                Submit Course Registration
              </Button>
            </div>

            <div className="space-y-3">
              {availableCourses.map((c) => {
                const isSelected = registeredCourses.includes(c.code);
                return (
                  <div
                    key={c.code}
                    className={`bg-white border rounded-lg p-4 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      isSelected ? 'border-[#8C1515] bg-red-50/20 shadow-xs' : 'border-slate-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">{c.code}</span>
                        <Badge variant="neutral" size="xs">{c.category}</Badge>
                        <span className="text-[11px] font-mono text-slate-500">{c.ltps}</span>
                      </div>
                      <h4 className="font-serif font-bold text-sm text-slate-900 mt-1 m-0">
                        {c.title}
                      </h4>
                      <div className="mt-1 flex items-center gap-4 text-xs text-slate-500 font-sans">
                        <span>Instructor: {c.instructor}</span>
                        <span>&bull;</span>
                        <span className="font-mono">Seats: {c.enrolled}/{c.capacity} enrolled</span>
                        <span>&bull;</span>
                        <span className={c.prereqMet ? 'text-emerald-700' : 'text-red-600 font-bold'}>
                          Prerequisite: {c.prereqLabel}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-serif font-bold text-base text-slate-900">{c.credits}</span>
                        <span className="text-xs text-slate-500 ml-1">Credits</span>
                      </div>
                      <Button
                        variant={isSelected ? 'outline' : 'primary'}
                        size="sm"
                        disabled={!c.prereqMet}
                        onClick={() => handleToggleCourse(c.code)}
                      >
                        {isSelected ? 'Drop Course' : 'Add to Basket'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBTAB: Knowledge-Gap Analyzer */}
        {activeSubTab === 'gaps' && (
          <Card title="Prerequisite Ancestor & Concept Gap Audit" subtitle="Continuous evaluation of foundational readiness">
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-600">
                The Campus AI Academic Advisor analyzes your prerequisite performance across previous terms to alert you to foundational knowledge gaps before you register for advanced electives.
              </div>

              <div className="border border-slate-200 rounded divide-y divide-slate-100">
                <div className="p-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900">Foundational Course: CS201 Data Structures</div>
                    <div className="text-slate-500 text-[11px]">Completed in Semester 3 &bull; Grade: C (5.0 GP) &bull; Repeat Cleared</div>
                    <p className="mt-1 text-slate-700">
                      Recommendation: Review Graph Traversal and Dynamic Programming before enrolling in CS401 Distributed Systems.
                    </p>
                  </div>
                  <Badge variant="warning" size="xs">Medium Gap</Badge>
                </div>

                <div className="p-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900">Foundational Course: MA201 Linear Algebra &amp; Matrices</div>
                    <div className="text-slate-500 text-[11px]">Completed in Semester 4 &bull; Grade: A (9.0 GP)</div>
                    <p className="mt-1 text-slate-700">
                      Strong foundation verified. Student fully qualified for Deep Learning &amp; AI electives.
                    </p>
                  </div>
                  <Badge variant="success" size="xs">Mastered</Badge>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* SUBTAB: Placements */}
        {activeSubTab === 'career' && (
          <Card title="Active Campus Placement Drives" subtitle="Eligible opportunities and application status">
            <div className="divide-y divide-slate-100">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <span>Google India &bull; Software Engineer</span>
                    <Badge variant="institutional" size="xs">Super Dream (₹28.5 LPA)</Badge>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">Eligibility: CGPA 8.0+ &bull; Student CGPA: 8.45 (Qualified)</div>
                </div>
                <Badge variant="success" size="xs">Interview Scheduled</Badge>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <span>Microsoft &bull; Cloud Solutions Architect</span>
                    <Badge variant="institutional" size="xs">Dream (₹18.0 LPA)</Badge>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">Eligibility: CGPA 7.5+ &bull; Student CGPA: 8.45 (Qualified)</div>
                </div>
                <Badge variant="info" size="xs">Shortlisted</Badge>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <span>Amazon &bull; Systems Development Engineer</span>
                    <Badge variant="institutional" size="xs">Super Dream (₹24.0 LPA)</Badge>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">Eligibility: CGPA 7.0+ &bull; Student CGPA: 8.45 (Qualified)</div>
                </div>
                <Badge variant="neutral" size="xs">Applied</Badge>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
