import React, { useState } from 'react';
import {
  Shield,
  UserCheck,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface RoleAssignmentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (assignment: any) => void;
}

export const RoleAssignmentWizard: React.FC<RoleAssignmentWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState(1);

  // Form State
  const [selectedPerson, setSelectedPerson] = useState('Dr. Suresh Raman (FAC004)');
  const [selectedRole, setSelectedRole] = useState('PLACEMENT_COORDINATOR');
  const [selectedScopeType, setSelectedScopeType] = useState('DEPARTMENT');
  const [selectedDepartment, setSelectedDepartment] = useState('Computer Science & Engineering');
  const [selectedCampus, setSelectedCampus] = useState('Campus North');
  const [validFrom, setValidFrom] = useState('2026-07-01');
  const [validTo, setValidTo] = useState('2027-06-30');
  const [allowDelegation, setAllowDelegation] = useState(false);

  // Available roles with human-readable descriptions
  const roles = [
    {
      code: 'PLACEMENT_COORDINATOR',
      title: 'Departmental Placement Coordinator',
      desc: 'Oversees student drive eligibility, shortlist endorsements, and departmental placement reporting.',
      category: 'CAREER_SERVICES',
    },
    {
      code: 'ACADEMIC_ADVISOR',
      title: 'Academic Advisor / Mentor',
      desc: 'Mentors assigned student cohort, reviews prerequisite gaps, and approves course registrations.',
      category: 'ACADEMIC',
    },
    {
      code: 'COURSE_INSTRUCTOR',
      title: 'Course Instructor / Faculty',
      desc: 'Manages class roster attendance, enters CIE continuous evaluation marks, and uploads syllabus.',
      category: 'TEACHING',
    },
    {
      code: 'HEAD_OF_DEPARTMENT',
      title: 'Head of Department (HOD)',
      desc: 'Authorizes departmental course baskets, assigns faculty teaching workloads, and moderates CIE grades.',
      category: 'GOVERNANCE',
    },
  ];

  // Effective permission simulation preview (Section 6.3)
  const effectivePermissions = {
    PLACEMENT_COORDINATOR: {
      allowed: [
        'View departmental student dossiers and verified academic transcripts',
        'Review and endorse candidate applications for corporate JNFs',
        'Inspect interview schedules and Superday clash resolution recommendations',
        'Generate departmental placement analytics and NIRF graduation statistics',
      ],
      denied: [
        'Modify institutional global placement charter rules (Admin only)',
        'Access confidential salary records of other departmental faculties',
        'Alter course structures or finalize degree progression in other schools',
      ],
      scopeCeiling: 'Restricted strictly to Computer Science & Engineering (Campus North).',
    },
    ACADEMIC_ADVISOR: {
      allowed: [
        'Inspect mentee academic transcripts and prerequisite gap visualizations',
        'Approve or flag elective registration choices during enrollment windows',
        'Deliberate at-risk academic standing with students and HOD',
      ],
      denied: [
        'Submit end-semester CIE marks for unassigned course sections',
        'Access non-mentee financial or disciplinary records',
      ],
      scopeCeiling: 'Restricted to assigned 60 mentees in Batch 2027.',
    },
    COURSE_INSTRUCTOR: {
      allowed: [
        'Take daily session attendance with 1-click toggles',
        'Enter continuous internal evaluation (CIE) scores on UGC 10-point scale',
        'Upload course lecture notes and weekly laboratory assignments',
      ],
      denied: [
        'Publish final grades to Senate without Dean of Academics moderation signoff',
        'Modify course syllabus credits or prerequisite definitions',
      ],
      scopeCeiling: 'Restricted to active allotted teaching sections.',
    },
    HEAD_OF_DEPARTMENT: {
      allowed: [
        'Review and authorize departmental curriculum version drafts',
        'Balance faculty teaching workloads across semesters',
        'Moderate continuous evaluation scores and approve exam eligibility',
      ],
      denied: ['Authorize university-wide degree conferral without Academic Council assent'],
      scopeCeiling: 'Department of Computer Science & Engineering.',
    },
  }[selectedRole] || {
    allowed: ['General read access'],
    denied: ['Administrative actions'],
    scopeCeiling: 'Standard institutional perimeter.',
  };

  const handleConfirm = () => {
    const payload = {
      person: selectedPerson,
      role: selectedRole,
      scope: `${selectedDepartment} (${selectedCampus})`,
      validity: `${validFrom} to ${validTo}`,
      allowDelegation,
    };
    if (onSuccess) onSuccess(payload);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Institutional Responsibility"
      subtitle="Guided role assignment with automated privilege preview and scope boundary checks"
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Step indicator */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 uppercase tracking-wider font-mono">
            Step {step} of 3:{' '}
            {step === 1 && 'Select Person & Responsibility Role'}
            {step === 2 && 'Define Scope Boundaries & Validity'}
            {step === 3 && 'Effective Permission Preview & Confirm'}
          </span>
          <span className="font-semibold text-[#8C1515] font-mono">
            {step === 1 ? '33%' : step === 2 ? '66%' : '100%'}
          </span>
        </div>

        {/* STEP 1: Person & Role */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Institutional Member (Faculty / Staff) *
              </label>
              <select
                value={selectedPerson}
                onChange={(e) => setSelectedPerson(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium"
              >
                <option value="Dr. Suresh Raman (FAC004)">
                  Dr. Suresh Raman (Senior Associate Professor &bull; CSE)
                </option>
                <option value="Dr. Ananya Sen (FAC008)">
                  Dr. Ananya Sen (Professor &bull; Electronics)
                </option>
                <option value="Prof. Rajesh Kulkarni (FAC012)">
                  Prof. Rajesh Kulkarni (Assistant Professor &bull; Mathematics)
                </option>
                <option value="Dr. Kavita Nair (FAC015)">
                  Dr. Kavita Nair (Dean of Academic Affairs)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Select Responsibility Role *
              </label>
              <div className="space-y-2">
                {roles.map((r) => {
                  const isSelected = selectedRole === r.code;
                  return (
                    <div
                      key={r.code}
                      onClick={() => setSelectedRole(r.code)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#8C1515] bg-red-50/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{r.title}</span>
                        <Badge variant={isSelected ? 'success' : 'neutral'} size="xs">
                          {r.category}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">{r.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Scope & Validity */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
              <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <span>
                Assign the exact operational perimeter. The selected role will grant access ONLY to resources within this scope.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Campus</label>
                <select
                  value={selectedCampus}
                  onChange={(e) => setSelectedCampus(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
                >
                  <option value="Campus North">Campus North (Main Technical Campus)</option>
                  <option value="Campus South">Campus South (Applied Research Park)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department / School
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
                >
                  <option value="Computer Science & Engineering">
                    Computer Science &amp; Engineering
                  </option>
                  <option value="Electronics & Communication">
                    Electronics &amp; Communication
                  </option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Management Studies">Management Studies</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Valid From *
                </label>
                <input
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Valid To *</label>
                <input
                  type="date"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Permit Temporary Delegation
                </span>
                <span className="text-[11px] text-slate-500">
                  Allow this member to delegate duties during sanctioned academic leaves
                </span>
              </div>
              <input
                type="checkbox"
                checked={allowDelegation}
                onChange={(e) => setAllowDelegation(e.target.checked)}
                className="w-4 h-4 text-[#8C1515] rounded"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Effective Permission Preview (Section 6.3) */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Assigned Member
                </span>
                <span className="font-bold text-slate-900">{selectedPerson}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Designated Role
                </span>
                <span className="font-bold text-[#8C1515]">
                  {roles.find((r) => r.code === selectedRole)?.title}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Scope Ceiling
                </span>
                <span className="font-semibold text-slate-800">
                  {selectedDepartment} ({selectedCampus})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Active Horizon
                </span>
                <span className="font-mono text-slate-700">
                  {validFrom} &rarr; {validTo}
                </span>
              </div>
            </div>

            {/* What will this person be able to access? (Section 6.3) */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                What will this person be able to access?
              </h4>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-950 mb-1">
                    <CheckCircle2 size={14} className="text-emerald-700" />
                    Permitted Operational Actions
                  </div>
                  <ul className="list-disc pl-5 text-[11px] text-emerald-900 space-y-1">
                    {effectivePermissions.allowed.map((perm, idx) => (
                      <li key={idx}>{perm}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-red-50/60 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-1.5 font-bold text-red-950 mb-1">
                    <Lock size={14} className="text-red-700" />
                    Enforced Boundary Ceilings (Prohibited)
                  </div>
                  <ul className="list-disc pl-5 text-[11px] text-red-900 space-y-1">
                    {effectivePermissions.denied.map((perm, idx) => (
                      <li key={idx}>{perm}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          {step > 1 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(step - 1)}
              leftIcon={<ArrowLeft size={13} />}
            >
              Previous
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
          )}

          {step < 3 ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setStep(step + 1)}
              rightIcon={<ArrowRight size={13} />}
            >
              Continue to Step {step + 1}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirm}
              rightIcon={<Check size={13} />}
            >
              Confirm &amp; Activate Role Assignment
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

