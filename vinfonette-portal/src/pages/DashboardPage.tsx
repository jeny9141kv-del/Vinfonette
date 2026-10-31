import React from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import {
  Users,
  BookOpen,
  CheckCircle2,
  Sparkles,
  FileText,
  Calendar,
  Gift,
  Award,
  AlertTriangle,
  Clock,
  TrendingUp,
  Building2,
  ArrowUpRight,
  Briefcase,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate, formatDateTime, getStageColor } from '../lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user, role, isAdmin, isCoordinator } = useAuth();
  const { metrics, candidates, interviews, tasks, activities, companies, placements, offers } = useData();

  // Metric Cards configuration
  const statCards = [
    {
      title: 'Total Registered',
      value: metrics.totalRegistered,
      icon: Users,
      color: 'text-brand-600 bg-brand-50 border-brand-200',
      link: '/candidates',
    },
    {
      title: 'In Training',
      value: metrics.inTraining,
      icon: BookOpen,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      link: '/candidates?stage=Training in Progress',
    },
    {
      title: 'Training Completed',
      value: metrics.trainingCompleted,
      icon: CheckCircle2,
      color: 'text-sky-600 bg-sky-50 border-sky-200',
      link: '/candidates?stage=Training Completed',
    },
    {
      title: 'Placement Ready',
      value: metrics.placementReady,
      icon: Sparkles,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      link: '/candidates?stage=Placement Ready',
    },
    {
      title: 'Active Applications',
      value: metrics.activeApplications,
      icon: FileText,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      link: '/applications',
    },
    {
      title: 'Upcoming Interviews',
      value: metrics.upcomingInterviews,
      icon: Calendar,
      color: 'text-teal-600 bg-teal-50 border-teal-200',
      link: '/interviews',
    },
    {
      title: 'Offers Received',
      value: metrics.offersReceived,
      icon: Gift,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      link: '/pipeline',
    },
    {
      title: 'Successfully Placed',
      value: metrics.placedSuccessfully,
      icon: Award,
      color: 'text-emerald-700 bg-emerald-100 border-emerald-300 font-bold',
      link: '/candidates?stage=Placed Successfully',
    },
    {
      title: 'Pending Feedback',
      value: metrics.pendingFeedback,
      icon: Clock,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      link: '/interviews',
    },
    {
      title: 'Overdue Tasks',
      value: metrics.overdueTasks,
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      link: '/tasks',
    },
  ];

  // Stage Distribution Data
  const stageData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    candidates.forEach((c) => {
      counts[c.current_stage] = (counts[c.current_stage] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [candidates]);

  // Batch placement rates
  const batchData = React.useMemo(() => {
    const batches = Array.from(new Set(candidates.map((c) => c.batch)));
    return batches.map((batch) => {
      const batchCandidates = candidates.filter((c) => c.batch === batch);
      const placed = batchCandidates.filter((c) => c.current_stage === 'Placed Successfully').length;
      const rate = batchCandidates.length > 0 ? Math.round((placed / batchCandidates.length) * 100) : 0;
      return {
        batch: `Batch ${batch}`,
        total: batchCandidates.length,
        placed,
        rate,
      };
    });
  }, [candidates]);

  // Company-wise placements
  const companyPlacementData = React.useMemo(() => {
    return companies.map((comp) => {
      const count = placements.filter((p) => p.company_id === comp.id).length;
      return {
        company: comp.name.length > 14 ? comp.name.slice(0, 14) + '...' : comp.name,
        placements: count,
      };
    });
  }, [companies, placements]);

  // Monthly Trend Mock Data
  const trendData = [
    { month: 'Oct 25', offers: 3, placed: 2 },
    { month: 'Nov 25', offers: 5, placed: 4 },
    { month: 'Dec 25', offers: 6, placed: 5 },
    { month: 'Jan 26', offers: 8, placed: 6 },
    { month: 'Feb 26', offers: 11, placed: 9 },
  ];

  // Colors for charts
  const PIE_COLORS = ['#087DC1', '#0055B8', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#64748B'];

  // Upcoming 4 interviews
  const upcomingInterviewsList = interviews
    .filter((i) => ['scheduled', 'confirmed'].includes(i.status))
    .slice(0, 4);

  // Today's / Overdue Tasks
  const priorityTasksList = tasks
    .filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled')
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement Operations Dashboard"
        subtitle={`Welcome back, ${user?.full_name}. Here is an overview of active recruitment pipelines, interviews, and candidates.`}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/pipeline">
              <Button variant="outline" size="sm" leftIcon={<TrendingUp className="w-4 h-4" />}>
                Kanban Pipeline
              </Button>
            </Link>
            {(isAdmin || isCoordinator) && (
              <Link to="/candidates/new">
                <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Register Candidate
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link key={idx} to={card.link}>
              <Card hoverable className="p-3.5 sm:p-4 border border-charcoal-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-charcoal-500 truncate">{card.title}</span>
                  <div className={`p-1.5 rounded-lg border ${card.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl sm:text-2xl font-extrabold text-charcoal-900">{card.value}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-charcoal-400" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Key Metric Spotlight: Average Package */}
      <div className="bg-gradient-to-r from-brand-600 via-brand-500 to-sky-600 rounded-2xl p-6 text-white shadow-enterprise flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-brand-100">
            Placement Performance Highlight
          </span>
          <h2 className="text-2xl font-bold mt-1">Average Confirmed CTC: {formatCurrency(metrics.averageCtc)}</h2>
          <p className="text-xs text-brand-100 mt-1 max-w-xl">
            Calculated across confirmed placements at tier-1 enterprise software and fintech partners including Nexis Cloud Solutions and AeroFin Technologies.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/reports">
            <Button variant="secondary" size="sm" className="bg-white text-brand-700 hover:bg-brand-50 border-none font-semibold">
              View Detailed Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placement Trends */}
        <Card className="p-5">
          <CardHeader className="px-0 pt-0 border-b-0 pb-3">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">Monthly Placement & Offer Trends</h3>
              <p className="text-xs text-charcoal-500">Offers extended vs confirmed student joinings</p>
            </div>
          </CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="offers" fill="#81cbe9" name="Offers Extended" radius={[4, 4, 0, 0]} />
                <Bar dataKey="placed" fill="#087DC1" name="Placed Successfully" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pipeline Stage Distribution */}
        <Card className="p-5">
          <CardHeader className="px-0 pt-0 border-b-0 pb-3">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">Current Candidate Stage Distribution</h3>
              <p className="text-xs text-charcoal-500">Live breakdown of all 20 candidates across stages</p>
            </div>
          </CardHeader>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stageData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  dataKey="count"
                  paddingAngle={3}
                >
                  {stageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Batch-wise Placement Rates */}
        <Card className="p-5">
          <CardHeader className="px-0 pt-0 border-b-0 pb-3">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">Batch-wise Placement Rates</h3>
              <p className="text-xs text-charcoal-500">Comparative success rate by graduation cohort</p>
            </div>
          </CardHeader>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={batchData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="batch" type="category" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${value}% Placed`, 'Placement Rate']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="rate" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Company-wise Placements */}
        <Card className="p-5">
          <CardHeader className="px-0 pt-0 border-b-0 pb-3">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">Employer Hiring Share</h3>
              <p className="text-xs text-charcoal-500">Placements distributed by company</p>
            </div>
          </CardHeader>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyPlacementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="company" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="placements" fill="#0055B8" radius={[4, 4, 0, 0]} name="Placed Candidates" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Operational Widgets: Upcoming Interviews, Priority Tasks & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Interviews */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-charcoal-100 mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              <h3 className="text-xs font-bold text-charcoal-900">Upcoming Interviews</h3>
            </div>
            <Link to="/interviews" className="text-[11px] font-semibold text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingInterviewsList.length === 0 ? (
              <p className="text-xs text-charcoal-400 py-6 text-center">No upcoming interviews scheduled</p>
            ) : (
              upcomingInterviewsList.map((item) => {
                const cand = candidates.find((c) => c.id === item.candidate_id);
                const comp = companies.find((c) => c.id === item.company_id);
                return (
                  <div key={item.id} className="p-3 rounded-xl bg-surface-50 border border-charcoal-100 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-charcoal-900 truncate">{cand?.full_name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                        Round {item.round_number}
                      </span>
                    </div>
                    <p className="text-[11px] text-charcoal-600 truncate">{comp?.name} · {item.round_name}</p>
                    <p className="text-[10px] text-charcoal-400 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-brand-500" />
                      {formatDateTime(item.scheduled_at)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Priority Tasks & Follow-ups */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-charcoal-100 mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-charcoal-900">Action Items & Tasks</h3>
            </div>
            <Link to="/tasks" className="text-[11px] font-semibold text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {priorityTasksList.length === 0 ? (
              <p className="text-xs text-charcoal-400 py-6 text-center">All action items completed!</p>
            ) : (
              priorityTasksList.map((t) => (
                <div key={t.id} className="p-3 rounded-xl bg-surface-50 border border-charcoal-100 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-charcoal-900 truncate">{t.title}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        t.priority === 'Urgent'
                          ? 'bg-rose-100 text-rose-700'
                          : t.priority === 'High'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                  {t.description && <p className="text-[11px] text-charcoal-500 line-clamp-1">{t.description}</p>}
                  <p className="text-[10px] text-charcoal-400 mt-1">Due: {formatDate(t.due_date)}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Pipeline Activity */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-charcoal-100 mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-charcoal-900">Live Activity Feed</h3>
            </div>
            <Link to="/audit-logs" className="text-[11px] font-semibold text-brand-600 hover:text-brand-700">
              Audit
            </Link>
          </div>

          <div className="space-y-3">
            {activities.slice(0, 4).map((act) => (
              <div key={act.id} className="text-xs pb-2 border-b border-charcoal-100 last:border-b-0 last:pb-0">
                <p className="text-charcoal-800 leading-snug">{act.description}</p>
                <div className="flex items-center justify-between mt-1 text-[10px] text-charcoal-400">
                  <span>By {act.actor_name}</span>
                  <span>{formatDate(act.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
