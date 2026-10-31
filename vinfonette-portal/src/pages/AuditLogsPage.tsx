import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ShieldCheck, Search, Download, Lock } from 'lucide-react';
import { formatDateTime, exportToCSV } from '../lib/utils';
import { Navigate } from 'react-router-dom';

export const AuditLogsPage: React.FC = () => {
  const { auditLogs } = useData();
  const { canAccessAuditLogs, role } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');

  // Enforce server-style permission check
  if (!canAccessAuditLogs) {
    return (
      <div className="py-12 text-center bg-white rounded-2xl border border-charcoal-200 p-8 max-w-lg mx-auto mt-8">
        <Lock className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-charcoal-900">Access Restricted</h2>
        <p className="text-xs text-charcoal-500 mt-1">
          Under VinfoNette security compliance policies, system audit logs are restricted exclusively to Administrator and Executive Management personas. Your current role is <strong>{role}</strong>.
        </p>
      </div>
    );
  }

  const filteredLogs = auditLogs.filter((log) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.actor_email.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.entity_type.toLowerCase().includes(q) ||
        log.entity_id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExport = () => {
    const rows = filteredLogs.map((l) => ({
      ID: l.id,
      Actor: l.actor_email,
      Action: l.action,
      'Entity Type': l.entity_type,
      'Entity ID': l.entity_id,
      Details: JSON.stringify(l.details),
      Timestamp: l.created_at,
    }));
    exportToCSV('vinfonette-audit-logs', rows);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tamper-Evident System Audit Trail"
        subtitle={`Immutable log trace recording ${auditLogs.length} state transitions, user access, and pipeline stage modifications.`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Audit Trail (CSV)
          </Button>
        }
      />

      {/* Security Context Banner */}
      <div className="p-4 rounded-xl bg-surface-50 border border-charcoal-200 flex items-start gap-3 text-xs text-charcoal-600">
        <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-charcoal-900 block mb-0.5">Database-Enforced Integrity</span>
          Audit logs are triggered via server-side procedures and database Row Level Security policies. Non-administrator users cannot alter or bypass audit event recording.
        </div>
      </div>

      {/* Search Input */}
      <Card className="p-3.5 border border-charcoal-200">
        <div className="relative">
          <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by actor email, action type, or entity ID..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-charcoal-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card className="overflow-hidden border border-charcoal-200 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-charcoal-700">
            <thead className="bg-surface-50 border-b border-charcoal-200 text-charcoal-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Payload Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-100 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-charcoal-400 font-sans text-xs">
                    No audit records matched your filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-charcoal-500 whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-charcoal-900">
                      {log.actor_email}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-bold border border-brand-200 text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-charcoal-600">
                      {log.entity_type} <span className="text-charcoal-400">({log.entity_id.slice(0, 8)}...)</span>
                    </td>
                    <td className="py-3 px-4 text-charcoal-500 font-sans text-xs max-w-md truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
