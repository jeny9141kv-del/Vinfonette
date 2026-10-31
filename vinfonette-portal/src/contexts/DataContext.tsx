import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Candidate,
  Company,
  JobOpening,
  JobApplication,
  Interview,
  Offer,
  Placement,
  Task,
  NotificationItem,
  CandidateActivity,
  AuditLog,
  TrainingProgram,
  Profile,
  CandidateStage,
  DashboardMetrics,
} from '../lib/types';
import { DEMO_PROGRAMS } from '../lib/demo-data';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { api } from '../lib/api';

interface DataContextType {
  candidates: Candidate[];
  companies: Company[];
  jobs: JobOpening[];
  applications: JobApplication[];
  interviews: Interview[];
  offers: Offer[];
  placements: Placement[];
  tasks: Task[];
  notifications: NotificationItem[];
  activities: CandidateActivity[];
  auditLogs: AuditLog[];
  programs: TrainingProgram[];
  team: Profile[];
  metrics: DashboardMetrics;
  isLoading: boolean;
  refreshData: () => Promise<void>;

  // Candidate Operations
  addCandidate: (candidate: Omit<Candidate, 'id' | 'candidate_id' | 'created_at' | 'updated_at' | 'last_activity_at'>) => Promise<Candidate>;
  updateCandidate: (id: string, updates: Partial<Candidate>) => Promise<void>;
  updateCandidateStage: (id: string, newStage: CandidateStage, note?: string) => Promise<void>;
  archiveCandidate: (id: string) => Promise<void>;

  // Company Operations
  addCompany: (company: Omit<Company, 'id' | 'company_id' | 'created_at' | 'updated_at'>) => Promise<Company>;
  updateCompany: (id: string, updates: Partial<Company>) => Promise<void>;

  // Job Operations
  addJob: (job: Omit<JobOpening, 'id' | 'job_id' | 'created_at' | 'updated_at'>) => Promise<JobOpening>;
  updateJob: (id: string, updates: Partial<JobOpening>) => Promise<void>;

  // Application & Placement Operations
  applyToJob: (candidateId: string, jobId: string, notes?: string) => Promise<JobApplication>;
  updateApplicationStatus: (id: string, status: JobApplication['status']) => Promise<void>;
  scheduleInterview: (interviewData: Omit<Interview, 'id' | 'created_at' | 'updated_at'>) => Promise<Interview>;
  updateInterview: (id: string, updates: Partial<Interview>) => Promise<void>;
  recordInterviewFeedback: (id: string, feedback: string, result: Interview['result'], nextRound?: string) => Promise<void>;
  createOffer: (offerData: Omit<Offer, 'id' | 'created_at' | 'updated_at'>) => Promise<Offer>;
  updateOfferStatus: (id: string, status: Offer['status'], rejectionReason?: string) => Promise<void>;
  confirmPlacement: (placementData: Omit<Placement, 'id' | 'placed_at' | 'created_at' | 'updated_at'>) => Promise<Placement>;

