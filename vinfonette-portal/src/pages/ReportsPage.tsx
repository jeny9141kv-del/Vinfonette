import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import {
  BarChart3,
  Download,
  Printer,
  TrendingUp,
  Award,
  Users,
  Building2,
  Briefcase,
  CheckCircle2,
  Calendar,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatCurrency, exportToCSV } from '../lib/utils';

export const ReportsPage: React.FC = () => {
  const { candidates, placements, offers, interviews, companies, jobs, team } = useData();

  const [selectedBatch, setSelectedBatch] = useState<string>('ALL');

  // Filtered by batch
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => (selectedBatch === 'ALL' ? true : c.batch === selectedBatch));
  }, [candidates, selectedBatch]);

  // Derived metrics (strictly unique per candidate as required)
  const totalInBatch = filteredCandidates.length;
  const placedInBatch = filteredCandidates.filter((c) => c.current_stage === 'Placed Successfully').length;
  const batchPlacementRate = totalInBatch > 0 ? Math.round((placedInBatch / totalInBatch) * 100) : 0;

  // Training completion rate
  const completedTraining = filteredCandidates.filter(
    (c) => c.training_progress === 100 || ['Training Completed', 'Resume Ready', 'Placement Ready', 'Placed Successfully'].includes(c.current_stage)
  ).length;
  const trainingRate = totalInBatch > 0 ? Math.round((completedTraining / totalInBatch) * 100) : 0;

  // Interview-to-Offer Conversion Rate
  const totalInterviewsCount = interviews.length;
  const passedInterviews = interviews.filter((i) => i.result === 'PASSED' || i.result === 'STRONG_HIRE').length;
  const interviewSuccessRate = totalInterviewsCount > 0 ? Math.round((passedInterviews / totalInterviewsCount) * 100) : 0;

  // Offer Acceptance Rate
  const totalOffers = offers.length;
  const acceptedOffers = offers.filter((o) => o.status === 'ACCEPTED').length;
  const offerAcceptanceRate = totalOffers > 0 ? Math.round((acceptedOffers / totalOffers) * 100) : 0;

  // Company-wise placements
  const companyMetrics = useMemo(() => {
    return companies.map((c) => {
      const placedCount = placements.filter((p) => p.company_id === c.id).length;
      return {
        company: c.name,
        placements: placedCount,
        tier: c.tier,
      };
    });
  }, [companies, placements]);

  // Salary Band Breakdown
  const salaryBands = useMemo(() => {
    let under8 = 0;
    let between8and12 = 0;
    let above12 = 0;

    placements.forEach((p) => {
      if (p.ctc < 800000) under8++;
      else if (p.ctc <= 1200000) between8and12++;
      else above12++;
    });

    return [
      { name: 'Under ₹8 LPA', count: under8 },
      { name: '₹8 - ₹12 LPA', count: between8and12 },
      { name: 'Above ₹12 LPA', count: above12 },
    ];
  }, [placements]);

  const COLORS = ['#087DC1', '#10B981', '#F59E0B'];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const reportData = filteredCandidates.map((c) => {
      const plc = placements.find((p) => p.candidate_id === c.id);
      const comp = plc ? companies.find((co) => co.id === plc.company_id) : null;
      return {
        'Candidate ID': c.candidate_id,
        Name: c.full_name,
        Batch: c.batch,
        Degree: c.education,
        Specialization: c.specialization,
        'Pipeline Stage': c.current_stage,
        'Placement Status': c.placement_status,
        Company: comp?.name || 'N/A',
        CTC: plc?.ctc || 0,
        'Readiness Score': c.readiness_score,
      };
    });
    exportToCSV('vinfonette-placement-executive-report', reportData);
  };

  return (
    <div className="space-y-6 print:space-y-4">
      <PageHeader
        title="Institutional Placement Reports & Analytics"
        subtitle="Audited performance statistics, batch conversion funnels, and enterprise outcome benchmarks."
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print / Save PDF
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export Full Report (CSV)
            </Button>
          </div>
        }
      />

      {/* Batch Filter */}
      <Card className="p-4 border border-charcoal-200 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-charcoal-400" />
            <span className="text-xs font-semibold text-charcoal-800">Filter Analytics by Batch Cohort:</span>
          </div>

          <div className="flex items-center gap-2">
            {['ALL', '2026-A', '2026-B', '2025-A', '2025-B'].map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBatch(b)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedBatch === b
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'bg-surface-50 text-charcoal-600 hover:bg-slate-200'
                }`}
              >
                {b === 'ALL' ? 'All Batches' : `Batch ${b}`}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Audited Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs text-charcoal-400 block mb-1">Batch Placement Rate</span>
          <span className="text-2xl font-black text-brand-600">{batchPlacementRate}%</span>
          <p className="text-[11px] text-charcoal-500 mt-1">
            {placedInBatch} of {totalInBatch} unique candidates placed
          </p>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-charcoal-400 block mb-1">Training Completion Rate</span>
          <span className="text-2xl font-black text-emerald-600">{trainingRate}%</span>
          <p className="text-[11px] text-charcoal-500 mt-1">Passed full technical track</p>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-charcoal-400 block mb-1">Interview Success Rate</span>
          <span className="text-2xl font-black text-purple-600">{interviewSuccessRate}%</span>
          <p className="text-[11px] text-charcoal-500 mt-1">Cleared rounds with passing score</p>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-charcoal-400 block mb-1">Offer Acceptance Rate</span>
          <span className="text-2xl font-black text-indigo-600">{offerAcceptanceRate}%</span>
          <p className="text-[11px] text-charcoal-500 mt-1">Accepted out of {totalOffers} total offers</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5">
          <CardHeader className="px-0 pt-0 border-b-0 pb-3">
            <h3 className="text-sm font-bold text-charcoal-900">Placements by Employer</h3>
            <p className="text-xs text-charcoal-500">Corporate distribution</p>
          </CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="company" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="placements" fill="#087DC1" radius={[4, 4, 0, 0]} name="Placed Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader className="px-0 pt-0 border-b-0 pb-3">
            <h3 className="text-sm font-bold text-charcoal-900">Compensation Band Distribution</h3>
            <p className="text-xs text-charcoal-500">CTC breakdown for placed candidates</p>
          </CardHeader>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salaryBands}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  dataKey="count"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {salaryBands.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
