import { Company, JobApplication, JobOpening } from './types';

export function getRemainingVacancies(job: JobOpening, applications: JobApplication[]): number {
  const hiredCandidates = applications.filter(
    (application) => application.job_id === job.id && application.status === 'Hired',
  ).length;

  return Math.max(0, Number(job.vacancies || 0) - hiredCandidates);
}

export function isJobCurrentlyAvailable(
  job: JobOpening,
  company: Company | undefined,
  applications: JobApplication[],
  now = new Date(),
): boolean {
  if (!company || !['ACTIVE', 'PARTNERED'].includes(company.status) || job.status !== 'OPEN') {
    return false;
  }

  if (job.application_deadline) {
    const deadline = new Date(`${job.application_deadline.slice(0, 10)}T23:59:59`);
    if (!Number.isNaN(deadline.getTime()) && deadline < now) return false;
  }

  return getRemainingVacancies(job, applications) > 0;
}
