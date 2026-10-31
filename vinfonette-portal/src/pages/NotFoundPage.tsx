import React from 'react';
import { Button } from '../components/common/Button';
import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-charcoal-900 tracking-tight">404 — Page Not Found</h1>
      <p className="mt-2 text-xs text-charcoal-500 max-w-sm">
        The requested routing URL could not be located in the VinfoNette Placement Portal registry.
      </p>
      <div className="mt-6">
        <Link to="/dashboard">
          <Button variant="primary" size="md">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};
