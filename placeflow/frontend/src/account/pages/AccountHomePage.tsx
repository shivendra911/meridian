import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  Bell,
  Lock,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../core/auth/useAuth';
import { formatRoleLabel } from '../../core/auth/roleLabels';
import { Avatar } from '../../ui/cards/Avatar';
import { MacOsProgressBar } from '../../components/ui/MacOsProgressBar';

export const AccountHomePage: React.FC = () => {
  const { me } = useAuth();
  const navigate = useNavigate();

  const defaultPortal = me?.default_portal || (me?.portals && me.portals[0]) || 'student';
  const workspaceUrl = `/${defaultPortal}/home`;
  const displayName = me?.profile?.display_name || me?.display_name || 'Member';
  const email = me?.profile?.email || me?.subject?.id || 'Registered Account';
  const roleLabel = me?.profile?.affiliation_label
    ? formatRoleLabel(me.profile.affiliation_label)
    : formatRoleLabel(me?.assignments?.[0]?.role_code);
  const institutionName = me?.profile?.institution_name || 'Apex Institute of Technology';
  const department = me?.profile?.department || 'Computer Science & Engineering';
  const avatarUrl = me?.profile?.avatar_url || null;

  return (
    <div className="space-y-6">
      {/* 1. Account Hero Card (macOS System Settings Style) */}
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-macos-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Avatar src={avatarUrl} name={displayName} size={64} className="ring-2 ring-slate-200 shrink-0" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-ink leading-tight m-0">
                {displayName}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-brand/10 text-brand">
                <CheckCircle2 size={12} />
                <span>Verified Account</span>
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-1 m-0">
              {email} &bull; {roleLabel}
            </p>
            <div className="mt-2 flex items-center gap-3 text-xs text-ink-muted">
              <span className="flex items-center gap-1">
                <Building2 size={12} className="text-slate-400" />
                <span>{institutionName}</span>
              </span>
              <span>&bull;</span>
              <span>{department}</span>
            </div>
          </div>
        </div>

        {/* Quick Launch Workspace Button */}
        <div className="w-full md:w-auto">
          <Link
            to={workspaceUrl}
            className="macos-press w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-5 py-2.5 shadow-sm transition-all duration-150 cursor-pointer"
          >
            <span>Launch {defaultPortal.toUpperCase()} Workspace</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* 2. Account Health & Completeness Bar */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-macos-card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-brand" />
            <span className="text-xs font-bold text-ink">Account Profile Completeness</span>
          </div>
          <span className="text-xs font-mono font-bold text-brand">85% Complete</span>
        </div>
        <MacOsProgressBar value={85} height={6} />
        <div className="mt-2 flex items-center justify-between text-[11.5px] text-ink-muted">
          <span>Official dossier verified &bull; Multi-factor authentication ready</span>
          <Link
            to="/account/profile"
            className="font-semibold text-brand hover:underline inline-flex items-center gap-1"
          >
            <span>Complete Bio</span>
            <ExternalLink size={10} />
          </Link>
        </div>
      </div>

      {/* 3. Central Management Grid (macOS Preference Panes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Profile Card */}
        <div
          onClick={() => navigate('/account/profile')}
          className="card-interactive rounded-2xl border border-line bg-surface p-5 shadow-macos-card cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <User size={18} />
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="text-xs font-bold text-ink mb-1">Personal Profile & Bio</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Manage your display name, campus card photo, professional headline, language, and timezone settings.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs text-slate-500">
            <span>Official Dossier</span>
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Locked &amp; Verified
            </span>
          </div>
        </div>

        {/* Security & Sessions Card */}
        <div
          onClick={() => navigate('/account/security')}
          className="card-interactive rounded-2xl border border-line bg-surface p-5 shadow-macos-card cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <Shield size={18} />
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="text-xs font-bold text-ink mb-1">Security & Active Sessions</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Change institutional password, review concurrent logins, and inspect cryptographic session revocation logs.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Smartphone size={13} className="text-slate-400" />
              <span>Current device: Windows PC</span>
            </span>
            <span className="text-brand font-semibold">1 Active Session</span>
          </div>
        </div>

        {/* Notifications Card */}
        <div
          onClick={() => navigate('/account/notifications')}
          className="card-interactive rounded-2xl border border-line bg-surface p-5 shadow-macos-card cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <Bell size={18} />
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="text-xs font-bold text-ink mb-1">Notification Preferences</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Fine-tune high-priority placement alerts, interview reminders, consent deadlines, and marketing digests.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs text-slate-500">
            <span>Delivery Channels</span>
            <span className="text-ink font-semibold">Email &bull; In-App &bull; SMS</span>
          </div>
        </div>

        {/* Privacy & Data Rights Card */}
        <div
          onClick={() => navigate('/account/privacy')}
          className="card-interactive rounded-2xl border border-line bg-surface p-5 shadow-macos-card cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                <Lock size={18} />
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="text-xs font-bold text-ink mb-1">Privacy & Data Rights</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Export verified JSON dossiers, request corrections for registrar records, and audit privacy consent logs.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs text-slate-500">
            <span>DPDP Act Compliance</span>
            <span className="text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Active Consent Record
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountHomePage;
