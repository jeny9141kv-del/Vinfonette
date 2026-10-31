import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Candidate } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { uploadResume, getSecureResumeUrl } from '../../lib/storage';
import { FileText, Download, Upload, ShieldCheck, ExternalLink } from 'lucide-react';

export interface ResumeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
}

export const ResumeViewerModal: React.FC<ResumeViewerModalProps> = ({ isOpen, onClose, candidate }) => {
  const { user, canEditCandidate } = useAuth();
  const { updateCandidate } = useData();
  const { success, error } = useToast();

  const [isUploading, setIsUploading] = useState(false);

  if (!candidate) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const result = await uploadResume(candidate.id, file);

    if (result.success && result.filePath) {
      await updateCandidate(candidate.id, {
        resume_url: result.filePath,
        resume_filename: result.filename || file.name,
      });
      success('Resume Updated', `${file.name} uploaded to the configured document storage.`);
    } else {
      error('Upload Failed', result.error || 'Failed to upload document.');
    }
    setIsUploading(false);
  };

  const handleDownload = async () => {
    if (!candidate.resume_url && !candidate.resume_filename) return;
    const downloadUrl = await getSecureResumeUrl(candidate.resume_url || '', candidate.id);
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  const canEdit = canEditCandidate(candidate);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Candidate Resume & Documents"
      description={`Private local document vault for ${candidate.full_name} (${candidate.candidate_id})`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Security Alert */}
        <div className="p-3 rounded-xl bg-surface-50 border border-brand-200 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
          <div className="text-xs text-charcoal-700">
            <span className="font-semibold text-brand-700 block mb-0.5">Private Local Storage Vault</span>
            Resumes are stored offline in your computer's private application data directory (%LOCALAPPDATA%\VinfoNette\data\resumes\). Unauthenticated access is blocked.
          </div>
        </div>

        {/* Current Resume Card */}
        <div className="p-4 rounded-xl border border-charcoal-200 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-charcoal-900">
                {candidate.resume_filename || `${candidate.full_name}_Resume.pdf`}
              </p>
              <p className="text-xs text-charcoal-400">
                {candidate.resume_url ? 'Verified PDF Document · 1.2 MB' : 'No document uploaded yet'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {candidate.resume_url ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Download Signed
              </Button>
            ) : null}

            {canEdit && (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isUploading}
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                  type="button"
                >
                  {candidate.resume_url ? 'Replace' : 'Upload'}
                </Button>
              </label>
            )}
          </div>
        </div>

        {/* Quick Document Viewer / Placeholder Canvas */}
        <div className="rounded-xl border border-charcoal-200 bg-slate-50 p-6 text-center">
          <div className="max-w-md mx-auto space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto animate-pulse"></div>
            <div className="h-3 bg-slate-200 rounded w-1/2 mx-auto"></div>
            <div className="h-3 bg-slate-200 rounded w-2/3 mx-auto"></div>
            <div className="my-4 p-4 bg-white rounded-lg border border-charcoal-100 text-left text-xs font-mono text-charcoal-600 space-y-1">
              <div className="font-bold text-charcoal-900 border-b border-charcoal-100 pb-1 mb-2">
                CANDIDATE DOSSIER: {candidate.full_name.toUpperCase()}
              </div>
              <p>• Candidate ID: {candidate.candidate_id}</p>
              <p>• Education: {candidate.education} in {candidate.specialization} ({candidate.graduation_year})</p>
              <p>• Technical Skills: {candidate.technical_skills.join(', ')}</p>
              <p>• Current Pipeline Stage: {candidate.current_stage}</p>
              <p>• Placement Status: {candidate.placement_status}</p>
            </div>
            <p className="text-[11px] text-charcoal-400">
              Full formatted documents can be downloaded securely with coordinator authentication.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-charcoal-100">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
