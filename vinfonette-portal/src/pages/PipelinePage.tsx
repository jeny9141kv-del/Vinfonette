import React from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { PipelineKanban } from '../components/pipeline/PipelineKanban';
import { Button } from '../components/common/Button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const PipelinePage: React.FC = () => {
  const { isAdmin, isCoordinator } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement Pipeline Board"
        subtitle="Live Kanban visualization tracking candidate progression across all 10 stages from registration to confirmed placement."
        actions={
          (isAdmin || isCoordinator) && (
            <Link to="/candidates/new">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Register Candidate
              </Button>
            </Link>
          )
        }
      />

      <PipelineKanban />
    </div>
  );
};
