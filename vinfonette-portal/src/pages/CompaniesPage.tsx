import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Company } from '../lib/types';
import { Building2, Search, Plus, MapPin, Mail, Phone, ExternalLink, Briefcase, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isJobCurrentlyAvailable } from '../lib/job-availability';

export const CompaniesPage: React.FC = () => {
  const { companies, jobs, placements, applications, addCompany } = useData();
  const { canManageCompanies } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [addModalOpen, setAddModalOpen] = useState(false);

  // New Company form state
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [officeLocation, setOfficeLocation] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [tier, setTier] = useState<Company['tier']>('TIER_1');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCompanies = companies.filter((c) => {
    if (selectedTier !== 'ALL' && c.tier !== selectedTier) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.office_location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contactEmail.trim()) return;

    setIsSubmitting(true);
    try {
      await addCompany({
        name,
        industry,
        office_location: officeLocation,
        contact_person: contactPerson,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        tier,
        website,
        status: 'ACTIVE',
        notes,
      });

      // Reset form
      setName('');
      setIndustry('');
      setOfficeLocation('');
      setContactPerson('');
      setContactEmail('');
      setContactPhone('');
      setNotes('');
      setAddModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hiring Partners & Corporate Network"
        subtitle={`Total partner companies: ${companies.length} · Connecting candidates with leading enterprises.`}
        actions={
          canManageCompanies && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setAddModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Company
            </Button>
          )
        }
      />

      {/* Filter Bar */}
      <Card className="p-4 border border-charcoal-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies by name, industry, or location..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-charcoal-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-charcoal-600 font-medium">Partner Tier:</span>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="text-xs p-2 rounded-lg border border-charcoal-200 bg-surface-50 font-medium text-charcoal-800"
            >
              <option value="ALL">All Tiers ({companies.length})</option>
              <option value="ENTERPRISE">Enterprise</option>
              <option value="TIER_1">Tier 1</option>
              <option value="TIER_2">Tier 2</option>
              <option value="STARTUP">Startup</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCompanies.map((comp) => {
          const companyJobs = jobs.filter(
            (job) => job.company_id === comp.id && isJobCurrentlyAvailable(job, comp, applications),
          );
          const companyPlacements = placements.filter((p) => p.company_id === comp.id);

          return (
            <Card key={comp.id} hoverable className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-mono text-charcoal-400 uppercase tracking-wider block">
                      {comp.company_id}
                    </span>
                    <Link
                      to={`/companies/${comp.id}`}
                      className="text-base font-bold text-charcoal-900 hover:text-brand-600 transition-colors"
                    >
                      {comp.name}
                    </Link>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                    {comp.tier}
                  </span>
                </div>

                <p className="text-xs font-medium text-charcoal-600 mb-2">{comp.industry}</p>

                <div className="space-y-1.5 text-xs text-charcoal-500 mb-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-charcoal-400 shrink-0" />
                    <span>{comp.office_location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-charcoal-400 shrink-0" />
                    <span className="truncate">{comp.contact_email}</span>
                  </div>
                  {comp.contact_person && (
                    <div className="flex items-center gap-1.5 text-charcoal-700 font-medium">
                      <span>HR POC: {comp.contact_person}</span>
                    </div>
                  )}
                </div>

                {comp.notes && (
                  <p className="text-[11px] text-charcoal-400 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-charcoal-100 mb-4">
                    {comp.notes}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-charcoal-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-charcoal-500 text-[11px]">
                  <span className="flex items-center gap-1 font-semibold text-charcoal-800">
                    <Briefcase className="w-3.5 h-3.5 text-brand-500" />
                    {companyJobs.length} Openings
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-700">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    {companyPlacements.length} Placed
                  </span>
                </div>

                <Link
                  to={`/companies/${comp.id}`}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-0.5"
                >
                  View Details →
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add Company Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Register Hiring Partner"
        description="Add a new recruitment company and primary HR contact point."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateCompany} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Company Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nexis Cloud Solutions"
                required
                className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Industry Sector *</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Fintech, Enterprise Cloud, Cybersecurity"
                required
                className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Office Location *</label>
              <input
                type="text"
                value={officeLocation}
                onChange={(e) => setOfficeLocation(e.target.value)}
                placeholder="e.g. Bengaluru, India"
                required
                className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Corporate Website</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="e.g. https://company.com"
                className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Primary Recruiter / POC *</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Rohan Mehta"
                required
                className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">HR Email *</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="e.g. hiring@company.com"
                required
                className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="e.g. +91 98200 11223"
                className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Partner Tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as any)}
                className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
              >
                <option value="TIER_1">Tier 1 Partner</option>
                <option value="ENTERPRISE">Enterprise Global</option>
                <option value="TIER_2">Tier 2</option>
                <option value="STARTUP">Startup</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Relationship Notes & Drive Policy</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Campus drive requirements, package benchmarks, recruiter preferences..."
              className="w-full text-xs p-2 rounded-lg border border-charcoal-300 bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-charcoal-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
              Register Partner
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
