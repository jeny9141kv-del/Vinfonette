import React from 'react';
import { useData } from '../contexts/DataContext';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Bell, CheckCheck, Calendar, Award, Briefcase, Info, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDateTime } from '../lib/utils';

export const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useData();

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
    <div className="space-y-6">
      <PageHeader
        title="Notifications Center"
        subtitle="Live alerts for student interview confirmations, formal offers, and critical follow-up deadlines."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={markAllNotificationsRead}
            leftIcon={<CheckCheck className="w-4 h-4" />}
          >
            Mark all as read
          </Button>
        }
      />

      <Card className="divide-y divide-charcoal-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="py-12 text-center text-xs text-charcoal-400">No notifications in your feed.</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                n.read ? 'bg-white opacity-80' : 'bg-brand-50/20'
              }`}
              onClick={() => markNotificationRead(n.id)}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-surface-50 border border-charcoal-100 shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-charcoal-900">{n.title}</h4>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-charcoal-600 mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-charcoal-400 mt-1.5">{formatDateTime(n.created_at)}</p>
                </div>
              </div>

              {n.link && (
                <Link to={n.link}>
                  <Button variant="ghost" size="sm" rightIcon={<ExternalLink className="w-3 h-3" />}>
                    Open
                  </Button>
                </Link>
              )}
            </div>
          ))
        )}
      </Card>
    </div>
  );
};
