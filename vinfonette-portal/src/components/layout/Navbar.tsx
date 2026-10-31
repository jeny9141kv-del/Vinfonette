import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { NotificationCenter } from './NotificationCenter';
import {
  Menu,
  Search,
  User,
  Settings,
  LogOut,
  ChevronDown,
  UserCheck,
  Building2,
  Briefcase,
  X,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user, role, logout } = useAuth();
  const { candidates, companies, jobs } = useData();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered search items
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return null;
    const q = searchQuery.toLowerCase();

    const matchedCandidates = candidates
      .filter((c) => c.full_name.toLowerCase().includes(q) || c.candidate_id.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
      .slice(0, 4);

    const matchedCompanies = companies
      .filter((c) => c.name.toLowerCase().includes(q) || c.company_id.toLowerCase().includes(q))
      .slice(0, 3);

    const matchedJobs = jobs
      .filter((j) => j.title.toLowerCase().includes(q) || j.job_id.toLowerCase().includes(q))
      .slice(0, 3);

    return { candidates: matchedCandidates, companies: matchedCompanies, jobs: matchedJobs };
  }, [searchQuery, candidates, companies, jobs]);

  return (
    <header className="h-16 bg-white border-b border-charcoal-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile hamburger & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-charcoal-600 hover:text-charcoal-900 hover:bg-slate-100 lg:hidden"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative flex-1" ref={searchRef}>
          <div className="relative">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Search candidates, companies, jobs... (e.g. Aarav, Nexis)"
              className="w-full bg-surface-50 border border-charcoal-200 rounded-xl pl-9 pr-8 py-2 text-xs text-charcoal-900 placeholder-charcoal-400 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {searchFocused && searchResults && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-enterprise border border-charcoal-200 py-2 z-50 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-1">
              {searchResults.candidates.length === 0 &&
              searchResults.companies.length === 0 &&
              searchResults.jobs.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-charcoal-400">
                  No matching candidates, companies, or jobs found for "{searchQuery}".
                </div>
              ) : (
                <>
                  {searchResults.candidates.length > 0 && (
                    <div className="px-3 py-1.5">
                      <p className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider px-2 mb-1">
                        Candidates
                      </p>
                      {searchResults.candidates.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            navigate(`/candidates/${c.id}`);
                            setSearchFocused(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-brand-50/60 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <User className="w-4 h-4 text-brand-500 shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-charcoal-900 leading-none">{c.full_name}</p>
                              <p className="text-[11px] text-charcoal-500 mt-0.5">{c.candidate_id} · {c.education}</p>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-charcoal-700 font-medium">
                            {c.current_stage}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.companies.length > 0 && (
                    <div className="px-3 py-1.5 border-t border-charcoal-100">
                      <p className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider px-2 mb-1">
                        Companies
                      </p>
                      {searchResults.companies.map((comp) => (
                        <div
                          key={comp.id}
                          onClick={() => {
                            navigate(`/companies/${comp.id}`);
                            setSearchFocused(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-brand-50/60 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-charcoal-900 leading-none">{comp.name}</p>
                              <p className="text-[11px] text-charcoal-500 mt-0.5">{comp.industry} · {comp.office_location}</p>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                            {comp.tier}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.jobs.length > 0 && (
                    <div className="px-3 py-1.5 border-t border-charcoal-100">
                      <p className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider px-2 mb-1">
                        Job Openings
                      </p>
                      {searchResults.jobs.map((j) => (
                        <div
                          key={j.id}
                          onClick={() => {
                            navigate(`/jobs/${j.id}`);
                            setSearchFocused(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-brand-50/60 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <Briefcase className="w-4 h-4 text-purple-600 shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-charcoal-900 leading-none">{j.title}</p>
                              <p className="text-[11px] text-charcoal-500 mt-0.5">{j.job_id} · {j.work_location}</p>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">
                            {j.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Notifications, Quick Actions, Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        <NotificationCenter />

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user?.full_name || 'User'}
              className="w-8 h-8 rounded-full object-cover border border-brand-200"
            />
            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold text-charcoal-900 leading-tight">{user?.full_name}</p>
              <p className="text-[10px] text-brand-600 font-medium">{role}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-charcoal-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-enterprise border border-charcoal-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2.5 border-b border-charcoal-100">
                <p className="text-xs font-bold text-charcoal-900">{user?.full_name}</p>
                <p className="text-[11px] text-charcoal-500 truncate">{user?.email}</p>
                <span className="mt-1.5 inline-block text-[10px] px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-semibold border border-brand-200">
                  Role: {role}
                </span>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-charcoal-700 hover:bg-slate-50 hover:text-charcoal-900 transition-colors"
                >
                  <User className="w-4 h-4 text-charcoal-400" />
                  My Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-charcoal-700 hover:bg-slate-50 hover:text-charcoal-900 transition-colors"
                >
                  <Settings className="w-4 h-4 text-charcoal-400" />
                  Portal Settings
                </Link>
              </div>

              <div className="pt-1 border-t border-charcoal-100">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
