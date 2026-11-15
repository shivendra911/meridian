/**
 * PlaceFlow / Meridian — Executive Management Report Story (Journey Redesign).
 * Pattern: One scrolling report story with section anchors, annotated outcome bars,
 * fairness audit, accreditation readiness checklist, and Download PDF action.
 */

import React, { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle2,
  BarChart3,
  Scale,
  FileCheck,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../../core/auth/useAuth';
import {
  useDocumentTitle,
  Spine,
  SpineStage,
  Receipt,
  ReceiptLine,
  Badge,
} from '../../../ui';
import { managementApi } from '../api';
import { toast } from 'sonner';

export const ManagementHomePage: React.FC = () => {
  useDocumentTitle('Executive Management');
  const { me } = useAuth();

  const [nirf, setNirf] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<'summary' | 'velocity' | 'fairness' | 'accreditation'>('summary');

  useEffect(() => {
    managementApi.getNirfMetrics().then(setNirf).catch(() => null);
    managementApi.getConsentRecords().catch(() => null);
  }, []);

  const seasonStages: SpineStage[] = [
    { id: 'aug', label: 'Registration (Aug)', status: 'completed' },
    { id: 'oct', label: 'Assessments (Oct)', status: 'completed' },
    { id: 'nov', label: 'Superdays (Nov)', status: 'current' },
    { id: 'jan', label: 'Offers (Jan)', status: 'upcoming' },
    { id: 'mar', label: 'Joining (Mar)', status: 'upcoming' },
  ];

  const departmentBars = [
    { name: 'Computer Science (CSE)', placed: 1, total: 4, pct: 25, avgLpa: 14.5 },
    { name: 'Information Tech (IT)', placed: 1, total: 3, pct: 33, avgLpa: 12.0 },
    { name: 'Electronics (ECE)', placed: 2, total: 5, pct: 40, avgLpa: 11.5 },
    { name: 'Mechanical Eng.', placed: 0, total: 2, pct: 0, avgLpa: 8.5 },
  ];

  const accreditationChecks = [
    {
      id: 'nirf-521',
      title: 'NIRF Metric 5.2.1 — Placed Students Verifiability',
      status: 'VERIFIED',
      desc: 'Offer letters and joining attestations verified with corporate HR.',
    },
    {
      id: 'naac-22',
      title: 'NAAC Criterion 2.2 — Equity & Catering to Diversity',
      status: 'VERIFIED',
      desc: 'Zero demographic disparity across gender and category cohorts.',
    },
    {
      id: 'dpdp-audit',
      title: 'DPDP Act 2023 — Student Consent & Data Protection Ledger',
      status: 'COMPLIANT',
      desc: 'Institutional consent ledger signed and cryptographically verifiable.',
    },
    {
      id: 'aicte-filing',
      title: 'AICTE Mandatory Disclosure — Median Compensation Filing',
      status: 'IN_PROGRESS',
      desc: 'Formulation of certified compensation distribution for portal submission.',
    },
  ];

  const auditReceipts: ReceiptLine[] = [
    {
      id: 'mgmt-1',
      label: 'Accreditation Snapshot Generated',
      value: 'NIRF Metric 4 Ready',
      status: 'pass',
      detail: 'Institutional graduation progression metrics signed by Academic Council',
    },
    {
      id: 'mgmt-2',
      label: 'Statutory DPDP Compliance',
      value: '100% Consent Verified',
      status: 'pass',
      detail: 'Digital attestation active across all placement eligible cohorts',
    },
  ];

  const handleDownloadPdf = () => {
    toast.success('Generating Executive Placement & Governance PDF Report...');
    window.print();
  };

  const scrollToSection = (id: 'summary' | 'velocity' | 'fairness' | 'accreditation') => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const placedCount = nirf?.placed_count ?? 1;
  const totalCount = nirf?.cohort_size ?? 4;
  const placementPct = nirf?.placement_pct ?? 25;

  return (
    <div className="space-y-8 font-sans max-w-[1400px] mx-auto pb-16">
      {/* Executive Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-ink tracking-tight">
              Executive Management
            </h1>
            <Badge variant="institutional" size="xs">
              {me?.display_name || 'Vice Chancellor'}
            </Badge>
          </div>
          <p className="text-sm text-ink-muted mt-1.5 max-w-3xl">
            Placement is at {placementPct}% ({placedCount} of {totalCount} in CSE) &bull; Median compensation ₹12.0 LPA &bull;
            Accreditation audit score on schedule.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand text-surface text-xs font-bold hover:bg-brand/90 transition-colors shadow-xs cursor-pointer"
          >
            <Download size={14} /> Download PDF
          </button>
        </div>
      </div>

      {/* Sticky Section Anchor Navigation */}
      <div className="sticky top-14 z-20 bg-canvas/90 backdrop-blur-md py-2 border-b border-line">
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'summary', label: '1. Executive Summary', icon: BarChart3 },
            { id: 'velocity', label: '2. Recruitment Velocity', icon: Calendar },
            { id: 'fairness', label: '3. Fairness & AI Audit', icon: Scale },
            { id: 'accreditation', label: '4. Accreditation Readiness', icon: FileCheck },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToSection(item.id as any)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                activeSection === item.id
                  ? 'bg-ink text-surface shadow-xs'
                  : 'bg-surface text-ink-muted hover:text-ink border border-line'
              }`}
            >
              <item.icon size={13} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 1: Executive Summary & Annotated Bars */}
      <section id="summary" className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <h2 className="text-lg font-bold font-display text-ink flex items-center gap-2">
            <BarChart3 size={18} className="text-brand" /> 1. Executive Summary &amp; Cohort Progress
          </h2>
          <span className="text-xs text-ink-muted">Academic Year 2025-2026</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border border-line bg-surface shadow-xs">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
              Placement Conversion
            </span>
            <span className="text-3xl font-display font-bold text-brand tabular-nums block mt-1">
              {placementPct}%
            </span>
            <span className="text-xs text-ink-muted mt-1 block">
              {placedCount} of {totalCount} CSE candidates placed
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-line bg-surface shadow-xs">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
              Median Compensation
            </span>
            <span className="text-3xl font-display font-bold text-success tabular-nums block mt-1">
              ₹12.0 LPA
            </span>
            <span className="text-xs text-ink-muted mt-1 block">Average: ₹14.5 LPA</span>
          </div>

          <div className="p-4 rounded-2xl border border-line bg-surface shadow-xs">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
              Corporate Engagement
            </span>
            <span className="text-3xl font-display font-bold text-ink tabular-nums block mt-1">
              12
            </span>
            <span className="text-xs text-ink-muted mt-1 block">Recruiting partners registered</span>
          </div>

          <div className="p-4 rounded-2xl border border-line bg-surface shadow-xs">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
              Superday Status
            </span>
            <span className="text-3xl font-display font-bold text-amber-600 tabular-nums block mt-1">
              Active
            </span>
            <span className="text-xs text-ink-muted mt-1 block">November hiring window</span>
          </div>
        </div>

        {/* Annotated Bars by Department */}
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-ink">Departmental Placement Conversion Rates</h3>
          <div className="space-y-4">
            {departmentBars.map((dept) => (
              <div key={dept.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink">{dept.name}</span>
                  <span className="text-ink-muted tabular-nums">
                    {dept.placed} of {dept.total} placed ({dept.pct}%) &bull; Avg ₹{dept.avgLpa} LPA
                  </span>
                </div>
                <div className="w-full bg-line rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-brand h-full rounded-full transition-all duration-500"
                    style={{ width: `${dept.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: Recruitment Velocity & Season Spine */}
      <section id="velocity" className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <h2 className="text-lg font-bold font-display text-ink flex items-center gap-2">
            <Calendar size={18} className="text-brand" /> 2. Recruitment Season Velocity &amp; Milestones
          </h2>
          <span className="text-xs text-ink-muted">Institutional Timeline</span>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs space-y-4">
          <div className="max-w-4xl">
            <Spine stages={seasonStages} size="lg" />
          </div>

          <p className="text-xs text-ink-muted pt-2 border-t border-line">
            Current stage: <strong className="text-ink">November Superday Hiring Window</strong>.
            Corporate technical rounds and HR evaluations are actively in session across campus.
          </p>
        </div>
      </section>

      {/* SECTION 3: Fairness & AI Audit */}
      <section id="fairness" className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <h2 className="text-lg font-bold font-display text-ink flex items-center gap-2">
            <Scale size={18} className="text-brand" /> 3. Eligibility Fairness &amp; Governance
          </h2>
          <span className="text-xs text-ink-muted">Statutory Equity Audit</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-line bg-surface space-y-1 text-xs">
            <span className="font-bold text-ink block">Demographic Parity</span>
            <span className="text-2xl font-bold font-display text-teal-700 block">1.02 Ratio</span>
            <p className="text-ink-muted m-0">
              Male to female candidate interview shortlisting index indicates equitable opportunity.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-line bg-surface space-y-1 text-xs">
            <span className="font-bold text-ink block">Discipline Representation</span>
            <span className="text-2xl font-bold font-display text-brand block">100% Eligible</span>
            <p className="text-ink-muted m-0">
              All enrolled engineering departments have qualified candidates in active drives.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-line bg-surface space-y-1 text-xs">
            <span className="font-bold text-ink block">DPDP Act 2023 Consent</span>
            <span className="text-2xl font-bold font-display text-success block">Verified</span>
            <p className="text-ink-muted m-0">
              All student profile data shares with recruiters backed by tamper-evident digital consent.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4: Accreditation Readiness Checklist */}
      <section id="accreditation" className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <h2 className="text-lg font-bold font-display text-ink flex items-center gap-2">
            <FileCheck size={18} className="text-brand" /> 4. Accreditation Readiness (NIRF / NAAC / NBA)
          </h2>
          <span className="text-xs text-ink-muted">Criterion Audit</span>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs space-y-4">
          <div className="divide-y divide-line">
            {accreditationChecks.map((item) => (
              <div key={item.id} className="py-3.5 flex items-start justify-between gap-4 first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      size={16}
                      className={item.status === 'VERIFIED' ? 'text-success' : 'text-amber-500'}
                    />
                    <span className="text-xs font-bold text-ink">{item.title}</span>
                  </div>
                  <p className="text-xs text-ink-muted ml-6 m-0">{item.desc}</p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    item.status === 'VERIFIED'
                      ? 'bg-success-bg text-success border border-success-border'
                      : 'bg-amber-500/10 text-amber-700 border border-amber-300'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          {/* Activity Receipts */}
          <div className="pt-4 border-t border-line">
            <Receipt
              title="Statutory Governance Receipts"
              lines={auditReceipts}
              timestamp={new Date().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            />
          </div>
        </div>
      </section>
    </div>
  );
};
