import React, { useState } from 'react';
import {
  Building2,
  Users,
  GraduationCap,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';

interface HodWorkspaceProps {
  onNavigateTab?: (tabId: string) => void;
  onOpenCopilot?: () => void;
}

export const HodWorkspace: React.FC<HodWorkspaceProps> = ({
  onNavigateTab,
  onOpenCopilot,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'approvals' | 'workload' | 'standing'>('approvals');

  return (
    <div className="space-y-6 font-sans">
      {/* 1. HOD Status Ribbon */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs border-l-4 border-l-navy-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral" size="xs">
              Departmental Governance &bull; HOD Command
            </Badge>
            <span className="text-slate-300">&bull;</span>
            <span className="text-xs font-mono text-slate-500">School of Computing &bull; Dept of CSE</span>
          </div>

          <h1 className="font-serif font-bold text-xl text-slate-900 mt-1 m-0">
            Prof. Dr. S. Ramanathan, Senior Dean
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 m-0">
            Head of Department &bull; Jurisdiction: 42 Faculty Members &bull; 680 Undergraduate Scholars
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCopilot}
            leftIcon={<Sparkles size={13} className="text-cardinal" />}
          >
            Department Intelligence AI
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigateTab?.('academic')}
            rightIcon={<ArrowRight size={13} />}
          >
            Curriculum Designer
          </Button>
        </div>
      </div>

      {/* 2. Key Department Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Department Enrollment"
          value="680"
          subValue="Across 4 Batches"
          change="98.2% Sanctioned Intake"
          changeType="up"
          icon={Users}
        />
        <StatCard
          label="Faculty Teaching Load"
          value="14.2"
          subValue="Hrs / Week Avg"
          change="Balanced &bull; AICTE Norm"
          changeType="neutral"
          icon={Building2}
        />
        <StatCard
          label="Pending Curriculum Approvals"
          value="2"
          subValue="Revisions v2026.1"
          change="Dean Review Required"
          changeType="down"
          icon={FileCheck2}
        />
        <StatCard
          label="Placement Clearance"
          value="84.2%"
          subValue="572 / 680 Placed"
          change="Avg CTC: ₹14.8 LPA"
          changeType="up"
          icon={GraduationCap}
        />
      </div>

      {/* 3. Sub-Tabs */}
      <div className="space-y-4">
        <Tabs
          activeTab={activeSubTab}
          onChange={(tab) => setActiveSubTab(tab as any)}
          tabs={[
            { id: 'approvals', label: 'Curriculum & Program Approvals', icon: FileCheck2, count: 2 },
            { id: 'workload', label: 'Faculty Teaching Load Distribution', icon: Users },
            { id: 'standing', label: 'Academic Standing & Progression Audit', icon: BarChart3 },
          ]}
        />

        {activeSubTab === 'approvals' && (
          <Card title="Pending Departmental Approvals Queue" subtitle="Curriculum versions, course introductions & role assignments">
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded flex items-center justify-between shadow-2xs">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>B.Tech CSE Version 2026.1 (Curriculum Revision)</span>
                    <Badge variant="warning" size="xs">Pending Approval</Badge>
                  </div>
                  <div className="text-slate-500 font-mono mt-0.5">
                    +2 New Core Electives (Cloud DevOps, Quantum Computing) &bull; Credit Balance: 160.0 Credits
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="xs" onClick={() => onNavigateTab?.('academic')}>
                    Inspect Diff
                  </Button>
                  <Button variant="primary" size="xs" onClick={() => toast.success('Approved curriculum revision B.Tech CSE v2026.1!')}>
                    Approve Version
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded flex items-center justify-between shadow-2xs">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>Faculty Placement Delegation: Dr. Ramesh Kumar</span>
                    <Badge variant="info" size="xs">Delegation</Badge>
                  </div>
                  <div className="text-slate-500 font-mono mt-0.5">
                    Delegate: Placement Coordinator &bull; Scope: Dept of CSE &bull; Validity: 1 Year
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="xs" onClick={() => toast.success('Delegation Authority Approved!')}>
                    Confirm Scope
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeSubTab === 'workload' && (
          <Card title="Faculty Teaching Workload Matrix" subtitle="AICTE Norm: 12-16 hours per week for Assistant Professors">
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900">Dr. Ramesh Kumar (Senior Asst. Prof)</span>
                  <div className="text-[11px] text-slate-500">CS301 (4 cr) + CS401 (4 cr) &bull; 8 Lecture Hrs + 4 Lab Hrs</div>
                </div>
                <Badge variant="success" size="xs">12 Hrs &bull; Optimal</Badge>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900">Dr. Sunita Rao (Associate Prof)</span>
                  <div className="text-[11px] text-slate-500">AI402 (4 cr) + Research Guidance &bull; 10 Lecture Hrs + 4 Lab Hrs</div>
                </div>
                <Badge variant="success" size="xs">14 Hrs &bull; Optimal</Badge>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900">Prof. Arvind Patel (Professor)</span>
                  <div className="text-[11px] text-slate-500">FIN301 (3 cr) + Dept Admin &bull; 6 Lecture Hrs + 10 Admin Hrs</div>
                </div>
                <Badge variant="neutral" size="xs">16 Hrs &bull; High</Badge>
              </div>
            </div>
          </Card>
        )}

        {activeSubTab === 'standing' && (
          <Card title="Student Progression Standing Distribution" subtitle="6-Step Deterministic Progression Pipeline Evaluation">
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded">
                <div className="text-[10px] text-emerald-700 font-bold uppercase font-mono">Normal Progression</div>
                <div className="font-serif font-bold text-xl text-emerald-900 mt-1">612</div>
                <div className="text-[10px] text-emerald-600 mt-0.5">90.0% of Department</div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                <div className="text-[10px] text-amber-700 font-bold uppercase font-mono">Probationary Promoted</div>
                <div className="font-serif font-bold text-xl text-amber-900 mt-1">54</div>
                <div className="text-[10px] text-amber-600 mt-0.5">7.9% with &lt; 2 Backlogs</div>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <div className="text-[10px] text-red-700 font-bold uppercase font-mono">Retained Year Repeat</div>
                <div className="font-serif font-bold text-xl text-red-900 mt-1">14</div>
                <div className="text-[10px] text-red-600 mt-0.5">2.1% Credit Shortfall</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
