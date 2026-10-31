const TOKEN_STORAGE_KEY = 'vinfonette_portal_jwt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Do not set Content-Type if body is FormData (browser will set multipart boundary)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage = typeof data === 'object' && data?.error ? data.error : response.statusText || 'API Request failed';
    throw new Error(errorMessage);
  }

  return data as T;
}

export const api = {
  // Auth
  getSetupStatus: () => apiRequest<{ setupRequired: boolean; userCount: number; mode: string; message: string }>('/api/auth/setup-status'),
  setupAdmin: (data: { email: string; password: string; full_name: string; title?: string; phone?: string }) =>
    apiRequest<{ message: string; token: string; user: any }>('/api/auth/setup-admin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: (credentials: { email: string; password: string }) =>
    apiRequest<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => apiRequest<{ user: any }>('/api/auth/me'),
  logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
  seedDemo: () => apiRequest<{ message: string }>('/api/auth/seed-demo', { method: 'POST' }),

  // Candidates
  getCandidates: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest<{ candidates: any[] }>(`/api/candidates${qs}`);
  },
  getCandidate: (id: string) => apiRequest<{ candidate: any; activities: any[]; applications: any[]; interviews: any[]; offers: any[]; placement: any; tasks: any[] }>(`/api/candidates/${id}`),
  createCandidate: (data: any) => apiRequest<{ candidate: any }>('/api/candidates', { method: 'POST', body: JSON.stringify(data) }),
  updateCandidate: (id: string, data: any) => apiRequest<{ candidate: any }>(`/api/candidates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateCandidateStage: (id: string, newStage: string, note?: string) =>
    apiRequest<{ candidate: any }>(`/api/candidates/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ newStage, note }) }),
  archiveCandidate: (id: string) => apiRequest(`/api/candidates/${id}`, { method: 'DELETE' }),

  // Companies
  getCompanies: () => apiRequest<{ companies: any[] }>('/api/companies'),
  getCompany: (id: string) => apiRequest<{ company: any; jobs: any[]; placements: any[] }>(`/api/companies/${id}`),
  createCompany: (data: any) => apiRequest<{ company: any }>('/api/companies', { method: 'POST', body: JSON.stringify(data) }),
  updateCompany: (id: string, data: any) => apiRequest<{ company: any }>(`/api/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Jobs
  getJobs: () => apiRequest<{ jobs: any[] }>('/api/jobs'),
  getJob: (id: string) => apiRequest<{ job: any; applications: any[] }>(`/api/jobs/${id}`),
  createJob: (data: any) => apiRequest<{ job: any }>('/api/jobs', { method: 'POST', body: JSON.stringify(data) }),
  updateJob: (id: string, data: any) => apiRequest<{ job: any }>(`/api/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Applications
  getApplications: () => apiRequest<{ applications: any[] }>('/api/applications'),
  createApplication: (candidate_id: string, job_id: string, notes?: string) =>
    apiRequest<{ application: any }>('/api/applications', { method: 'POST', body: JSON.stringify({ candidate_id, job_id, notes }) }),
  updateApplicationStatus: (id: string, status: string) =>
    apiRequest<{ application: any }>(`/api/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Interviews
  getInterviews: () => apiRequest<{ interviews: any[] }>('/api/interviews'),
  scheduleInterview: (data: any) => apiRequest<{ interview: any }>('/api/interviews', { method: 'POST', body: JSON.stringify(data) }),
  updateInterview: (id: string, data: any) => apiRequest<{ interview: any }>(`/api/interviews/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  recordFeedback: (id: string, feedback: string, result: string, next_round?: string) =>
    apiRequest<{ interview: any }>(`/api/interviews/${id}/feedback`, { method: 'POST', body: JSON.stringify({ feedback, result, next_round }) }),

  // Offers
  getOffers: () => apiRequest<{ offers: any[] }>('/api/offers'),
  createOffer: (data: any) => apiRequest<{ offer: any }>('/api/offers', { method: 'POST', body: JSON.stringify(data) }),
  updateOfferStatus: (id: string, status: string, rejection_reason?: string) =>
    apiRequest<{ offer: any }>(`/api/offers/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, rejection_reason }) }),

  // Placements
  getPlacements: () => apiRequest<{ placements: any[] }>('/api/placements'),
  confirmPlacement: (data: any) => apiRequest<{ placement: any }>('/api/placements', { method: 'POST', body: JSON.stringify(data) }),

  // Tasks
  getTasks: (params?: { owner_id?: string; status?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest<{ tasks: any[] }>(`/api/tasks${qs}`);
  },
  createTask: (data: any) => apiRequest<{ task: any }>('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, data: any) => apiRequest<{ task: any }>(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleTask: (id: string) => apiRequest<{ task: any }>(`/api/tasks/${id}/toggle`, { method: 'PATCH' }),

  // Team
  getTeam: () => apiRequest<{ team: any[] }>('/api/team'),
  inviteMember: (data: any) => apiRequest<{ member: any; temporaryPassword?: string }>('/api/team', { method: 'POST', body: JSON.stringify(data) }),
  updateMember: (id: string, data: any) => apiRequest<{ member: any }>(`/api/team/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Reports
  getReports: () => apiRequest<{ metrics: any; stageBreakdown: any[]; batchBreakdown: any[]; topCompanies: any[] }>('/api/reports/metrics'),

  // Notifications
  getNotifications: () => apiRequest<{ notifications: any[] }>('/api/notifications'),
  markNotificationRead: (id: string) => apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => apiRequest('/api/notifications/read-all', { method: 'PATCH' }),

  // Audit Logs
  getAuditLogs: (params?: { action?: string; entity_type?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest<{ auditLogs: any[] }>(`/api/audit${qs}`);
  },

  // Resumes & Documents
  uploadResume: (candidateId: string, file: File) => {
    const formData = new FormData();
    formData.append('resume', file);
    return apiRequest<{ message: string; resumeUrl: string; resumeFilename: string; originalName: string }>(
      `/api/resumes/${candidateId}`,
      { method: 'POST', body: formData }
    );
  },
  uploadDocument: (candidateId: string, docType: 'education_certificate' | 'experience_certificate' | 'resume', file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest<{ message: string; docType: string; url: string; filename: string; originalName: string }>(
      `/api/documents/upload/${candidateId}/${docType}`,
      { method: 'POST', body: formData }
    );
  },

  // Backups
  getBackupInfo: () =>
    apiRequest<{
      dataDir: string;
      dbPath: string;
      dbSizeBytes: number;
      resumesDir: string;
      resumesCount: number;
      resumesSizeBytes: number;
      backupsDir: string;
      backups: any[];
      privacyNotice: string;
    }>('/api/backup/info'),
  createBackup: () => apiRequest<{ message: string; backupId: string; destination: string; manifest: any }>('/api/backup/create', { method: 'POST' }),
  restoreBackup: (backupId: string) => apiRequest<{ message: string; backupId: string }>('/api/backup/restore', { method: 'POST', body: JSON.stringify({ backupId }) }),
};
