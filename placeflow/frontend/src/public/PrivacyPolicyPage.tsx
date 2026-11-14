import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield} from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
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
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink">Privacy & DPDP Policy</h1>
              <p className="text-xs text-ink-muted">Digital Personal Data Protection Act compliance at Meridian</p>
            </div>
          </div>

          <section className="space-y-3 text-xs leading-relaxed text-ink-muted">
            <h2 className="text-sm font-bold text-ink">1. Data Ownership & Governance</h2>
            <p>
              Meridian acts as a institutional data processor on behalf of affiliated universities. All official student records (including registration numbers, CGPA, department, and academic history) are verified and owned by the institution.
            </p>

            <h2 className="text-sm font-bold text-ink">2. Digital Personal Data Protection (DPDP) Principles</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Purpose Limitation:</strong> Data is strictly processed for academic administration and placement drive coordination.</li>
              <li><strong>Explicit Consent:</strong> Participation in recruitment drives and sharing profiles with external recruiters requires affirmative user consent.</li>
              <li><strong>Right to Withdraw:</strong> Students may withdraw placement and profile visibility consents at any time in Account &gt; Privacy.</li>
              <li><strong>Right to Correction:</strong> Discrepancies in verified records can be submitted directly for registrar review.</li>
            </ul>

            <h2 className="text-sm font-bold text-ink">3. Data Retention & Erasure</h2>
            <p>
              Account data is retained for the duration of the student's active enrollment and subsequent alumni affiliation, or until institutional de-provisioning is requested by the university administration.
            </p>
          </section>

          <div className="pt-4 border-t border-line text-xs text-ink-muted flex items-center justify-between">
            <span>Last reviewed: November 2026</span>
            <Link to="/contact" className="font-semibold text-brand hover:underline">
              Contact Privacy Officer
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
