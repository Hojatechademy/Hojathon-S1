/**
 * Ente Ward - Ward & Administration Service
 */

import { DEMO_WARD } from './mockData';
import { Ward } from '../types/database';

export interface AdminRepresentativePayload {
  fullName: string;
  email: string;
  phone: string;
  wardNumber: number;
  wardNameMl: string;
  localBodyName: string;
}

class WardService {
  private wards: Ward[] = [DEMO_WARD];

  public async getWard(wardId: string): Promise<Ward | null> {
    const found = this.wards.find(w => w.id === wardId);
    return found || DEMO_WARD;
  }

  public async getAllWards(): Promise<Ward[]> {
    return [...this.wards];
  }

  public async createRepresentative(payload: AdminRepresentativePayload): Promise<{ success: boolean; message: string }> {
    // In production this triggers a Supabase Auth invite / admin user creation
    const newWardId = `ward-${payload.wardNumber.toString().padStart(2, '0')}`;
    const newWard: Ward = {
      id: newWardId,
      wardNumber: payload.wardNumber,
      nameEn: `Ward ${payload.wardNumber}`,
      nameMl: payload.wardNameMl,
      localBodyName: payload.localBodyName,
      district: 'തിരുവനന്തപുരം',
      representativeId: `rep-${Date.now()}`
    };

    this.wards.push(newWard);
    return {
      success: true,
      message: `Representative provisioned for Ward ${payload.wardNumber} (${payload.wardNameMl}) - notification dispatched to ${payload.email}.`
    };
  }
}

export const wardService = new WardService();
