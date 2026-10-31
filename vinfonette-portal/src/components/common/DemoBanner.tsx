import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Database, RefreshCw, ShieldCheck } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const { user, role } = useAuth();
  const { resetToDemoData } = useData();

  return (
    <div className="bg-charcoal-900 text-white px-4 py-2 border-b border-charcoal-800 text-xs flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
          <Database className="w-3 h-3 text-emerald-400" />
          Private Local-First Mode
        </span>
        <span className="text-charcoal-300 hidden md:inline text-[11px]">
          Operational data isolated in your local application directory (%LOCALAPPDATA%\VinfoNette\data\).
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-charcoal-800 border border-charcoal-700 text-charcoal-200">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
          <span>Active Role: <strong className="text-white">{role}</strong> ({user?.full_name || 'Staff'})</span>
        </div>

        <button
          onClick={resetToDemoData}
          title="Reload sample candidates, companies, and jobs into local SQLite"
          className="flex items-center gap-1 px-2 py-1 rounded bg-charcoal-800 text-charcoal-300 hover:text-white hover:bg-charcoal-700 transition-colors border border-charcoal-700 text-[11px]"
        >
          <RefreshCw className="w-3 h-3" />
          <span className="hidden sm:inline">Load Sample Data</span>
        </button>
      </div>
    </div>
  );
};
