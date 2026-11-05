import React, { useState } from 'react';
import {
  FileText,
  Clock,
  Layers,
  History,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  User,
  Database,
} from 'lucide-react';
import { Badge, BadgeVariant } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Tabs } from '../ui/Tabs';

export interface ObjectHistoryEntry {
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  details: string;
  status?: 'SUCCESS' | 'WARNING' | 'PENDING';
}

export interface RelatedRecord {
  id: string;
  type: string;
  title: string;
  status: string;
  updatedAt: string;
}

export interface UniversalObjectWorkspaceProps {
  objectType: string;
  objectId: string;
  title: string;
  subtitle: string;
  status: string;
  statusVariant?: BadgeVariant;
  parentBreadcrumb?: string[];
  actionButtons?: React.ReactNode;
  overviewContent: React.ReactNode;
  relatedRecords?: RelatedRecord[];
  historyEntries?: ObjectHistoryEntry[];
  documents?: { name: string; type: string; size: string; date: string }[];
  onNavigateRecord?: (type: string, id: string) => void;
}

export const UniversalObjectWorkspace: React.FC<UniversalObjectWorkspaceProps> = ({
  objectType,
  objectId,
  title,
  subtitle,
  status,
  statusVariant = 'success',
  parentBreadcrumb = ['Campus OS', 'Registries'],
  actionButtons,
  overviewContent,
  relatedRecords = [],
  historyEntries = [],
  documents = [],
  onNavigateRecord,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'related' | 'history' | 'documents'>('overview');

  return (
    <div className="space-y-6">
      {/* 1. Universal Object Masthead Ribbon */}
      <div className="bg-white border-l-4 border-l-cardinal border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1.5 font-medium">
            {parentBreadcrumb.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <span>{crumb}</span>
                {idx < parentBreadcrumb.length - 1 && <ChevronRight size={11} className="text-slate-400" />}
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold font-serif text-slate-900 m-0">{title}</h1>
            <Badge variant={statusVariant} size="sm">
              {status}
            </Badge>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
              {objectId}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">{subtitle}</p>
        </div>

        {/* Action slot */}
        <div className="flex flex-wrap items-center gap-2.5">{actionButtons}</div>
      </div>

      {/* 2. Horizontal Tabbed Navigation */}
      <Tabs
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
        variant="line"
        tabs={[
          { id: 'overview', label: 'Primary Information' },
          { id: 'related', label: 'Related Records & Associations', count: relatedRecords.length },
          { id: 'history', label: 'Audit Trail & Event History', count: historyEntries.length },
          { id: 'documents', label: 'Attested Documents', count: documents.length },
        ]}
      />

      {/* 3. Tab Contents */}
      {activeTab === 'overview' && <div>{overviewContent}</div>}

      {activeTab === 'related' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif">
                Directly Associated Records &amp; Tasks
              </h3>
              <p className="text-xs text-slate-500">
                Connected academic programs, enrollment batches, and workflow queues
              </p>
            </div>
            <Badge variant="subtle">{relatedRecords.length} records</Badge>
          </div>

          {relatedRecords.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No directly linked associations found for this object.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 bg-slate-50">
                    <th className="py-2.5 px-3 font-semibold">Entity ID</th>
                    <th className="py-2.5 px-3 font-semibold">Record Type</th>
                    <th className="py-2.5 px-3 font-semibold">Title / Description</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold">Last Modified</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {relatedRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-cardinal">{rec.id}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-600 font-medium">
                        {rec.type}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-900">{rec.title}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="neutral" size="xs">
                          {rec.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-sans">{rec.updatedAt}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onNavigateRecord?.(rec.type, rec.id)}
                          className="text-[11px] font-semibold text-cardinal hover:underline cursor-pointer"
                        >
                          Inspect &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'history' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif">
                Immutable Governance &amp; Mutation History
              </h3>
              <p className="text-xs text-slate-500">
                Cryptographically tracked lifecycle events across CAMP domains
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <ShieldCheck size={14} /> Audit Trail Verified
            </div>
          </div>

          <div className="space-y-3">
            {historyEntries.map((entry, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-4 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={14} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{entry.action}</span>
                      <span className="text-[11px] text-slate-500">
                        by {entry.actor} ({entry.actorRole})
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">{entry.details}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-400 font-mono block">
                    {entry.timestamp}
                  </span>
                  <Badge variant="neutral" size="xs" className="mt-1">
                    Verified
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'documents' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif">
                Attested Documents &amp; Certificates
              </h3>
              <p className="text-xs text-slate-500">
                DPDP consent certificates, syllabus gazettes, and accreditation packages
              </p>
            </div>
            <Button variant="outline" size="xs">
              + Upload Document
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {documents.map((doc, idx) => (
              <div
                key={idx}
                className="p-3 border border-slate-200 rounded-lg bg-white flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-red-50 text-cardinal flex items-center justify-center shrink-0 font-bold font-mono text-[10px]">
                    PDF
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">{doc.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {doc.size} &bull; Uploaded {doc.date}
                    </span>
                  </div>
                </div>

                <Button variant="ghost" size="xs" leftIcon={<ExternalLink size={12} />}>
                  View
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

