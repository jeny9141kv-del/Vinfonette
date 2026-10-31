import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole, Candidate } from '../lib/types';
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../lib/api';

interface AuthContextType {
  user: Profile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSetupRequired: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  setupAdmin: (data: { email: string; password: string; full_name: string; title?: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  seedDemoData: () => Promise<void>;
  checkSetupStatus: () => Promise<void>;

  // Authorization Permission Helpers (Enforced both in backend and UI)
  isAdmin: boolean;
  isCoordinator: boolean;
  isManagement: boolean;
  isTrainer: boolean;
  canEditCandidate: (candidate?: Candidate | null) => boolean;
  canManageCompanies: boolean;
  canAccessAuditLogs: boolean;
  canManagePlacements: boolean;
  canManageSettings: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupRequired, setIsSetupRequired] = useState(false);

  const checkSetupStatus = async () => {
    try {
      const status = await api.getSetupStatus();
      setIsSetupRequired(status.setupRequired);
    } catch (err) {
      console.warn('Could not contact local backend on http://127.0.0.1:4000:', err);
    }
  };

  useEffect(() => {
    async function initAuth() {
      setIsLoading(true);
      try {
        // 1. Check if first-run setup is required
        const status = await api.getSetupStatus();
        setIsSetupRequired(status.setupRequired);

        // 2. If token exists, restore session from local backend
        const token = getStoredToken();
        if (token && !status.setupRequired) {
          try {
            const { user: profile } = await api.getMe();
            if (profile) {
              setUser(profile as Profile);
              setIsLoading(false);
              return;
            }
          } catch {
            clearStoredToken();
          }
        }
      } catch (err) {
        console.warn('Backend connection error during auth init:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, password = ''): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      setStoredToken(res.token);
      setUser(res.user as Profile);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Invalid credentials' };
    }
  };

  const setupAdmin = async (data: {
    email: string;
    password: string;
    full_name: string;
    title?: string;
    phone?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await api.setupAdmin(data);
      setStoredToken(res.token);
      setUser(res.user as Profile);
      setIsSetupRequired(false);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Setup failed' };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {}
    clearStoredToken();
    setUser(null);
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    return {
      success: true,
      message: `Password reset request registered for ${email}. Since the application operates in private local-first mode without external mail relays, your local administrator can update or reset credentials directly under Team & Access.`,
    };
  };

  const seedDemoData = async () => {
    await api.seedDemo();
    await checkSetupStatus();
  };

  const role: UserRole = user?.role || 'PLACEMENT_COORDINATOR';
  const isAdmin = role === 'ADMIN';
  const isCoordinator = role === 'PLACEMENT_COORDINATOR';
  const isManagement = role === 'MANAGEMENT';
  const isTrainer = role === 'TRAINER';

  const canEditCandidate = (candidate?: Candidate | null): boolean => {
    if (!user || !candidate) return false;
    if (isAdmin) return true;
    if (isCoordinator) {
      return !candidate.coordinator_id || candidate.coordinator_id === user.id;
    }
    if (isTrainer) {
      return candidate.trainer_id === user.id;
    }
    return false; // Management is strictly read-only
  };

  const canManageCompanies = isAdmin || isCoordinator;
  const canAccessAuditLogs = isAdmin || isManagement;
  const canManagePlacements = isAdmin || isCoordinator;
  const canManageSettings = isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: Boolean(user),
        isLoading,
        isSetupRequired,
        login,
        setupAdmin,
        logout,
        resetPassword,
        seedDemoData,
        checkSetupStatus,
        isAdmin,
        isCoordinator,
        isManagement,
        isTrainer,
        canEditCandidate,
        canManageCompanies,
        canAccessAuditLogs,
        canManagePlacements,
        canManageSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
