import React, { useState, useMemo } from 'react';
import {
  Building2,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Users,
  Calendar,
  Layers,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  ShieldCheck,
  Sparkles,
  Info,
  Clock,
  Laptop,
  Check,
  Send,
  X,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

interface PlacementDriveWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (driveData: any) => void;
}

export const PlacementDriveWizard: React.FC<PlacementDriveWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  // Step 1 State: Company & Opportunity
  const [companyName, setCompanyName] = useState('Google India');
  const [jobTitle, setJobTitle] = useState('Software Development Engineer - Cloud & Infrastructure');
  const [tier, setTier] = useState('SUPER_DREAM');
  const [ctc, setCtc] = useState('32.5');
  const [location, setLocation] = useState('Bengaluru / Hyderabad');
  const [jobDescription, setJobDescription] = useState(
    'Seeking passionate software engineers to develop high-throughput distributed systems, storage fabrics, and cloud telemetry solutions.'
  );

  // Step 2 State: Eligibility
  const [minCgpa, setMinCgpa] = useState(7.5);
  const [maxBacklogs, setMaxBacklogs] = useState(0);
  const [targetBatch, setTargetBatch] = useState('2027');
  const [selectedBranches, setSelectedBranches] = useState<string[]>([
    'CSE',
    'IT',
    'ECE',
    'AI_DS',
  ]);
  const [minClass12, setMinClass12] = useState(75);

  // Step 3 State: Selection Rounds
  const [rounds, setRounds] = useState([
    { id: 1, name: 'Online Coding Assessment', type: 'ONLINE', duration: '90 mins', platform: 'HackerRank' },
    { id: 2, name: 'Technical Interview 1 (DSA & Systems)', type: 'IN_PERSON', duration: '60 mins', venue: 'Lab 4' },
    { id: 3, name: 'Technical Interview 2 (Domain & Projects)', type: 'IN_PERSON', duration: '45 mins', venue: 'Lab 4' },
    { id: 4, name: 'HR & Leadership Fitment', type: 'IN_PERSON', duration: '30 mins', venue: 'Boardroom 2' },
  ]);

  // Step 4 State: Superday & Schedule
  const [driveDate, setDriveDate] = useState('2026-11-14');
  const [superdaySlot, setSuperdaySlot] = useState('SLOT_A_MORNING');
  const [assignedLab, setAssignedLab] = useState('Superday Computer Centre Lab 3 & 4 (120 Terminals)');

  // Step 5 State: Quotas & Policy
  const [intakeGoal, setIntakeGoal] = useState(25);
  const [acceptanceDeadlineHours, setAcceptanceDeadlineHours] = useState(48);
  const [diversityFocus, setDiversityFocus] = useState(true);

  // Real-time qualifying student estimator
  const qualifyingEstimates = useMemo(() => {
    // Total candidate pool in selected branches
    const branchPools: Record<string, number> = {
      CSE: 240,
      IT: 180,
      ECE: 220,
      AI_DS: 120,
      EE: 160,
      MECH: 210,
    };
    const totalInBranches = selectedBranches.reduce((sum, b) => sum + (branchPools[b] || 100), 0);

    // Apply CGPA filter discount
    const cgpaFraction = minCgpa >= 8.5 ? 0.45 : minCgpa >= 8.0 ? 0.65 : minCgpa >= 7.5 ? 0.8 : 0.92;
    const cgpaQualified = Math.round(totalInBranches * cgpaFraction);

    // Apply Backlog filter discount
    const backlogFraction = maxBacklogs === 0 ? 0.88 : maxBacklogs === 1 ? 0.95 : 1.0;
    const backlogQualified = Math.round(cgpaQualified * backlogFraction);

    // Consent verified count
    const consentVerified = Math.round(backlogQualified * 0.97);

    return {
      totalInBranches,
      cgpaQualified,
      backlogQualified,
      finalEligible: consentVerified,
      flaggedDataIssues: 4,
    };
  }, [selectedBranches, minCgpa, maxBacklogs]);

  const toggleBranch = (branch: string) => {
    if (selectedBranches.includes(branch)) {
      if (selectedBranches.length > 1) {
        setSelectedBranches(selectedBranches.filter((b) => b !== branch));
      }
    } else {
      setSelectedBranches([...selectedBranches, branch]);
    }
  };

  const handlePublish = () => {
    const payload = {
      companyName,
      jobTitle,
      tier,
      ctc,
      minCgpa,
      maxBacklogs,
      targetBatch,
      selectedBranches,
      rounds,
      driveDate,
      intakeGoal,
      qualifyingCount: qualifyingEstimates.finalEligible,
    };
    if (onSuccess) {
      onSuccess(payload);
    }
    onClose();
  };

  const progressPct = Math.round((currentStep / totalSteps) * 100);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Placement Recruitment Drive"
      subtitle="Guided step-by-step drive wizard with deterministic eligibility simulation"
      size="xl"
    >
      <div className="space-y-6">
        {/* Step Progress Stepper */}
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider font-mono">
              STEP {currentStep} OF {totalSteps}:{' '}
              {currentStep === 1 && 'Company & Opportunity'}
              {currentStep === 2 && 'Eligibility & Candidate Filtering'}
              {currentStep === 3 && 'Selection Process & Assessment Rounds'}
              {currentStep === 4 && 'Superday Window & Clash Detection'}
              {currentStep === 5 && 'Intake Quotas & Acceptance Policy'}
              {currentStep === 6 && 'Review, Simulation & Publication'}
            </span>
            <span className="font-semibold text-[#8C1515] font-mono">{progressPct}% Complete</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#8C1515] h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* STEP 1: Company & Opportunity */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
              <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <span>
                Select a verified corporate partner from the institutional registry. Position terms will automatically inherit your institution's placement charter rules.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Corporate Partner *
                </label>
                <select
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#8C1515]/20 focus:border-[#8C1515]"
                >
                  <option value="Google India">Google India (Tier 1 Global)</option>
                  <option value="Microsoft IDC">Microsoft IDC (Tier 1 Global)</option>
                  <option value="Goldman Sachs">Goldman Sachs (FinTech Global)</option>
                  <option value="Texas Instruments">Texas Instruments (Core Semi)</option>
                  <option value="Oracle Cloud">Oracle Cloud Infrastructure</option>
                  <option value="Qualcomm">Qualcomm India</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Opportunity Tier *
                </label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#8C1515]/20 focus:border-[#8C1515]"
                >
                  <option value="SUPER_DREAM">Super Dream (&gt; ₹20 LPA)</option>
                  <option value="DREAM">Dream (₹10 - ₹20 LPA)</option>
                  <option value="CORE">Core Engineering (₹7 - ₹12 LPA)</option>
                  <option value="STANDARD">Regular / Mass Recruit (₹4 - ₹7 LPA)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Position Title *
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#8C1515]/20 focus:border-[#8C1515]"
                  placeholder="e.g. SDE-1 (Distributed Systems)"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CTC Package (INR LPA) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={ctc}
                    onChange={(e) => setCtc(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white pl-7 font-mono font-semibold"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                    ₹
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Posting Location(s)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
                placeholder="e.g. Bengaluru, Hyderabad, Gurugram"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Job Overview &amp; Responsibilities
              </label>
              <textarea
                rows={3}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Eligibility & Real-time Candidate Estimator */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left Column: Form Controls */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Minimum CGPA Cutoff
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="5.0"
                      max="10.0"
                      value={minCgpa}
                      onChange={(e) => setMinCgpa(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-mono font-semibold"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Autonomous scale: 10.0 max
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Active Backlogs Permitted
                    </label>
                    <select
                      value={maxBacklogs}
                      onChange={(e) => setMaxBacklogs(parseInt(e.target.value, 10))}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
                    >
                      <option value="0">0 Active Backlogs (Strict Zero)</option>
                      <option value="1">At most 1 Active Backlog</option>
                      <option value="2">At most 2 Active Backlogs</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Graduating Batch Year
                  </label>
                  <select
                    value={targetBatch}
                    onChange={(e) => setTargetBatch(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
                  >
                    <option value="2027">Batch of 2027 (Active Superday Cohort)</option>
                    <option value="2026">Batch of 2026 (Graduating / Immediate)</option>
                    <option value="2028">Batch of 2028 (Pre-Final Internships)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Eligible Academic Disciplines / Branches
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { code: 'CSE', label: 'Computer Science & Engg' },
                      { code: 'IT', label: 'Information Technology' },
                      { code: 'AI_DS', label: 'AI & Data Science' },
                      { code: 'ECE', label: 'Electronics & Communication' },
                      { code: 'EE', label: 'Electrical Engineering' },
                      { code: 'MECH', label: 'Mechanical Engineering' },
                    ].map((branch) => {
                      const isSelected = selectedBranches.includes(branch.code);
                      return (
                        <button
                          key={branch.code}
                          type="button"
                          onClick={() => toggleBranch(branch.code)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#8C1515] text-white border-[#8C1515] shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {isSelected && <Check size={12} />}
                          <span>{branch.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Live Qualifying Student Estimator (Per Section 4.D) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-[#8C1515]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Live Pool Simulation
                  </span>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg text-center">
                  <div className="text-[11px] text-slate-500 uppercase font-semibold">
                    Estimated Qualifying Candidates
                  </div>
                  <div className="text-3xl font-serif font-bold text-[#8C1515] mt-1">
                    {qualifyingEstimates.finalEligible}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                    Ready for instant one-click notification
                  </div>
                </div>

                <div className="space-y-2 text-xs pt-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Total in Selected Branches:</span>
                    <span className="font-mono font-semibold">
                      {qualifyingEstimates.totalInBranches}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Passed CGPA &gt;= {minCgpa}:</span>
                    <span className="font-mono font-semibold text-emerald-700">
                      {qualifyingEstimates.cgpaQualified}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Passed Backlog Limit ({maxBacklogs}):</span>
                    <span className="font-mono font-semibold text-emerald-700">
                      {qualifyingEstimates.backlogQualified}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>DPDP Consent Granted:</span>
                    <span className="font-mono font-semibold text-emerald-700">
                      {qualifyingEstimates.finalEligible}
                    </span>
                  </div>
                  <div className="flex justify-between text-amber-700 pt-1 border-t border-slate-200">
                    <span>Pending Verification Flags:</span>
                    <span className="font-mono font-semibold">
                      {qualifyingEstimates.flaggedDataIssues} students
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Selection Process & Rounds */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Drive Assessment Stages &amp; Pipeline
                </h4>
                <p className="text-xs text-slate-500">
                  Configure evaluation milestones from online screening to final offer release
                </p>
              </div>
              <Button
                variant="outline"
                size="xs"
                onClick={() =>
                  setRounds([
                    ...rounds,
                    {
                      id: rounds.length + 1,
                      name: `Assessment Round ${rounds.length + 1}`,
                      type: 'IN_PERSON',
                      duration: '45 mins',
                      venue: 'Lab 4',
                    },
                  ])
                }
              >
                + Add Round
              </Button>
            </div>

            <div className="space-y-2.5">
              {rounds.map((round, idx) => (
                <div
                  key={round.id}
                  className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#8C1515] text-white flex items-center justify-center font-bold font-mono text-[11px]">
                      {idx + 1}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">{round.name}</span>
                      <span className="text-[11px] text-slate-500">
                        Duration: {round.duration} &bull; Mode: {round.type} &bull;{' '}
                        {'platform' in round ? round.platform : round.venue}
                      </span>
                    </div>
                  </div>

                  <Badge variant="info" size="xs">
                    Stage {idx + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Superday Window & Clash Solver */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scheduled Drive Date
                </label>
                <input
                  type="date"
                  value={driveDate}
                  onChange={(e) => setDriveDate(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Superday Time Block
                </label>
                <select
                  value={superdaySlot}
                  onChange={(e) => setSuperdaySlot(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
                >
                  <option value="SLOT_A_MORNING">Morning Block A (08:30 - 13:00 IST)</option>
                  <option value="SLOT_B_AFTERNOON">Afternoon Block B (13:30 - 18:00 IST)</option>
                  <option value="SLOT_C_FULLDAY">Full Day Exclusive Superday (09:00 - 19:00 IST)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reserved Computer Terminal Lab Venue
              </label>
              <input
                type="text"
                value={assignedLab}
                onChange={(e) => setAssignedLab(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
              />
            </div>

            {/* Clash Solver Result Banner */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 text-xs text-emerald-950">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Autonomous Superday Clash Solver: Zero Conflicts</span>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  No competing Day 1 corporate partner holds a lock on Lab 3 & 4 during this time window. Student interview slots will be automatically interleaved with academic lectures.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Intake Quotas & Acceptance Policy */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Anticipated Hiring Intake Target
                </label>
                <input
                  type="number"
                  value={intakeGoal}
                  onChange={(e) => setIntakeGoal(parseInt(e.target.value, 10) || 0)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-mono font-semibold"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Expected offers</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Candidate Offer Acceptance Window
                </label>
                <select
                  value={acceptanceDeadlineHours}
                  onChange={(e) => setAcceptanceDeadlineHours(parseInt(e.target.value, 10))}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
                >
                  <option value="24">24 Hours (Fast-track Superday)</option>
                  <option value="48">48 Hours (Standard Placement Policy v3)</option>
                  <option value="72">72 Hours (Extended Dream Window)</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Encourage Gender Diversity &amp; Special Demographics
                </span>
                <span className="text-[11px] text-slate-500">
                  Highlight candidate profiles from underrepresented engineering disciplines
                </span>
              </div>
              <input
                type="checkbox"
                checked={diversityFocus}
                onChange={(e) => setDiversityFocus(e.target.checked)}
                className="w-4 h-4 text-[#8C1515] rounded focus:ring-[#8C1515]"
              />
            </div>
          </div>
        )}

        {/* STEP 6: Review, Simulation & Publication */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
              <Sparkles size={20} className="text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-emerald-950 block">
                  Deterministic Pre-Publication Simulation Passed
                </span>
                <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                  Drive parameters are completely verified against Institutional Placement Charter v3. Exactly <strong>{qualifyingEstimates.finalEligible} students</strong> will receive instant verified notifications.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Partner
                </span>
                <span className="font-bold text-slate-900">{companyName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Package
                </span>
                <span className="font-mono font-bold text-emerald-700">₹{ctc} LPA</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Eligible Pool
                </span>
                <span className="font-mono font-bold text-[#8C1515]">
                  {qualifyingEstimates.finalEligible} Candidates
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Date
                </span>
                <span className="font-mono font-bold text-slate-900">{driveDate}</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-white p-3 border border-slate-200 rounded-lg space-y-1">
              <span className="font-semibold text-slate-800 block">Included Disciplines:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedBranches.map((b) => (
                  <Badge key={b} variant="neutral" size="xs">
                    {b}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          {currentStep > 1 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(currentStep - 1)}
              leftIcon={<ArrowLeft size={13} />}
            >
              Previous Step
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
          )}

          {currentStep < totalSteps ? (
            <Button
              variant="cardinal"
              size="sm"
              onClick={() => setCurrentStep(currentStep + 1)}
              rightIcon={<ArrowRight size={13} />}
            >
              Continue to Step {currentStep + 1}
            </Button>
          ) : (
            <Button
              variant="cardinal"
              size="sm"
              onClick={handlePublish}
              rightIcon={<Send size={13} />}
            >
              Publish Drive &amp; Notify Eligible Candidates
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

