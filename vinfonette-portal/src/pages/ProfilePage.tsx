import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { User, Mail, Phone, ShieldCheck, Key, Lock } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, role } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="My User Account Profile"
        subtitle="Manage personal contact credentials, role authorizations, and authenticated session parameters."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <Card className="p-6 text-center">
          <img
            src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={user?.full_name}
            className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-brand-300 shadow-card mb-3"
          />
          <h3 className="text-base font-bold text-charcoal-900">{user?.full_name}</h3>
          <p className="text-xs text-charcoal-500">{user?.title || 'Placement Staff'}</p>

          <div className="mt-3">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
              Role: {role}
            </span>
          </div>

          <div className="mt-6 pt-4 border-t border-charcoal-100 text-left text-xs text-charcoal-600 space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-charcoal-400" />
              <span>{user?.email}</span>
            </div>
            {user?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-charcoal-400" />
                <span>{user?.phone}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Security & Role Enforcement Details */}
        <Card className="p-6 md:col-span-2 space-y-4">
          <div className="flex items-center gap-2 border-b border-charcoal-100 pb-3">
            <ShieldCheck className="w-5 h-5 text-brand-500" />
            <h3 className="text-sm font-bold text-charcoal-900">Security & Database Row Level Security (RLS)</h3>
          </div>

          <p className="text-xs text-charcoal-600 leading-relaxed">
            Your permissions are enforced at the PostgreSQL database level using Supabase Row Level Security. Role privileges cannot be altered from browser client state.
          </p>

          <div className="p-4 rounded-xl bg-surface-50 border border-charcoal-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-charcoal-800">Current Role:</span>
              <span className="font-mono font-bold text-brand-600">{role}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-charcoal-800">Self-Role Escalation Prevention:</span>
              <span className="text-emerald-700 font-semibold">Active (Protected by RLS)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-charcoal-800">Resume Access Tier:</span>
              <span className="text-charcoal-700">Authenticated Staff Signed Token</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
