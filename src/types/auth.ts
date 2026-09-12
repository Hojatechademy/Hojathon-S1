/**
 * Ente Ward (എന്റെ വാർഡ്) - Authentication & User Profile Types
 */

import { UserRole } from './database';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  fullNameMl?: string;
  role: UserRole;
  wardId: string;
  wardNumber: number;
  wardNameMl: string;
  localBodyName: string;
  district: string;
  phone?: string;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  error: string | null;
}

export type AuthView = 
  | 'role-selection'
  | 'resident-login'
  | 'representative-login'
  | 'admin-login';
