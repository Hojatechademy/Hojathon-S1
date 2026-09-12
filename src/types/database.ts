/**
 * Ente Ward (എന്റെ വാർഡ്) - Domain & Database Types
 * Modeled for Supabase PostgreSQL compatibility.
 */

export type UserRole = 'resident' | 'representative' | 'admin';

export type IssueStatus = 
  | 'submitted' 
  | 'triaged' 
  | 'in_progress' 
  | 'action_taken' 
  | 'resolved' 
  | 'rejected';

export type IssueCategory = 
  | 'roads' 
  | 'streetlights' 
  | 'water_supply' 
  | 'sanitation' 
  | 'drainage' 
  | 'public_health' 
  | 'other';

export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Ward {
  id: string;
  wardNumber: number;
  nameMl: string;
  nameEn: string;
  localBodyName: string;
  district: string;
  representativeId?: string;
  createdAt?: string;
}

export interface Profile {
  id: string;
  username?: string;
  fullName: string;
  phoneNumber?: string;
  email?: string;
  role: UserRole;
  wardId: string;
  houseName?: string;
  createdAt?: string;
}

export interface WardMembership {
  id: string;
  userId: string;
  wardId: string;
  isVerified: boolean;
  role: UserRole;
  joinedAt: string;
}

export interface Issue {
  id: string;
  issueNumber: string; // e.g. EW-W04-2026-001
  wardId: string;
  residentId: string;
  titleMl: string;
  descriptionMl: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  locationLandmark?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  assignedTo?: string;
  resolvedAt?: string;
  resolutionRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IssueTimeline {
  id: string;
  issueId: string;
  status: IssueStatus;
  actorId: string;
  actorRole: UserRole | 'system' | 'agent';
  titleMl: string;
  remarksMl?: string;
  createdAt: string;
}

export interface IssueEvidence {
  id: string;
  issueId: string;
  uploadedBy: string;
  mediaType: 'image' | 'document' | 'video';
  mediaUrl: string;
  captionMl?: string;
  stage: 'before' | 'in_progress' | 'after';
  createdAt: string;
}

export interface WardNotification {
  id: string;
  recipientId: string;
  recipientRole: UserRole;
  issueId?: string;
  titleMl: string;
  bodyMl: string;
  isRead: boolean;
  createdAt: string;
}

export interface WardContact {
  id: string;
  wardId: string;
  name: string;
  designation: string;
  phone: string;
  email?: string;
  description?: string;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type GovernmentContactLevel = 
  | 'minister' 
  | 'district_collector' 
  | 'senior_official' 
  | 'secretariat';

export interface GovernmentContact {
  id: string;
  name: string;
  designation: string;
  department?: string;
  level: GovernmentContactLevel;
  district?: string;
  phone: string | null;
  email?: string;
  website?: string;
  description?: string;
  sourceName: string;
  sourceUrl?: string;
  lastVerified: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResidentRecord {
  id: string;
  username?: string;
  fullName: string;
  email: string;
  phone?: string;
  wardId: string;
  wardNumber: number;
  wardNameMl?: string;
  localBodyName?: string;
  district?: string;
  status: 'Active' | 'Pending';
  createdAt: string;
}