  // Task Operations
  createTask: (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  toggleTaskStatus: (id: string) => Promise<void>;

  // Team & Notifications
  inviteTeamMember: (member: Omit<Profile, 'id' | 'status' | 'created_at' | 'updated_at'>) => Promise<void>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetToDemoData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { success, error, warning } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activities, setActivities] = useState<CandidateActivity[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [programs] = useState<TrainingProgram[]>(DEMO_PROGRAMS);
  const [team, setTeam] = useState<Profile[]>([]);

  // Fetch all live records from the local SQLite database
  const refreshData = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [
        candsRes,
        compsRes,
        jobsRes,
        appsRes,
        intsRes,
        offsRes,
        plcsRes,
        tasksRes,
        notifsRes,
        teamRes,
      ] = await Promise.allSettled([
        api.getCandidates(),
        api.getCompanies(),
        api.getJobs(),
        api.getApplications(),
        api.getInterviews(),
        api.getOffers(),
        api.getPlacements(),
        api.getTasks(),
        api.getNotifications(),
        api.getTeam(),
      ]);

      if (candsRes.status === 'fulfilled') setCandidates(candsRes.value.candidates || []);
      if (compsRes.status === 'fulfilled') setCompanies(compsRes.value.companies || []);
      if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value.jobs || []);
      if (appsRes.status === 'fulfilled') setApplications(appsRes.value.applications || []);
      if (intsRes.status === 'fulfilled') setInterviews(intsRes.value.interviews || []);
      if (offsRes.status === 'fulfilled') setOffers(offsRes.value.offers || []);
      if (plcsRes.status === 'fulfilled') setPlacements(plcsRes.value.placements || []);
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.tasks || []);
      if (notifsRes.status === 'fulfilled') setNotifications(notifsRes.value.notifications || []);
      if (teamRes.status === 'fulfilled') setTeam(teamRes.value.team || []);

      // If admin or management, load audit logs
      if (user?.role === 'ADMIN' || user?.role === 'MANAGEMENT') {
        try {
          const auditRes = await api.getAuditLogs();
          setAuditLogs(auditRes.auditLogs || []);
        } catch {}
      }
    } catch (err) {
      console.warn('Failed to load local SQLite data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Live Metrics Calculation
  const metrics: DashboardMetrics = useMemo(() => {
    const totalRegistered = candidates.length;
    const inTraining = candidates.filter((c) => c.current_stage === 'Training in Progress').length;
    const trainingCompleted = candidates.filter((c) => c.current_stage === 'Training Completed').length;
    const placementReady = candidates.filter((c) => c.current_stage === 'Placement Ready').length;
    const activeApplications = applications.filter((a) => !['Hired', 'Rejected', 'Withdrawn'].includes(a.status)).length;

    const upcomingInterviews = interviews.filter(
      (i) => ['scheduled', 'confirmed'].includes(i.status) && new Date(i.scheduled_at) >= new Date()
    ).length;

    const offersReceived = offers.filter((o) => o.status === 'RECEIVED' || o.status === 'ACCEPTED').length;
    const placedSuccessfully = candidates.filter((c) => c.current_stage === 'Placed Successfully').length;
    const pendingFeedback = interviews.filter((i) => i.status === 'awaiting-feedback').length;

    const overdueTasks = tasks.filter(
      (t) => t.status !== 'Completed' && t.status !== 'Cancelled' && new Date(t.due_date) < new Date()
    ).length;

    const totalPlacedCtc = placements.reduce((sum, p) => sum + (p.ctc || 0), 0);
    const averageCtc = placements.length > 0 ? Math.round(totalPlacedCtc / placements.length) : 0;

    return {
      totalRegistered,
      inTraining,
      trainingCompleted,
      placementReady,
      activeApplications,
      upcomingInterviews,
      offersReceived,
      placedSuccessfully,
      pendingFeedback,
      overdueTasks,
      averageCtc,
    };
  }, [candidates, applications, interviews, offers, placements, tasks]);

  // 1. Add Candidate
  const addCandidate = async (
    candidateData: Omit<Candidate, 'id' | 'candidate_id' | 'created_at' | 'updated_at' | 'last_activity_at'>
  ): Promise<Candidate> => {
    try {
      const res = await api.createCandidate(candidateData);
      const newCand = res.candidate;
      setCandidates((prev) => [newCand, ...prev]);
      success('Candidate Registered', `${newCand.full_name} (${newCand.candidate_id}) saved to local database.`);
      return newCand;
    } catch (err: any) {
      error('Registration Failed', err.message || 'Could not save candidate.');
      throw err;
    }
  };

  // 2. Update Candidate
  const updateCandidate = async (id: string, updates: Partial<Candidate>) => {
    try {
      const res = await api.updateCandidate(id, updates);
      setCandidates((prev) => prev.map((c) => (c.id === id ? res.candidate : c)));
      success('Profile Updated', 'Candidate details saved in local database.');
    } catch (err: any) {
      error('Update Failed', err.message || 'Could not update candidate.');
      throw err;
    }
  };

  // 3. Update Candidate Stage
  const updateCandidateStage = async (id: string, newStage: CandidateStage, note?: string) => {
    try {
      const res = await api.updateCandidateStage(id, newStage, note);
      setCandidates((prev) => prev.map((c) => (c.id === id ? res.candidate : c)));
      success('Stage Updated', `Moved to ${newStage}.`);
    } catch (err: any) {
      error('Stage Transition Rejected', err.message || 'Could not change stage.');
      throw err;
    }
  };

  // 4. Archive Candidate
  const archiveCandidate = async (id: string) => {
    try {
      await api.archiveCandidate(id);
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, placement_status: 'ARCHIVED' } : c))
      );
      success('Candidate Archived', 'Candidate moved to archive.');
    } catch (err: any) {
      error('Archive Failed', err.message || 'Could not archive candidate.');
      throw err;
    }
  };

  // 5. Add Company
  const addCompany = async (
    companyData: Omit<Company, 'id' | 'company_id' | 'created_at' | 'updated_at'>
  ): Promise<Company> => {
    try {
      const res = await api.createCompany(companyData);
      setCompanies((prev) => [res.company, ...prev]);
      success('Company Added', `${res.company.name} saved as hiring partner.`);
      return res.company;
    } catch (err: any) {
      error('Company Creation Failed', err.message);
      throw err;
    }
  };

  // 6. Update Company
  const updateCompany = async (id: string, updates: Partial<Company>) => {
    try {
      const res = await api.updateCompany(id, updates);
      setCompanies((prev) => prev.map((c) => (c.id === id ? res.company : c)));
      success('Company Updated', 'Company details saved.');
    } catch (err: any) {
      error('Update Failed', err.message);
      throw err;
    }
  };

  // 7. Add Job
  const addJob = async (
    jobData: Omit<JobOpening, 'id' | 'job_id' | 'created_at' | 'updated_at'>
  ): Promise<JobOpening> => {
    try {
      const res = await api.createJob(jobData);
      setJobs((prev) => [res.job, ...prev]);
      success('Job Opening Created', `${res.job.title} posted successfully.`);
      return res.job;
    } catch (err: any) {
      error('Job Creation Failed', err.message);
      throw err;
    }
  };

  // 8. Update Job
  const updateJob = async (id: string, updates: Partial<JobOpening>) => {
    try {
      const res = await api.updateJob(id, updates);
      setJobs((prev) => prev.map((j) => (j.id === id ? res.job : j)));
      success('Job Updated', 'Opening details saved.');
    } catch (err: any) {
      error('Update Failed', err.message);
      throw err;
    }
  };

  // 9. Apply to Job
  const applyToJob = async (candidateId: string, jobId: string, notes?: string): Promise<JobApplication> => {
    try {
      const res = await api.createApplication(candidateId, jobId, notes);
      setApplications((prev) => [res.application, ...prev]);
      success('Application Submitted', 'Candidate application registered.');
      return res.application;
    } catch (err: any) {
      warning('Application Notice', err.message || 'Could not submit application.');
      throw err;
    }
  };

  // 10. Update Application Status
  const updateApplicationStatus = async (id: string, newStatus: JobApplication['status']) => {
    try {
      const res = await api.updateApplicationStatus(id, newStatus);
      setApplications((prev) => prev.map((a) => (a.id === id ? res.application : a)));
      success('Status Updated', `Application moved to ${newStatus}.`);
    } catch (err: any) {
      error('Update Failed', err.message);
      throw err;
    }
  };

  // 11. Schedule Interview
  const scheduleInterview = async (
    interviewData: Omit<Interview, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Interview> => {
    try {
      const res = await api.scheduleInterview(interviewData);
      setInterviews((prev) => [...prev, res.interview]);
      success('Interview Scheduled', `${res.interview.round_name} scheduled.`);
      return res.interview;
    } catch (err: any) {
      error('Scheduling Conflict / Error', err.message);
      throw err;
    }
  };

  // 12. Update Interview
  const updateInterview = async (id: string, updates: Partial<Interview>) => {
    try {
      const res = await api.updateInterview(id, updates);
      setInterviews((prev) => prev.map((i) => (i.id === id ? res.interview : i)));
      success('Interview Updated', 'Schedule details updated.');
    } catch (err: any) {
      error('Update Failed', err.message);
      throw err;
    }
  };

  // 13. Record Interview Feedback
  const recordInterviewFeedback = async (
    id: string,
    feedback: string,
    result: Interview['result'],
    nextRound?: string
  ) => {
    try {
      const res = await api.recordFeedback(id, feedback, result || 'PENDING', nextRound);
      setInterviews((prev) => prev.map((i) => (i.id === id ? res.interview : i)));
      success('Feedback Recorded', 'Interview evaluation saved.');
    } catch (err: any) {
      error('Feedback Failed', err.message);
      throw err;
    }
  };

  // 14. Create Offer
  const createOffer = async (offerData: Omit<Offer, 'id' | 'created_at' | 'updated_at'>): Promise<Offer> => {
    try {
      const res = await api.createOffer(offerData);
      setOffers((prev) => [res.offer, ...prev]);
      // Update candidate stage in state
      setCandidates((prev) =>
        prev.map((c) => (c.id === offerData.candidate_id ? { ...c, current_stage: 'Offer Received' } : c))
      );
      success('Offer Logged', `Job offer recorded.`);
      return res.offer;
    } catch (err: any) {
      error('Offer Creation Failed', err.message);
      throw err;
    }
  };

  // 15. Update Offer Status
  const updateOfferStatus = async (id: string, status: Offer['status'], rejectionReason?: string) => {
    try {
      const res = await api.updateOfferStatus(id, status, rejectionReason);
      setOffers((prev) => prev.map((o) => (o.id === id ? res.offer : o)));
      success('Offer Status Updated', `Offer status changed to ${status}.`);
    } catch (err: any) {
      error('Update Failed', err.message);
      throw err;
    }
  };

  // 16. Confirm Placement
  const confirmPlacement = async (
    placementData: Omit<Placement, 'id' | 'placed_at' | 'created_at' | 'updated_at'>
  ): Promise<Placement> => {
    try {
      const res = await api.confirmPlacement(placementData);
      const newPlacement = res.placement;
      setPlacements((prev) => [newPlacement, ...prev]);

      // Candidate moves to Placed Successfully
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === placementData.candidate_id
            ? { ...c, current_stage: 'Placed Successfully', placement_status: 'PLACED' }
            : c
        )
      );

      const comp = companies.find((c) => c.id === placementData.company_id);
      success('Placement Confirmed!', `Candidate placed successfully at ${comp?.name || 'Partner Company'}.`);
      return newPlacement;
    } catch (err: any) {
      error('Placement Confirmation Failed', err.message);
      throw err;
    }
  };

  // 17. Create Task
  const createTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> => {
    try {
      const res = await api.createTask(taskData);
      setTasks((prev) => [res.task, ...prev]);
      success('Task Created', `${res.task.title} created.`);
      return res.task;
    } catch (err: any) {
      error('Task Creation Failed', err.message);
      throw err;
    }
  };

  // 18. Update Task
  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const res = await api.updateTask(id, updates);
      setTasks((prev) => prev.map((t) => (t.id === id ? res.task : t)));
    } catch (err: any) {
      error('Task Update Failed', err.message);
      throw err;
    }
  };

  // 19. Toggle Task Status
  const toggleTaskStatus = async (id: string) => {
    try {
      const res = await api.toggleTask(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? res.task : t)));
    } catch (err: any) {
      error('Toggle Failed', err.message);
      throw err;
    }
  };

  // 20. Team Invitation
  const inviteTeamMember = async (member: Omit<Profile, 'id' | 'status' | 'created_at' | 'updated_at'>) => {
    try {
      const res = await api.inviteMember(member);
      setTeam((prev) => [...prev, res.member]);
      success('Team Member Invited', `${res.member.full_name} (${res.member.role}) registered in local database.`);
    } catch (err: any) {
      error('Invitation Failed', err.message);
      throw err;
    }
  };

  // 21. Notification Operations
  const markNotificationRead = (id: string) => {
    api.markNotificationRead(id).then();
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    api.markAllNotificationsRead().then();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Seed / Reset Demonstration Data
  const resetToDemoData = async () => {
    try {
      await api.seedDemo();
      await refreshData();
      success('Demo Data Loaded', 'Synthetic candidates, companies, and jobs loaded into your private SQLite database.');
    } catch (err: any) {
      error('Seed Failed', err.message);
    }
  };

  return (
    <DataContext.Provider
      value={{
        candidates,
        companies,
        jobs,
        applications,
        interviews,
        offers,
        placements,
        tasks,
        notifications,
        activities,
        auditLogs,
        programs,
        team,
        metrics,
        isLoading,
        refreshData,
        addCandidate,
        updateCandidate,
        updateCandidateStage,
        archiveCandidate,
        addCompany,
        updateCompany,
        addJob,
        updateJob,
        applyToJob,
        updateApplicationStatus,
        scheduleInterview,
        updateInterview,
        recordInterviewFeedback,
        createOffer,
        updateOfferStatus,
        confirmPlacement,
        createTask,
        updateTask,
        toggleTaskStatus,
        inviteTeamMember,
        markNotificationRead,
        markAllNotificationsRead,
        resetToDemoData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
