/**
 * Meridian public landing page.
 * Self-contained: no API calls, no portal imports. All figures shown in the
 * product preview are illustrative sample data and are labelled as such.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Check, Minus, GraduationCap, Building2, Users, Landmark, ShieldCheck,
  Settings2, FileSearch, GitBranch, CalendarClock, Radar, Lock, BarChart3, Menu, X,
  Briefcase, Eye,
} from 'lucide-react';

/* ----------------------------- content ----------------------------- */

const ROLES = [
  {
    id: 'student', label: 'Students', icon: GraduationCap,
    title: 'See only the drives you qualify for, and why.',
    body: 'A personal workspace for opportunities, applications, interviews and offers, with your privacy choices in your hands.',
    points: ['Eligibility explained for every drive, with the exact rule that applies', 'One timeline from application to offer', 'Consent and profile controls you own'],
    stat: ['Eligible drives', '7'], stat2: ['Applications', '3'],
  },
  {
    id: 'tpo', label: 'Placement office', icon: Building2,
    title: 'Run every drive from notification to offer.',
    body: 'Create drives with eligibility rules, move candidates through stages, and resolve interview clashes before they reach students.',
    points: ['Guided drive creation with a live eligibility preview', 'Pipeline view across applications, interviews and offers', 'Clash-free scheduling across same-day drives'],
    stat: ['Open drives', '12'], stat2: ['In pipeline', '1,284'],
  },
  {
    id: 'faculty', label: 'Faculty', icon: Users,
    title: 'Mentor with context, not spreadsheets.',
    body: 'Your mentees, their readiness and what needs your attention, limited to the students assigned to you.',
    points: ['Mentee watchlist and verification queue', 'Read-only view of mentee applications', 'Access scoped to your mentees only'],
    stat: ['Mentees', '24'], stat2: ['Need attention', '5'],
  },
  {
    id: 'hod', label: 'Department heads', icon: Briefcase,
    title: 'Department outcomes at a glance.',
    body: 'Placement progress, at-risk students and curriculum approvals for your department, without seeing anyone else\u2019s.',
    points: ['Department placement rate and trends', 'At-risk student list with reasons', 'Curriculum approval queue'],
    stat: ['Placement rate', '68%'], stat2: ['At risk', '19'],
  },
  {
    id: 'leadership', label: 'Leadership', icon: Landmark,
    title: 'Decisions backed by auditable evidence.',
    body: 'Institution-wide outcomes, accreditation metrics and compliance signals, shown in aggregate.',
    points: ['NIRF-aligned metrics and exportable reports', 'Fairness audits across demographic groups', 'Consent and AI decision audit trails'],
    stat: ['Programs', '42'], stat2: ['Open flags', '3'],
  },
  {
    id: 'admin', label: 'Administrators', icon: Settings2,
    title: 'Configure the institution once.',
    body: 'Campuses, hierarchy, roles and assignments, with every change recorded.',
    points: ['Institution, campus and department hierarchy', 'Roles, assignments and time-boxed delegation', 'Guided onboarding for new institutions'],
    stat: ['Campuses', '4'], stat2: ['Active roles', '13'],
  },
];

const FEATURES = [
  { icon: FileSearch, title: 'Explainable eligibility', body: 'Every yes or no comes with the rule behind it, for students and for the placement office.' },
  { icon: GitBranch, title: 'One application pipeline', body: 'Applied, shortlisted, interviewed, offered. Every stage on one timeline with a full history.' },
  { icon: CalendarClock, title: 'Interview scheduling', body: 'Detects and resolves clashes when a student is booked into two drives on the same day.' },
  { icon: Radar, title: 'Retention risk', body: 'Flags offers likely to be dropped, so the placement office can act early.' },
  { icon: Lock, title: 'Privacy by design', body: 'Consent records, and personal data masked by role, in line with India\u2019s DPDP Act.' },
  { icon: BarChart3, title: 'Reporting and accreditation', body: 'NIRF-aligned metrics and exportable reports from the same source of truth.' },
];

const STEPS = [
  { n: '01', title: 'Set up your institution', body: 'Define campuses, departments and who holds which role. Access follows from there.' },
  { n: '02', title: 'Publish drives with rules', body: 'Add the company, role and eligibility. Students see only what they qualify for.' },
  { n: '03', title: 'Track outcomes', body: 'Follow candidates to offers and report outcomes to leadership with evidence.' },
];

const MATRIX: { row: string; cols: boolean[] }[] = [
  { row: 'Own record', cols: [true, true, true, true, true] },
  { row: 'Mentees\u2019 records', cols: [false, true, false, false, false] },
  { row: 'Department records', cols: [false, false, true, false, false] },
  { row: 'All students', cols: [false, false, false, true, false] },
  { row: 'Aggregate reports', cols: [false, false, true, true, true] },
];
const MATRIX_COLS = ['Student', 'Faculty', 'Dept head', 'Placement', 'Leadership'];

