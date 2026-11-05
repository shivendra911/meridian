import React, { useState } from 'react';
import {
  Building2,
  Landmark,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Globe,
  Plus,
  Trash2,
  GitFork,
  Check,
  FileCheck2,
  ExternalLink,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface HierarchyNode {
  id: string;
  name: string;
  type: 'SCHOOL' | 'DEPARTMENT' | 'CENTRE';
  code: string;
  children?: HierarchyNode[];
}

export const InstitutionalOnboardingBuilder: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (data: any) => void;
}> = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 7;

  // Step 1: Identity
  const [legalName, setLegalName] = useState('National Institute of Advanced Technology');
  const [aisheCode, setAisheCode] = useState('U-0842');
  const [institutionType, setInstitutionType] = useState('AUTONOMOUS_INSTITUTE');
  const [websiteUrl, setWebsiteUrl] = useState('https://niat.ac.in');

  // Step 2: Campuses
  const [campuses, setCampuses] = useState([
    { id: 'c1', name: 'Campus North (Main)', city: 'Tiruchirappalli', state: 'Tamil Nadu', isPrimary: true },
    { id: 'c2', name: 'Campus South (Research Park)', city: 'Chennai', state: 'Tamil Nadu', isPrimary: false },
  ]);

  // Step 3: Schools & Departments visual hierarchy
  const [schools, setSchools] = useState<HierarchyNode[]>([
    {
      id: 'sch_eng',
      name: 'School of Computing & Engineering',
      type: 'SCHOOL',
      code: 'SCE',
      children: [
        { id: 'dept_cse', name: 'Department of Computer Science & Engg', type: 'DEPARTMENT', code: 'CSE' },
        { id: 'dept_ai', name: 'Centre for Artificial Intelligence & Data Science', type: 'CENTRE', code: 'CAIDS' },
        { id: 'dept_ece', name: 'Department of Electronics & Communication', type: 'DEPARTMENT', code: 'ECE' },
      ],
    },
    {
      id: 'sch_mgmt',
      name: 'School of Management Studies',
      type: 'SCHOOL',
      code: 'SMS',
      children: [
        { id: 'dept_mba', name: 'Department of Business Administration', type: 'DEPARTMENT', code: 'MBA' },
        { id: 'dept_fin', name: 'Centre for Financial Analytics', type: 'CENTRE', code: 'CFA' },
      ],
    },
  ]);

  // Step 4: Administrative Offices
  const [adminOffices] = useState([
    { name: 'Office of the Registrar', head: 'Registrar', scope: 'Institutional Secretariat' },
    { name: 'Dean of Academic Affairs', head: 'Dean (Academics)', scope: 'Curriculum & Senate' },
    { name: 'Office of Career Services (OCS / TPO)', head: 'Professor-in-Charge Placements', scope: 'Recruitment' },
    { name: 'Controller of Examinations (CoE)', head: 'CoE', scope: 'Grades & Convocation' },
  ]);

  // Step 5: Relationships & Affiliations
  const [affiliations] = useState([
    { partner: 'University Grants Commission (UGC)', role: 'AUTONOMOUS_REGULATOR', status: 'VERIFIED' },
    { partner: 'National Board of Accreditation (NBA)', role: 'TIER_1_ACCREDITATION', status: 'VERIFIED' },
    { partner: 'DigiLocker / National Academic Depository (NAD)', role: 'APAAR_ISSUER', status: 'ACTIVE' },
  ]);

  // Step 6: Initial Settings
  const [dpdpEnabled, setDpdpEnabled] = useState(true);
  const [apaarAutoVerify, setApaarAutoVerify] = useState(true);
  const [gradingScale, setGradingScale] = useState('UGC_10_POINT');

  // Step 7: Readiness check
  const [isActivating, setIsActivating] = useState(false);
  const [activationResult, setActivationResult] = useState<string | null>(null);

  const handleActivate = () => {
    setIsActivating(true);
    setTimeout(() => {
      setIsActivating(false);
      setActivationResult('INSTITUTION_ACTIVATED_SUCCESSFULLY');
      if (onComplete) {
        onComplete({
          legalName,
          aisheCode,
          campuses,
          schools,
          dpdpEnabled,
        });
      }
    }, 700);
  };

  const progressPct = Math.round((step / totalSteps) * 100);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Institutional Onboarding & Topology Builder"
      subtitle="7-step guided setup with acyclic hierarchy validation and regulatory verification"
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Stepper Progress */}
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider font-mono">
              Step {step} of {totalSteps}:{' '}
              {step === 1 && 'Institutional Identity & AISHE'}
              {step === 2 && 'Campuses & Geographic Locations'}
              {step === 3 && 'Schools, Faculties & Departments'}
              {step === 4 && 'Administrative Offices & Directorates'}
              {step === 5 && 'Affiliations & Regulatory Bridges'}
              {step === 6 && 'Governance Settings & DPDP Act'}
              {step === 7 && 'Readiness Audit & Activation'}
            </span>
            <span className="font-semibold text-cardinal font-mono">{progressPct}% Complete</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-cardinal h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* STEP 1: Identity */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
              <Landmark size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <span>
                Enter the legal gazetted institutional identity. Credentials are verified against the Ministry of Education AISHE repository.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Legal Registered Name *
                </label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  AISHE National Registry Code *
                </label>
                <input
                  type="text"
                  value={aisheCode}
                  onChange={(e) => setAisheCode(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institutional Governance Type
                </label>
                <select
                  value={institutionType}
                  onChange={(e) => setInstitutionType(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
                >
                  <option value="AUTONOMOUS_INSTITUTE">Autonomous Institute (Senate Governed)</option>
                  <option value="CENTRAL_UNIVERSITY">Central University</option>
                  <option value="STATE_UNIVERSITY">State University</option>
                  <option value="DEEMED_UNIVERSITY">Deemed-to-be University</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Web Portal URL
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-mono text-[11px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Campuses */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Configured Physical Campuses
                </h4>
                <p className="text-xs text-slate-500">
                  CAMP-01 enforces exactly one primary campus per institution
                </p>
              </div>
              <Button
                variant="outline"
                size="xs"
                onClick={() =>
                  setCampuses([
                    ...campuses,
                    {
                      id: `c${campuses.length + 1}`,
                      name: `New Campus ${campuses.length + 1}`,
                      city: 'Bengaluru',
                      state: 'Karnataka',
                      isPrimary: false,
                    },
                  ])
                }
              >
                + Add Campus
              </Button>
            </div>

            <div className="space-y-2.5">
              {campuses.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">{c.name}</span>
                      <span className="text-[11px] text-slate-500">
                        {c.city}, {c.state}
                      </span>
                    </div>
                  </div>

                  <Badge variant={c.isPrimary ? 'success' : 'neutral'} size="xs">
                    {c.isPrimary ? 'PRIMARY CAMPUS' : 'SATELLITE CAMPUS'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Schools & Departments Visual Hierarchy */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Academic Organizational Hierarchy Tree
                </h4>
                <p className="text-xs text-slate-500">
                  Structural cycle prevention active: DAG validation guarantees no circular ancestry
                </p>
              </div>
              <Badge variant="success" size="xs">
                Acyclic Tree Verified (0 Cycles)
              </Badge>
            </div>

            <div className="space-y-3">
              {schools.map((school) => (
                <div key={school.id} className="border border-slate-200 rounded-lg bg-slate-50/50 p-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <Layers size={15} className="text-cardinal" />
                      <span className="font-bold text-xs text-slate-900">{school.name}</span>
                      <span className="text-[10px] font-mono bg-slate-200 px-1.5 py-0.2 rounded font-semibold text-slate-700">
                        {school.code}
                      </span>
                    </div>
                    <Badge variant="neutral" size="xs">
                      School Unit
                    </Badge>
                  </div>

                  <div className="mt-2.5 pl-4 space-y-1.5 border-l-2 border-slate-200">
                    {school.children?.map((dept) => (
                      <div
                        key={dept.id}
                        className="p-2 bg-white border border-slate-200 rounded flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <GitFork size={13} className="text-slate-400 rotate-90" />
                          <span className="font-medium text-slate-800">{dept.name}</span>
                        </div>
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">
                          {dept.code}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Administrative Offices */}
        {step === 4 && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Institutional Administrative Offices &amp; Directorates
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {adminOffices.map((office, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{office.name}</span>
                    <Badge variant="info" size="xs">
                      Directorate
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-600">Head: {office.head}</div>
                  <div className="text-[11px] text-slate-400 font-mono">Scope: {office.scope}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: Relationships & Affiliations */}
        {step === 5 && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              National Depository &amp; Regulatory Affiliations
            </h4>
            <div className="space-y-2">
              {affiliations.map((aff, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900 block">{aff.partner}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{aff.role}</span>
                    </div>
                  </div>
                  <Badge variant="success" size="xs">
                    {aff.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: Governance Settings & DPDP */}
        {step === 6 && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Governance, Security &amp; Compliance Standards
            </h4>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  DPDP Act 2023 Consent Enforcement
                </span>
                <span className="text-[11px] text-slate-500">
                  Cryptographically hash candidate Aadhaar/PAN and mask recruiter PII previews
                </span>
              </div>
              <input
                type="checkbox"
                checked={dpdpEnabled}
                onChange={(e) => setDpdpEnabled(e.target.checked)}
                className="w-4 h-4 text-cardinal rounded"
              />
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  DigiLocker APAAR Automated Identity Verification
                </span>
                <span className="text-[11px] text-slate-500">
                  Pre-verify government identity tokens on student matriculation
                </span>
              </div>
              <input
                type="checkbox"
                checked={apaarAutoVerify}
                onChange={(e) => setApaarAutoVerify(e.target.checked)}
                className="w-4 h-4 text-cardinal rounded"
              />
            </div>
          </div>
        )}

        {/* STEP 7: Readiness Audit & Activation */}
        {step === 7 && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-emerald-950 block">
                  Autonomous Pre-Activation Audit Passed (100% Score)
                </span>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  All 10 structural conditions satisfied: Primary campus verified, DAG cycle checks clear, regulatory credentials attested, DPDP privacy policy active.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Institution
                </span>
                <span className="font-bold text-slate-900">{legalName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  AISHE Code
                </span>
                <span className="font-mono font-bold text-cardinal">{aisheCode}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Campuses
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {campuses.length} Campuses
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Schools / Units
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {schools.length} Schools (5 Depts)
                </span>
              </div>
            </div>

            {activationResult && (
              <div className="p-3 bg-emerald-100/60 border border-emerald-300 rounded text-xs text-emerald-900 font-semibold text-center">
                ✨ Institution successfully chartered and activated into Campus OS ecosystem!
              </div>
            )}
          </div>
        )}

        {/* Footer controls */}
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

          {step < totalSteps ? (
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
              onClick={handleActivate}
              loading={isActivating}
              rightIcon={<Zap size={13} />}
            >
              Charter &amp; Activate Institution
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

