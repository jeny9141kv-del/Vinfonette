import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isValid } from 'date-fns';
import {
  CandidateStage,
  InterviewStatus,
  TaskPriority,
  TaskStatus,
  ReadinessAssessment,
  PaymentStatus,
  PFStatus,
} from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount?: number | null, currency = 'INR'): string {
  if (amount == null) return 'N/A';
  if (currency === 'INR') {
    if (amount >= 100000) {
      const lpa = amount / 100000;
      return `₹${lpa % 1 === 0 ? lpa : lpa.toFixed(1)} LPA`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString?: string | null, formatStr = 'MMM dd, yyyy'): string {
  if (!dateString) return '—';
  try {
    const d = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    if (!isValid(d)) return dateString;
    return format(d, formatStr);
  } catch {
    return dateString || '—';
  }
}

export function formatDateTime(dateString?: string | null): string {
  return formatDate(dateString, 'MMM dd, yyyy · hh:mm a');
}

export function getStageColor(stage: CandidateStage): { bg: string; text: string; border: string } {
  switch (stage) {
    case 'Registered':
      return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' };
    case 'Training in Progress':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' };
    case 'Training Completed':
      return { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-300' };
    case 'Resume Ready':
      return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-300' };
    case 'Placement Ready':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' };
    case 'Applications Submitted':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' };
    case 'Interview Scheduled':
      return { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-300' };
    case 'Interview Completed':
      return { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-300' };
    case 'Offer Received':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' };
    case 'Placed Successfully':
      return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-400 font-semibold' };
    case 'On Hold':
      return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' };
    case 'Not Interested':
    case 'Withdrawn':
      return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' };
    case 'Rejected':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
  }
}

export function getReadinessBadge(assessment: ReadinessAssessment): { label: string; color: string } {
  switch (assessment) {
    case 'HIGH_POTENTIAL':
      return { label: 'High Potential ★', color: 'bg-purple-100 text-purple-800 border-purple-200' };
    case 'READY':
      return { label: 'Placement Ready', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    case 'NEEDS_WORK':
      return { label: 'Needs Mentoring', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    case 'NOT_EVALUATED':
    default:
      return { label: 'Not Evaluated', color: 'bg-slate-100 text-slate-600 border-slate-200' };
  }
}

export function getPaymentStatusBadge(status?: PaymentStatus): { label: string; color: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'PAID':
      return {
        label: 'Paid',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
      };
    case 'PARTIAL':
      return {
        label: 'Partially Paid',
        color: 'bg-amber-100 text-amber-800 border-amber-300',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
      };
    case 'WAIVED':
      return {
        label: 'Waived',
        color: 'bg-purple-100 text-purple-800 border-purple-300',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
      };
    case 'PENDING':
    default:
      return {
        label: 'Pending',
        color: 'bg-rose-100 text-rose-800 border-rose-300',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
      };
  }
}

export function getPFStatusBadge(status?: PFStatus): { label: string; color: string } {
  switch (status) {
    case 'APPLICABLE':
      return { label: 'PF Applicable / Active', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    case 'EXEMPT':
      return { label: 'PF Exempted', color: 'bg-purple-100 text-purple-800 border-purple-200' };
    case 'NOT_APPLICABLE':
    default:
      return { label: 'Not Applicable (Fresher)', color: 'bg-slate-100 text-slate-600 border-slate-200' };
  }
}

export function getPriorityBadge(priority: TaskPriority): string {
  switch (priority) {
    case 'Urgent':
      return 'bg-rose-100 text-rose-800 border-rose-300';
    case 'High':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'Medium':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'Low':
      return 'bg-slate-100 text-slate-700 border-slate-300';
  }
}

export function getInterviewStatusBadge(status: InterviewStatus): { bg: string; text: string } {
  switch (status) {
    case 'scheduled':
      return { bg: 'bg-blue-50', text: 'text-blue-700' };
    case 'confirmed':
      return { bg: 'bg-teal-50', text: 'text-teal-700' };
    case 'completed':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700' };
    case 'awaiting-feedback':
      return { bg: 'bg-amber-50', text: 'text-amber-700' };
    case 'rescheduled':
      return { bg: 'bg-purple-50', text: 'text-purple-700' };
    case 'cancelled':
    case 'no-show':
      return { bg: 'bg-rose-50', text: 'text-rose-700' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-700' };
  }
}

export function exportToCSV(filename: string, rows: Record<string, any>[]): void {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers
        .map(fieldName => {
          let value = row[fieldName];
          if (Array.isArray(value)) {
            value = value.join('; ');
          }
          if (value === null || value === undefined) {
            value = '';
          }
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    ),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
