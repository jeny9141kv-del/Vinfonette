import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { PageHeader } from '../components/common/PageHeader';
import { CandidateForm } from '../components/candidates/CandidateForm';
import { Button } from '../components/common/Button';

export const EditCandidatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { candidates } = useData();

  const candidate = candidates.find((c) => c.id === id);

  if (!candidate) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-bold text-charcoal-900">Candidate Not Found</h2>
        <p className="text-xs text-charcoal-500 mt-1">The candidate profile you requested does not exist.</p>
        <Link to="/candidates" className="mt-4 inline-block">
          <Button variant="primary" size="sm">Back to Candidates</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit Profile: ${candidate.full_name}`}
        subtitle={`${candidate.candidate_id} · Update credentials, payment status, PF info, service history & certificates.`}
        breadcrumbs={[
          { label: 'Candidates', href: '/candidates' },
          { label: candidate.full_name, href: `/candidates/${candidate.id}` },
          { label: 'Edit Profile' },
        ]}
      />

      <CandidateForm initialData={candidate} />
    </div>
  );
};

