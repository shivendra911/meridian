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
  Building2,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

interface StudentWorkspaceProps {
  onNavigateTab?: (tabId: string) => void;
  onOpenCopilot?: () => void;
}

export const StudentWorkspace: React.FC<StudentWorkspaceProps> = ({
  onNavigateTab,
  onOpenCopilot,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'registration' | 'gaps' | 'career'>('overview');
  const [registeredCourses, setRegisteredCourses] = useState<string[]>(['CS401', 'AI402']);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);

  // Available offerings for course registration basket
  const availableCourses = [
    {
      code: 'CS401',
      title: 'Distributed Systems & Cloud Infrastructure',
      category: 'Major Core',
      credits: 4.0,
      ltps: 'L:3 T:1 P:0',
      instructor: 'Dr. Ramesh Kumar',
      enrolled: 44,
      capacity: 50,
      prereqMet: true,
      prereqLabel: 'CS201 Data Structures (Cleared: Grade A)',
    },
    {
      code: 'AI402',
      title: 'Deep Learning & Natural Language Processing',
      category: 'Major Core',
      credits: 4.0,
      ltps: 'L:3 T:0 P:2',
      instructor: 'Dr. Sunita Rao',
      enrolled: 48,
      capacity: 50,
      prereqMet: true,
      prereqLabel: 'MA201 Linear Algebra (Cleared: Grade B+)',
    },
    {
      code: 'FIN301',
      title: 'Financial Engineering & Algorithmic Markets',
      category: 'Minor Elective',
      credits: 3.0,
      ltps: 'L:3 T:0 P:0',
      instructor: 'Prof. Arvind Patel',
      enrolled: 32,
      capacity: 40,
      prereqMet: true,
      prereqLabel: 'Open Elective (No Prerequisite)',
    },
    {
      code: 'ENV101',
      title: 'Environmental Sustainability & Climate Technology',
      category: 'Multidisciplinary',
      credits: 2.0,
      ltps: 'L:2 T:0 P:0',
      instructor: 'Dr. Leela Nair',
      enrolled: 35,
      capacity: 60,
      prereqMet: true,
      prereqLabel: 'Mandatory MDC (No Prerequisite)',
    },
    {
      code: 'CS502',
      title: 'Advanced Compiler Optimization Techniques',
      category: 'Major Core',
      credits: 4.0,
      ltps: 'L:3 T:0 P:2',
      instructor: 'Dr. V. Anand',
      enrolled: 18,
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
    setRegistrationSubmitted(false);
  };

  const totalRegisteredCredits = availableCourses
    .filter((c) => registeredCourses.includes(c.code))
    .reduce((acc, c) => acc + c.credits, 8.0); // 8 base credits from required labs

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Page Header */}
      <PageHeader
        title="Student Academic & Career Hub"
        description="Rohan Sharma • Roll: 2023CSB001 • B.Tech Computer Science & Engineering • Semester 6"
        badge={
          <Badge variant="success" size="xs">
            Academic Good Standing
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenCopilot}
              leftIcon={<Sparkles size={14} className="text-brand" />}
            >
              Ask Advisor AI
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveSubTab('registration')}
              leftIcon={<BookOpen size={14} />}
            >
              Course Basket ({registeredCourses.length})
            </Button>
          </div>
        }
      />

      {/* 2. Top Metric Row (Max 4 StatCards, 8px radius, tabular-nums) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Cumulative GPA"
          value="8.45"
          subValue="/ 10.0"
          hint="Cohort Rank #4 / 240 (Top 5%)"
          icon={GraduationCap}
          change="+0.18 from Sem 5"
          changeType="up"
        />
        <StatCard
          label="Credits Completed"
          value="132"
          subValue="/ 160 req"
          hint="82.5% towards Honours Degree"
          icon={BookOpen}
          change="On Track"
          changeType="neutral"
        />
        <StatCard
          label="Active Placement Drives"
          value="4"
          subValue="Eligible for 4"
          hint="Tier-1 & Super Dream Eligible"
          icon={Briefcase}
          change="0 Active Backlogs"
          changeType="up"
        />
        <StatCard
          label="Average Attendance"
          value="91.4%"
          hint="Above 75.0% Mandatory Minimum"
          icon={Award}
          change="Verified"
          changeType="neutral"
        />
      </div>

      {/* 3. 2/3 Main Panel + 1/3 Side Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Panel (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subtab Navigator */}
          <Tabs
            activeTab={activeSubTab}
            onChange={(tab) => setActiveSubTab(tab as any)}
            tabs={[
              { id: 'overview', label: 'Enrolled Courses & Schedule', icon: Calendar },
              {
                id: 'registration',
                label: 'Course Registration Basket',
                icon: BookOpen,
                count: registeredCourses.length,
              },
              { id: 'gaps', label: 'Prerequisite Gap Analyzer', icon: Sparkles },
              { id: 'career', label: 'Placement Drives', icon: Briefcase, count: 4 },
            ]}
          />

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : (
            <>
              {/* SUBTAB: Academic Overview */}
              {activeSubTab === 'overview' && (
                <div className="space-y-4">
                  <Card
                    title="Active Course Enrollments (Semester 6)"
                    subtitle="Registered credit hours with verified classroom attendance"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-line text-ink-muted uppercase tracking-wider text-[11px] h-10">
                            <th className="py-2.5 px-3 font-medium">Course</th>
                            <th className="py-2.5 px-3 font-medium">Credits</th>
                            <th className="py-2.5 px-3 font-medium">Faculty</th>
                            <th className="py-2.5 px-3 font-medium">Schedule & Venue</th>
                            <th className="py-2.5 px-3 font-medium text-right">Attendance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          <tr className="h-10 hover:bg-canvas/50 transition-colors">
                            <td className="py-2 px-3 font-medium text-ink">
                              <span className="font-semibold text-brand">CS301:</span> Operating Systems &amp; Virtualization
                            </td>
                            <td className="py-2 px-3 tabular-nums text-ink">4.0</td>
                            <td className="py-2 px-3 text-ink-muted">Dr. K. V. Sharma</td>
                            <td className="py-2 px-3 text-ink-muted">Mon, Wed 10:00 AM • Room 302</td>
                            <td className="py-2 px-3 text-right">
                              <span className="font-semibold text-success tabular-nums">92.0%</span>
                            </td>
                          </tr>
                          <tr className="h-10 hover:bg-canvas/50 transition-colors">
                            <td className="py-2 px-3 font-medium text-ink">
                              <span className="font-semibold text-brand">CS302:</span> Database Management Systems
                            </td>
                            <td className="py-2 px-3 tabular-nums text-ink">4.0</td>
                            <td className="py-2 px-3 text-ink-muted">Dr. Ananya Sen</td>
                            <td className="py-2 px-3 text-ink-muted">Tue, Thu 11:30 AM • Lab 2</td>
                            <td className="py-2 px-3 text-right">
                              <span className="font-semibold text-success tabular-nums">88.5%</span>
                            </td>
                          </tr>
                          <tr className="h-10 hover:bg-canvas/50 transition-colors">
                            <td className="py-2 px-3 font-medium text-ink">
                              <span className="font-semibold text-brand">CS303:</span> Computer Networks &amp; Security
                            </td>
                            <td className="py-2 px-3 tabular-nums text-ink">3.0</td>
                            <td className="py-2 px-3 text-ink-muted">Prof. Rajiv Mehta</td>
                            <td className="py-2 px-3 text-ink-muted">Fri 09:00 AM • Lab 4</td>
                            <td className="py-2 px-3 text-right">
                              <span className="font-semibold text-success tabular-nums">94.0%</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  <Card
                    title="Continuous Internal Evaluation (CIE) Marks"
                    subtitle="Semester 6 mid-term test & assignment ledger"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg border border-line bg-canvas">
                        <div className="text-[11px] font-medium text-ink-muted">CS301 Operating Systems</div>
                        <div className="mt-1 text-lg font-semibold tabular-nums text-ink">44 / 50</div>
                        <div className="text-[10px] text-success mt-0.5">Top Decile • Grade A Projection</div>
                      </div>
                      <div className="p-3 rounded-lg border border-line bg-canvas">
                        <div className="text-[11px] font-medium text-ink-muted">CS302 Database Systems</div>
                        <div className="mt-1 text-lg font-semibold tabular-nums text-ink">41 / 50</div>
                        <div className="text-[10px] text-success mt-0.5">Grade A- Projection</div>
                      </div>
                      <div className="p-3 rounded-lg border border-line bg-canvas">
                        <div className="text-[11px] font-medium text-ink-muted">CS303 Computer Networks</div>
                        <div className="mt-1 text-lg font-semibold tabular-nums text-ink">46 / 50</div>
                        <div className="text-[10px] text-success mt-0.5">Highest in Batch • Grade O Projection</div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* SUBTAB: Course Registration Basket */}
              {activeSubTab === 'registration' && (
                <div className="space-y-4">
                  {/* Registration Control Banner */}
                  <div className="rounded-lg border border-line bg-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs text-ink-muted">Selected Term Credits:</div>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-xl font-semibold tabular-nums text-ink">
                          {totalRegisteredCredits.toFixed(1)} Credits
                        </span>
                        <span className="text-xs text-ink-muted font-medium">
                          (Min 16.0 • Max 26.0 allowed)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {registrationSubmitted ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-success bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                          <CheckCircle2 size={14} />
                          <span>Basket Submitted &amp; Seats Held</span>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setRegistrationSubmitted(true)}
                          disabled={totalRegisteredCredits < 16.0}
                        >
                          Submit Course Basket
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Offerings List */}
                  <div className="space-y-3">
                    {availableCourses.map((course) => {
                      const isSelected = registeredCourses.includes(course.code);
                      return (
                        <div
                          key={course.code}
                          className={`rounded-lg border p-4 transition-colors duration-150 ${
                            isSelected
                              ? 'border-brand bg-brand/5'
                              : 'border-line bg-surface'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-ink">
                                  {course.code}
                                </span>
                                <Badge variant="neutral" size="xs">
                                  {course.category}
                                </Badge>
                                <span className="text-[11px] text-ink-muted tabular-nums">
                                  {course.ltps}
                                </span>
                              </div>

                              <h4 className="text-sm font-semibold text-ink mt-1 m-0">
                                {course.title}
                              </h4>

                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                                <span>Instructor: {course.instructor}</span>
                                <span>•</span>
                                <span className="tabular-nums">
                                  Seats: {course.enrolled}/{course.capacity}
                                </span>
                                <span>•</span>
                                <span
                                  className={
                                    course.prereqMet
                                      ? 'text-success font-medium'
                                      : 'text-danger font-medium'
                                  }
                                >
                                  {course.prereqMet ? 'Prerequisite Met' : 'Missing Prerequisite'}
                                </span>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-3">
                              <div className="text-right">
                                <span className="text-sm font-semibold tabular-nums text-ink">
                                  {course.credits.toFixed(1)}
                                </span>
                                <span className="text-xs text-ink-muted ml-1">Credits</span>
                              </div>

                              <Button
                                variant={isSelected ? 'outline' : 'primary'}
                                size="sm"
                                disabled={!course.prereqMet}
                                onClick={() => handleToggleCourse(course.code)}
                              >
                                {isSelected ? 'Drop Course' : 'Add to Basket'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SUBTAB: Concept Gap Analyzer */}
              {activeSubTab === 'gaps' && (
                <Card
                  title="Foundational Prerequisite & Concept Gap Audit"
                  subtitle="Autonomous analysis of prior academic coursework to ensure readiness for electives"
                >
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg border border-line bg-canvas text-xs text-ink-muted leading-relaxed">
                      The Meridian Academic Engine continuously cross-references prerequisite course performance against advanced elective syllabi to highlight potential mastery gaps.
                    </div>

                    <div className="divide-y divide-line border border-line rounded-lg overflow-hidden">
                      <div className="p-4 bg-surface flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-ink">
                            CS201 Data Structures &amp; Algorithms
                          </div>
                          <div className="text-[11px] text-ink-muted">
                            Completed in Semester 3 • Grade C (5.0 GP) • Cleared
                          </div>
                          <p className="text-xs text-ink-muted leading-relaxed m-0 pt-1">
                            Advisory: Review Graph Traversal and Dynamic Programming algorithms prior to registering for CS401 Distributed Systems.
                          </p>
                        </div>
                        <Badge variant="warning" size="xs">
                          Review Suggested
                        </Badge>
                      </div>

                      <div className="p-4 bg-surface flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-ink">
                            MA201 Linear Algebra &amp; Matrices
                          </div>
                          <div className="text-[11px] text-ink-muted">
                            Completed in Semester 4 • Grade A (9.0 GP) • Mastered
                          </div>
                          <p className="text-xs text-ink-muted leading-relaxed m-0 pt-1">
                            Full proficiency verified. Fully eligible and prepared for AI402 Deep Learning &amp; NLP.
                          </p>
                        </div>
                        <Badge variant="success" size="xs">
                          Mastered
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* SUBTAB: Placement Opportunities */}
              {activeSubTab === 'career' && (
                <Card
                  title="Active Placement Drives & Applications"
                  subtitle="Campus recruitment opportunities for which student meets all criteria"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-line text-ink-muted uppercase tracking-wider text-[11px] h-10">
                          <th className="py-2.5 px-3 font-medium">Company & Role</th>
                          <th className="py-2.5 px-3 font-medium">Package</th>
                          <th className="py-2.5 px-3 font-medium">Criteria Match</th>
                          <th className="py-2.5 px-3 font-medium">Interview / Test</th>
                          <th className="py-2.5 px-3 font-medium text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        <tr className="h-12 hover:bg-canvas/50 transition-colors">
                          <td className="py-2 px-3">
                            <div className="font-semibold text-ink">Google India</div>
                            <div className="text-[11px] text-ink-muted">Software Development Engineer</div>
                          </td>
                          <td className="py-2 px-3 font-semibold text-ink tabular-nums">₹32.5 LPA</td>
                          <td className="py-2 px-3">
                            <span className="text-success font-medium">100% (CGPA 8.45 &gt;= 7.50)</span>
                          </td>
                          <td className="py-2 px-3 text-ink-muted">Tomorrow, 10:00 AM</td>
                          <td className="py-2 px-3 text-right">
                            <Badge variant="success" size="xs">Interview Scheduled</Badge>
                          </td>
                        </tr>
                        <tr className="h-12 hover:bg-canvas/50 transition-colors">
                          <td className="py-2 px-3">
                            <div className="font-semibold text-ink">Microsoft</div>
                            <div className="text-[11px] text-ink-muted">Cloud &amp; Infrastructure Engineer</div>
                          </td>
                          <td className="py-2 px-3 font-semibold text-ink tabular-nums">₹24.0 LPA</td>
                          <td className="py-2 px-3">
                            <span className="text-success font-medium">100% (CGPA 8.45 &gt;= 7.00)</span>
                          </td>
                          <td className="py-2 px-3 text-ink-muted">Nov 18, 02:00 PM</td>
                          <td className="py-2 px-3 text-right">
                            <Badge variant="info" size="xs">Shortlisted</Badge>
                          </td>
                        </tr>
                        <tr className="h-12 hover:bg-canvas/50 transition-colors">
                          <td className="py-2 px-3">
                            <div className="font-semibold text-ink">Amazon</div>
                            <div className="text-[11px] text-ink-muted">Systems Development Engineer</div>
                          </td>
                          <td className="py-2 px-3 font-semibold text-ink tabular-nums">₹28.0 LPA</td>
                          <td className="py-2 px-3">
                            <span className="text-success font-medium">100% (CGPA 8.45 &gt;= 7.00)</span>
                          </td>
                          <td className="py-2 px-3 text-ink-muted">Online Assessment Cleared</td>
                          <td className="py-2 px-3 text-right">
                            <Badge variant="neutral" size="xs">Application Submitted</Badge>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Side Panel (1 Column) */}
        <div className="space-y-6">
          {/* Action Cards */}
          <div className="rounded-lg border border-line bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <Clock size={14} className="text-warning" />
                <span>Urgent Action Required</span>
              </span>
              <Badge variant="warning" size="xs">48h Remaining</Badge>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed m-0">
              Semester 7 course registration basket closes on Friday at 5:00 PM. Confirm your major electives before the window expires.
            </p>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setActiveSubTab('registration')}
              className="w-full"
            >
              Confirm Course Basket
            </Button>
          </div>

          <div className="rounded-lg border border-line bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <Calendar size={14} className="text-success" />
                <span>Next Interview</span>
              </span>
              <Badge variant="success" size="xs">Tomorrow</Badge>
            </div>
            <div className="text-xs text-ink leading-tight font-medium">
              Google India • Technical Round 1
            </div>
            <p className="text-xs text-ink-muted leading-relaxed m-0">
              Scheduled for 10:00 AM in Superday Lab 4. Verify your camera and HackerRank access credentials in advance.
            </p>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => onNavigateTab?.('interviews')}
              className="w-full"
            >
              View Interview Details
            </Button>
          </div>

          {/* NEP 2020 Degree Progression Milestones */}
          <Card
            title="Degree Progression Milestones"
            subtitle="NEP 2020 Multi-Exit Architecture"
          >
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-line">
                <span className="text-ink font-medium">UG Certificate (40 cr)</span>
                <Badge variant="success" size="xs">Cleared</Badge>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-line">
                <span className="text-ink font-medium">UG Diploma (80 cr)</span>
                <Badge variant="success" size="xs">Cleared</Badge>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-line">
                <span className="text-ink font-medium">UG Degree (120 cr)</span>
                <Badge variant="success" size="xs">Cleared</Badge>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-ink font-semibold">Honours Degree (160 cr)</span>
                <Badge variant="institutional" size="xs">132 / 160</Badge>
              </div>
            </div>
          </Card>

          {/* Academic Advisor Contact */}
          <Card
            title="Faculty Advisor"
            subtitle="Office of Academic Affairs"
          >
            <div className="text-xs space-y-1">
              <div className="font-semibold text-ink">Dr. Ramesh Kumar</div>
              <div className="text-ink-muted">Department of Computer Science &amp; Engineering</div>
              <div className="text-ink-muted pt-1">Office Hours: Mon, Wed 2:00 – 4:00 PM</div>
              <div className="pt-2">
                <Button variant="outline" size="xs" className="w-full" onClick={onOpenCopilot}>
                  Message via Advisor AI
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
