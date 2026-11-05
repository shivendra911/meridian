import React, { useEffect, useState } from 'react';
import { api } from '../api';
import {
  PlatformTenant,
  PlatformInstitution,
  Campus,
  OrganizationalTreeNode,
  ReadinessReport,
} from '../types';
import {
  Building,
  GitFork,
  MapPin,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Search,
  Sliders,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { InstitutionalOnboardingBuilder } from '../components/institutional/InstitutionalOnboardingBuilder';

interface DirectoryResult {
  directory_id: string;
  aishe_code: string;
  legal_name: string;
  display_name: string;
  institution_type: string;
  state: string;
  district: string;
  is_verified: boolean;
  website_url?: string;
}

export const InstitutionalArchitecturePage: React.FC = () => {
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [institutions, setInstitutions] = useState<PlatformInstitution[]>([]);
  const [selectedInstId, setSelectedInstId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Active Tab: 6 comprehensive tabs covering all CAMP-01 modules
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'campuses' | 'readiness' | 'directory' | 'config' | 'onboarding'>('hierarchy');

  // Tab Data
  const [tree, setTree] = useState<OrganizationalTreeNode[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [readiness, setReadiness] = useState<ReadinessReport | null>(null);

  // Directory Search State
  const [dirQuery, setDirQuery] = useState('');
  const [dirState, setDirState] = useState('');
  const [directoryResults, setDirectoryResults] = useState<DirectoryResult[]>([]);
  const [dirLoading, setDirLoading] = useState(false);

  // Config Resolution State
  const [resolvedConfig, setResolvedConfig] = useState<Record<string, unknown> | null>(null);
  const [configLoading, setConfigLoading] = useState(false);

  // Onboarding Demo Form State
  const [showOnboardingBuilder, setShowOnboardingBuilder] = useState(false);
  const [onboardLoading, setOnboardLoading] = useState(false);
  const [onboardResult, setOnboardResult] = useState<{ is_successful: boolean; pipeline_log: Array<{ step: number; title: string; status: string }> } | null>(null);

  // Initial Load: Fetch Tenants
  useEffect(() => {
    setLoading(true);
    api.getTenants().then((res) => {
      setTenants(res.tenants);
      if (res.tenants.length > 0) {
        setSelectedTenantId(res.tenants[0].id);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Fetch Institutions when Tenant changes
  useEffect(() => {
    if (!selectedTenantId) return;
    api.getInstitutions(selectedTenantId).then((res) => {
      setInstitutions(res.institutions);
      if (res.institutions.length > 0) {
        setSelectedInstId(res.institutions[0].institution_id);
      } else {
        setSelectedInstId('');
      }
    });
  }, [selectedTenantId]);

  // Fetch Tab details when Institution changes
  useEffect(() => {
    if (!selectedTenantId || !selectedInstId) return;
    // 1. Hierarchy Tree
    api.getHierarchyTree(selectedTenantId, selectedInstId).then((res) => {
      setTree(res.hierarchy_tree);
    });
    // 2. Campuses
    api.getCampuses(selectedTenantId).then((res) => {
      setCampuses(res.campuses);
    });
    // 3. Readiness Checklist
    api.getInstitutionReadiness(selectedTenantId, selectedInstId).then((res) => {
      setReadiness(res);
    });
  }, [selectedTenantId, selectedInstId]);

  // Initial directory search
  useEffect(() => {
    if (activeTab === 'directory' && directoryResults.length === 0) {
      handleSearchDirectory();
    }
    if (activeTab === 'config' && selectedTenantId) {
      handleFetchConfig();
    }
  }, [activeTab, selectedTenantId, selectedInstId]);

  const handleSearchDirectory = (q?: string, s?: string) => {
    setDirLoading(true);
    api.searchDirectory(q !== undefined ? q : dirQuery, s !== undefined ? s : dirState)
      .then((res) => {
        setDirectoryResults(res.directory_results || []);
        setDirLoading(false);
      })
      .catch(() => setDirLoading(false));
  };

  const handleFetchConfig = () => {
    if (!selectedTenantId) return;
    setConfigLoading(true);
    api.resolveConfig(selectedTenantId, selectedInstId || undefined)
      .then((res) => {
        setResolvedConfig(res.resolved_config || {});
        setConfigLoading(false);
      })
      .catch(() => setConfigLoading(false));
  };

  const handleRunOnboardingDemo = () => {
    setOnboardLoading(true);
    setOnboardResult(null);
    const demoSlug = `inst-demo-${Date.now().toString().slice(-4)}`;
    api.executeOnboardingPipeline({
      tenant_name: 'National Technology University System',
      tenant_slug: demoSlug,
      customer_type: 'ENTERPRISE',
      admin_email: 'chancellor@ntu.edu.in',
      institution_code: `NTU_${demoSlug.slice(-3).toUpperCase()}`,
      legal_name: 'National Technology University',
      display_name: 'NTU Central',
      institution_type: 'INSTITUTE',
      classifications: {
        institution_kind: 'INSTITUTE',
        ownership: 'CENTRAL_GOVERNMENT',
        governance: 'PUBLIC',
        recognition_status: 'RECOGNIZED',
        institutional_role: 'DEGREE_AWARDING',
        delivery_model: 'PHYSICAL',
      },
      campus_code: 'CAMPUS_MAIN',
      campus_name: 'Central Technology Park',
      location_data: {
        building_name: 'Administrative Senate',
        city: 'Hyderabad',
        state: 'Telangana',
        postal_code: '500032',
      },
      regulatory_identifiers: [
        { scheme: 'AISHE', value: `U-${demoSlug.slice(-4)}`, issuer: 'Ministry of Education' }
      ],
    }).then((res) => {
      setOnboardResult(res);
      setOnboardLoading(false);
      // Refresh tenants
      api.getTenants().then((tRes) => {
        setTenants(tRes.tenants);
      });
    }).catch(() => setOnboardLoading(false));
  };

  const renderTreeNode = (node: OrganizationalTreeNode, depth: number = 0) => {
    const typeColors: Record<string, string> = {
      EXECUTIVE: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      SCHOOL: 'bg-blue-100 text-blue-800 border-blue-200',
      DEPARTMENT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      PLACEMENT_OFFICE: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
      RESEARCH_CENTRE: 'bg-purple-100 text-purple-800 border-purple-200',
    };

    return (
      <div key={node.unit_id} className="ml-6 border-l-2 border-slate-200 pl-4 py-2 my-1">
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-slate-800 text-xs font-mono">{node.unit_code}</span>
          <span className="text-slate-900 font-medium text-xs">{node.name}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded border ${typeColors[node.unit_type] || 'bg-slate-100 text-slate-700'}`}>
            {node.unit_type}
          </span>
        </div>
        {node.children && node.children.length > 0 && (
          <div className="space-y-1 mt-1">
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId);
  const selectedInst = institutions.find((i) => i.institution_id === selectedInstId);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 text-sm">
        <Activity className="animate-spin mr-2" size={18} />
        Loading CAMP-01 Institutional Architecture...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Directorate Header */}
      <div className="bg-white border-l-4 border-l-navy-900 border border-slate-200 rounded p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">
            CAMP-01 &bull; TENANT &amp; INSTITUTION ARCHITECTURE FOUNDATION
          </div>
          <h1 className="text-xl font-bold font-serif text-slate-900 m-0">
            Institutional Topology &amp; Governance Directorate
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Authoritative multi-tenant boundary, physical &amp; virtual campuses, acyclic organizational trees, 4-tier config inheritance, and 12-point readiness gates.
          </p>
        </div>

        {/* Workspace Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="bg-slate-50 border border-slate-300 rounded p-2 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Active Tenant Boundary</span>
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-medium text-slate-800"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.slug})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-50 border border-slate-300 rounded p-2 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Active Institution</span>
            <select
              value={selectedInstId}
              onChange={(e) => setSelectedInstId(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-medium text-slate-800"
            >
              {institutions.map((i) => (
                <option key={i.institution_id} value={i.institution_id}>
                  {i.display_name} [{i.institution_code}]
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Selected Institution Meta Strip */}
      {selectedInst && (
        <div className="bg-slate-900 text-white rounded p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-cardinal text-white flex items-center justify-center font-serif font-bold text-lg border border-red-700">
              {selectedInst.institution_code.slice(0, 2)}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100">{selectedInst.legal_name}</div>
              <div className="text-xs text-slate-400 font-mono">
                {selectedInst.institution_code} &bull; {selectedInst.classifications?.institution_kind} &bull; {selectedInst.classifications?.ownership}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded font-semibold border ${
              selectedInst.status === 'ACTIVE'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                : 'bg-amber-950 text-amber-300 border-amber-700'
            }`}>
              {selectedInst.status}
            </span>
            <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {selectedInst.timezone}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Tabs (6 Comprehensive CAMP-01 Sections) */}
      <div className="border-b border-slate-200 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'hierarchy'
              ? 'border-cardinal text-cardinal'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GitFork size={14} />
          <span>Acyclic Hierarchy Tree</span>
        </button>

        <button
          onClick={() => setActiveTab('campuses')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'campuses'
              ? 'border-cardinal text-cardinal'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin size={14} />
          <span>Campuses &amp; Locations</span>
        </button>

        <button
          onClick={() => setActiveTab('readiness')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'readiness'
              ? 'border-cardinal text-cardinal'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck size={14} />
          <span>12-Point Readiness Gate</span>
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'directory'
              ? 'border-cardinal text-cardinal'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Globe size={14} />
          <span>AISHE National Registry</span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'config'
              ? 'border-cardinal text-cardinal'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders size={14} />
          <span>4-Tier Config Resolver</span>
        </button>

        <button
          onClick={() => setActiveTab('onboarding')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'onboarding'
              ? 'border-cardinal text-cardinal'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap size={14} />
          <span>10-Step Onboarding Pipeline</span>
        </button>
      </div>

      {/* Tab 1: Hierarchy Tree */}
      {activeTab === 'hierarchy' && (
        <div className="bg-white border border-slate-200 rounded p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif m-0">
                Institutional Containment Tree (Acyclic Graph)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Structural containment relationships resolved via MongoDB $graphLookup with runtime cycle detection.
              </p>
            </div>
            <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              ADR-C01-012 Acyclic Invariant Guaranteed
            </span>
          </div>

          {tree.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No organizational hierarchy units defined for this institution yet.
            </div>
          ) : (
            <div className="space-y-1">
              {tree.map((rootNode) => renderTreeNode(rootNode))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Campuses */}
      {activeTab === 'campuses' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campuses.map((c) => (
              <div key={c.campus_id} className="bg-white border border-slate-200 rounded p-5 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      {c.campus_code}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 m-0">{c.campus_name}</h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                    {c.campus_kind}
                  </span>
                </div>
                <div className="mt-3 text-xs text-slate-600 space-y-1">
                  <div><span className="font-medium text-slate-800">Status:</span> {c.status}</div>
                  <div><span className="font-medium text-slate-800">Timezone:</span> {c.timezone}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Readiness Checklist */}
      {activeTab === 'readiness' && readiness && (
        <div className="bg-white border border-slate-200 rounded p-6 shadow-subtle space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif m-0">
                12-Point Institutional Readiness Evaluation Gate
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Section 12.3: Unverified or structurally incomplete institutions cannot be activated.
              </p>
            </div>
            <div className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 ${
              readiness.is_ready_for_activation
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}>
              {readiness.is_ready_for_activation ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              <span>{readiness.is_ready_for_activation ? 'READINESS GATE PASSED' : 'READINESS GATE BLOCKED'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {readiness.checklist.map((item, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded border text-xs flex items-center justify-between ${
                  item.passed
                    ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                    : 'bg-red-50/50 border-red-200 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.passed ? (
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle size={16} className="text-red-500 shrink-0" />
                  )}
                  <span className="font-medium">{item.criterion}</span>
                </div>
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                  item.passed ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'
                }`}>
                  {item.passed ? 'PASS' : 'REQUIRED'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: AISHE National Directory Search (Section 3 & ADR-C01-003) */}
      {activeTab === 'directory' && (
        <div className="bg-white border border-slate-200 rounded p-6 shadow-subtle space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif m-0">
                Verified Public Institutional Directory (AISHE Registry)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Section 3 &amp; ADR-C01-003: Public directory identities maintained separately from customer tenant workspaces.
              </p>
            </div>
            <span className="text-[11px] font-mono text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              Ministry of Education Verified
            </span>
          </div>

          {/* Search Inputs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                value={dirQuery}
                onChange={(e) => setDirQuery(e.target.value)}
                placeholder="Search university name, AISHE code (e.g. U-0053)..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-cardinal focus:outline-hidden"
              />
            </div>
            <input
              type="text"
              value={dirState}
              onChange={(e) => setDirState(e.target.value)}
              placeholder="Filter state (e.g. Maharashtra, Delhi)..."
              className="w-48 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-cardinal focus:outline-hidden"
            />
            <button
              onClick={() => handleSearchDirectory()}
              className="px-4 py-2 bg-cardinal text-white text-xs font-semibold rounded hover:bg-cardinal-dark transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {dirLoading ? <Activity className="animate-spin" size={14} /> : <Search size={14} />}
              <span>Search Registry</span>
            </button>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {directoryResults.map((entry) => (
              <div key={entry.directory_id} className="p-4 rounded border border-slate-200 hover:border-slate-400 transition-colors bg-slate-50/50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cardinal">{entry.aishe_code}</span>
                      {entry.is_verified && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded border border-emerald-300">
                          VERIFIED
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-slate-900 text-sm mt-1">{entry.legal_name}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{entry.display_name} • {entry.institution_type}</div>
                  </div>
                  {entry.website_url && (
                    <a
                      href={entry.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
                <div className="mt-3 text-xs text-slate-500 flex items-center gap-3">
                  <span>District: <strong className="text-slate-700">{entry.district}</strong></span>
                  <span>•</span>
                  <span>State: <strong className="text-slate-700">{entry.state}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: 4-Tier Configuration Resolver (Section 7) */}
      {activeTab === 'config' && (
        <div className="bg-white border border-slate-200 rounded p-6 shadow-subtle space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif m-0">
                4-Tier Hierarchical Configuration Resolution
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Section 7: Resolution precedence (Platform Default &rarr; Tenant Workspace &rarr; Institution Entity &rarr; Physical Campus) with freeze locks.
              </p>
            </div>
            <button
              onClick={handleFetchConfig}
              className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              {configLoading ? <Activity className="animate-spin" size={13} /> : <Sliders size={13} />}
              <span>Resolve Config Hierarchy</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-400">Level 1</div>
              <div className="font-semibold text-slate-900 mt-0.5">Platform Defaults</div>
              <div className="text-[11px] text-slate-500 mt-1">Global statutory baselines &amp; system constraints</div>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-400">Level 2</div>
              <div className="font-semibold text-slate-900 mt-0.5">Tenant Overrides</div>
              <div className="text-[11px] text-slate-500 mt-1">Customer-level governance &amp; billing rules</div>
            </div>
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <div className="text-[10px] uppercase font-bold text-blue-600">Level 3</div>
              <div className="font-semibold text-blue-900 mt-0.5">Institution Profile</div>
              <div className="text-[11px] text-blue-700 mt-1">Academic calendar, time zones &amp; branding</div>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-400">Level 4</div>
              <div className="font-semibold text-slate-900 mt-0.5">Campus Specifics</div>
              <div className="text-[11px] text-slate-500 mt-1">Physical site operating hours &amp; geo-fencing</div>
            </div>
          </div>

          {resolvedConfig && (
            <div className="bg-slate-950 text-slate-200 p-4 rounded font-mono text-xs overflow-x-auto">
              <div className="text-slate-400 mb-2">// Resolved Effective Configuration Document</div>
              <pre>{JSON.stringify(resolvedConfig, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* Tab 6: 10-Step Onboarding Wizard */}
      {activeTab === 'onboarding' && (
        <div className="bg-white border border-slate-200 rounded p-6 shadow-subtle space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif m-0">
                10-Step Institutional Onboarding Pipeline
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Section 12: Automated customer onboarding, identity verification, campus association, and readiness activation.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowOnboardingBuilder(true)}
                className="px-4 py-2 bg-cardinal text-white text-xs font-semibold rounded hover:bg-cardinal-dark transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Layers size={14} />
                <span>Launch Visual Hierarchy Wizard</span>
              </button>
              <button
                onClick={handleRunOnboardingDemo}
                disabled={onboardLoading}
                className="px-4 py-2 bg-navy-900 text-white text-xs font-semibold rounded hover:bg-navy-950 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {onboardLoading ? <Activity className="animate-spin" size={14} /> : <Zap size={14} />}
                <span>Execute 10-Step Pipeline Demo</span>
              </button>
            </div>
          </div>

          {onboardResult && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-xs font-semibold">
                ✓ Full 10-Step Onboarding Pipeline executed with 100% success!
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {onboardResult.pipeline_log.map((step) => (
                  <div key={step.step} className="p-3 rounded bg-slate-50 border border-slate-200 text-xs">
                    <div className="text-[10px] font-bold text-slate-400">STEP {step.step}</div>
                    <div className="font-semibold text-slate-800 mt-0.5">{step.title}</div>
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                      <CheckCircle2 size={12} />
                      <span>{step.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Guided 7-Step Institutional Onboarding & Topology Builder (Section 6.1) */}
      <InstitutionalOnboardingBuilder
        isOpen={showOnboardingBuilder}
        onClose={() => setShowOnboardingBuilder(false)}
      />
    </div>
  );
};

export default InstitutionalArchitecturePage;
