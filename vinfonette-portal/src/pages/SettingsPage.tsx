import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { api } from '../lib/api';
import {
  Database,
  ShieldAlert,
  HardDrive,
  Download,
  RotateCcw,
  Sparkles,
  Lock,
  Folder,
  FileText,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export const SettingsPage: React.FC = () => {
  const { isAdmin, role } = useAuth();
  const { resetToDemoData, refreshData } = useData();
  const { success, error, warning } = useToast();

  const [backupInfo, setBackupInfo] = useState<{
    dataDir: string;
    dbPath: string;
    dbSizeBytes: number;
    resumesDir: string;
    resumesCount: number;
    resumesSizeBytes: number;
    backupsDir: string;
    backups: any[];
    privacyNotice: string;
  } | null>(null);

  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const loadBackupDiagnostics = async () => {
    try {
      const info = await api.getBackupInfo();
      setBackupInfo(info);
    } catch (err: any) {
      console.warn('Could not fetch backup diagnostics:', err);
    }
  };

  useEffect(() => {
    loadBackupDiagnostics();
  }, []);

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const res = await api.createBackup();
      success('Backup Created', `Snapshot saved to ${res.destination}`);
      await loadBackupDiagnostics();
    } catch (err: any) {
      error('Backup Failed', err.message);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    const confirmed = window.confirm(
      `WARNING: Restoring backup "${backupId}" will overwrite your current local database with the snapshot data. Are you sure you wish to proceed?`
    );
    if (!confirmed) return;

    setIsRestoring(backupId);
    try {
      await api.restoreBackup(backupId);
      success('Backup Restored', 'Local database restored from snapshot.');
      await refreshData();
      await loadBackupDiagnostics();
    } catch (err: any) {
      error('Restore Failed', err.message);
    } finally {
      setIsRestoring(null);
    }
  };

  const handleLoadDemo = async () => {
    setIsSeeding(true);
    try {
      await resetToDemoData();
      await loadBackupDiagnostics();
    } finally {
      setIsSeeding(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="py-12 text-center bg-white rounded-2xl border border-charcoal-200 p-8 max-w-lg mx-auto mt-8">
        <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-charcoal-900">Administrator Privileges Required</h2>
        <p className="text-xs text-charcoal-500 mt-1">
          Local database configuration, backup snapshots, and privacy controls are restricted to the <strong>ADMIN</strong> role. Your active role is <strong>{role}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Local-First Storage & Data Privacy"
        subtitle="Manage private SQLite storage, manual backups, resume directories, and local workstation isolation."
      />

      {/* Local Architecture & Diagnostics Card */}
      <Card className="p-6 border border-charcoal-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-brand-50 text-brand-600">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">
                Private Local-First SQLite Database Engine
              </h3>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Operating strictly on private loopback <code>127.0.0.1:4000</code>. No cloud databases or external servers are involved.
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            Local Loopback Online
          </span>
        </div>

        <div className="mt-4 pt-4 border-t border-charcoal-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-surface-50 rounded-xl border border-charcoal-200">
            <span className="text-charcoal-500 block text-[10px] uppercase font-bold flex items-center gap-1.5 mb-1">
              <HardDrive className="w-3.5 h-3.5 text-brand-600" />
              SQLite Database Path
            </span>
            <code className="text-[11px] font-mono text-charcoal-800 break-all select-all block bg-white p-1.5 rounded border border-charcoal-200">
              {backupInfo?.dbPath || 'Loading...'}
            </code>
            <span className="text-[10px] text-charcoal-400 mt-1 block">
              File Size: {backupInfo ? `${(backupInfo.dbSizeBytes / 1024).toFixed(1)} KB` : '—'}
            </span>
          </div>

          <div className="p-3 bg-surface-50 rounded-xl border border-charcoal-200">
            <span className="text-charcoal-500 block text-[10px] uppercase font-bold flex items-center gap-1.5 mb-1">
              <Folder className="w-3.5 h-3.5 text-brand-600" />
              Private Resumes Storage
            </span>
            <code className="text-[11px] font-mono text-charcoal-800 break-all select-all block bg-white p-1.5 rounded border border-charcoal-200">
              {backupInfo?.resumesDir || 'Loading...'}
            </code>
            <span className="text-[10px] text-charcoal-400 mt-1 block">
              Files: {backupInfo?.resumesCount ?? 0} ({backupInfo ? `${(backupInfo.resumesSizeBytes / 1024).toFixed(1)} KB` : '—'})
            </span>
          </div>
        </div>
      </Card>

      {/* Manual Local Backup & Restore (Section 6) */}
      <Card className="p-6 border border-charcoal-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-charcoal-900">Manual Local Backup & Restore</h3>
            </div>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Create offline snapshots of your SQLite database and candidate resumes.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateBackup}
            isLoading={isCreatingBackup}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Create Backup Snapshot
          </Button>
        </div>

        {/* Warning Alert Banner */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1 mb-4">
          <div className="flex items-center gap-1.5 font-bold text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Sensitive Personal Information Warning</span>
          </div>
          <p className="leading-relaxed">
            Local backups contain confidential candidate personal information, contact records, and uploaded resume documents. Backups are stored unencrypted on disk. Never email, synchronize, or upload backup folders to unencrypted cloud drives.
          </p>
        </div>

        {/* Existing Local Backups List */}
        <div>
          <h4 className="text-xs font-bold text-charcoal-700 uppercase mb-2">Available Local Backup Snapshots:</h4>
          {!backupInfo?.backups || backupInfo.backups.length === 0 ? (
            <div className="p-4 text-center border border-dashed border-charcoal-200 rounded-xl text-xs text-charcoal-400">
              No manual backups created yet. Click "Create Backup Snapshot" above to generate your first offline archive.
            </div>
          ) : (
            <div className="space-y-2">
              {backupInfo.backups.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-charcoal-200 bg-surface-50 gap-2 text-xs"
                >
                  <div>
                    <span className="font-bold text-charcoal-900 block font-mono text-[11px]">{b.id}</span>
                    <span className="text-[11px] text-charcoal-500">
                      Created: {new Date(b.createdAt).toLocaleString()} · Candidates: {b.manifest?.candidateCount ?? '—'} · Placements: {b.manifest?.placementCount ?? '—'}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestoreBackup(b.id)}
                    isLoading={isRestoring === b.id}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5 text-brand-600" />}
                    className="text-xs"
                  >
                    Restore This Snapshot
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Workstation Security & BitLocker Guidance (Section 6) */}
      <Card className="p-6 border border-charcoal-200 bg-white">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-bold text-charcoal-900">Workstation Privacy & Encryption Guidance</h3>
        </div>
        <div className="text-xs text-charcoal-600 space-y-2 leading-relaxed">
          <p>
            Local database files (<code>vinfonette.db</code>) and resume documents are stored in plaintext by SQLite on the Windows filesystem. They are <strong>not automatically encrypted</strong> simply by virtue of being stored locally.
          </p>
          <div className="p-3 bg-surface-50 border border-charcoal-200 rounded-xl space-y-1.5">
            <span className="font-bold text-charcoal-900 block">Recommended Windows Security Practices:</span>
            <ul className="list-disc list-inside space-y-1 text-charcoal-700">
              <li>
                <strong>Enable BitLocker or Windows Device Encryption:</strong> In Windows Settings &gt; Privacy & Security &gt; Device Encryption, ensure drive encryption is turned <strong>ON</strong>.
              </li>
              <li>
                <strong>Restrict Windows User Accounts:</strong> Ensure each staff coordinator uses their own password-protected Windows login. Other Windows users cannot access your <code>%LOCALAPPDATA%</code> folder without administrative permissions.
              </li>
              <li>
                <strong>Source Code Sharing Safety:</strong> The source-code folder does not contain any database or resumes. You can safely share or export the git project folder without exposing your local candidate data.
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Synthetic Demo Seeding */}
      <Card className="p-6 border border-charcoal-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-charcoal-900">Demonstration Sample Data</h3>
            </div>
            <p className="text-xs text-charcoal-500 mt-1">
              Load 20 synthetic candidates, 5 companies, 8 jobs, 10 interviews, and verified placements into your local SQLite database for training or evaluation.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadDemo}
            isLoading={isSeeding}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
          >
            Load Sample Records
          </Button>
        </div>
      </Card>
    </div>
  );
};
