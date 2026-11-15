import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SeasonTimeline, SeasonDriveItem } from '../../../ui/SeasonTimeline';
import { PeekPanel } from '../../../ui/PeekPanel';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { useDocumentTitle, CompanyMark, Spine, SpineStage } from '../../../ui';
import { AlertCircle, ArrowRight, Briefcase } from 'lucide-react';

const MOCK_SEASON_DRIVES: SeasonDriveItem[] = [
  {
    id: 'drv_cognizant',
    companyName: 'Cognizant',
    role: 'Programmer Analyst',
    isPublished: true,
    hasClash: true,
    clashReason: 'Interview room clash with Razorpay in Seminar Hall B',
    stages: [
      { id: 's1', name: 'Reg', startDate: '2026-11-01', endDate: '2026-11-10', type: 'reg' },
      { id: 's2', name: 'Test', startDate: '2026-11-12', endDate: '2026-11-15', type: 'test' },
      { id: 's3', name: 'Interviews', startDate: '2026-11-18', endDate: '2026-11-20', type: 'interview', hasClash: true },
      { id: 's4', name: 'Offers', startDate: '2026-11-25', endDate: '2026-11-28', type: 'offer' },
    ],
  },
  {
    id: 'drv_zoho',
    companyName: 'Zoho Corporation',
    role: 'Software Development Engineer',
    isPublished: true,
    hasClash: false,
    stages: [
      { id: 's1', name: 'Reg', startDate: '2026-11-10', endDate: '2026-11-20', type: 'reg' },
      { id: 's2', name: 'Test', startDate: '2026-11-22', endDate: '2026-11-25', type: 'test' },
      { id: 's3', name: 'Interviews', startDate: '2026-11-28', endDate: '2026-12-05', type: 'interview' },
    ],
  },
  {
    id: 'drv_razorpay',
    companyName: 'Razorpay',
    role: 'Frontend Platform Engineer',
    isPublished: true,
    hasClash: true,
    clashReason: 'Interview panel clash on 18 Nov',
    stages: [
      { id: 's1', name: 'Reg', startDate: '2026-11-15', endDate: '2026-11-22', type: 'reg' },
      { id: 's2', name: 'Test', startDate: '2026-11-24', endDate: '2026-11-26', type: 'test' },
      { id: 's3', name: 'Interviews', startDate: '2026-11-28', endDate: '2026-12-02', type: 'interview', hasClash: true },
    ],
  },
  {
    id: 'drv_infosys',
    companyName: 'Infosys',
    role: 'Specialist Programmer',
    isPublished: false,
    hasClash: false,
    stages: [
      { id: 's1', name: 'Draft', startDate: '2026-12-01', endDate: '2026-12-10', type: 'reg' },
      { id: 's2', name: 'Hackathon', startDate: '2026-12-15', endDate: '2026-12-20', type: 'test' },
    ],
  },
];

export const SeasonPage: React.FC = () => {
  useDocumentTitle('Season Timeline & Planning');
  const navigate = useNavigate();

  const [selectedDriveId, setSelectedDriveId] = useState<string | null>(null);

  const selectedDrive = MOCK_SEASON_DRIVES.find((d) => d.id === selectedDriveId);

  const peekSpineStages: SpineStage[] = selectedDrive
    ? selectedDrive.stages.map((stg) => ({
        id: stg.id,
        label: stg.name,
        status: stg.type === 'offer' ? 'upcoming' : 'current',
      }))
    : [];

  return (
    <div className="space-y-6 font-sans max-w-6xl mx-auto pb-12">
      <PageHeader
        title="Placement Season 2026 Planning Board"
        description="Timeline of corporate recruitment drives across weeks, schedule overlaps, and clash alerts."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              pill
              size="sm"
              onClick={() => navigate('/tpo/interviews')}
              leftIcon={<AlertCircle size={14} className="text-danger" />}
            >
              Resolve 2 Clashes
            </Button>
            <Button
              variant="primary"
              pill
              size="sm"
              onClick={() => navigate('/tpo/drives')}
              leftIcon={<Briefcase size={14} />}
            >
              All Drives
            </Button>
          </div>
        }
      />

      {/* Legend & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-line bg-surface text-xs">
        <div className="flex items-center gap-4 text-ink-muted">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-surface border border-line" />
            <span>Registration / Test</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-brand" />
            <span>Interviews</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-block-teal" />
            <span>Offers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-danger" />
            <span>Schedule Clash</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-now" />
            <span>Today Line</span>
          </div>
        </div>

        <span className="font-semibold text-ink">
          Tip: Click any drive row to inspect its details in the Peek Panel.
        </span>
      </div>

      {/* Season Timeline Gantt-style View */}
      <SeasonTimeline
        drives={MOCK_SEASON_DRIVES}
        months={['Nov 2026', 'Dec 2026', 'Jan 2027', 'Feb 2027']}
        todayPositionPercent={40}
        onDriveClick={(id) => setSelectedDriveId(id)}
      />

      {/* Peek Panel for Selected Drive */}
      <PeekPanel
        isOpen={Boolean(selectedDrive)}
        onClose={() => setSelectedDriveId(null)}
        title={selectedDrive?.companyName || 'Drive Details'}
        subtitle={selectedDrive?.role}
        width={480}
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              pill
              size="sm"
              onClick={() => setSelectedDriveId(null)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              pill
              size="sm"
              onClick={() => {
                if (selectedDrive) {
                  navigate(`/tpo/drives/${selectedDrive.id}`);
                }
              }}
              rightIcon={<ArrowRight size={14} />}
            >
              Open Drive Room
            </Button>
          </div>
        }
      >
        {selectedDrive && (
          <div className="space-y-5 text-ink">
            <div className="flex items-center gap-3">
              <CompanyMark name={selectedDrive.companyName} size="md" />
              <div>
                <h3 className="text-base font-bold text-ink m-0">{selectedDrive.companyName}</h3>
                <p className="text-xs text-ink-muted m-0">{selectedDrive.role}</p>
              </div>
            </div>

            {selectedDrive.hasClash && (
              <div className="p-3 rounded-xl bg-danger-bg border border-danger-border text-danger text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold m-0">Schedule Clash Detected</p>
                  <p className="m-0 mt-0.5">{selectedDrive.clashReason}</p>
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">
                Recruitment Stages
              </p>
              <Spine stages={peekSpineStages} size="sm" />
            </div>

            <div className="border-t border-line pt-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-muted">Drive Status</span>
                <span className="font-semibold text-ink">
                  {selectedDrive.isPublished ? 'Published & Active' : 'Draft / Unpublished'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-muted">Registered Candidates</span>
                <span className="font-semibold text-ink">84 Applicants</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-muted">Eligibility Passed</span>
                <span className="font-semibold text-success">42 Qualified</span>
              </div>
            </div>
          </div>
        )}
      </PeekPanel>
    </div>
  );
};

export default SeasonPage;
