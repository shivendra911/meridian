import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Key,
  ShieldCheck,
  UserCheck,
  Lock,
  Unlock,
  AlertTriangle,
  Clock,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import { api } from '../api';
import { useTenant } from '../context/TenantContext';
import { RoleAssignmentWizard } from '../components/iam/RoleAssignmentWizard';

export const IdentityAccessPage: React.FC = () => {
  const { activeTenant, activeInstitution } = useTenant();

  const [activeTab, setActiveTab] = useState<'identities' | 'roles' | 'assignments' | 'delegations' | 'simulator'>('identities');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [identities, setIdentities] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [delegations, setDelegations] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Simulator state
  const [simMembershipId, setSimMembershipId] = useState('');
  const [simAction, setSimAction] = useState('student.profile.read');
  const [simScopeType, setSimScopeType] = useState('ORGANIZATIONAL_UNIT');
  const [simResult, setSimResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

  // New Identity Modal
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [showRoleWizard, setShowRoleWizard] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newApaar, setNewApaar] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [idRes, rolesRes, assignRes, delRes, permRes] = await Promise.all([
        api.getIamIdentities(searchQuery),
        api.getIamRoles(),
        api.getIamAssignments(),
        api.getIamDelegations(),
        api.getIamPermissions(),
      ]);

      setIdentities(idRes.identities || []);
      setRoles(rolesRes.roles || []);
      setAssignments(assignRes.assignments || []);
      setDelegations(delRes.delegations || []);
      setPermissions(permRes.permissions || []);
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to load IAM data:', err);
      setError(err.message || 'Failed to communicate with IAM services.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenant?.id]);

  const handleCreateIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const nationalIds = newApaar ? [{ scheme: 'APAAR', identifier_value: newApaar }] : [];
      await api.createIamIdentity({
        primary_email: newEmail,
        first_name: newFirstName,
        last_name: newLastName,
        national_identifiers: nationalIds,
      });
      setShowIdentityModal(false);
      setNewFirstName('');
      setNewLastName('');
      setNewEmail('');
      setNewApaar('');
      loadData();
    } catch (err: any) {
      alert(`Error creating identity: ${err.message}`);
    }
  };

  const handleSimulateAuth = async () => {
    if (!simMembershipId) {
      alert('Please enter or select a membership ID to test authorization.');
      return;
    }
    setSimLoading(true);
    try {
      const res = await api.checkAuthorization(simMembershipId, simAction, {
        scope_type: simScopeType,
        scope_id: activeInstitution?.institution_id || '',
      });
      setSimResult(res);
    } catch (err: any) {
      setSimResult({
        allowed: false,
        reason_code: 'API_ERROR',
        message: err.message,
      });
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Institutional Top Bar */}
      <div className="bg-white border-l-4 border-l-[#8C1515] border border-slate-200 rounded p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8C1515] mb-1">
            <ShieldCheck size={14} />
            <span>CAMP-02 Institutional Security &amp; Access Governance</span>
          </div>
          <h1 className="text-xl font-bold font-serif text-slate-900 m-0">
            Identity, Membership &amp; Authorization Command Center
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Person identities with APAAR &amp; PAN deduplication, 5-tier downward scope inheritance, and 13-step deterministic authorization pipeline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowRoleWizard(true)}
            className="px-3.5 py-1.5 bg-[#0B1B3D] hover:bg-[#071228] text-white text-xs font-semibold rounded shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Shield size={14} />
            <span>Assign Responsibility (Wizard)</span>
          </button>
          <button
            onClick={loadData}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded border border-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={13} />
            <span>Refresh State</span>
          </button>
          <button
            onClick={() => setShowIdentityModal(true)}
            className="px-3.5 py-1.5 bg-[#8C1515] hover:bg-[#701010] text-white text-xs font-semibold rounded shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} />
            <span>Provision Person</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strips */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 p-3 rounded">
          <div className="text-[10px] font-semibold text-slate-400 uppercase">Person Identities</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{identities.length}</div>
          <div className="text-[10px] text-emerald-600 font-mono mt-1">Deduplicated</div>
        </div>
        <div className="bg-white border border-slate-200 p-3 rounded">
          <div className="text-[10px] font-semibold text-slate-400 uppercase">Catalogued Roles</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{roles.length}</div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">Scope Ceilings Applied</div>
        </div>
        <div className="bg-white border border-slate-200 p-3 rounded">
          <div className="text-[10px] font-semibold text-slate-400 uppercase">Atomic Capabilities</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{permissions.length}</div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">60+ Enterprise Perms</div>
        </div>
        <div className="bg-white border border-slate-200 p-3 rounded">
          <div className="text-[10px] font-semibold text-slate-400 uppercase">Active Delegations</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{delegations.length}</div>
          <div className="text-[10px] text-amber-600 font-mono mt-1">Anti-Cascade (Hop 1)</div>
        </div>
        <div className="bg-white border border-slate-200 p-3 rounded">
          <div className="text-[10px] font-semibold text-slate-400 uppercase">Decision Latency</div>
          <div className="text-xl font-bold text-emerald-600 mt-0.5">&lt; 3.2ms</div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">13-Step Deterministic</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-medium text-slate-600">
        <button
          onClick={() => setActiveTab('identities')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 ${
            activeTab === 'identities'
              ? 'border-[#8C1515] text-[#8C1515] font-semibold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Users size={14} />
          <span>Person Identities &amp; Accounts</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 ${
            activeTab === 'roles'
              ? 'border-[#8C1515] text-[#8C1515] font-semibold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Key size={14} />
          <span>Roles &amp; Capability Catalogue</span>
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 ${
            activeTab === 'assignments'
              ? 'border-[#8C1515] text-[#8C1515] font-semibold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Shield size={14} />
          <span>Scoped Authority Bindings</span>
        </button>

        <button
          onClick={() => setActiveTab('delegations')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 ${
            activeTab === 'delegations'
              ? 'border-[#8C1515] text-[#8C1515] font-semibold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Clock size={14} />
          <span>Delegations &amp; Break-Glass</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 ${
            activeTab === 'simulator'
              ? 'border-[#8C1515] text-[#8C1515] font-semibold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Zap size={14} />
          <span>Live 13-Step Authorization Simulator</span>
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-12 text-slate-500 text-xs gap-2">
          <Activity size={18} className="animate-spin text-[#8C1515]" />
          <span>Querying CAMP-02 Distributed IAM Registry...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800 text-xs flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: IDENTITIES */}
      {!loading && activeTab === 'identities' && (
        <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-xs">
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-700">Durable Human Identities ({identities.length})</div>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                placeholder="Search email, APAAR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData()}
                className="pl-7 pr-3 py-1 bg-white border border-slate-200 rounded text-xs focus:border-[#8C1515]"
              />
            </div>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Name</th>
                <th className="py-2.5 px-4 font-semibold">Primary Email</th>
                <th className="py-2.5 px-4 font-semibold">National Identifiers</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {identities.map((id) => (
                <tr key={id.person_id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 font-medium text-slate-900">{id.display_name}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-700">{id.primary_email}</td>
                  <td className="py-2.5 px-4">
                    {id.national_identifiers && id.national_identifiers.length > 0 ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {id.national_identifiers[0].scheme}: {id.national_identifiers[0].identifier_value}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {id.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                    {new Date(id.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: ROLES */}
      {!loading && activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((r) => (
            <div key={r.role_id} className="bg-white border border-slate-200 rounded p-4 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{r.role_name}</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      v{r.current_version}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">{r.role_code}</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 uppercase tracking-wide">
                  Max Scope: {r.active_version?.max_allowed_scope || 'ORGANIZATIONAL_UNIT'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2">{r.description}</p>

              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Granted Capabilities ({r.active_version?.permissions?.length || 0})
                </div>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {r.active_version?.permissions?.slice(0, 10).map((perm: string) => (
                    <span key={perm} className="text-[10px] font-mono bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                      {perm}
                    </span>
                  ))}
                  {(r.active_version?.permissions?.length || 0) > 10 && (
                    <span className="text-[10px] font-mono text-slate-400 self-center">
                      +{r.active_version.permissions.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: ASSIGNMENTS */}
      {!loading && activeTab === 'assignments' && (
        <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-xs">
          <div className="p-3 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
            Active Role Scopes &amp; Temporal Bindings ({assignments.length})
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Assignment ID</th>
                <th className="py-2.5 px-4 font-semibold">Role</th>
                <th className="py-2.5 px-4 font-semibold">Scope Tier</th>
                <th className="py-2.5 px-4 font-semibold">Target Scope ID</th>
                <th className="py-2.5 px-4 font-semibold">Validity</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignments.map((a) => (
                <tr key={a.assignment_id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">{a.assignment_id.slice(0, 8)}...</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{a.role_code || a.role_id}</td>
                  <td className="py-2.5 px-4">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 uppercase">
                      {a.scope_type}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-700">{a.scope_id}</td>
                  <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                    {a.valid_to ? new Date(a.valid_to).toLocaleDateString() : 'PERMANENT'}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: DELEGATIONS */}
      {!loading && activeTab === 'delegations' && (
        <div className="bg-white border border-slate-200 rounded p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900 m-0 uppercase tracking-wide">
              Active Role Delegations &amp; Emergency Break-Glass Protocols
            </h2>
          </div>
          {delegations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded">
              No active role delegations or elevated break-glass sessions currently recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {delegations.map((d) => (
                <div key={d.delegation_id} className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-900">
                      Delegated Role: {d.role_id} ({d.scope_type})
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Reason: {d.reason} &bull; Valid to: {new Date(d.valid_to).toLocaleString()}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded">
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SIMULATOR */}
      {!loading && activeTab === 'simulator' && (
        <div className="bg-white border border-slate-200 rounded p-6 shadow-xs max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-[#8C1515]" />
            <h2 className="text-sm font-bold text-slate-900 m-0">13-Step Authorization Decision Pipeline Tester</h2>
          </div>
          <p className="text-xs text-slate-600 mb-6">
            Execute real-time evaluation of principal permissions against target resources using the deterministic CAMP-02 engine.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Principal Membership ID</label>
              <input
                type="text"
                placeholder="e.g. paste a membership_id"
                value={simMembershipId}
                onChange={(e) => setSimMembershipId(e.target.value)}
                className="w-full text-xs font-mono p-2 bg-slate-50 border border-slate-200 rounded focus:border-[#8C1515]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Requested Action</label>
                <select
                  value={simAction}
                  onChange={(e) => setSimAction(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded"
                >
                  <option value="student.profile.read">student.profile.read</option>
                  <option value="student.verification.approve">student.verification.approve</option>
                  <option value="placement.offer.approve">placement.offer.approve</option>
                  <option value="placement.offer.record">placement.offer.record</option>
                  <option value="reports.statutory.sign">reports.statutory.sign</option>
                  <option value="iam.role.assign">iam.role.assign</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Resource Scope</label>
                <select
                  value={simScopeType}
                  onChange={(e) => setSimScopeType(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded"
                >
                  <option value="INSTITUTION">INSTITUTION</option>
                  <option value="CAMPUS">CAMPUS</option>
                  <option value="ORGANIZATIONAL_UNIT">ORGANIZATIONAL_UNIT</option>
                  <option value="SELF">SELF</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSimulateAuth}
              disabled={simLoading}
              className="w-full py-2 bg-[#8C1515] hover:bg-[#701010] text-white text-xs font-semibold rounded shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {simLoading ? <Activity size={14} className="animate-spin" /> : <Zap size={14} />}
              <span>Evaluate Authorization Decision</span>
            </button>

            {simResult && (
              <div
                className={`mt-4 p-4 rounded border ${
                  simResult.allowed
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-red-50 border-red-200 text-red-950'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  {simResult.allowed ? (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  ) : (
                    <XCircle size={16} className="text-red-600" />
                  )}
                  <span>
                    DECISION: {simResult.allowed ? 'ALLOWED' : 'DENIED'} ({simResult.reason_code})
                  </span>
                </div>
                <div className="text-xs mt-1.5">{simResult.message}</div>
                {simResult.matched_role_id && (
                  <div className="text-[10px] font-mono text-slate-600 mt-2">
                    Matched Authoritative Role: {simResult.matched_role_id}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Provision Identity Modal */}
      {showIdentityModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">Provision Person Identity</h3>
            <p className="text-xs text-slate-500 mb-4">
              Registers an authoritative human identity into the multi-tenant CAMP-02 registry.
            </p>

            <form onSubmit={handleCreateIdentity} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Primary Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">APAAR Identifier (Optional)</label>
                <input
                  type="text"
                  placeholder="12-digit APAAR"
                  value={newApaar}
                  onChange={(e) => setNewApaar(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowIdentityModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#8C1515] hover:bg-[#701010] text-white text-xs font-semibold rounded"
                >
                  Confirm &amp; Provision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Role and Permission Assignment Wizard (Section 6.3) */}
      <RoleAssignmentWizard
        isOpen={showRoleWizard}
        onClose={() => setShowRoleWizard(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
};

