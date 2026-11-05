import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { Student, Application, Interview } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  FileText,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  Video,
  MapPin,
  ArrowRight,
  Sparkles,
  AlertCircle,
  XCircle,
} from 'lucide-react';

export const StudentApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getStudent('STU001')
      .then((res) => {
        setStudent(res.student);
        setApplications(res.applications || []);
        setInterviews(res.interviews || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalApps = applications.length;
  const shortlistedCount = applications.filter((a) => a.status === 'Shortlisted' || a.status === 'Interviewing' || a.status === 'Selected').length;
  const interviewingCount = applications.filter((a) => a.status === 'Interviewing').length;
  const offersCount = applications.filter((a) => a.status === 'Selected').length;

  const getStageIndex = (status: string) => {
    switch (status) {
      case 'Applied': return 1;
      case 'Shortlisted': return 2;
      case 'Interviewing': return 3;
      case 'Selected': return 4;
      case 'Rejected': return -1;
      default: return 1;
    }
  };

  const stages = [
    { label: 'Applied', desc: 'Profile Submitted' },
    { label: 'Shortlisted', desc: 'Screening Passed' },
    { label: 'Interviewing', desc: 'Rounds in Progress' },
    { label: 'Offered', desc: 'Placement Sealed' },
  ];

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="My Applications & Interviews"
        description="Candidate stage progression, scheduled technical evaluations, and official offers."
        badge={
          <Badge variant="institutional" size="xs">
            Candidate: {student?.name || 'Aarav Sharma'} ({student?.student_id || 'STU001'})
          </Badge>
        }
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/opportunities')}
            rightIcon={<ArrowRight size={13} />}
          >
            Explore Drives
          </Button>
        }
      />

      {/* Top Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Applications"
          value={loading ? '—' : totalApps}
          hint="Drives applied this season"
          icon={FileText}
        />
        <StatCard
          label="Shortlisted / Advanced"
          value={loading ? '—' : shortlistedCount}
          hint="Cleared initial screening"
          icon={CheckCircle2}
        />
        <StatCard
          label="Active Interviews"
          value={loading ? '—' : interviewingCount}
          hint={`${interviews.length} rounds logged`}
          icon={Calendar}
        />
        <StatCard
          label="Offers Extended"
          value={loading ? '—' : offersCount}
          hint={offersCount > 0 ? 'Verified Placement Offer' : 'Pending final rounds'}
          icon={Sparkles}
        />
      </div>

      {/* Application List with Interactive Progression Steppers */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No applications submitted yet"
          description="Browse active placement drives and submit your verified dossier to campus recruiters."
          actionLabel="Browse Opportunities"
          onAction={() => navigate('/opportunities')}
        />
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const currentStage = getStageIndex(app.status);
            const isRejected = app.status === 'Rejected';
            const matchingInterview = interviews.find((i) => i.application_id === app.application_id);

            return (
              <Card key={app.application_id} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-line">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-brand">
                        {app.application_id}
                      </span>
                      <span className="text-ink-muted text-xs">&bull;</span>
                      <span className="text-xs text-ink-muted">
                        Applied {app.applied_at ? new Date(app.applied_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-ink mt-1">
                      {app.job?.title || 'Software Engineering Role'}
                    </h3>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Recruiting Partner: <strong className="text-ink">{app.job?.company_id || 'Corporate Recruiter'}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {app.job?.package_lpa && (
                      <div className="text-right">
                        <span className="text-base font-bold text-success font-mono tabular-nums block">
                          ₹{app.job.package_lpa} LPA
                        </span>
                        <span className="text-[10px] text-ink-muted">Compensation</span>
                      </div>
                    )}
                    <Badge
                      variant={
                        app.status === 'Selected'
                          ? 'success'
                          : app.status === 'Interviewing'
                          ? 'info'
                          : app.status === 'Rejected'
                          ? 'danger'
                          : 'institutional'
                      }
                      size="sm"
                    >
                      {app.status}
                    </Badge>
                  </div>
                </div>

                {/* Progress Stepper */}
                <div className="py-5">
                  <div className="relative flex items-center justify-between">
                    <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-line -z-0" />
                    {stages.map((stage, idx) => {
                      const stepNum = idx + 1;
                      const isComplete = !isRejected && currentStage >= stepNum;
                      const isCurrent = !isRejected && currentStage === stepNum;

                      return (
                        <div key={stage.label} className="relative z-10 flex flex-col items-center bg-surface px-2">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                              isRejected
                                ? 'bg-line text-ink-muted'
                                : isComplete
                                ? 'bg-brand text-white'
                                : isCurrent
                                ? 'bg-brand/20 text-brand border-2 border-brand'
                                : 'bg-canvas text-ink-muted border border-line'
                            }`}
                          >
                            {isComplete ? <CheckCircle2 size={15} /> : stepNum}
                          </div>
                          <span className={`text-xs mt-1.5 font-medium ${isCurrent ? 'text-brand font-semibold' : 'text-ink'}`}>
                            {stage.label}
                          </span>
                          <span className="text-[10px] text-ink-muted hidden sm:block">
                            {stage.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Next Step / Status Callout */}
                <div className="pt-4 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-canvas/60 p-3 rounded-lg border border-line">
                  {matchingInterview ? (
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-brand shrink-0" />
                      <div>
                        <span className="font-semibold text-ink">Upcoming Evaluation: </span>
                        <span className="text-ink-muted">{matchingInterview.round} &bull; </span>
                        <span className="font-mono text-ink">
                          {matchingInterview.scheduled_start ? new Date(matchingInterview.scheduled_start).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }) : 'Time TBD'}
                        </span>
                        <span className="text-ink-muted"> ({matchingInterview.mode})</span>
                      </div>
                    </div>
                  ) : app.status === 'Selected' ? (
                    <div className="flex items-center gap-2 text-success font-medium">
                      <Sparkles size={14} className="shrink-0" />
                      <span>Congratulations! Offer letter and pre-onboarding formalities initiated.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-ink-muted">
                      <Clock size={14} className="shrink-0" />
                      <span>Application dossier under recruiter review. You will receive an SMS and email notification when shortlisted.</span>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => navigate('/me/profile')}
                  >
                    View Verified Dossier
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

