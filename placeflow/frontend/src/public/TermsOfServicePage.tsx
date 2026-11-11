import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-canvas text-ink font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-hover mb-8"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </Link>

        <div className="bg-surface rounded-2xl border border-line p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-line pb-4">
            <div className="p-2.5 rounded-xl bg-brand/10 text-brand">
              <FileText size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink">Terms of Service</h1>
              <p className="text-xs text-ink-muted">Acceptable use policy for Meridian Institutional Platform</p>
            </div>
          </div>

          <section className="space-y-3 text-xs leading-relaxed text-ink-muted">
            <h2 className="text-sm font-bold text-ink">1. Authorized Institutional Access</h2>
            <p>
              Access to Meridian workspaces is granted solely to registered students, faculty, department heads, placement officers, and institutional administrators authorized by the host university.
            </p>

            <h2 className="text-sm font-bold text-ink">2. Placement & Recruitment Integrity</h2>
            <p>
              Students agree to provide accurate self-asserted project and skill information. Academic metrics (CGPA, backlogs, attendance) are non-editable and reflect the institution's authoritative ledger.
            </p>

            <h2 className="text-sm font-bold text-ink">3. Account Security</h2>
            <p>
              Users are responsible for safeguarding login credentials and one-time verification tokens. Any suspected credential compromise should be immediately addressed via password reset or session revocation.
            </p>
          </section>

          <div className="pt-4 border-t border-line text-xs text-ink-muted flex items-center justify-between">
            <span>Effective date: November 2026</span>
            <Link to="/contact" className="font-semibold text-brand hover:underline">
              Support & Inquiries
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
