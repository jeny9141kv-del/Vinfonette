import React from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ShieldAlert, ArrowLeft, Terminal, KeyRound, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ForgotPasswordPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <Link to="/login" className="inline-block">
          <img
            src="/vinfonette-logo.png"
            alt="VinfoNette"
            className="h-12 w-auto mx-auto object-contain bg-white p-2 rounded-xl border border-charcoal-200"
          />
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-charcoal-900">
          Password Recovery & Admin Reset
        </h2>
        <p className="mt-1 text-xs text-charcoal-500">
          Private Local-First Credential Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-enterprise rounded-2xl border border-charcoal-200 sm:px-8 space-y-6">
          <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-xs text-brand-900 flex items-start gap-2.5">
            <Database className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              This installation operates in <strong>Private Local-First Mode</strong>. Credentials and candidate records reside offline on this machine; no external cloud mail relay is configured.
            </p>
          </div>

          {/* Recovery Method 1: Administrator Terminal Reset */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-charcoal-900">
              <KeyRound className="w-4 h-4 text-brand-600" />
              <span>Administrator Password Reset (Local CLI)</span>
            </div>
            <p className="text-xs text-charcoal-600">
              To update your local administrator password without deleting any candidate records, open PowerShell in your project folder and run:
            </p>
            <div className="p-3 rounded-xl bg-charcoal-900 text-charcoal-100 font-mono text-[11px] overflow-x-auto select-all">
              npm run admin:set -- --email admin@vinfonette.local --password YourNewPassword123!
            </div>
          </div>

          {/* Recovery Method 2: Browser Setup Mode */}
          <div className="space-y-2 pt-4 border-t border-charcoal-100">
            <div className="flex items-center gap-2 text-xs font-bold text-charcoal-900">
              <Terminal className="w-4 h-4 text-brand-600" />
              <span>Re-trigger Browser First-Time Setup Wizard</span>
            </div>
            <p className="text-xs text-charcoal-600">
              If you want the web browser to display the initial Administrator Setup Wizard on <code>/login</code> (while keeping 100% of candidate data intact):
            </p>
            <div className="p-3 rounded-xl bg-charcoal-900 text-charcoal-100 font-mono text-[11px] overflow-x-auto select-all">
              npm run admin:clear
            </div>
            <p className="text-[11px] text-charcoal-400">
              After running this command, refresh <code>http://127.0.0.1:3000/login</code> (or 3001) to create your administrator account in the browser.
            </p>
          </div>

          <div className="pt-2 text-center">
            <Link to="/login">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
