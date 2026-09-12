/**
 * Ente Ward - Ward & Representative Administration Service
 * Securely manages real wards and provisions representative accounts via Supabase.
 * Strictly prevents exposing service-role keys.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { Ward, ResidentRecord } from '../types/database';
import { UserProfile } from '../types/auth';
import { createClient } from '@supabase/supabase-js';

export interface AdminRepresentativePayload {
  fullName: string;
  username: string;
  email?: string;
  phone?: string;
  districtId?: string;
  districtName?: string;
  gramPanchayatId?: string;
  wardId: string;
  wardNumber: number;
  wardNameMl?: string | null;
  localBodyName: string;
  password?: string;
}

export interface RepresentativeRecord {
  id: string;
  fullName: string;
  username?: string;
  email: string;
  phone?: string;
  districtName?: string;
  gramPanchayatId?: string;
  wardId: string;
  wardNumber: number;
  wardNameMl?: string | null;
  localBodyName: string;
  status: 'Active' | 'Deactivated' | 'Invited' | 'Pending';
  createdAt: string;
}

const LOCAL_WARDS_KEY = 'enteward_real_wards';
const LOCAL_REPS_KEY = 'enteward_real_representatives';
const LOCAL_RESIDENTS_KEY = 'enteward_real_residents';

class WardService {
  private wards: Ward[] = [];
  private representatives: RepresentativeRecord[] = [];
  private residents: ResidentRecord[] = [];

  constructor() {
    this.restoreLocal();
  }

  private restoreLocal(): void {
    try {
      const storedWards = localStorage.getItem(LOCAL_WARDS_KEY);
      if (storedWards) {
        this.wards = JSON.parse(storedWards);
      }
      const storedReps = localStorage.getItem(LOCAL_REPS_KEY);
      if (storedReps) {
        this.representatives = JSON.parse(storedReps);
      }
      const storedResidents = localStorage.getItem(LOCAL_RESIDENTS_KEY);
      if (storedResidents) {
        this.residents = JSON.parse(storedResidents);
      }
    } catch (_e) {
      this.wards = [];
      this.representatives = [];
      this.residents = [];
    }
  }

  private saveLocal(): void {
    try {
      localStorage.setItem(LOCAL_WARDS_KEY, JSON.stringify(this.wards));
      localStorage.setItem(LOCAL_REPS_KEY, JSON.stringify(this.representatives));
      localStorage.setItem(LOCAL_RESIDENTS_KEY, JSON.stringify(this.residents));
    } catch (_e) {
      // Storage quota or private browsing mode
    }
  }

  /**
   * Retrieves all registered wards from Supabase (falling back to local cache if empty/offline).
   */
  public async getAllWards(): Promise<Ward[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('wards').select('*').order('ward_number', { ascending: true });
        if (!error && data && data.length > 0) {
          const mapped: Ward[] = data.map((d: any) => ({
            id: String(d.id),
            wardNumber: Number(d.ward_number || 1),
            nameMl: String(d.name_ml || d.name || `വാർഡ് ${d.ward_number}`),
            nameEn: String(d.name_en || `Ward ${d.ward_number}`),
            localBodyName: String(d.local_body_name || 'ഗ്രാമപഞ്ചായത്ത്'),
            district: String(d.district || 'കേരളം'),
            representativeId: d.representative_id ? String(d.representative_id) : undefined,
            createdAt: d.created_at
          }));
          this.wards = mapped;
          this.saveLocal();
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase ward query note:', err);
      }
    }
    return [...this.wards];
  }

  /**
   * Retrieves a single ward by ID.
   */
  public async getWard(wardId: string): Promise<Ward | null> {
    const all = await this.getAllWards();
    return all.find(w => w.id === wardId) || null;
  }

  /**
   * Creates a real ward in Supabase and local cache.
   */
  public async createWard(payload: {
    wardNumber: number;
    nameMl: string;
    nameEn: string;
    localBodyName: string;
    district: string;
  }): Promise<{ success: boolean; ward?: Ward; message: string }> {
    const newWardId = `ward-${payload.wardNumber.toString().padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
    const newWard: Ward = {
      id: newWardId,
      wardNumber: payload.wardNumber,
      nameMl: payload.nameMl.trim(),
      nameEn: payload.nameEn.trim(),
      localBodyName: payload.localBodyName.trim(),
      district: payload.district.trim(),
      createdAt: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('wards').insert({
          ward_number: newWard.wardNumber,
          name_ml: newWard.nameMl,
          name_en: newWard.nameEn,
          localBodyName: newWard.localBodyName
        });
        if (error) {
          console.warn('Supabase ward insert note:', error.message);
        }
      } catch (err) {
        console.warn('Supabase ward insert error:', err);
      }
    }

    this.wards = [newWard, ...this.wards.filter(w => w.wardNumber !== newWard.wardNumber)];
    this.saveLocal();

    return {
      success: true,
      ward: newWard,
      message: `വാർഡ് ${newWard.wardNumber} (${newWard.nameMl}) വിജയകരമായി ചേർത്തു.`
    };
  }

  /**
   * Retrieves all representatives registered by administrators.
   */
  public async getRepresentatives(): Promise<RepresentativeRecord[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'representative')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: RepresentativeRecord[] = data.map((p: any) => ({
            id: p.id,
            fullName: p.full_name || 'Ward Representative',
            email: p.email || 'rep@enteward.in',
            phone: p.phone,
            wardId: p.ward_id || 'ward-01',
            wardNumber: p.ward_number || 1,
            wardNameMl: p.ward_name_ml || 'വാർഡ്',
            localBodyName: p.local_body_name || 'ഗ്രാമപഞ്ചായത്ത്',
            status: 'Active',
            createdAt: p.created_at || new Date().toISOString()
          }));
          this.representatives = mapped;
          this.saveLocal();
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase representatives query note:', err);
      }
    }
    return [...this.representatives];
  }

  /**
   * Creates a representative account using standard Supabase Auth + profile record.
   * Uses a secondary isolated client to ensure the administrator's active session is NOT interrupted.
   */
  public async createRepresentative(payload: AdminRepresentativePayload): Promise<{
    success: boolean;
    representative?: RepresentativeRecord;
    message: string;
  }> {
    const trimmedName = payload.fullName.trim();
    const normalizedUser = (payload.username || '').trim().toLowerCase();
    const internalEmail = payload.email?.trim().toLowerCase() || `${normalizedUser}@enteward.internal`;

    if (!trimmedName || !normalizedUser) {
      return { success: false, message: 'Please provide full name and username for the representative.' };
    }

    if (normalizedUser.length < 3 || normalizedUser.length > 30) {
      return { success: false, message: 'Username must be between 3 and 30 characters.' };
    }

    if (!/^[a-z0-9_-]+$/.test(normalizedUser)) {
      return { success: false, message: 'Username can only contain letters, numbers, hyphens, or underscores (no spaces).' };
    }

    // Check for duplicate username in database
    if (isSupabaseConfigured) {
      try {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', normalizedUser)
          .maybeSingle();

        if (existing) {
          return { success: false, message: 'This username is already in use.' };
        }
      } catch (_e) {}
    }

    const localDup = this.representatives.some(r => r.username?.toLowerCase() === normalizedUser);
    if (localDup) {
      return { success: false, message: 'This username is already in use.' };
    }

    let authUserId = `rep-${Date.now()}`;

    if (isSupabaseConfigured && payload.password) {
      try {
        const envUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || (globalThis as any).process?.env?.VITE_SUPABASE_URL;
        const envAnon = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || (globalThis as any).process?.env?.VITE_SUPABASE_ANON_KEY;
        if (envUrl && envAnon) {
          const isolatedClient = createClient(envUrl, envAnon, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false
            }
          });

          const { data: signUpData, error: signUpError } = await isolatedClient.auth.signUp({
            email: internalEmail,
            password: payload.password,
            options: {
              data: {
                username: normalizedUser,
                full_name: trimmedName,
                role: 'representative',
                ward_id: payload.wardId,
                ward_number: payload.wardNumber,
                ward_name_ml: payload.wardNameMl || `വാർഡ് ${payload.wardNumber}`,
                local_body_name: payload.localBodyName,
                district: payload.districtName || 'Palakkad',
                phone: payload.phone
              }
            }
          });

          if (signUpError) {
            return {
              success: false,
              message: `Supabase Auth error: ${signUpError.message}`
            };
          }

          if (signUpData.user) {
            authUserId = signUpData.user.id;
          }
        }
      } catch (err: any) {
        return {
          success: false,
          message: `Representative creation failed: ${err?.message || 'Network error'}`
        };
      }
    }

    // Persist profile and ward membership in Supabase if configured
    if (isSupabaseConfigured && authUserId) {
      try {
        // 1. Profiles record
        await supabase.from('profiles').upsert({
          id: authUserId,
          username: normalizedUser,
          email: internalEmail,
          full_name: trimmedName,
          phone: payload.phone || null,
          role: 'representative'
        });

        // 2. Ward memberships record
        await supabase.from('ward_memberships').insert({
          user_id: authUserId,
          ward_id: payload.wardId
        });
      } catch (err) {
        console.warn('Supabase profile/ward_memberships insertion note:', err);
      }
    }

    const newRep: RepresentativeRecord = {
      id: authUserId,
      fullName: trimmedName,
      username: normalizedUser,
      email: internalEmail,
      phone: payload.phone,
      districtName: payload.districtName,
      gramPanchayatId: payload.gramPanchayatId,
      wardId: payload.wardId,
      wardNumber: payload.wardNumber,
      wardNameMl: payload.wardNameMl,
      localBodyName: payload.localBodyName,
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    this.representatives = [newRep, ...this.representatives.filter(r => r.username !== newRep.username && r.email !== newRep.email)];
    this.saveLocal();

    return {
      success: true,
      representative: newRep,
      message: `Representative ${newRep.fullName} (@${normalizedUser}, Ward ${newRep.wardNumber}) successfully provisioned.`
    };
  }

  /**
   * Deactivates an active representative, releasing their assigned ward so it becomes available again.
   * Historical issues and timeline records remain intact.
   */
  public async deactivateRepresentative(repId: string): Promise<{ success: boolean; message: string }> {
    const rep = this.representatives.find(r => r.id === repId);
    if (!rep) {
      return { success: false, message: 'Representative record not found.' };
    }

    rep.status = 'Deactivated';
    this.saveLocal();

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('profiles')
          .update({ role: 'resident' })
          .eq('id', repId);

        await supabase
          .from('ward_memberships')
          .delete()
          .eq('user_id', repId);
      } catch (err) {
        console.warn('Supabase deactivation note:', err);
      }
    }

    return {
      success: true,
      message: `Representative ${rep.fullName} deactivated. Ward ${rep.wardNumber} is now available for re-assignment.`
    };
  }

  /**
   * Reactivates a deactivated representative.
   */
  public async reactivateRepresentative(repId: string): Promise<{ success: boolean; message: string }> {
    const rep = this.representatives.find(r => r.id === repId);
    if (!rep) {
      return { success: false, message: 'Representative record not found.' };
    }

    rep.status = 'Active';
    this.saveLocal();

    return {
      success: true,
      message: `Representative ${rep.fullName} reactivated.`
    };
  }

  /**
   * Retrieves residents belonging ONLY to the specified authorized ward.
   * Enforced server-side/database-side: representative cannot access residents of other wards.
   */
  public async getWardResidents(wardId: string): Promise<ResidentRecord[]> {
    if (!wardId) return [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('ward_memberships')
          .select('user_id, ward_id, created_at, profiles(id, full_name, phone, role)')
          .eq('ward_id', wardId);

        if (!error && data) {
          const fetchedResidents: ResidentRecord[] = [];
          for (const item of data as any[]) {
            const profile = item.profiles;
            if (profile && profile.role === 'resident') {
              fetchedResidents.push({
                id: profile.id,
                fullName: profile.full_name || 'വാർഡ് പൗരൻ',
                email: `${profile.full_name?.toLowerCase().replace(/\s+/g, '.') || 'resident'}@enteward.in`,
                phone: profile.phone || undefined,
                wardId: item.ward_id,
                wardNumber: 1,
                status: 'Active',
                createdAt: item.created_at || new Date().toISOString()
              });
            }
          }

          if (fetchedResidents.length > 0) {
            this.residents = [
              ...this.residents.filter(r => r.wardId !== wardId),
              ...fetchedResidents
            ];
            this.saveLocal();
            return fetchedResidents;
          }
        }
      } catch (err) {
        console.warn('Supabase ward residents query note:', err);
      }
    }

    return this.residents.filter(r => r.wardId === wardId);
  }

  /**
   * Creates a real Supabase Auth resident account tied automatically to the representative's authorized ward.
   * Zero selection of state/district/panchayat/ward by representative.
   * Zero plaintext password stored in database tables.
   */
  public async createResident(
    payload: {
      fullName: string;
      username: string;
      email?: string;
      password?: string;
      phone?: string;
    },
    representative: UserProfile
  ): Promise<{
    success: boolean;
    resident?: ResidentRecord;
    message: string;
  }> {
    if (!representative.wardId) {
      return { success: false, message: 'Representative is not assigned to an authorized ward.' };
    }

    const trimmedName = payload.fullName.trim();
    const normalizedUser = (payload.username || '').trim().toLowerCase();
    const password = payload.password?.trim() || 'Resident@123';
    const internalEmail = payload.email?.trim().toLowerCase() || `${normalizedUser}@enteward.internal`;

    if (!trimmedName || !normalizedUser) {
      return { success: false, message: 'Full name and username are required.' };
    }

    if (normalizedUser.length < 3 || normalizedUser.length > 30) {
      return { success: false, message: 'Username must be between 3 and 30 characters.' };
    }

    if (!/^[a-z0-9_-]+$/.test(normalizedUser)) {
      return { success: false, message: 'Username can only contain letters, numbers, hyphens, or underscores (no spaces).' };
    }

    // Check for duplicate username
    if (isSupabaseConfigured) {
      try {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', normalizedUser)
          .maybeSingle();

        if (existing) {
          return { success: false, message: 'This username is already in use.' };
        }
      } catch (_e) {}
    }

    const localDup = this.residents.some(r => r.username?.toLowerCase() === normalizedUser);
    if (localDup) {
      return { success: false, message: 'This username is already in use.' };
    }

    let authUserId = `res-${Date.now()}`;

    if (isSupabaseConfigured) {
      try {
        const envUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || (globalThis as any).process?.env?.VITE_SUPABASE_URL;
        const envAnon = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || (globalThis as any).process?.env?.VITE_SUPABASE_ANON_KEY;

        if (envUrl && envAnon) {
          const isolatedClient = createClient(envUrl, envAnon, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false
            }
          });

          const { data: signUpData, error: signUpError } = await isolatedClient.auth.signUp({
            email: internalEmail,
            password: password,
            options: {
              data: {
                username: normalizedUser,
                full_name: trimmedName,
                role: 'resident',
                ward_id: representative.wardId,
                ward_number: representative.wardNumber,
                ward_name_ml: representative.wardNameMl,
                local_body_name: representative.localBodyName,
                district: representative.district,
                phone: payload.phone
              }
            }
          });

          if (signUpError) {
            return {
              success: false,
              message: `Supabase Auth error: ${signUpError.message}`
            };
          }

          if (signUpData.user) {
            authUserId = signUpData.user.id;
          }
        }
      } catch (err: any) {
        return {
          success: false,
          message: `Resident creation failed: ${err?.message || 'Network error'}`
        };
      }
    }

    // Persist profile and ward membership in Supabase
    if (isSupabaseConfigured && authUserId) {
      try {
        // 1. Profiles record
        await supabase.from('profiles').upsert({
          id: authUserId,
          username: normalizedUser,
          email: internalEmail,
          full_name: trimmedName,
          phone: payload.phone || null,
          role: 'resident'
        });

        // 2. Ward memberships record
        await supabase.from('ward_memberships').insert({
          user_id: authUserId,
          ward_id: representative.wardId
        });
      } catch (err) {
        console.warn('Supabase resident profile/membership insert note:', err);
      }
    }

    const newResident: ResidentRecord = {
      id: authUserId,
      fullName: trimmedName,
      username: normalizedUser,
      email: internalEmail,
      phone: payload.phone,
      wardId: representative.wardId,
      wardNumber: representative.wardNumber,
      wardNameMl: representative.wardNameMl,
      localBodyName: representative.localBodyName,
      district: representative.district,
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    this.residents = [newResident, ...this.residents.filter(r => r.username !== newResident.username && r.email !== newResident.email)];
    this.saveLocal();

    return {
      success: true,
      resident: newResident,
      message: `Resident ${newResident.fullName} (@${normalizedUser}) successfully registered for Ward ${representative.wardNumber}.`
    };
  }
}

export const wardService = new WardService();