const SAMPLE_DRIVES = [
  { co: 'Northwind Systems', role: 'Software Engineer', tier: 'Super Dream', status: 'Open' },
  { co: 'Lumen Analytics', role: 'Data Analyst', tier: 'Dream', status: 'Open' },
  { co: 'Apex Cloud', role: 'Programmer Analyst', tier: 'Normal', status: 'Closing soon' },
];

/* ----------------------------- pieces ----------------------------- */

const Logo: React.FC<{ light?: boolean }> = ({ light }) => (
  <Link to="/" className="flex items-center gap-2.5">
    <span className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-sm">M</span>
    <span className={`font-semibold tracking-tight text-base ${light ? 'text-white' : 'text-ink'}`}>Meridian</span>
  </Link>
);

const ProductPreview: React.FC = () => (
  <div className="relative">
    <div className="absolute -inset-4 bg-gradient-to-br from-brand/10 via-transparent to-accent/10 rounded-3xl blur-2xl" aria-hidden />
    <div className="relative rounded-xl border border-line bg-surface shadow-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-line bg-canvas">
        <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /><span className="w-2.5 h-2.5 rounded-full bg-slate-300" /><span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
        <span className="ml-3 text-xs text-ink-muted">Placement Office · Overview</span>
        <span className="ml-auto text-[11px] text-ink-muted">Sample data</span>
      </div>
      <div className="p-5 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          {[['Open drives', '12'], ['Applications', '1,284'], ['Offers', '214']].map(([l, v]) => (
            <div key={l} className="rounded-lg border border-line p-3">
              <p className="text-[11px] font-medium text-ink-muted">{l}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{v}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs font-medium text-ink-muted mb-2">Pipeline</p>
          <div className="space-y-1.5">
            {[['Applied', 100], ['Shortlisted', 62], ['Interviewed', 38], ['Offered', 17]].map(([l, w]) => (
              <div key={l as string} className="flex items-center gap-3">
                <span className="w-20 text-[11px] text-ink-muted">{l}</span>
                <div className="flex-1 h-2 rounded-full bg-canvas"><div className="h-2 rounded-full bg-brand" style={{ width: `${w}%`, opacity: 0.35 + (Number(w) / 160) }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-line divide-y divide-line">
          {SAMPLE_DRIVES.map((d) => (
            <div key={d.co} className="flex items-center gap-3 px-3 py-2.5">
              <span className="w-8 h-8 rounded-md bg-canvas text-ink-muted flex items-center justify-center text-xs font-semibold">{d.co[0]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{d.co}</p>
                <p className="text-xs text-ink-muted truncate">{d.role}</p>
              </div>
              <span className="hidden sm:inline text-[11px] px-2 py-0.5 rounded bg-canvas text-ink-muted">{d.tier}</span>
              <span className={`text-[11px] px-2 py-0.5 rounded ${d.status === 'Open' ? 'bg-green-50 text-success' : 'bg-amber-50 text-warning'}`}>{d.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ----------------------------- page ----------------------------- */

export const LandingPage: React.FC = () => {
  const [role, setRole] = useState(ROLES[0].id);
  const [menu, setMenu] = useState(false);
  const active = ROLES.find((r) => r.id === role)!;

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => { document.documentElement.style.scrollBehavior = ''; };
  }, []);

  const links = [['Platform', '#platform'], ['Roles', '#roles'], ['How it works', '#how'], ['Security', '#security']];

  return (
    <div className="min-h-screen bg-surface text-ink font-sans">
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-line">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center gap-8">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm text-ink-muted">
            {links.map(([l, h]) => <a key={h} href={h} className="hover:text-ink transition-colors">{l}</a>)}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/login" className="hidden sm:inline-flex px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors">Sign in</Link>
            <button className="md:hidden p-2 rounded-lg border border-line" onClick={() => setMenu(!menu)} aria-label="Menu">{menu ? <X size={18} /> : <Menu size={18} />}</button>
          </div>
        </div>
        {menu && (
          <div className="md:hidden border-t border-line px-6 py-3 space-y-1 bg-surface">
            {links.map(([l, h]) => <a key={h} href={h} onClick={() => setMenu(false)} className="block py-2 text-sm text-ink-muted">{l}</a>)}
            <Link to="/login" className="block py-2 text-sm font-medium text-brand">Sign in</Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-canvas to-surface">
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-20 lg:pt-24 lg:pb-28 grid lg:grid-cols-[1.05fr_1fr] gap-14 items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-medium text-ink-muted border border-line rounded-full px-3 py-1 bg-surface">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Placement and career operations platform
            </p>
            <h1 className="mt-5 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.08] text-brand">
              Every drive, every student, one system of record.
            </h1>
            <p className="mt-5 text-lg text-ink-muted leading-relaxed max-w-xl">
              Meridian gives placement cells, students, faculty and leadership their own workspace on shared, auditable data. Eligibility is explained, access follows each person&rsquo;s role, and nothing lives in a spreadsheet.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors">
                Sign in <ArrowRight size={16} />
              </Link>
              <a href="#platform" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-line bg-surface text-sm font-medium hover:border-slate-400 transition-colors">
                Explore the platform
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
              {['Role-based access', 'DPDP-aware privacy', 'Full audit trail'].map((t) => (
                <li key={t} className="flex items-center gap-2"><Check size={15} className="text-success" />{t}</li>
              ))}
            </ul>
          </div>
          <ProductPreview />
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="scroll-mt-20 border-y border-line">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-semibold tracking-tight text-brand">A workspace for every role</h2>
          <p className="mt-3 text-ink-muted max-w-2xl">Each person signs in to their own portal, built around their work and limited to the data they are allowed to see.</p>

          <div className="mt-8 flex gap-2 overflow-x-auto pb-1" role="tablist">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const on = r.id === role;
              return (
                <button key={r.id} role="tab" aria-selected={on} onClick={() => setRole(r.id)}
                  className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${on ? 'bg-brand text-white border-brand' : 'bg-surface text-ink-muted border-line hover:text-ink hover:border-slate-400'}`}>
                  <Icon size={16} />{r.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid md:grid-cols-[1.2fr_1fr] gap-6 rounded-xl border border-line bg-canvas p-8">
            <div>
              <h3 className="text-xl font-semibold tracking-tight">{active.title}</h3>
              <p className="mt-2 text-ink-muted">{active.body}</p>
              <ul className="mt-5 space-y-3">
                {active.points.map((p) => (
                  <li key={p} className="flex gap-3 text-sm"><Check size={16} className="mt-0.5 shrink-0 text-success" /><span>{p}</span></li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-3 content-start">
              {[active.stat, active.stat2].map(([l, v]) => (
                <div key={l} className="rounded-lg border border-line bg-surface p-4">
                  <p className="text-[11px] font-medium text-ink-muted">{l}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{v}</p>
                </div>
              ))}
              <p className="col-span-2 text-[11px] text-ink-muted">Illustrative sample values</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="platform" className="scroll-mt-20 bg-canvas">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-semibold tracking-tight text-brand">Built for how placements actually run</h2>
          <p className="mt-3 text-ink-muted max-w-2xl">The details that usually live in spreadsheets and group chats, handled in one place.</p>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-xl border border-line bg-surface p-6">
                  <span className="w-10 h-10 rounded-lg bg-brand/5 text-brand flex items-center justify-center"><Icon size={20} /></span>
                  <h3 className="mt-4 font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-ink-muted leading-relaxed">{f.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-semibold tracking-tight text-brand">From setup to offers in three steps</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="border-t-2 border-brand pt-5">
                <p className="text-sm font-semibold text-accent tabular-nums">{s.n}</p>
                <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-muted leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="scroll-mt-20 bg-brand text-white">
        <div className="mx-auto max-w-6xl px-6 py-20 grid lg:grid-cols-[1fr_1.1fr] gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-medium text-blue-200"><ShieldCheck size={16} /> Security and access</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Access that follows the role, enforced on the server.</h2>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              {['Permissions checked on every request, not just hidden in the interface', 'Each institution\u2019s data is isolated from every other', 'Personal data masked for roles that do not need it', 'Sensitive actions recorded in an audit trail'].map((t) => (
                <li key={t} className="flex gap-3"><Check size={16} className="mt-0.5 shrink-0 text-green-400" />{t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 overflow-x-auto">
            <table className="w-full text-sm min-w-[460px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-medium">Can see</th>
                  {MATRIX_COLS.map((c) => <th key={c} className="px-2 py-3 font-medium text-center">{c}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {MATRIX.map((m) => (
                  <tr key={m.row}>
                    <td className="px-4 py-3 text-slate-200">{m.row}</td>
                    {m.cols.map((on, i) => (
                      <td key={i} className="px-2 py-3 text-center">
                        {on ? <Check size={16} className="inline text-green-400" /> : <Minus size={16} className="inline text-slate-600" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-canvas">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <Eye className="mx-auto text-accent" size={28} />
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-brand">See your own workspace</h2>
          <p className="mt-3 text-ink-muted max-w-xl mx-auto">Sign in with your institutional account to open the portal for your role.</p>
          <Link to="/login" className="mt-7 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors">
            Sign in <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-950 text-slate-400">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row gap-6 sm:items-center justify-between">
          <Logo light />
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {links.map(([l, h]) => <a key={h} href={h} className="hover:text-white transition-colors">{l}</a>)}
            <Link to="/login" className="hover:text-white transition-colors">Sign in</Link>
          </nav>
          <p className="text-xs">&copy; 2026 Meridian</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
