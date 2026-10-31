import React from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { CandidateForm } from '../components/candidates/CandidateForm';

export const NewCandidatePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Register New Candidate"
        subtitle="Create an applicant profile with academic background, skills, assigned track, and mentors."
        breadcrumbs={[
          { label: 'Candidates', href: '/candidates' },
          { label: 'Register Candidate' },
        ]}
      />

      <CandidateForm />
    </div>
  );
};
