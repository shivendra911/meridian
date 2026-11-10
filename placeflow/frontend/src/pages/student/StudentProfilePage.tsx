import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { Student } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Skeleton } from '../../components/ui/Skeleton';
import { VtiBadge } from '../../components/common/VtiBadge';
import { WhatIfPage } from '../WhatIfPage';
import { ConsentPage } from '../ConsentPage';
import {
  User,
  GraduationCap,
  Award,
  Sliders,
  Shield,
  FileCheck2,
  Sparkles,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'vti' | 'whatif' | 'privacy'>('profile');

  useEffect(() => {
    setLoading(true);
    api.getStudent('STU001')
      .then((res) => {
        setStudent(res.student);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 font-sans">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title={student?.name || 'Aarav Sharma'}
        description={`${student?.student_id || 'STU001'} • ${student?.department || 'Computer Science & Engineering'} • Class of ${student?.year || 2026} • ${student?.email || 'aarav.sharma@apex.edu'}`}
        badge={
          <Badge variant="success" size="xs">
            DigiLocker &bull; Verified Candidate
          </Badge>
        }
      />

      {/* 4 Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Cumulative GPA"
          value={student?.cgpa?.toFixed(2) || '8.90'}
          hint="University Grade Scale (10.0)"
          icon={GraduationCap}
        />
        <StatCard
          label="Backlog Clearance"
          value={student?.backlogs === 0 ? 'Clear' : `${student?.backlogs} Active`}
          hint={student?.backlogs === 0 ? '0 active backlogs' : 'Requires academic remedial'}
          icon={CheckCircle2}
        />
        <StatCard
          label="Talent Index (VTI)"
          value={student?.vti ? `${student.vti.score} / 100` : '88 / 100'}
          hint={student?.vti?.badge || 'Gold Authenticity Seal'}
          icon={Award}
        />
        <StatCard
          label="Placement Standing"
          value={student?.placement_status || 'Unplaced'}
          hint={student?.highest_tier ? `Highest: ${student.highest_tier}` : 'Actively interviewing'}
          icon={TrendingUp}
        />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'profile', label: 'Academic Dossier' },
          { id: 'vti', label: 'Authenticity Seal (VTI)' },
          { id: 'whatif', label: 'What-If Career Simulator' },
          { id: 'privacy', label: 'Privacy & DPDP Consents' },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {activeTab === 'whatif' ? (
        <WhatIfPage studentId="STU001" onBack={() => setActiveTab('profile')} />
      ) : activeTab === 'privacy' ? (
        <ConsentPage initialStudentId="STU001" />
      ) : activeTab === 'vti' ? (
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-line">
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-ink-muted">
                ANTI-FRAUD &bull; PROOF OF TALENT
              </span>
              <h2 className="text-lg font-bold text-ink mt-0.5">Verified Talent Index (VTI)</h2>
              <p className="text-xs text-ink-muted mt-1 max-w-xl">
                Cryptographic tamper-evident composite score benchmarked against autonomous examination records, verified coding submissions, and course completion.
              </p>
            </div>
            {student?.vti && <VtiBadge vti={student.vti} />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="p-4 bg-canvas rounded-lg border border-line">
              <span className="text-[11px] text-ink-muted block">Academic GPA Weight</span>
              <span className="text-2xl font-bold font-mono text-ink mt-1 block">
                {student?.vti?.breakdown?.cgpa_score || 35} / 40
              </span>
              <span className="text-[10px] text-ink-muted mt-0.5 block">Official transcript normalized</span>
            </div>
            <div className="p-4 bg-canvas rounded-lg border border-line">
              <span className="text-[11px] text-ink-muted block">Backlog Reliability</span>
              <span className="text-2xl font-bold font-mono text-ink mt-1 block">
                {student?.vti?.breakdown?.backlog_score || 25} / 25
              </span>
              <span className="text-[10px] text-ink-muted mt-0.5 block">Clean examination record</span>
            </div>
            <div className="p-4 bg-canvas rounded-lg border border-line">
              <span className="text-[11px] text-ink-muted block">Skills Verification</span>
              <span className="text-2xl font-bold font-mono text-ink mt-1 block">
                {student?.vti?.breakdown?.skills_score || 18} / 20
              </span>
              <span className="text-[10px] text-ink-muted mt-0.5 block">Git & lab practical audits</span>
            </div>
            <div className="p-4 bg-canvas rounded-lg border border-line">
              <span className="text-[11px] text-ink-muted block">Hiring Tier Weight</span>
              <span className="text-2xl font-bold font-mono text-ink mt-1 block">
                {student?.vti?.breakdown?.tier_score || 10} / 15
              </span>
              <span className="text-[10px] text-ink-muted mt-0.5 block">Super Dream eligibility</span>
            </div>
          </div>
        </Card>
      ) : (
        /* Academic Dossier Tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-brand" />
                University Credential & Program Standing
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-canvas rounded-lg border border-line">
                  <span className="text-ink-muted text-[10px] uppercase tracking-wider block">Degree</span>
                  <span className="font-semibold text-ink text-sm mt-0.5 block">Bachelor of Technology</span>
                </div>
                <div className="p-3 bg-canvas rounded-lg border border-line">
                  <span className="text-ink-muted text-[10px] uppercase tracking-wider block">Major</span>
                  <span className="font-semibold text-ink text-sm mt-0.5 block">{student?.department}</span>
                </div>
                <div className="p-3 bg-canvas rounded-lg border border-line">
                  <span className="text-ink-muted text-[10px] uppercase tracking-wider block">Roll Number</span>
                  <span className="font-semibold text-ink text-sm mt-0.5 block font-mono">{student?.student_id}</span>
                </div>
                <div className="p-3 bg-canvas rounded-lg border border-line">
                  <span className="text-ink-muted text-[10px] uppercase tracking-wider block">Graduation Batch</span>
                  <span className="font-semibold text-ink text-sm mt-0.5 block font-mono">{student?.year}</span>
                </div>
                <div className="p-3 bg-canvas rounded-lg border border-line sm:col-span-2">
                  <span className="text-ink-muted text-[10px] uppercase tracking-wider block">Institution Email</span>
                  <span className="font-semibold text-ink text-sm mt-0.5 block font-mono">{student?.email}</span>
                </div>
              </div>

              {/* Verified Skills */}
              <div className="mt-6 pt-5 border-t border-line">
                <span className="text-xs font-semibold text-ink block mb-2">Verified Skill Competencies</span>
                <div className="flex flex-wrap gap-1.5">
                  {(student?.skills || ['Python', 'Java', 'Distributed Systems', 'PostgreSQL', 'Docker', 'Kubernetes', 'FastAPI']).map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 bg-canvas border border-line rounded-md text-xs text-ink font-mono font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Rail: Quick Telemetry */}
          <div className="space-y-6">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-brand" />
                Dossier Completeness
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-line">
                  <span className="text-ink">DigiLocker Marksheets</span>
                  <Badge variant="success" size="xs">Verified</Badge>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-line">
                  <span className="text-ink">DPDP Recruiter Consent</span>
                  <Badge variant="success" size="xs">Granted</Badge>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-line">
                  <span className="text-ink">Resume & Portfolio</span>
                  <Badge variant="success" size="xs">Uploaded</Badge>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-ink">Placement Registration</span>
                  <Badge variant="institutional" size="xs">Active</Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

