import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Company } from '../../../types';
import { Building2, PlusCircle, ArrowRight, LayoutGrid, List } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { toast } from 'sonner';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { CompanyCard, useDocumentTitle } from '../../../ui';

export const CompaniesPage: React.FC = () => {
  useDocumentTitle('Corporate Partners');
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

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
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-canvas p-1 rounded-lg border border-line">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'cards' ? 'bg-surface text-brand shadow-xs' : 'text-ink-muted hover:text-ink'
                }`}
                title="Cards view"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'table' ? 'bg-surface text-brand shadow-xs' : 'text-ink-muted hover:text-ink'
                }`}
                title="Table view"
              >
                <List size={14} />
              </button>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsRegisterOpen(true)}
              leftIcon={<PlusCircle size={14} />}
            >
              Register Partner
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Corporate Partners"
          value={companies.length}
          hint="Active recruiting accounts"
          icon={Building2}
        />
        <StatCard
          label="Industry Sectors"
          value={industriesCount}
          hint="Domains represented"
          icon={Building2}
        />
        <StatCard
          label="Super Dream Recruiters"
          value={companies.filter((c) => c.tier === 'Super Dream').length}
          hint=">10 LPA packages"
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
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((c) => (
            <CompanyCard
              key={c.company_id}
              data={{
                company_id: c.company_id,
                name: c.name,
                industry: c.industry,
                location: c.location,
                tier: c.tier || 'Enterprise Partner',
              }}
              onClick={() => navigate(`/tpo/companies/${c.company_id}`)}
            />
          ))}
        </div>
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
                    onClick={() => navigate(`/tpo/companies/${c.company_id}`)}
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
                          navigate(`/tpo/companies/${c.company_id}`);
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
      >
        <form onSubmit={handleRegisterCompany} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink mb-1">Company Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Corp Technologies"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-canvas border border-line rounded focus:bg-surface focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Industry Sector</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-canvas border border-line rounded focus:bg-surface focus:outline-hidden cursor-pointer"
              >
                <option value="Technology & Software">Technology & Software</option>
                <option value="Financial Services & Fintech">Financial Services & Fintech</option>
                <option value="Management Consulting">Management Consulting</option>
                <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                <option value="Manufacturing & Core Engineering">Manufacturing & Core Engineering</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">Location / HQ</label>
              <input
                type="text"
                placeholder="e.g. Bengaluru, IN"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-canvas border border-line rounded focus:bg-surface focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1">Primary Recruiter Contact Email</label>
            <input
              type="email"
              placeholder="campus-recruitment@company.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-canvas border border-line rounded focus:bg-surface focus:outline-hidden font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
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
