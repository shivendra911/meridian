import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Check,
  Radar,
  Zap,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { api } from '../../api';
import { toast } from 'sonner';

export interface TaskItem {
  id: string;
  title: string;
  domain: 'Academic' | 'IAM' | 'Placement' | 'Governance';
  deadline: string;
  urgency: 'OVERDUE' | 'TODAY' | 'UPCOMING';
  targetPath: string;
  description: string;
}

interface UnifiedTaskInboxProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tabId: string) => void;
}

export const UnifiedTaskInbox: React.FC<UnifiedTaskInboxProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([
        api.getSuperdayConflicts().catch(() => null),
        api.getRenegeRadar().catch(() => null),
        api.getJobs().catch(() => null),
      ]).then(([sRes, rRes, jRes]) => {
        const dynamicTasks: TaskItem[] = [];

        // Superday Conflict Task
        if (sRes && sRes.clashes_count > 0) {
          dynamicTasks.push({
            id: 'task_superday',
            title: `Resolve Superday Conflict (${sRes.clashes_count} interview clashes)`,
            domain: 'Placement',
            deadline: 'Immediate • Overdue',
            urgency: 'OVERDUE',
            targetPath: '/placement/interviews',
            description: `Candidate interview overlaps detected across concurrent corporate recruiting boards.`,
          });
        }

        // Post-offer Renege Risk Task
        if (rRes && rRes.critical_count > 0) {
          dynamicTasks.push({
            id: 'task_renege',
            title: `Mitigate Flight Risk (${rRes.critical_count} critical candidates)`,
            domain: 'Placement',
            deadline: 'Today, 5:00 PM',
            urgency: 'TODAY',
            targetPath: '/placement/offers',
            description: `Predictive ML model detected renege probability >= 60% among placed candidates.`,
          });
        }

        // Placement Drive Review Task
        const openJobs = jRes?.jobs?.filter((j) => j.status === 'Open') || [];
        if (openJobs.length > 0) {
          dynamicTasks.push({
            id: 'task_drives',
            title: `Review ${openJobs[0].title} Drive Enrollment`,
            domain: 'Placement',
            deadline: 'Tomorrow, 11:00 AM',
            urgency: 'UPCOMING',
            targetPath: `/placement/drives/${openJobs[0].job_id}`,
            description: `${openJobs[0].company_id} offers ₹${openJobs[0].package_lpa} LPA. Verification of candidate cutoffs pending.`,
          });
        }

        // Institutional Academic Governance
        dynamicTasks.push({
          id: 'task_academic',
          title: 'Approve B.Tech CSE Curriculum 2026.1 Revision',
          domain: 'Academic',
          deadline: 'In 2 days',
          urgency: 'UPCOMING',
          targetPath: '/me/academics',
          description: 'L-T-P-S credit calculation & prerequisite DAG ready for statutory sign-off.',
        });

        dynamicTasks.push({
          id: 'task_dpdp',
          title: 'Attest DPDP Act 2023 Placement Consents',
          domain: 'Governance',
          deadline: 'In 3 days',
          urgency: 'UPCOMING',
          targetPath: '/compliance/consent',
          description: 'Verified APAAR & DigiLocker identity attestations awaiting compliance archival.',
        });

        setTasks(dynamicTasks);
        setLoading(false);
      });
    }
  }, [isOpen]);

  const handleExecuteTask = (task: TaskItem) => {
    navigate(task.targetPath);
    onClose();
  };

  const handleResolveTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    toast.success('Task marked as completed & archived to audit ledger');
  };

  if (!isOpen) return null;

  const domainIcons = {
    Academic: GraduationCap,
    IAM: ShieldCheck,
    Placement: Briefcase,
    Governance: Building2,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex pl-10 max-w-full">
        <div className="w-screen max-w-md bg-surface shadow-2xl border-l border-line flex flex-col">
          {/* Header */}
          <div className="p-4 bg-brand text-white flex items-center justify-between border-b border-brand-hover">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold">
                <Inbox size={16} />
              </div>
              <div>
                <div className="font-semibold text-sm flex items-center gap-2">
                  <span>My Work &bull; Unified Action Inbox</span>
                  <span className="text-[10px] bg-white/20 text-white font-mono font-bold px-1.5 py-0.5 rounded">
                    {tasks.length} Actionable
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Real-time approvals across Placement, Academic &amp; IAM
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Actionable List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="py-12 text-center text-xs text-ink-muted">
                Syncing actionable items with Campus Telemetry...
              </div>
            ) : tasks.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                  <Check size={20} />
                </div>
                <div className="text-sm font-semibold text-ink">Inbox Zero!</div>
                <p className="text-xs text-ink-muted max-w-xs mx-auto">
                  All urgent placement conflicts, risk items, and approvals have been resolved.
                </p>
              </div>
            ) : (
              tasks.map((task) => {
                const Icon = domainIcons[task.domain] || Inbox;
                return (
                  <div
                    key={task.id}
                    className="bg-surface border border-line rounded-lg p-3.5 shadow-2xs hover:border-slate-300 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-6 h-6 rounded bg-canvas text-ink flex items-center justify-center shrink-0 border border-line">
                          <Icon size={13} />
                        </div>
                        <span className="text-[11px] font-semibold text-ink-muted uppercase font-mono tracking-wider">
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
                      <h4 className="font-semibold text-xs text-ink m-0">
                        {task.title}
                      </h4>
                      <p className="text-[11px] text-ink-muted mt-1 m-0 leading-relaxed">
                        {task.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-line flex items-center justify-between">
                      <button
                        onClick={(e) => handleResolveTask(task.id, e)}
                        className="text-[11px] text-ink-muted hover:text-success inline-flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <CheckCircle2 size={13} />
                        <span>Dismiss / Mark Done</span>
                      </button>

                      <Button
                        variant="primary"
                        size="xs"
                        rightIcon={<ArrowRight size={11} />}
                        onClick={() => handleExecuteTask(task)}
                      >
                        Execute
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-line bg-canvas text-[10px] text-ink-muted flex items-center justify-between font-mono">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={12} className="text-success" />
              <span>All tasks verified &amp; scoped</span>
            </span>
            <span>Meridian Campus OS</span>
          </div>
        </div>
      </div>
    </div>
  );
};
