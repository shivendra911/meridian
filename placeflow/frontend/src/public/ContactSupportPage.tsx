import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Send, CheckCircle2 } from 'lucide-react';

export const ContactSupportPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
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
              <Mail size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink">Institutional Support</h1>
              <p className="text-xs text-ink-muted">Connect with campus administrators and technical support</p>
            </div>
          </div>

          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-sm font-semibold text-ink">Message Dispatched</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Your support inquiry has been routed to the campus administration queue. A representative will contact you via your institutional email.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  Send another inquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Category
                </label>
                <select
                  required
                  className="w-full px-3 py-2 text-xs border border-line rounded-lg bg-canvas text-ink focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                >
                  <option value="account">Account Access or Claim Issue</option>
                  <option value="record">Academic Record Discrepancy</option>
                  <option value="drive">Placement Drive Inquiry</option>
                  <option value="tech">Technical Issue or Bug Report</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Summary of issue..."
                  className="w-full px-3 py-2 text-xs border border-line rounded-lg bg-canvas text-ink placeholder-ink-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Description
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide registration number, error details, or question..."
                  className="w-full px-3 py-2 text-xs border border-line rounded-lg bg-canvas text-ink placeholder-ink-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Send size={14} />
                <span>Submit ticket</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
