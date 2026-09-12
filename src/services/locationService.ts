/**
 * Ente Ward - Kerala Prototype Location Master Data Service
 * 
 * PROTOTYPE LOCATION DATA:
 * State: Kerala
 * Districts: Palakkad, Ernakulam
 * Panchayats:
 *   - Palakkad: Kulukkallur (1–19), Ongallur (1–24), Koppam (1–20), Alathur (1–18)
 *   - Ernakulam: Kuttampuzha (1–17)
 * 
 * Ward Availability:
 * Available Wards = All Panchayat Wards - Active Assigned Wards
 * (Deactivated representatives release their ward assignment)
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { wardService } from './wardService';

export interface District {
  id: string;
  name: string;
  nameMl: string;
  code: string;
  state: 'Kerala';
}

export interface GramaPanchayat {
  id: string;
  name: string;
  nameMl: string;
  code: string;
  districtId: string;
}

export interface LocationWard {
  id: string;
  wardNumber: number;
  name: string | null;
  displayName: string;
  gramPanchayatId: string;
  localBodyName: string;
}

// 1. Prototype Kerala Districts
export const PROTOTYPE_DISTRICTS: District[] = [
  { id: 'dist-pkd', name: 'Palakkad', nameMl: 'പാലക്കാട്', code: 'PKD', state: 'Kerala' },
  { id: 'dist-ekm', name: 'Ernakulam', nameMl: 'എറണാകുളം', code: 'EKM', state: 'Kerala' }
];

// 2. Prototype Grama Panchayats
export const PROTOTYPE_GRAMA_PANCHAYATS: GramaPanchayat[] = [
  // Palakkad
  { id: 'gp-kulukkallur', name: 'Kulukkallur', nameMl: 'കുലുക്കല്ലൂർ', code: 'G09001', districtId: 'dist-pkd' },
  { id: 'gp-ongallur', name: 'Ongallur', nameMl: 'ഓങ്ങല്ലൂർ', code: 'G09002', districtId: 'dist-pkd' },
  { id: 'gp-koppam', name: 'Koppam', nameMl: 'കൊപ്പാം', code: 'G09003', districtId: 'dist-pkd' },
  { id: 'gp-alathur', name: 'Alathur', nameMl: 'ആലത്തൂർ', code: 'G09004', districtId: 'dist-pkd' },

  // Ernakulam
  { id: 'gp-kuttampuzha', name: 'Kuttampuzha', nameMl: 'കുട്ടമ്പുഴ', code: 'G07001', districtId: 'dist-ekm' }
];

// 3. Helper to generate verified delimitation ward ranges (names left NULL)
function generatePanchayatWards(
  panchayatId: string,
  localBodyName: string,
  totalWards: number
): LocationWard[] {
  const list: LocationWard[] = [];
  for (let i = 1; i <= totalWards; i++) {
    const pad = i.toString().padStart(2, '0');
    list.push({
      id: `ward-${panchayatId.replace('gp-', '')}-${pad}`,
      wardNumber: i,
      name: null, // No invented ward names
      displayName: `Ward ${i}`,
      gramPanchayatId: panchayatId,
      localBodyName
    });
  }
  return list;
}

// 4. Prototype Delimitation Wards (Total: 98 verified wards)
export const PROTOTYPE_WARDS: LocationWard[] = [
  ...generatePanchayatWards('gp-kulukkallur', 'കുലുക്കല്ലൂർ ഗ്രാമപഞ്ചായത്ത് (Kulukkallur GP)', 19),
  ...generatePanchayatWards('gp-ongallur', 'ഓങ്ങല്ലൂർ ഗ്രാമപഞ്ചായത്ത് (Ongallur GP)', 24),
  ...generatePanchayatWards('gp-koppam', 'കൊപ്പാം ഗ്രാമപഞ്ചായത്ത് (Koppam GP)', 20),
  ...generatePanchayatWards('gp-alathur', 'ആലത്തൂർ ഗ്രാമപഞ്ചായത്ത് (Alathur GP)', 18),
  ...generatePanchayatWards('gp-kuttampuzha', 'കുട്ടമ്പുഴ ഗ്രാമപഞ്ചായത്ത് (Kuttampuzha GP)', 17)
];

class LocationService {
  /**
   * Retrieves prototype districts (Palakkad, Ernakulam).
   */
  public async getDistricts(): Promise<District[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('districts').select('*').order('name', { ascending: true });
        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: String(d.id),
            name: String(d.name),
            nameMl: String(d.name_ml || d.name),
            code: String(d.code),
            state: 'Kerala'
          }));
        }
      } catch (err) {
        console.warn('Supabase districts query note:', err);
      }
    }
    return [...PROTOTYPE_DISTRICTS];
  }

  /**
   * Retrieves Grama Panchayats for the selected district.
   */
  public async getGramaPanchayats(districtId: string): Promise<GramaPanchayat[]> {
    if (!districtId) return [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('gram_panchayats')
          .select('*')
          .eq('district_id', districtId)
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((gp: any) => ({
            id: String(gp.id),
            name: String(gp.name),
            nameMl: String(gp.name_ml || gp.name),
            code: String(gp.code || ''),
            districtId: String(gp.district_id)
          }));
        }
      } catch (err) {
        console.warn('Supabase gram_panchayats query note:', err);
      }
    }

    return PROTOTYPE_GRAMA_PANCHAYATS.filter(gp => gp.districtId === districtId);
  }

  /**
   * Retrieves available wards for selected Panchayat.
   * Wards with an ACTIVE representative are filtered out.
   * Deactivated representatives release their ward.
   */
  public async getAvailableWards(panchayatId: string): Promise<{
    availableWards: LocationWard[];
    allWardsCount: number;
    assignedWardsCount: number;
    hasNoMasterData: boolean;
    allAssigned: boolean;
  }> {
    if (!panchayatId) {
      return { availableWards: [], allWardsCount: 0, assignedWardsCount: 0, hasNoMasterData: true, allAssigned: false };
    }

    let allWards: LocationWard[] = [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('wards')
          .select('*')
          .eq('gram_panchayat_id', panchayatId)
          .order('ward_number', { ascending: true });

        if (!error && data && data.length > 0) {
          allWards = data.map((w: any) => ({
            id: String(w.id),
            wardNumber: Number(w.ward_number),
            name: w.name || null,
            displayName: `Ward ${w.ward_number}${w.name ? ` (${w.name})` : ''}`,
            gramPanchayatId: panchayatId,
            localBodyName: String(w.local_body_name || 'ഗ്രാമപഞ്ചായത്ത്')
          }));
        }
      } catch (err) {
        console.warn('Supabase wards query note:', err);
      }
    }

    if (allWards.length === 0) {
      allWards = PROTOTYPE_WARDS.filter(w => w.gramPanchayatId === panchayatId);
    }

    if (allWards.length === 0) {
      return {
        availableWards: [],
        allWardsCount: 0,
        assignedWardsCount: 0,
        hasNoMasterData: true,
        allAssigned: false
      };
    }

    // Check ACTIVE representative assignments
    const reps = await wardService.getRepresentatives();
    const activeAssignedWardIds = new Set<string>();

    for (const rep of reps) {
      // Only ACTIVE representatives hold an assignment. Deactivated ones release it!
      if (rep.status === 'Active' && rep.wardId) {
        activeAssignedWardIds.add(rep.wardId);
      }
    }

    // Filter out active assigned wards
    const availableWards = allWards.filter(w => !activeAssignedWardIds.has(w.id));

    return {
      availableWards,
      allWardsCount: allWards.length,
      assignedWardsCount: activeAssignedWardIds.size,
      hasNoMasterData: false,
      allAssigned: availableWards.length === 0 && allWards.length > 0
    };
  }

  /**
   * Server/Service-side Hierarchy & Duplicate Validation.
   */
  public async validateHierarchy(
    districtId: string,
    panchayatId: string,
    wardId: string
  ): Promise<{ isValid: boolean; error?: string }> {
    const districts = await this.getDistricts();
    const districtExists = districts.some(d => d.id === districtId);
    if (!districtExists) {
      return { isValid: false, error: 'Invalid district selection.' };
    }

    const panchayats = await this.getGramaPanchayats(districtId);
    const panchayatExists = panchayats.some(p => p.id === panchayatId);
    if (!panchayatExists) {
      return { isValid: false, error: 'Selected Grama Panchayat does not belong to the selected District.' };
    }

    const { availableWards, allWardsCount, allAssigned } = await this.getAvailableWards(panchayatId);

    if (allWardsCount === 0) {
      return { isValid: false, error: 'No ward data is available for this Grama Panchayat.' };
    }

    if (allAssigned) {
      return { isValid: false, error: 'All wards in this Grama Panchayat already have active representatives.' };
    }

    const wardIsAvailable = availableWards.some(w => w.id === wardId);
    if (!wardIsAvailable) {
      return { isValid: false, error: 'The selected ward is already assigned to an active representative.' };
    }

    return { isValid: true };
  }
}

export const locationService = new LocationService();
