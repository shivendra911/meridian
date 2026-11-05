import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  GraduationCap,
  ShieldCheck,
  Briefcase,
  Building2,
  ArrowRight,
  Inbox,
  X,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface TaskItem {
  id: string;
  title: string;
  domain: 'Academic' | 'IAM' | 'Placement' | 'Governance';
  deadline: string;
  urgency: 'OVERDUE' | 'TODAY' | 'UPCOMING';
  targetTab: string;
  description: string;
}

interface UnifiedTaskInboxProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const UnifiedTaskInbox: React.FC<UnifiedTaskInboxProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const tasks: TaskItem[] = [
    {
      id: 'task_01',
      title: 'Approve B.Tech CSE Curriculum 2026.1',
      domain: 'Academic',
      deadline: 'Today, 5:00 PM',
      urgency: 'TODAY',
      targetTab: 'academic',
      description: 'L-T-P-S credit calculation & prerequisite DAG ready for Dean review.',
    },
    {
      id: 'task_02',
      title: 'Review Google SWE JNF Placement Drive',
      domain: 'Placement',
      deadline: 'Tomorrow, 11:00 AM',
      urgency: 'UPCOMING',
      targetTab: 'jobs',
      description: 'Role offers ₹28.50 LPA. Staged in Human Gate waiting for TPO sign-off.',
    },
    {
      id: 'task_03',
      title: 'Resolve Superday Conflict for STU007',
      domain: 'Placement',
      deadline: 'Overdue by 2 hours',
      urgency: 'OVERDUE',
      targetTab: 'superday',
      description: 'Interview overlap between Amazon and Microsoft at 10:00 AM.',
    },
    {
      id: 'task_04',
      title: 'Confirm Faculty Role Delegation (Dr. Mehta)',
      domain: 'IAM',
      deadline: 'In 2 days',
      urgency: 'UPCOMING',
      targetTab: 'iam',
      description: 'Departmental placement coordinator delegation requires confirmation.',
    },
    {
      id: 'task_05',
      title: 'Verify Campus AISHE Statutory Evidence',
      domain: 'Governance',
      deadline: 'In 3 days',
      urgency: 'UPCOMING',
      targetTab: 'architecture',
      description: 'Main campus regulatory identifier checklist 12/12 readiness check.',
    },
  ];

  if (!isOpen) return null;

  const domainIcons = {
    Academic: GraduationCap,
    IAM: ShieldCheck,
    Placement: Briefcase,
    Governance: Building2,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex pl-10 max-w-full">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col font-sans">
          {/* Header */}
          <div className="p-4 bg-[#090D16] text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-cardinal text-white flex items-center justify-center">
                <Inbox size={16} />
              </div>
              <div>
                <div className="font-serif font-bold text-sm flex items-center gap-2">
                  <span>My Work &bull; Unified Inbox</span>
                  <span className="text-[10px] bg-red-100 text-cardinal font-mono font-bold px-1.5 py-0.2 rounded">
                    {tasks.length} Actionable
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Aggregated approvals across Academic, IAM &amp; Placement
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Actionable List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {tasks.map((task) => {
              const Icon = domainIcons[task.domain] || Inbox;
              return (
                <div
                  key={task.id}
                  className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs hover:border-slate-300 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-6 h-6 rounded bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                        <Icon size={13} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase font-mono tracking-wider">
                        {task.domain}
                      </span>
                    </div>

                    <Badge
                      variant={
                        task.urgency === 'OVERDUE'
                          ? 'danger'
                          : task.urgency === 'TODAY'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="xs"
                      isDot
                      isPulse={task.urgency === 'OVERDUE'}
                    >
                      {task.deadline}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="font-serif font-bold text-xs text-slate-900 m-0">
                      {task.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-1 m-0 font-sans leading-relaxed">
                      {task.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                    <Button
                      variant="primary"
                      size="xs"
                      rightIcon={<ArrowRight size={11} />}
                      onClick={() => {
                        onNavigateTab(task.targetTab);
                        onClose();
                      }}
                    >
                      Execute Workflow
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-500 flex items-center justify-between font-mono">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-600" />
              <span>All tasks verified &amp; scoped</span>
            </span>
            <span>CAMP-01/02/03 Sync</span>
          </div>
        </div>
      </div>
    </div>
  );
};

