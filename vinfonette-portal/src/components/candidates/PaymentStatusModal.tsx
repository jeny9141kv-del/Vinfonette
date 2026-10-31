import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Candidate, PaymentStatus } from '../../lib/types';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { CreditCard, CheckCircle2, Clock, AlertTriangle, IndianRupee } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';

export interface PaymentStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
}

export const PaymentStatusModal: React.FC<PaymentStatusModalProps> = ({ isOpen, onClose, candidate }) => {
  const { updateCandidate } = useData();
  const { success, error } = useToast();

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PENDING');
  const [paymentAmount, setPaymentAmount] = useState<number>(25000);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (candidate) {
      setPaymentStatus(candidate.payment_status || 'PENDING');
      setPaymentAmount(candidate.payment_amount ?? 25000);
      setAmountPaid(candidate.amount_paid ?? 0);
      setPaymentDate(candidate.payment_date || new Date().toISOString().split('T')[0]);
      setPaymentReference(candidate.payment_reference || '');
      setPaymentNotes(candidate.payment_notes || '');
    }
  }, [candidate, isOpen]);

  if (!candidate) return null;

  const balanceDue = Math.max(0, paymentAmount - amountPaid);

  const handleQuickStatus = (status: PaymentStatus) => {
    setPaymentStatus(status);
    if (status === 'PAID') {
      setAmountPaid(paymentAmount);
      if (!paymentDate) setPaymentDate(new Date().toISOString().split('T')[0]);
    } else if (status === 'PENDING') {
      setAmountPaid(0);
    } else if (status === 'WAIVED') {
      setAmountPaid(0);
      setPaymentNotes((prev) => prev || 'Fee waived by Management approval.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateCandidate(candidate.id, {
        payment_status: paymentStatus,
        payment_amount: Number(paymentAmount),
        amount_paid: Number(amountPaid),
        payment_date: paymentDate || undefined,
        payment_reference: paymentReference || undefined,
        payment_notes: paymentNotes || undefined,
      });

      success('Payment Updated', `Payment details updated for ${candidate.full_name}.`);
      onClose();
    } catch (err: any) {
      error('Update Failed', err.message || 'Failed to update payment status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Candidate Payment Status"
      description={`Manage tuition fee, installments, and receipts for ${candidate.full_name} (${candidate.candidate_id})`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick Status Selectors */}
        <div>
          <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-2">
            Quick Status Presets
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleQuickStatus('PAID')}
              className={`py-2 px-1 text-center rounded-lg text-xs font-bold border transition-colors ${
                paymentStatus === 'PAID'
                  ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Paid
            </button>
            <button
              type="button"
              onClick={() => handleQuickStatus('PARTIAL')}
              className={`py-2 px-1 text-center rounded-lg text-xs font-bold border transition-colors ${
                paymentStatus === 'PARTIAL'
                  ? 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-300'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              Partial
            </button>
            <button
              type="button"
              onClick={() => handleQuickStatus('PENDING')}
              className={`py-2 px-1 text-center rounded-lg text-xs font-bold border transition-colors ${
                paymentStatus === 'PENDING'
                  ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-300'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
              }`}
            >
              Pending
            </button>
            <button
              type="button"
              onClick={() => handleQuickStatus('WAIVED')}
              className={`py-2 px-1 text-center rounded-lg text-xs font-bold border transition-colors ${
                paymentStatus === 'WAIVED'
                  ? 'bg-purple-600 text-white border-purple-600 ring-2 ring-purple-300'
                  : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
              }`}
            >
              Waived
            </button>
          </div>
        </div>

        {/* Financial Balance Summary Card */}
        <div className="p-4 rounded-xl bg-surface-50 border border-charcoal-200 grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-charcoal-400 block">Total Fee</span>
            <span className="text-sm font-extrabold text-charcoal-900">₹{Number(paymentAmount).toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-charcoal-400 block">Amount Paid</span>
            <span className="text-sm font-extrabold text-emerald-600">₹{Number(amountPaid).toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-charcoal-400 block">Balance Due</span>
            <span className={`text-sm font-extrabold ${balanceDue > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
              ₹{Number(balanceDue).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Total Fee Amount (₹)"
            type="number"
            min={0}
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(Number(e.target.value))}
            required
          />

          <Input
            label="Amount Paid So Far (₹)"
            type="number"
            min={0}
            max={paymentAmount}
            value={amountPaid}
            onChange={(e) => {
              const val = Number(e.target.value);
              setAmountPaid(val);
              if (val >= paymentAmount && paymentAmount > 0) {
                setPaymentStatus('PAID');
              } else if (val > 0) {
                setPaymentStatus('PARTIAL');
              }
            }}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Payment / Transaction Date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />

          <Input
            label="Reference ID / Receipt #"
            placeholder="e.g. UPI/123456789 or REC-2026-04"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-700 mb-1">
            Payment Notes & Receipt Remarks
          </label>
          <textarea
            rows={2}
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            placeholder="e.g. Paid via Google Pay to official account. Installment 1 cleared."
            className="w-full text-xs p-2.5 rounded-lg border border-charcoal-200 bg-surface-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-charcoal-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<CreditCard className="w-4 h-4" />}
          >
            Save Payment Details
          </Button>
        </div>
      </form>
    </Modal>
  );
};

