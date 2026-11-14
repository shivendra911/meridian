import React, { useState } from 'react';
import {
  ProfileCard,
  ProfileHeader,
  DriveCard,
  ApplicationCard,
  InterviewCard,
  OfferCard,
  CompanyCard,
  TaskCard,
  Avatar,
  PersonChip,
  StatCard} from '../ui/cards';
import { AlertCircle } from 'lucide-react';

type CardState = 'default' | 'loading' | 'empty' | 'error' | 'masked';

export const DevCardsPage: React.FC = () => {
  const [selectedState, setSelectedState] = useState<CardState>('default');

  const isDefault = selectedState === 'default';
  const isLoading = selectedState === 'loading';
  const isEmpty = selectedState === 'empty';
  const isError = selectedState === 'error';
  const isMasked = selectedState === 'masked';

  const errorMessage = isError ? 'Unable to load record due to network error (500)' : null;

  // Sample data
  const sampleProfile = isDefault || isMasked ? {
    person_id: 'per_aarav_001',
    name: 'Aarav Sharma',
    avatar_url: null,
    headline: 'B.Tech Computer Science & Engineering',
    department: 'CSE',
    roles: ['Student Candidate', 'SPC Rep'],
    is_verified: true,
    reg_no: '2023CSB001',
    cgpa: 8.45,
    email: 'aarav@meridian.edu',
    phone: '+91 98765 43210',
    hidden: isMasked ? ['Phone', 'Email', 'CGPA'] : [],
    masked: isMasked,
  } : null;

  const sampleDrive = isDefault || isMasked ? {
    drive_id: 'drv_001',
    company_name: 'Northwind Systems',
    company_mark: null,
    role: 'Software Development Engineer I',
    tier: 'Super Dream',
    package_lpa: 32,
    location: 'Bengaluru',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    eligible: true,
    masked: isMasked,
  } : null;

  const sampleApplication = isDefault || isMasked ? {
    application_id: 'app_001',
    role: 'Full Stack Engineer',
    company_name: 'Acme Cloud Corp',
    stage: 'Interview',
    last_update: 'Technical Round 2 scheduled for tomorrow, 10:00 AM',
    applied_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    masked: isMasked,
  } : null;

  const sampleInterview = isDefault || isMasked ? {
    interview_id: 'int_001',
    role: 'Software Development Engineer',
    company_name: 'Oracle India',
    round_name: 'System Architecture',
    scheduled_start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    mode: 'VIRTUAL',
    venue_or_link: 'https://meet.google.com/xyz-abc-def',
    interviewer_name: 'Vikram Mehta',
    masked: isMasked,
  } : null;

  const sampleOffer = isDefault || isMasked ? {
    offer_id: 'off_001',
    role: 'Member Technical Staff',
    company_name: 'Cisco Systems',
    package_lpa: 28,
    respond_by: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: 'PENDING',
    masked: isMasked,
  } : null;

  const sampleCompany = isDefault || isMasked ? {
    company_id: 'comp_001',
    name: 'Microsoft India R&D',
    industry: 'Enterprise Software & Cloud',
    location: 'Hyderabad',
    active_drives_count: 3,
    last_visit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    tier: 'Super Dream',
    masked: isMasked,
  } : null;

  const sampleTask = isDefault || isMasked ? {
    task_id: 'tsk_001',
    title: 'Submit Accenture Superday consent acknowledgment',
    due: new Date(Date.now() + 18 * 60 * 60 * 1000),
    priority: 'HIGH' as const,
    icon: AlertCircle,
    action_label: 'Acknowledge',
    masked: isMasked,
  } : null;

  return (
    <div className="min-h-screen bg-canvas p-6 lg:p-10 text-ink">
      {/* Top Banner & State Controller */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
            DEV Environment Only
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink m-0">
            Meridian Card System Review (/dev/cards)
          </h1>
          <p className="mt-1 text-sm text-ink-muted m-0">
            Audit cards across all 5 design system states: default, loading, empty, error, masked.
          </p>
        </div>

        {/* State Toggle Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-surface p-1">
          {(['default', 'loading', 'empty', 'error', 'masked'] as CardState[]).map((state) => (
            <button
              key={state}
              type="button"
              onClick={() => setSelectedState(state)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                selectedState === state
                  ? 'bg-brand text-white shadow-xs'
                  : 'text-ink-muted hover:text-ink hover:bg-slate-50'
              }`}
            >
              {state}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-10">
        {/* Section 1: ProfileHeader Banner */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted m-0">
              Profile Header (Banner)
            </h2>
            <span className="text-xs text-ink-muted">State: {selectedState}</span>
          </div>
          <ProfileHeader
            name="Aarav Sharma"
            program="B.Tech Computer Science"
            batch="2027"
            reg_no="2023CSB001"
            department="CSE"
            role="Student Candidate"
            completenessPercent={78}
            nextMissingItem="Upload official profile picture"
            loading={isLoading}
            onEdit={() => alert('Edit profile clicked')}
          />
        </section>

        {/* Section 2: Person & Identity Badges */}
        <section className="rounded-xl border border-line bg-surface p-6 space-y-6">
          <div className="border-b border-line pb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted m-0">
              Avatar & PersonChip Components
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-xs font-medium text-ink-muted mb-2">Avatar Sizes</p>
              <div className="flex items-center gap-3">
                <Avatar name="Aarav Sharma" size={20} />
                <Avatar name="Priya Patel" size={24} />
                <Avatar name="Rohit Verma" size={32} />
                <Avatar name="Kavita Iyer" size={40} presence="online" />
                <Avatar name="Deepak Nair" size={56} presence="busy" />
                <Avatar name="Sunita Rao" size={64} presence="away" />
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-ink-muted mb-2">PersonChip (Hover / Focus for Popover)</p>
              <div className="flex flex-wrap items-center gap-3">
                <PersonChip
                  name="Aarav Sharma"
                  role="Student"
                  profileData={{
                    name: 'Aarav Sharma',
                    roles: ['Student Candidate'],
                    department: 'CSE',
                    cgpa: 8.45,
                    reg_no: '2023CSB001',
                    is_verified: true,
                    masked: isMasked,
                    hidden: isMasked ? ['Phone', 'Email', 'CGPA'] : [],
                  }}
                />
                <PersonChip
                  name="Dr. Radhika Sen"
                  role="HOD CSE"
                  profileData={{
                    name: 'Dr. Radhika Sen',
                    roles: ['Department Head'],
                    department: 'Computer Science',
                    is_verified: true,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Entity Cards Grid */}
        <section>
          <div className="mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted m-0">
              Entity Cards (Drive, Application, Interview, Offer, Company, Profile)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. ProfileCard */}
            <div>
              <p className="text-xs font-medium text-ink-muted mb-2">ProfileCard</p>
              <ProfileCard
                data={sampleProfile}
                loading={isLoading}
                empty={isEmpty}
                error={errorMessage}
                masked={isMasked}
                onViewProfile={() => alert('View profile')}
                onMessage={() => alert('Message')}
              />
            </div>

            {/* 2. DriveCard */}
            <div>
              <p className="text-xs font-medium text-ink-muted mb-2">DriveCard</p>
              <DriveCard
                data={sampleDrive}
                loading={isLoading}
                empty={isEmpty}
                error={errorMessage}
                masked={isMasked}
                onApply={() => alert('Applied')}
                onClick={() => alert('Drive clicked')}
              />
            </div>

            {/* 3. ApplicationCard */}
            <div>
              <p className="text-xs font-medium text-ink-muted mb-2">ApplicationCard</p>
              <ApplicationCard
                data={sampleApplication}
                loading={isLoading}
                empty={isEmpty}
                error={errorMessage}
                masked={isMasked}
                onClick={() => alert('Application clicked')}
              />
            </div>

            {/* 4. InterviewCard */}
            <div>
              <p className="text-xs font-medium text-ink-muted mb-2">InterviewCard</p>
              <InterviewCard
                data={sampleInterview}
                loading={isLoading}
                empty={isEmpty}
                error={errorMessage}
                masked={isMasked}
                onJoin={() => alert('Joining video interview')}
                onAddToCalendar={() => alert('Added to calendar')}
              />
            </div>

            {/* 5. OfferCard */}
            <div>
              <p className="text-xs font-medium text-ink-muted mb-2">OfferCard</p>
              <OfferCard
                data={sampleOffer}
                loading={isLoading}
                empty={isEmpty}
                error={errorMessage}
                masked={isMasked}
                onAccept={() => alert('Offer accepted')}
                onDecline={() => alert('Offer declined')}
              />
            </div>

            {/* 6. CompanyCard */}
            <div>
              <p className="text-xs font-medium text-ink-muted mb-2">CompanyCard</p>
              <CompanyCard
                data={sampleCompany}
                loading={isLoading}
                empty={isEmpty}
                error={errorMessage}
                masked={isMasked}
                onClick={() => alert('Company clicked')}
              />
            </div>
          </div>
        </section>

        {/* Section 4: TaskCard & StatCard Row */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted m-0">
              TaskCard & StatCard
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Active Placement Drives"
              value="42"
              change="+12% from last cycle"
              changeType="up"
              explainTooltip="Verified campus recruitment drives currently accepting applications"
            />
            <StatCard
              label="Student Placement Rate"
              value="87.4%"
              subValue="542 placed"
              change="+4.2%"
              changeType="up"
              explainTooltip="NIRF-compliant placement success percentage across accredited branches"
            />
            <StatCard
              label="Highest Offered CTC"
              value="₹44.5 LPA"
              change="Super Dream"
              changeType="neutral"
              explainTooltip="Authoritative verified placement offer package recorded"
            />
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-medium text-ink-muted">TaskCard ("Needs your attention")</p>
            <TaskCard
              data={sampleTask}
              loading={isLoading}
              empty={isEmpty}
              error={errorMessage}
              masked={isMasked}
              onAction={() => alert('Task action triggered')}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default DevCardsPage;
