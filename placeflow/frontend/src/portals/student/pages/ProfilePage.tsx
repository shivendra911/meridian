/**
 * PlaceFlow / Meridian — Student Profile & DPDP Privacy Settings (Phase 5).
 *
 * Implements candidate identity dossier, skills self-curation, AI telemetry opt-out,
 * and statutory DPDP affirmative consent management.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Save,
  Plus,
  X,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertCircle} from 'lucide-react';
import { toast } from 'sonner';
import {
  studentApi,
  StudentProfile,
  StudentConsent,
  PlacementReadiness,
  SkillRecommendations} from '../api';
import { PageHeader, Card, Badge, Button, Skeleton } from '../../../ui';
import { ErrorState } from '../../../ui/ErrorState';

const CONSENT_PURPOSES = [
  {
    key: 'PLACEMENT_MATCHING',
    label: 'Campus Placement Eligibility Verification',
    description: 'Permits the Training & Placement Office to match your academic record against corporate drive cutoffs.',
  },
  {
    key: 'RECRUITER_DISCLOSURE',
    label: 'Recruiting Partner Profile Disclosure',
    description: 'Allows verified enterprise employers to view your attested CV, CGPA, and contact details upon shortlist.',
  },
  {
    key: 'AI_PREDICTIVE_MODELING',
    label: 'AI Readiness & Skill Recommendations',
    description: 'Enables machine learning telemetry for career fit predictions and Superday schedule clash resolution.',
  },
];

export const StudentProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [consents, setConsents] = useState<StudentConsent[]>([]);
  const [readiness, setReadiness] = useState<PlacementReadiness | null>(null);
  const [skillRecs, setSkillRecs] = useState<SkillRecommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Editable skills state
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [savingSkills, setSavingSkills] = useState(false);

  // ML Opt-out state
  const [mlOptOut, setMlOptOut] = useState<boolean>(false);
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profData, conData, readData, recData] = await Promise.all([
        studentApi.getMe(),
        studentApi.getConsents(),
        studentApi.getReadinessInsights().catch(() => null),
        studentApi.getSkillRecommendations().catch(() => null),
      ]);
      setProfile(profData);
      setSkills(profData.skills || []);
      setMlOptOut(Boolean(profData.ml_opt_out));
      setConsents(conData || []);
      if (readData) setReadiness(readData);
      if (recData) setSkillRecs(recData);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSkill.trim();
    if (!clean) return;
    if (skills.includes(clean)) {
      toast.error('Skill already added.');
      return;
    }
    setSkills([...skills, clean]);
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSaveSkills = async () => {
    setSavingSkills(true);
    try {
      const updated = await studentApi.updateProfile({ skills });
      setProfile(updated);
      toast.success('Skills portfolio successfully updated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update skills.');
    } finally {
      setSavingSkills(false);
    }
  };

  const handleToggleMlOptOut = async (val: boolean) => {
    setUpdatingPrivacy(true);
    try {
      const updated = await studentApi.updateProfile({ ml_opt_out: val });
      setMlOptOut(Boolean(updated.ml_opt_out));
      const updatedReadiness = await studentApi.getReadinessInsights().catch(() => null);
      if (updatedReadiness) setReadiness(updatedReadiness);
      toast.success(
        val
          ? 'ML Opt-Out Enabled: Telemetry disabled for automated ranking.'
          : 'ML Opt-Out Disabled: Standard AI assistance enabled.'
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to update privacy preference.');
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  const handleConsentToggle = async (purposeKey: string, currentlyActive: boolean) => {
    try {
      if (currentlyActive) {
        await studentApi.withdrawConsent(purposeKey);
        toast.success('Consent withdrawn successfully.');
      } else {
        await studentApi.recordConsent(purposeKey);
        toast.success('Affirmative consent recorded.');
      }
      // Refresh consents
      const freshConsents = await studentApi.getConsents();
      setConsents(freshConsents || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update consent ledger.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 font-sans">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} onRetry={loadData} />;
  }

  const isConsentActive = (purpose: string) => {
    return consents.some(
      (c) =>
        c.purpose === purpose &&
        (c.status === 'Active' ||
          c.status === 'ACTIVE' ||
          c.status === 'GRANTED_BY_DEFAULT' ||
          c.status === 'GRANTED')
    );
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Candidate Profile &amp; Privacy"
        description="Manage your professional dossier, verified skills portfolio, and DPDP Act 2023 consent ledger."
        badge={<Badge variant="institutional" size="xs">Self Governed</Badge>}
      />

      {/* Profile Overview Card */}
      <Card title="Student Dossier" subtitle="SIS Attested Academic Identity">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-lg border border-line bg-canvas">
            <span className="text-ink-muted text-xs block">Full Name</span>
            <span className="text-ink font-semibold text-sm">{profile?.name}</span>
          </div>

          <div className="p-3 rounded-lg border border-line bg-canvas">
            <span className="text-ink-muted text-xs block">University Roll Number</span>
            <span className="text-brand font-mono font-bold text-sm">{profile?.student_id}</span>
          </div>

          <div className="p-3 rounded-lg border border-line bg-canvas">
            <span className="text-ink-muted text-xs block">Institutional Email</span>
            <span className="text-ink font-medium">{profile?.email}</span>
          </div>

          <div className="p-3 rounded-lg border border-line bg-canvas">
            <span className="text-ink-muted text-xs block">Academic Discipline</span>
            <span className="text-ink font-semibold">{profile?.department}</span>
          </div>

          <div className="p-3 rounded-lg border border-line bg-canvas">
            <span className="text-ink-muted text-xs block">Placement Status</span>
            <Badge variant="success" size="xs">
              {profile?.placement_status || 'Eligible'}
            </Badge>
          </div>

          <div className="p-3 rounded-lg border border-line bg-canvas">
            <span className="text-ink-muted text-xs block">Entitled Tier</span>
            <span className="font-mono font-semibold text-brand">
              {profile?.tier_entitlement || 'All Institutional Tiers'}
            </span>
          </div>
        </div>
      </Card>

      {/* Placement Readiness & Explainability Insights */}
      <Card
        title="Predictive Placement Readiness &amp; Career Insights"
        subtitle="Tier-B Statistical Model with Directional Explainability (DPDP Compliant)"
      >
        {readiness?.opted_out ? (
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-900 flex items-start gap-3">
            <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider">Profiling Suppressed</div>
              <p className="text-xs text-amber-800">
                You have opted out of automated AI predictive modeling. Deterministic eligibility criteria (CGPA, backlogs, branch) remain fully active for all recruitment drives.
              </p>
            </div>
          </div>
        ) : readiness ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-canvas border border-line rounded-xl">
                <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">
                  Readiness Score
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold  text-brand">
                    {readiness.placement_probability ?? 0}%
                  </span>
                  <Badge
                    variant={
                      readiness.readiness_band === 'READY'
                        ? 'success'
                        : readiness.readiness_band === 'MODERATE'
                        ? 'warning'
                        : 'neutral'
                    }
                  >
                    {readiness.readiness_band?.replace('_', ' ') || 'CALCULATING'}
                  </Badge>
                </div>
              </div>

              <div className="p-3 bg-canvas border border-line rounded-xl">
                <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">
                  Indicative Package
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold  text-ink">
                    ₹{readiness.expected_package_lpa ?? '--'} <span className="text-xs font-sans font-normal text-ink-muted">LPA</span>
                  </span>
                  <Badge variant="ai">80% Interval</Badge>
                </div>
              </div>

              <div className="p-3 bg-canvas border border-line rounded-xl">
                <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">
                  Model Governance
                </div>
                <div className="text-xs text-ink font-mono font-medium">
                  {readiness.model_version ? `v${readiness.model_version}` : 'v2.0.0'} &bull; Tier-B
                </div>
                <div className="text-xs text-ink-muted mt-1">
                  Human coordinators make final selections
                </div>
              </div>
            </div>

            {/* Explainability Drivers */}
            {readiness.drivers && readiness.drivers.length > 0 && (
              <div className="pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2 flex items-center gap-1.5">
                  <TrendingUp size={13} className="text-brand" />
                  <span>Directional Explainability Factors</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {readiness.drivers.map((drv, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-canvas border border-line rounded-lg text-xs flex items-start gap-2"
                    >
                      {drv.impact === 'POSITIVE' ? (
                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                      ) : drv.impact === 'NEGATIVE' ? (
                        <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                      ) : (
                        <Sparkles size={14} className="text-brand shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-semibold text-ink">{drv.feature}: </span>
                        <span className="text-ink-muted">{drv.explanation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Market-Recommended Skills */}
            {skillRecs && skillRecs.recommendations && skillRecs.recommendations.length > 0 && (
              <div className="pt-2 border-t border-line">
                <div className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-500" />
                    <span>In-Demand Skills for Your Target Roles</span>
                  </span>
                  <span className="text-xs text-ink-muted font-normal lowercase">
                    {skillRecs.market_demand_basis || 'active drives catalog'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {skillRecs.recommendations.map((rec) => {
                    const alreadyHas = skills.includes(rec);
                    return (
                      <button
                        key={rec}
                        type="button"
                        disabled={alreadyHas}
                        onClick={() => {
                          if (!alreadyHas) {
                            setSkills([...skills, rec]);
                            toast.info(`Added "${rec}" to portfolio. Remember to click "Save Portfolio".`);
                          }
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                          alreadyHas
                            ? 'bg-canvas border-line text-ink-muted opacity-60 cursor-default'
                            : 'bg-brand/5 border-brand/20 text-brand hover:bg-brand/10 cursor-pointer'
                        }`}
                      >
                        <span>{rec}</span>
                        {!alreadyHas && <Plus size={11} className="text-brand" />}
                        {alreadyHas && <CheckCircle2 size={11} className="text-emerald-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-ink-muted p-2">
            Placement readiness telemetry will populate as profile data and drive interactions are recorded.
          </div>
        )}
      </Card>

      {/* Skills Portfolio Editor */}
      <Card
        title="Technical Skills &amp; Competencies"
        subtitle="Used for automated resume parsing and corporate role matching"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/10 text-brand border border-brand/20 rounded-lg text-xs font-semibold"
              >
                <span>{skill}</span>
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-red-500 transition-colors cursor-pointer"
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleAddSkill} className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add skill (e.g. React, Kubernetes, SQL)..."
              className="px-3 py-1.5 text-xs bg-canvas border border-line rounded-lg text-ink placeholder-ink-muted focus:outline-none focus:border-brand w-64"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              leftIcon={<Plus size={14} />}
            >
              Add Skill
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={savingSkills}
              onClick={handleSaveSkills}
              leftIcon={<Save size={14} />}
            >
              <span>{savingSkills ? 'Saving...' : 'Save Portfolio'}</span>
            </Button>
          </form>
        </div>
      </Card>

      {/* DPDP Act 2023 Consent & AI Telemetry */}
      <Card
        title="Data Protection &amp; AI Governance (DPDP Act 2023)"
        subtitle="Fine-grained statutory control over how your institutional data is processed and shared"
      >
        <div className="space-y-4">
          {/* ML Opt-Out Toggle */}
          <div className="p-4 rounded-xl border border-line bg-canvas flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-ink flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                <span>Automated AI Decisioning &amp; Ranking Opt-Out</span>
              </div>
              <p className="text-xs text-ink-muted max-w-xl">
                When enabled, your profile will be evaluated solely against deterministic rule cutoffs (CGPA, branch),
                and all neural predictive scoring models will be bypassed.
              </p>
            </div>
            <button
              disabled={updatingPrivacy}
              onClick={() => handleToggleMlOptOut(!mlOptOut)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                mlOptOut ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  mlOptOut ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Granular Purpose Consents */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Statutory Processing Purposes
            </h4>

            {CONSENT_PURPOSES.map((p) => {
              const active = isConsentActive(p.key);
              return (
                <div
                  key={p.key}
                  className="p-3.5 rounded-xl border border-line bg-surface flex items-start justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-ink flex items-center gap-2">
                      {active ? (
                        <ShieldCheck size={15} className="text-emerald-600" />
                      ) : (
                        <ShieldAlert size={15} className="text-amber-500" />
                      )}
                      <span>{p.label}</span>
                      <Badge variant={active ? 'success' : 'neutral'} size="xs">
                        {active ? 'Consent Active' : 'Withdrawn'}
                      </Badge>
                    </div>
                    <p className="text-xs text-ink-muted">{p.description}</p>
                  </div>

                  <Button
                    variant={active ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => handleConsentToggle(p.key, active)}
                  >
                    <span>{active ? 'Withdraw Consent' : 'Grant Consent'}</span>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};

