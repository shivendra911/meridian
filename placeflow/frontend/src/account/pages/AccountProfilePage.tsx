import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Camera,
  UploadCloud,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Globe,
  Clock,
  Phone,
  Sparkles,
  Info,
} from 'lucide-react';
import { client } from '../../core/api/client';
import { useAuth } from '../../core/auth/useAuth';
import { ProfileHeader } from '../../ui/cards/ProfileHeader';
import { formatApiError } from '../../core/api/errors';

export const AccountProfilePage: React.FC = () => {
  const { me, refreshMe } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states for self-asserted fields
  const [preferredName, setPreferredName] = useState('');
  const [headline, setHeadline] = useState('');
  const [phone, setPhone] = useState('');
  const [locale, setLocale] = useState('en-IN');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  // Avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const loadProfile = async () => {
    try {
      const data = await client.get<any>('/account/profile/');
      setProfile(data);
      setPreferredName(data.preferred_name || '');
      setHeadline(data.headline || '');
      setPhone(data.primary_phone || '');
      setLocale(data.locale || 'en-IN');
      setTimezone(data.timezone || 'Asia/Kolkata');
    } catch (err) {
      setErrorMsg(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const updated = await client.patch<any>('/account/profile/', {
        preferred_name: preferredName.trim() || null,
        headline: headline.trim() || null,
        primary_phone: phone.trim() || null,
        locale,
        timezone,
      });
      setProfile(updated);
      setSuccessMsg('Profile updated successfully.');
      await refreshMe();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image file exceeds the 2 MB limit.');
      return;
    }

    setUploadingAvatar(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await client.post('/account/avatar/', formData);
      await loadProfile();
      await refreshMe();
      setSuccessMsg('Avatar updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(formatApiError(err));
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 rounded-xl bg-slate-200" />
        <div className="h-64 rounded-xl bg-slate-200" />
      </div>
    );
  }

  const primaryAff = profile?.affiliations?.[0];
  const official = primaryAff?.official_data || {};
  const isVerified = primaryAff?.status === 'VERIFIED';
  const completeness = profile?.completeness || { score: 80, next_missing: 'Add skills' };

  return (
    <div className="space-y-8">
      {/* 1. Profile Header Card */}
      <ProfileHeader
        name={profile?.display_name || 'Member'}
        avatar_url={profile?.avatar_url}
        department={official.department || profile?.department}
        batch={official.batch ? String(official.batch) : null}
        reg_no={official.reg_no}
        role={primaryAff?.type || me?.assignments?.[0]?.role_code || 'Member'}
        is_verified={isVerified}
        completenessPercent={completeness.score}
        nextMissingItem={completeness.next_missing}
        onEdit={() => {
          document.getElementById('editable-profile-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Notifications / Alerts */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. Official Verified Dossier (Read-Only) */}
      <div className="rounded-xl border border-line bg-surface p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-line pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink flex items-center gap-2">
                Official Institutional Record
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                  Verified by institution
                </span>
              </h2>
              <p className="text-xs text-ink-muted">
                Authoritative academic data maintained by the campus registrar and placement office.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl border border-line bg-canvas">
            <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider block mb-1">
              Legal Name on File
            </span>
            <span className="text-xs font-bold text-ink">{profile?.display_name || '—'}</span>
          </div>

          <div className="p-3.5 rounded-xl border border-line bg-canvas">
            <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider block mb-1">
              Registration / Roll Number
            </span>
            <span className="text-xs font-bold text-ink font-mono">{official.reg_no || '—'}</span>
          </div>

          <div className="p-3.5 rounded-xl border border-line bg-canvas">
            <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider block mb-1">
              Department & Program
            </span>
            <span className="text-xs font-bold text-ink">{official.department || '—'}</span>
          </div>

          <div className="p-3.5 rounded-xl border border-line bg-canvas">
            <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider block mb-1">
              Graduation Batch
            </span>
            <span className="text-xs font-bold text-ink">{official.batch || '—'}</span>
          </div>

          {official.cgpa && (
            <div className="p-3.5 rounded-xl border border-line bg-canvas">
              <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider block mb-1">
                Authoritative CGPA
              </span>
              <span className="text-xs font-bold text-ink font-mono">{official.cgpa} / 10.0</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl border border-line bg-canvas">
            <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider block mb-1">
              Institutional Email
            </span>
            <span className="text-xs font-bold text-ink truncate block" title={profile?.primary_email}>
              {profile?.primary_email || '—'}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-line flex items-center justify-between text-xs text-ink-muted">
          <span className="flex items-center gap-1.5">
            <Info size={13} className="text-slate-400" />
            Official records are read-only to ensure academic integrity.
          </span>
          <button
            type="button"
            onClick={() => {
              window.location.href = '/account/privacy';
            }}
            className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Request correction</span>
            <ExternalLink size={12} />
          </button>
        </div>
      </div>

      {/* 3. Self-Asserted Editable Profile */}
      <div id="editable-profile-section" className="rounded-xl border border-line bg-surface p-6 shadow-xs">
        <div className="border-b border-line pb-4 mb-5">
          <h2 className="text-sm font-bold text-ink">Personal Profile & Bio</h2>
          <p className="text-xs text-ink-muted">
            Self-written information visible on your campus card, networking profiles, and workspace header.
          </p>
        </div>

        {/* Avatar Upload Strip */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-canvas border border-line mb-6">
          <div className="relative group">
            <img
              src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile?.display_name || 'M')}`}
              alt={profile?.display_name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-slate-200"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Change avatar"
            >
              <Camera size={18} />
            </button>
          </div>

          <div className="flex-1">
            <h4 className="text-xs font-bold text-ink">Profile Photo</h4>
            <p className="text-[11px] text-ink-muted">
              PNG, JPG, or WEBP up to 2 MB. Square format recommended.
            </p>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <button
              type="button"
              disabled={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface text-xs font-semibold text-ink hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
            >
              <UploadCloud size={14} className="text-brand" />
              <span>{uploadingAvatar ? 'Uploading...' : 'Upload photo'}</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Preferred Name / Nickname
              </label>
              <input
                type="text"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                placeholder="e.g. Diya"
                className="w-full px-3 py-2 text-xs border border-line rounded-lg bg-canvas text-ink placeholder-ink-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
              <span className="text-[10px] text-ink-muted mt-1 block">
                How you prefer to be addressed across chat and mentorship.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                  <Phone size={14} />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-line rounded-lg bg-canvas text-ink placeholder-ink-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Professional Headline
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Pre-final year CSE · Full Stack & Distributed Systems Enthusiast"
              maxLength={120}
              className="w-full px-3 py-2 text-xs border border-line rounded-lg bg-canvas text-ink placeholder-ink-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
            <div className="flex justify-between items-center text-[10px] text-ink-muted mt-1">
              <span>Displayed under your name on profile cards and search results.</span>
              <span>{headline.length} / 120</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Language & Locale
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                  <Globe size={14} />
                </div>
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-line rounded-lg bg-canvas text-ink focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                >
                  <option value="en-IN">English (India) - en-IN</option>
                  <option value="en-US">English (United States) - en-US</option>
                  <option value="en-GB">English (United Kingdom) - en-GB</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Timezone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                  <Clock size={14} />
                </div>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-line rounded-lg bg-canvas text-ink focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">America/New York (EST/EDT)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-line">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 py-2 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
