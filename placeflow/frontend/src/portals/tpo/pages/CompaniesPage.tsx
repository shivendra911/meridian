import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Company } from '../../../types';
import { Building2, PlusCircle, ArrowRight } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { toast } from 'sonner';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';

export const CompaniesPage: React.FC = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('Technology & Software');
  const [location, setLocation] = useState('Bengaluru');
  const [contactEmail, setContactEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchCompanies = () => {
    setLoading(true);
    api.getCompanies()
      .then((res) => {
        setCompanies(res.companies || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleRegisterCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setIsSaving(true);
    try {
      await api.addCompany({
        name,
        industry,
        location,
        contact_email: contactEmail,
      });
      setIsRegisterOpen(false);
      setName('');
      setContactEmail('');
      toast.success(`Registered corporate partner: ${name}`);
      fetchCompanies();
    } catch (err: any) {
      toast.error(`Failed to register corporate partner: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const industriesCount = new Set(companies.map((c) => c.industry)).size;

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Corporate Partners"
        description="Master registry of verified corporate recruiters and enterprise partners."
        badge={<Badge variant="institutional" size="xs">Authoritative Directory</Badge>}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsRegisterOpen(true)}
            leftIcon={<PlusCircle size={14} />}
          >
            Register Corporate Partner
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Corporate Partners"
          value={loading ? '—' : companies.length}
          hint="Registered Organizations"
          icon={Building2}
        />
        <StatCard
          label="Industry Domains"
          value={loading ? '—' : industriesCount}
          hint="Diverse Hiring Sectors"
          icon={Building2}
        />
        <StatCard
          label="Active Recruiters"
          value={loading ? '—' : companies.length}
          hint="Eligible to Post JNFs"
          icon={Building2}
        />
        <StatCard
          label="Placement Charter"
          value="v3 Approved"
          hint="Standard MoU Enforced"
          icon={Building2}
        />
      </div>

      {loading ? (
        <div className="rounded-lg border border-line bg-surface p-6 space-y-3">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No corporate partners registered"
          description="Register participating companies to begin scheduling campus recruitment drives."
          actionLabel="Register Partner"
          onAction={() => setIsRegisterOpen(true)}
        />
      ) : (
        <div className="rounded-lg border border-line bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-canvas/60 text-ink-muted uppercase tracking-wider text-[11px] h-10 sticky top-0">
                  <th className="py-2 px-4 font-medium">Company ID</th>
                  <th className="py-2 px-4 font-medium">Organization Name</th>
                  <th className="py-2 px-4 font-medium">Sector</th>
                  <th className="py-2 px-4 font-medium">Headquarters / Location</th>
                  <th className="py-2 px-4 font-medium">Contact Email</th>
                  <th className="py-2 px-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {companies.map((c) => (
                  <tr
                    key={c.company_id}
                    onClick={() => navigate(`/tpo/tpo/companies/${c.company_id}`)}
                    className="h-11 hover:bg-canvas/50 transition-colors cursor-pointer"
                  >
                    <td className="py-2 px-4 font-mono font-medium text-brand">{c.company_id}</td>
                    <td className="py-2 px-4 font-medium text-ink">{c.name}</td>
                    <td className="py-2 px-4 text-ink-muted">{c.industry}</td>
                    <td className="py-2 px-4 text-ink-muted">{c.location}</td>
                    <td className="py-2 px-4 font-mono text-ink-muted">{c.contact_email || '—'}</td>
                    <td className="py-2 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/tpo/tpo/companies/${c.company_id}`);
                        }}
                        className="text-brand hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <span>Details</span>
                        <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register Partner Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register Corporate Partner"
        subtitle="Add a new participating recruitment employer to the institution directory"
        size="md"
      >
        <form onSubmit={handleRegisterCompany} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block font-medium text-ink mb-1">Company / Organization Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Goldman Sachs"
              className="w-full text-xs border border-line rounded-lg p-2.5 bg-surface text-ink focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block font-medium text-ink mb-1">Industry Sector</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Financial Technology & Investment Banking"
              className="w-full text-xs border border-line rounded-lg p-2.5 bg-surface text-ink focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block font-medium text-ink mb-1">Primary Location / Office</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bengaluru / Hyderabad"
              className="w-full text-xs border border-line rounded-lg p-2.5 bg-surface text-ink focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block font-medium text-ink mb-1">Campus Recruitment Contact Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="e.g. university-recruiting@partner.com"
              className="w-full text-xs border border-line rounded-lg p-2.5 bg-surface text-ink focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsRegisterOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSaving}>
              {isSaving ? 'Registering...' : 'Register Partner'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

