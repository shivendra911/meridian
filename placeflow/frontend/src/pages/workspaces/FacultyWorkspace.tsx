import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  BookOpen,
  Calendar,
  Award,
  Sparkles,
  FileCheck2,
  AlertTriangle,
  ChevronRight,
  Save,
  Send,
  GraduationCap,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';

interface FacultyWorkspaceProps {
  onNavigateTab?: (tabId: string) => void;
  onOpenCopilot?: () => void;
}

export const FacultyWorkspace: React.FC<FacultyWorkspaceProps> = ({
  onNavigateTab,
  onOpenCopilot,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'gradebook' | 'advising'>('roster');
  const [selectedCourse, setSelectedCourse] = useState('CS301');

  // Roster state with attendance toggles
  const [roster, setRoster] = useState([
    { id: 'STU001', name: 'Rohan Sharma', roll: '2023CSB001', attendance: 'PRESENT', cieScore: 44, grade: 'O' },
    { id: 'STU002', name: 'Priya Iyer', roll: '2023CSB002', attendance: 'PRESENT', cieScore: 38, grade: 'A+' },
    { id: 'STU003', name: 'Amit Verma', roll: '2023CSB003', attendance: 'ABSENT', cieScore: 32, grade: 'B+' },
    { id: 'STU004', name: 'Sneha Patel', roll: '2023CSB004', attendance: 'PRESENT', cieScore: 41, grade: 'A' },
    { id: 'STU005', name: 'Vikram Singh', roll: '2023CSB005', attendance: 'LATE', cieScore: 28, grade: 'C' },
  ]);

  const handleToggleAttendance = (id: string) => {
    setRoster(
      roster.map((s) => {
        if (s.id !== id) return s;
        const nextState =
          s.attendance === 'PRESENT' ? 'ABSENT' : s.attendance === 'ABSENT' ? 'LATE' : 'PRESENT';
        return { ...s, attendance: nextState };
      })
    );
  };

  const handleMarkAllPresent = () => {
    setRoster(roster.map((s) => ({ ...s, attendance: 'PRESENT' })));
  };

  const handleGradeChange = (id: string, newGrade: string) => {
    setRoster(roster.map((s) => (s.id === id ? { ...s, grade: newGrade } : s)));
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Faculty Status Ribbon */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs border-l-4 border-l-navy-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral" size="xs">
              Faculty Teaching Workbench
            </Badge>
            <span className="text-slate-300">&bull;</span>
            <span className="text-xs font-mono text-slate-500">FAC-8921 &bull; Dept of Computer Science</span>
          </div>

          <h1 className="font-serif font-bold text-xl text-slate-900 mt-1 m-0">
            Dr. Ramesh Kumar, Ph.D.
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 m-0">
            Senior Assistant Professor &bull; Academic Delivery Term: Even Semester 2026
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCopilot}
            leftIcon={<Sparkles size={13} className="text-cardinal" />}
          >
            Teaching Assistant AI
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => toast.success('Attendance & Grade records synchronized with CAMP-03 Academic Record Engine!')}
            leftIcon={<Save size={13} />}
          >
            Save Session Records
          </Button>
        </div>
      </div>

      {/* 2. Key Teaching Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Assigned Courses"
          value="2"
          subValue="CS301 & CS401"
          change="8.0 Credits Total"
          changeType="neutral"
          icon={BookOpen}
        />
        <StatCard
          label="Total Enrolled Students"
          value="110"
          subValue="Across 2 Sections"
          change="92.4% Avg Attendance"
          changeType="up"
          icon={Users}
        />
        <StatCard
          label="Mentored M.Tech / UG Mentees"
          value="14"
          subValue="Advising Roster"
          change="3 At-Risk Alerts"
          changeType="down"
          icon={GraduationCap}
        />
        <StatCard
          label="CIE Grade Submissions"
          value="1 / 2"
          subValue="CS301 Pending"
          change="Deadline: 4 Days"
          changeType="neutral"
          icon={FileCheck2}
        />
      </div>

      {/* 3. Course Selector Bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded p-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Active Delivery Course:
          </span>
          <button
            onClick={() => setSelectedCourse('CS301')}
            className={`px-3 py-1 rounded text-xs font-semibold border transition-colors ${
              selectedCourse === 'CS301'
                ? 'bg-navy-900 text-white border-navy-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            CS301: Operating Systems (68 Students)
          </button>
          <button
            onClick={() => setSelectedCourse('CS401')}
            className={`px-3 py-1 rounded text-xs font-semibold border transition-colors ${
              selectedCourse === 'CS401'
                ? 'bg-navy-900 text-white border-navy-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            CS401: Distributed Systems (42 Students)
          </button>
        </div>

        <span className="text-xs font-mono text-slate-400">Term: Spring Semester 2026</span>
      </div>

      {/* 4. Sub-Tabs */}
      <div className="space-y-4">
        <Tabs
          activeTab={activeSubTab}
          onChange={(tab) => setActiveSubTab(tab as any)}
          tabs={[
            { id: 'roster', label: 'Class Roster & Attendance Matrix', icon: Users, count: roster.length },
            { id: 'gradebook', label: 'CIE Gradebook & Moderation', icon: Award },
            { id: 'advising', label: 'Mentee Advising & At-Risk Radar', icon: GraduationCap, count: 3 },
          ]}
        />

        {/* SUBTAB 1: Roster & Attendance */}
        {activeSubTab === 'roster' && (
          <Card
            title={`Attendance Session: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`}
            subtitle="Click student status to toggle between Present, Absent, and Late"
            actionSlot={
              <Button variant="outline" size="xs" onClick={handleMarkAllPresent}>
                Mark All Present
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Roll Number</th>
                    <th className="py-2.5 px-3">CIE Progress</th>
                    <th className="py-2.5 px-3 text-center">Session Status</th>
                    <th className="py-2.5 px-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roster.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-900">{s.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{s.roll}</td>
                      <td className="py-2.5 px-3 font-mono">{s.cieScore} / 50</td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleToggleAttendance(s.id)}
                          className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border cursor-pointer transition-colors ${
                            s.attendance === 'PRESENT'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : s.attendance === 'ABSENT'
                              ? 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {s.attendance}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onNavigateTab?.('students')}
                          className="text-[11px] font-semibold text-cardinal hover:underline"
                        >
                          View Dossier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* SUBTAB 2: Gradebook */}
        {activeSubTab === 'gradebook' && (
          <Card
            title="Continuous Internal Evaluation (CIE) Gradebook"
            subtitle="UGC 10-Point Scale Letter Grade Assignment"
            actionSlot={
              <Button
                variant="primary"
                size="xs"
                rightIcon={<Send size={11} />}
                onClick={() => toast.success('CIE Grade proposal submitted to Dean of Academics for Moderation!')}
              >
                Submit for Moderation
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3 font-mono">Roll</th>
                    <th className="py-2.5 px-3">Raw CIE (50)</th>
                    <th className="py-2.5 px-3">Letter Grade</th>
                    <th className="py-2.5 px-3">Grade Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {roster.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-900">{s.name}</td>
                      <td className="py-2.5 px-3 text-slate-500">{s.roll}</td>
                      <td className="py-2.5 px-3">{s.cieScore}</td>
                      <td className="py-2.5 px-3">
                        <select
                          value={s.grade}
                          onChange={(e) => handleGradeChange(s.id, e.target.value)}
                          className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-bold text-slate-800 focus:border-cardinal"
                        >
                          {['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'].map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-bold">
                        {s.grade === 'O' ? '10.0' : s.grade === 'A+' ? '9.0' : s.grade === 'A' ? '8.0' : s.grade === 'B+' ? '7.0' : s.grade === 'B' ? '6.0' : s.grade === 'C' ? '5.0' : s.grade === 'P' ? '4.0' : '0.0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* SUBTAB 3: Mentee Advising */}
        {activeSubTab === 'advising' && (
          <Card title="At-Risk Mentees & Foundational Gap Signals" subtitle="Academic mentoring alerts">
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-900 flex items-start justify-between">
                <div>
                  <div className="font-bold">Amit Verma (2023CSB003) &bull; CGPA: 5.82</div>
                  <p className="mt-0.5 text-red-800 m-0">
                    Attendance 62% in CS301 (Below 75% statutory bar). Prerequisite gap flagged in Discrete Mathematics.
                  </p>
                </div>
                <Badge variant="danger" size="xs">At-Risk</Badge>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 flex items-start justify-between">
                <div>
                  <div className="font-bold">Vikram Singh (2023CSB005) &bull; CGPA: 6.40</div>
                  <p className="mt-0.5 text-amber-800 m-0">
                    Active backlog in CS201 Data Structures. Requires remedial mentoring session before semester exams.
                  </p>
                </div>
                <Badge variant="warning" size="xs">Backlog Alert</Badge>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
