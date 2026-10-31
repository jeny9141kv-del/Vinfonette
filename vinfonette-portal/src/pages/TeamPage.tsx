import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { UserRole, Profile } from '../lib/types';
import { UserCog, Plus, Mail, Phone, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const TeamPage: React.FC = () => {
  const { team, inviteTeamMember } = useData();
  const { isAdmin } = useAuth();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('PLACEMENT_COORDINATOR');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) return;

    setIsSubmitting(true);
    try {
      await inviteTeamMember({
        email,
        full_name: fullName,
        role,
        title,
        phone,
      });

      setEmail('');
      setFullName('');
      setTitle('');
      setPhone('');
      setInviteModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PLACEMENT_COORDINATOR':
        return 'bg-brand-100 text-brand-800 border-brand-200';
      case 'TRAINER':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'MANAGEMENT':
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement Staff & Mentors Directory"
        subtitle="Manage authorized coordinators, technical mentors, and executive leadership roles."
        actions={
          isAdmin && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setInviteModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Invite Staff Member
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {team.map((member) => (
          <Card key={member.id} className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={member.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={member.full_name}
                  className="w-12 h-12 rounded-full object-cover border border-brand-200"
                />
                <div>
                  <h3 className="text-sm font-bold text-charcoal-900 leading-tight">{member.full_name}</h3>
                  <p className="text-[11px] text-charcoal-500 mt-0.5">{member.title || 'Staff'}</p>
                </div>
              </div>

              <div className="mb-3">
                <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold border ${getRoleBadge(member.role)}`}>
                  {member.role}
                </span>
              </div>

              <div className="space-y-1 text-xs text-charcoal-600">
                <p className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-charcoal-400 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </p>
                {member.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-charcoal-400 shrink-0" />
                    <span>{member.phone}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-charcoal-100 flex items-center justify-between text-[11px] text-charcoal-400 mt-4">
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
              <span>RLS Enforced</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Invite Member Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite Team Member"
        description="Provision an invitation for a staff coordinator, trainer, or management role."
        maxWidth="md"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Meenakshi Sundaram"
              required
              className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Institutional Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. meenakshi@vinfonette.com"
              required
              className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Assigned Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white font-medium"
              >
                <option value="PLACEMENT_COORDINATOR">Placement Coordinator</option>
                <option value="TRAINER">Technical Mentor / Trainer</option>
                <option value="MANAGEMENT">Management (Read-Only)</option>
                <option value="ADMIN">System Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Designation Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Associate Coordinator"
                className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Contact Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 00000"
              className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-charcoal-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
