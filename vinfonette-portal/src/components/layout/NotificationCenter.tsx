import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Bell, Check, CheckCheck, ExternalLink, Calendar, Award, Briefcase, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDateTime } from '../../lib/utils';

export const NotificationCenter: React.FC = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'PLACEMENT':
        return <Award className="w-4 h-4 text-emerald-600" />;
      case 'INTERVIEW':
        return <Calendar className="w-4 h-4 text-brand-500" />;
      case 'APPLICATION':
        return <Briefcase className="w-4 h-4 text-purple-500" />;
      default:
        return <Info className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-charcoal-500 hover:text-charcoal-800 hover:bg-slate-100 transition-colors focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-enterprise border border-charcoal-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="px-4 py-3 bg-surface-50 border-b border-charcoal-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-charcoal-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-brand-100 text-brand-700">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-[11px] font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-charcoal-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-charcoal-400">No notifications at this time</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 flex items-start gap-3 transition-colors ${
                    n.read ? 'bg-white opacity-70 hover:opacity-100' : 'bg-brand-50/30 hover:bg-brand-50/60'
                  }`}
                  onClick={() => markNotificationRead(n.id)}
                >
                  <div className="p-2 rounded-lg bg-white border border-charcoal-100 shadow-xs shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-charcoal-900 truncate">{n.title}</p>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-charcoal-600 mt-0.5 leading-snug">{n.message}</p>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-charcoal-400">
                      <span>{formatDateTime(n.created_at)}</span>
                      {n.link && (
                        <Link
                          to={n.link}
                          onClick={() => setIsOpen(false)}
                          className="text-brand-600 font-medium hover:underline flex items-center gap-0.5"
                        >
                          View <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2 bg-slate-50 border-t border-charcoal-100 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
