import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { Company, Job } from '../../types';
import { Building2, Briefcase, Mail, MapPin, ArrowLeft, ArrowRight } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { PlacementDriveWizard } from '../workspaces/PlacementDriveWizard';
import { Sparkles } from 'lucide-react';

export const CompanyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [drives, setDrives] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'drives' | 'contacts' | 'history'>('overview');
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getCompanies(), api.getJobs()])
      .then(([cRes, jRes]) => {
        const found = cRes.companies.find((c) => c.company_id === id);
        setCompany(found || null);
        setDrives((jRes.jobs || []).filter((j) => j.company_id === id || j.company_id === found?.name));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 font-sans">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (!company) {
    return (
      <EmptyState
        icon={Building2}
        title="Corporate partner not found"
        description={`No registered corporate partner found with ID "${id}".`}
        actionLabel="Back to Partners"
        onAction={() => navigate('/placement/companies')}
      />
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/placement/companies')}
          className="text-xs text-ink-muted hover:text-ink flex items-center gap-1 cursor-pointer font-medium"
        >
          <ArrowLeft size={13} />
          <span>Back to Partners</span>
        </button>
      </div>

      <PageHeader
        title={company.name}
        description={`Company ID: ${company.company_id} • Sector: ${company.industry} • Office: ${company.location}`}
        badge={<Badge variant="success" size="xs">Active Partner</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/placement/drives')}
              leftIcon={<Briefcase size={14} />}
            >
              All Drives ({drives.length})
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsWizardOpen(true)}
              leftIcon={<Sparkles size={14} />}
            >
              Create Drive
            </Button>
          </div>
        }
      />

      <div className="rounded-lg border border-line bg-surface p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-ink-muted block text-[11px]">Primary Sector</span>
          <span className="text-sm font-semibold text-ink">{company.industry}</span>
        </div>
        <div>
          <span className="text-ink-muted block text-[11px]">Operating Location</span>
          <span className="text-sm font-semibold text-ink">{company.location}</span>
        </div>
        <div>
          <span className="text-ink-muted block text-[11px]">Active Placement Drives</span>
          <span className="text-sm font-semibold tabular-nums text-brand">{drives.length} Openings</span>
        </div>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as any)}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'drives', label: 'Placement Drives', count: drives.length },
          { id: 'contacts', label: 'Recruiter Contacts' },
          { id: 'history', label: 'Engagement History' },
        ]}
      />

      {activeTab === 'overview' && (
        <Card title="Corporate Overview" subtitle="Enterprise profile and partnership summary">
          <div className="space-y-3 text-xs leading-relaxed text-ink">
            <p className="m-0">
              <strong>{company.name}</strong> is an authorized corporate partner participating in the university's campus recruitment program under Placement Charter v3.
            </p>
            <div className="p-3 rounded-lg border border-line bg-canvas space-y-1">
              <div className="font-semibold text-ink">Recruitment Terms</div>
              <div className="text-ink-muted">
                Offers generated by this partner adhere to the institutional tier-based holding and Superday scheduling arbitration rules.
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'drives' && (
        drives.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No placement drives posted by this partner"
            description="Create a Job Notification Form (JNF) drive for this partner to begin accepting applications."
            actionLabel="Create Placement Drive"
            onAction={() => navigate('/placement/drives')}
          />
        ) : (
          <div className="rounded-lg border border-line bg-surface overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-canvas/60 text-ink-muted uppercase tracking-wider text-[11px] h-10">
                  <th className="py-2 px-4 font-medium">JNF ID</th>
                  <th className="py-2 px-4 font-medium">Position</th>
                  <th className="py-2 px-4 font-medium">Package</th>
                  <th className="py-2 px-4 font-medium">Tier</th>
                  <th className="py-2 px-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {drives.map((d) => (
                  <tr
                    key={d.job_id}
                    onClick={() => navigate(`/placement/drives/${d.job_id}`)}
                    className="h-10 hover:bg-canvas/50 transition-colors cursor-pointer"
                  >
                    <td className="py-2 px-4 font-mono font-medium text-brand">{d.job_id}</td>
                    <td className="py-2 px-4 font-medium text-ink">{d.title}</td>
                    <td className="py-2 px-4 font-semibold text-success tabular-nums">
                      ₹{d.package_lpa} LPA
                    </td>
                    <td className="py-2 px-4">
                      <Badge variant="neutral" size="xs">{d.tier}</Badge>
                    </td>
                    <td className="py-2 px-4 text-right">
                      <span className="text-brand hover:underline font-medium inline-flex items-center gap-1">
                        <span>Inspect</span>
                        <ArrowRight size={13} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeTab === 'contacts' && (
        <Card title="Recruiter Contacts" subtitle="University Relations & Talent Acquisition liaisons">
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg border border-line bg-canvas flex items-center justify-between">
              <div>
                <span className="font-semibold text-ink block">Primary Campus Liaison</span>
                <span className="text-ink-muted font-mono">{company.contact_email || 'university-relations@partner.com'}</span>
              </div>
              <Badge variant="neutral" size="xs">Verified Contact</Badge>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'history' && (
        <Card title="Recruitment History" subtitle="Historical batch engagement & hiring metrics">
          <div className="space-y-2 text-xs text-ink-muted">
            <p className="m-0">Partner joined institutional network for current active placement cycles.</p>
          </div>
        </Card>
      )}

      <PlacementDriveWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={(driveData) => {
          if (driveData?.job_id) {
            navigate(`/placement/drives/${driveData.job_id}`);
          }
        }}
      />
    </div>
  );
};

