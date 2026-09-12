/**
 * Ente Ward - Secure Authentication Service
 * User-facing: USERNAME + PASSWORD
 * Underlying provider: Supabase Auth
 * Strictly resolves username -> internal Supabase Auth identity without storing plaintext passwords.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { UserProfile } from '../types/auth';
import { wardService } from './wardService';

const AUTH_STORAGE_KEY = 'enteward_active_session';

class AuthService {
  private currentUser: UserProfile | null = null;

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch (_e) {
      this.currentUser = null;
    }
  }

  private saveSession(user: UserProfile | null): void {
    this.currentUser = user;
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  public setCurrentUser(user: UserProfile | null): void {
    this.saveSession(user);
  }

  /**
   * Resolves a user-facing username to its internal Supabase Auth identity.
   * Internal Auth emails are strictly kept internal and never exposed to the user.
   */
  public async resolveInternalEmail(username: string): Promise<string> {
    const clean = username.trim().toLowerCase();

    // 1. Admin account maps to designated platform administrator
    if (clean === 'admin') {
      return 'mshibin042@gmail.com';
    }

    // 2. If user already typed an email (backward compatibility)
    if (clean.includes('@')) {
      return clean;
    }

    // 3. Look up in public.profiles table by username
    if (isSupabaseConfigured) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, username')
          .ilike('username', clean)
          .maybeSingle();

        if (profile?.email) {
          return profile.email;
        }
      } catch (_err) {
        // Fallback to deterministic mapping if profiles column query fails
      }
    }

    // 4. Deterministic internal Auth identity mapping
    return `${clean}@enteward.internal`;
  }

  /**
   * Signs in a user using USERNAME + PASSWORD.
   * Uses Supabase Auth under the hood.
   * Error message is uniform: "Incorrect username or password." (never reveals existence).
   */
  public async signIn(
    usernameInput: string,
    password: string,
    expectedRole?: 'resident' | 'representative' | 'admin'
  ): Promise<{
    user: UserProfile;
    error: string | null;
  }> {
    const cleanUsername = usernameInput.trim().toLowerCase();

    if (!cleanUsername || !password) {
      return {
        user: null as unknown as UserProfile,
        error: 'Incorrect username or password.'
      };
    }

    // Validate username characters (3-30 chars, no spaces)
    if (!cleanUsername.includes('@') && (!/^[a-z0-9_-]{3,30}$/.test(cleanUsername))) {
      return {
        user: null as unknown as UserProfile,
        error: 'Incorrect username or password.'
      };
    }

    if (isSupabaseConfigured) {
      try {
        const internalEmail = await this.resolveInternalEmail(cleanUsername);

        let authData: any = null;
        let authError: any = null;

        const authResult = await supabase.auth.signInWithPassword({
          email: internalEmail,
          password
        });
        authData = authResult.data;
        authError = authResult.error;

        // If admin failed with designated email, also attempt fallback internal identity
        if (authError && cleanUsername === 'admin' && internalEmail !== 'admin@enteward.internal') {
          const fallbackRes = await supabase.auth.signInWithPassword({
            email: 'admin@enteward.internal',
            password
          });
          if (!fallbackRes.error && fallbackRes.data?.user) {
            authData = fallbackRes.data;
            authError = null;
          }
        }

        if (authError || !authData?.user) {
          return {
            user: null as unknown as UserProfile,
            error: 'Incorrect username or password.'
          };
        }

        // 2. Fetch authoritative profile from Supabase
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        const userMetadata = authData.user.user_metadata || {};
        const resolvedRole: 'resident' | 'representative' | 'admin' =
          profile?.role ||
          userMetadata.role ||
          (cleanUsername === 'admin' ? 'admin' : 'resident');

        // Verify requested role matches authorized role
        if (expectedRole && resolvedRole !== expectedRole) {
          return {
            user: null as unknown as UserProfile,
            error: 'Incorrect username or password.'
          };
        }

        let repRecord: any = null;
        if (resolvedRole === 'representative') {
          const reps = await wardService.getRepresentatives();
          repRecord = reps.find(r => 
            r.id === authData.user.id || 
            r.username?.toLowerCase() === cleanUsername ||
            r.email.toLowerCase() === internalEmail
          );
        }

        let membershipWardId = profile?.ward_id || userMetadata.ward_id || repRecord?.wardId;
        if (!membershipWardId) {
          try {
            const { data: mem } = await supabase
              .from('ward_memberships')
              .select('ward_id')
              .eq('user_id', authData.user.id)
              .maybeSingle();
            if (mem?.ward_id) {
              membershipWardId = mem.ward_id;
            }
          } catch (_e) {}
        }

        const userProfile: UserProfile = {
          id: authData.user.id,
          username: profile?.username || userMetadata.username || cleanUsername,
          email: internalEmail,
          fullName: profile?.full_name || userMetadata.full_name || repRecord?.fullName || (cleanUsername === 'admin' ? 'Mohammed Shibin PT' : 'വാർഡ് പൗരൻ'),
          fullNameMl: profile?.full_name_ml,
          role: resolvedRole,
          wardId: membershipWardId || 'ward-01',
          wardNumber: repRecord?.wardNumber || profile?.ward_number || userMetadata.ward_number || 1,
          wardNameMl: repRecord?.wardNameMl || profile?.ward_name_ml || userMetadata.ward_name_ml || `വാർഡ് ${repRecord?.wardNumber || profile?.ward_number || userMetadata.ward_number || 1}`,
          localBodyName: repRecord?.localBodyName || profile?.local_body_name || userMetadata.local_body_name || 'കുലുക്കല്ലൂർ ഗ്രാമപഞ്ചായത്ത്',
          district: repRecord?.districtName || profile?.district || userMetadata.district || 'Palakkad',
          phone: profile?.phone || userMetadata.phone || repRecord?.phone,
          createdAt: profile?.created_at || authData.user.created_at || new Date().toISOString()
        };

        this.saveSession(userProfile);
        return { user: userProfile, error: null };
      } catch (_err) {
        return {
          user: null as unknown as UserProfile,
          error: 'Incorrect username or password.'
        };
      }
    }

    return {
      user: null as unknown as UserProfile,
      error: 'Supabase authentication service is not configured.'
    };
  }

  public async signOut(): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut notice:', err);
      }
    }
    this.saveSession(null);
  }
}

export const authService = new AuthService();
