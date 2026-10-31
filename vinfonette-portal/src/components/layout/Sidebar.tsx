import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Kanban,
  Users,
  Building2,
  Briefcase,
  FileText,
  CalendarCheck2,
  CheckSquare,
  BarChart3,
  UserCog,
  ShieldAlert,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  User,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { user, role, logout, isAdmin, isManagement, canAccessAuditLogs, canManageSettings } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Placement Pipeline', href: '/pipeline', icon: Kanban },
    { name: 'Candidates', href: '/candidates', icon: Users },
    { name: 'Companies', href: '/companies', icon: Building2 },
    { name: 'Job Openings', href: '/jobs', icon: Briefcase },
    { name: 'Applications', href: '/applications', icon: FileText },
    { name: 'Interviews', href: '/interviews', icon: CalendarCheck2 },
    { name: 'Tasks & Follow-ups', href: '/tasks', icon: CheckSquare },
    { name: 'Analytics & Reports', href: '/reports', icon: BarChart3 },
    ...(isAdmin || isManagement ? [{ name: 'Team & Mentors', href: '/team', icon: UserCog }] : []),
    ...(canAccessAuditLogs ? [{ name: 'Audit Logs', href: '/audit-logs', icon: ShieldAlert }] : []),
    ...(canManageSettings ? [{ name: 'Portal Settings', href: '/settings', icon: Settings }] : []),
  ];

  const roleLabels: Record<string, string> = {
    ADMIN: 'Admin',
    PLACEMENT_COORDINATOR: 'Coordinator',
    MANAGEMENT: 'Management',
    TRAINER: 'Trainer',
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-charcoal-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-charcoal-900 text-white transition-all duration-300 ease-in-out border-r border-charcoal-800 lg:static',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-charcoal-800 bg-charcoal-950/40">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 overflow-hidden"
            onClick={() => setMobileOpen(false)}
          >
            <img
              src="/vinfonette-logo.png"
              alt="VinfoNette"
              className="h-9 w-auto max-w-[130px] object-contain rounded shrink-0 bg-white p-1"
            />
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-[10px] tracking-widest uppercase font-semibold text-brand-400">
                  Placement Hub
                </span>
              </div>
            )}
          </NavLink>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-charcoal-400 hover:text-white hover:bg-charcoal-800 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group select-none',
                    isActive
                      ? 'bg-brand-500 text-white font-semibold shadow-sm'
                      : 'text-charcoal-300 hover:text-white hover:bg-charcoal-800/80',
                    collapsed && 'justify-center px-2'
                  )
                }
                title={collapsed ? item.name : undefined}
              >
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* User Footer Profile */}
        <div className="p-3 border-t border-charcoal-800 bg-charcoal-950/30">
          <div
            className={cn(
              'flex items-center gap-3 p-2 rounded-xl bg-charcoal-800/50 hover:bg-charcoal-800 transition-colors',
              collapsed && 'justify-center p-1.5'
            )}
          >
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user?.full_name || 'User'}
              className="w-8 h-8 rounded-full object-cover border border-brand-400/40 shrink-0"
            />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate leading-tight">{user?.full_name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <p className="text-[10px] text-brand-300 font-medium truncate uppercase tracking-wider">
                    {roleLabels[role] || role}
                  </p>
                </div>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={logout}
                className="p-1.5 text-charcoal-400 hover:text-rose-400 hover:bg-charcoal-700 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
