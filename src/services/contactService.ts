/**
 * Ente Ward - Contact Directory Service
 * 
 * Manages:
 * 1. Ward Contacts: Ward-specific contacts managed by the authorized representative,
 *    visible ONLY to residents of that ward.
 * 2. Government Contacts: Common Kerala Government official contact directory
 *    (Extracted from official 2026 directory PDF: Ministers, District Collectors,
 *    Senior Officials, Secretariat Contacts).
 * 
 * Strict Data Integrity:
 * - Zero invented phone numbers (missing numbers are kept null / "Not listed").
 * - Zero duplicate contacts.
 * - Ward boundaries strictly enforced on representative actions.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { WardContact, GovernmentContact, GovernmentContactLevel } from '../types/database';
import { UserProfile } from '../types/auth';

const LOCAL_WARD_CONTACTS_KEY = 'enteward_ward_contacts';

// Master Kerala Government Contact Directory extracted directly from official PDF (46 records)
export const KERALA_GOVERNMENT_CONTACTS: GovernmentContact[] = [
  // 1. Council of Ministers — 2026 (21 Ministers)
  {
    id: 'gov-min-01',
    name: 'V. D. Satheesan',
    designation: 'Chief Minister',
    department: 'Finance; Planning & Economic Affairs; General Administration; Law; Information & Public Relations; etc.',
    level: 'minister',
    phone: null, // "Not listed" in PDF
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-min-02',
    name: 'P. K. Kunhalikutty',
    designation: 'Minister',
    department: 'Industries & Commerce; IT; AI; Startups; Mining & Geology; Handlooms & Textiles',
    level: 'minister',
    phone: '9947020200',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-min-03',
    name: 'Ramesh Chennithala',
    designation: 'Minister',
    department: 'Home; Vigilance; Fire & Rescue; Prisons; Coir',
    level: 'minister',
    phone: '9447777100',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-min-04',
    name: 'Sunny Joseph',
    designation: 'Minister',
    department: 'Electricity; Environment; Parliamentary Affairs; ANERT',
    level: 'minister',
    phone: '9447046694',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-min-05',
    name: 'K. Muraleedharan',
    designation: 'Minister',
    department: 'Health; Medical Education; Medical University; AYUSH; Food Safety; Devaswoms',
    level: 'minister',
    phone: '9495305555',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-min-06',
    name: 'Mons Joseph',
    designation: 'Minister',
    department: 'Irrigation; CADA; Ground Water; Water Supply & Sanitation; Housing',
    level: 'minister',
    phone: '9447306270',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-min-07',
    name: 'Shibu Baby John',
    designation: 'Minister',
    department: 'Forests & Wildlife; Skill Development; KASE',
    level: 'minister',
    phone: '9539393333',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-min-08',
    name: 'Anoop Jacob',
    designation: 'Minister',
    department: 'Food & Civil Supplies; Consumer Affairs; Legal Metrology',
    level: 'minister',
    phone: '9847069671',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-min-09',
    name: 'C. P. John',
    designation: 'Minister',
    department: 'Road Transport; Motor Vehicles; Water Transport',
    level: 'minister',
    phone: '9447303653',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-min-10',
    name: 'A. P. Anilkumar',
    designation: 'Minister',
    department: 'Land Revenue; Survey & Land Records; Land Reforms',
    level: 'minister',
    phone: null, // "Not listed" in PDF
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-min-11',
    name: 'N. Samsudheen',
    designation: 'Minister',
    department: 'General Education; Literacy; Wakf & Hajj; Minority Welfare',
    level: 'minister',
    phone: null, // "Not listed" in PDF
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-min-12',
    name: 'P. C. Vishnunadh',
    designation: 'Minister',
    department: 'Tourism; Culture; KSFDC; Chalachithra Academy; Cultural Activist Welfare',
    level: 'minister',
    phone: null, // "Not listed" in PDF
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-min-13',
    name: 'Roji M. John',
    designation: 'Minister',
    department: 'Collegiate & Technical Education; Universities; Entrance Examination; NCC; ASAP Kerala',
    level: 'minister',
    phone: '9971392134',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-min-14',
    name: 'Bindhu Krishna',
    designation: 'Minister',
    department: 'Labour; Animal Husbandry; Dairy Development; Women & Child Development; Factories & Boilers; etc.',
    level: 'minister',
    phone: '9447191515',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-min-15',
    name: 'M. Liju',
    designation: 'Minister',
    department: 'Co-operation; Excise',
    level: 'minister',
    phone: '9446344957',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-min-16',
    name: 'K. M. Shaji',
    designation: 'Minister',
    department: 'Panchayat; Municipality; Corporation; Town Planning; Rural Development; KILA',
    level: 'minister',
    phone: null, // "Not listed" in PDF
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-min-17',
    name: 'P. K. Basheer',
    designation: 'Minister',
    department: 'Public Works Department',
    level: 'minister',
    phone: null, // "Not listed" in PDF
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-min-18',
    name: 'V. E. Abdul Gafoor',
    designation: 'Minister',
    department: 'Fisheries; Harbour Engineering; Social Justice',
    level: 'minister',
    phone: null, // "Not listed" in PDF
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-min-19',
    name: 'T. Siddique',
    designation: 'Minister',
    department: 'Agriculture; Soil Survey & Soil Conservation; Kerala Agricultural University; Warehousing',
    level: 'minister',
    phone: null, // "Not listed" in PDF
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-min-20',
    name: 'K. A. Thulasi',
    designation: 'Minister',
    department: 'Development of SC, ST & Backward Classes',
    level: 'minister',
    phone: null, // "Not listed" in PDF
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-min-21',
    name: 'O. J. Janeesh',
    designation: 'Minister',
    department: 'Sports; Youth Affairs; Zoos; Museums; Registration; Archaeology; Archives',
    level: 'minister',
    phone: null, // "Not listed" in PDF
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },

  // 2. District Collectors — All 14 Districts (14 Collectors)
  {
    id: 'gov-col-01',
    name: 'Anu Kumari IAS',
    designation: 'District Collector',
    department: 'District Administration',
    level: 'district_collector',
    district: 'Thiruvananthapuram',
    phone: '0471-2731177 / 0471-2731166 (F)',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-col-02',
    name: 'Anie Jula Thomas IAS',
    designation: 'District Collector',
    department: 'District Administration',
    level: 'district_collector',
    district: 'Kollam',
    phone: '0474-2794900',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-col-03',
    name: 'Shaji V Nair IAS',
    designation: 'District Collector',
    department: 'District Administration',
    level: 'district_collector',
    district: 'Alappuzha',
    phone: '0477-2251720',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-col-04',
    name: 'Nizamudeen A IAS',
    designation: 'District Collector',
    department: 'District Administration',
    level: 'district_collector',
    district: 'Pathanamthitta',
    phone: '0468-2222505',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-col-05',
    name: 'Chetan Kumar Meena IAS',
    designation: 'District Collector',
    department: 'District Administration',
    level: 'district_collector',
    district: 'Kottayam',
    phone: '0481-2562001',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-col-06',
    name: 'Priyanka G IAS',
    designation: 'District Collector',
    department: 'District Administration',
    level: 'district_collector',
    district: 'Ernakulam',
    phone: '0484-2423001',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-col-07',
    name: 'Dinesan Cheruvat IAS',
    designation: 'District Collector',
    department: 'District Administration',
    level: 'district_collector',
    district: 'Idukki',
    phone: '0486-2233103',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-col-08',
    name: 'Sikha Surendran IAS',
    designation: 'District Collector',
    department: 'District Administration',
    level: 'district_collector',
    district: 'Thrissur',
    phone: '0487-2361020',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-col-09',
    name: 'Sudhir K IAS',
    designation: 'District Collector',
    department: 'District Administration',
    level: 'district_collector',
    district: 'Palakkad',
    phone: '0491-2505266',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-col-10',
    name: 'Vinay Goyal IAS',
    designation: 'District Collector',
    department: 'District Administration',
    level: 'district_collector',
    district: 'Malappuram',
    phone: '0483-2734355',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-col-11',
    name: 'Madhavikutty M.S',
    designation: 'District Collector',
    department: 'District Administration',
    level: 'district_collector',
    district: 'Kozhikode',
    phone: '0495-2371400',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-col-12',
    name: 'Meghashree D R IAS',
    designation: 'District Collector',
    department: 'District Administration',
    level: 'district_collector',
    district: 'Wayanad',
    phone: '0493-6202230',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-col-13',
    name: 'Vishnuraj P IAS',
    designation: 'District Collector',
    department: 'District Administration',
    level: 'district_collector',
    district: 'Kannur',
    phone: '0497-2700243',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-col-14',
    name: 'Arjun Pandian IAS',
    designation: 'District Collector',
    department: 'District Administration',
    level: 'district_collector',
    district: 'Kasaragod',
    phone: '0499-4256400',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },

  // 3. Senior Government Officials (8 Officials)
  {
    id: 'gov-off-01',
    name: 'Bishwanath Sinha IAS',
    designation: 'Chief Secretary',
    department: 'General Administration',
    level: 'senior_official',
    phone: '0471-2333147 / 0471-2518181',
    email: 'chiefsecy@kerala.gov.in',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-off-02',
    name: 'Biju K IAS',
    designation: 'Secretary, General Administration Department',
    department: 'General Administration Department',
    level: 'senior_official',
    phone: '0471-2320311 / 0471-2518010',
    email: 'secy.gad@kerala.gov.in',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-off-03',
    name: 'Rajesh G R',
    designation: 'Additional Secretary, All India Services',
    department: 'General Administration Department',
    level: 'senior_official',
    phone: '0471-2518269',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-off-04',
    name: 'Anil Johney',
    designation: 'Additional Secretary, Coordination/Attendance Monitoring',
    department: 'General Administration Department',
    level: 'senior_official',
    phone: '0471-2517023',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-off-05',
    name: 'Santhosh Kumar R',
    designation: 'Additional Secretary, Accounts Division/Cash',
    department: 'General Administration Department',
    level: 'senior_official',
    phone: '0471-2518766',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-off-06',
    name: 'Seena A N',
    designation: 'Additional Secretary, House Keeping Cell',
    department: 'General Administration Department',
    level: 'senior_official',
    phone: '0471-2333276 / 0471-2518759',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-off-07',
    name: 'Geetha S',
    designation: 'Additional Secretary & Joint Chief Protocol Officer',
    department: 'General Administration Department',
    level: 'senior_official',
    phone: '0471-2518203',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-off-08',
    name: 'Latheesh S Dharan',
    designation: 'Deputy Secretary, Services A/D/E/H',
    department: 'General Administration Department',
    level: 'senior_official',
    phone: '0471-2518735',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },

  // 4. Key Secretariat Contact (3 Contacts)
  {
    id: 'gov-sec-01',
    name: 'Kerala Government Secretariat Exchange / PABX',
    designation: 'Central Secretariat Exchange',
    department: 'General Administration',
    level: 'secretariat',
    phone: '0471-2336576',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-sec-02',
    name: 'General Administration Department',
    designation: 'Department Secretariat Office',
    department: 'General Administration Department',
    level: 'secretariat',
    phone: '0471-2320311 / 0471-2518010',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'gov-sec-03',
    name: 'Information & Public Relations Department',
    designation: 'Official Public Relations',
    department: 'Information & Public Relations Department',
    level: 'secretariat',
    phone: '0471-2327782 / 0471-2518443',
    sourceName: 'Kerala Government — Official Contact Directory',
    lastVerified: '2026-09-12',
    isActive: true,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  }
];

class ContactService {
  private localWardContacts: WardContact[] = [];

  constructor() {
    this.restoreLocal();
  }

  private restoreLocal(): void {
    try {
      const stored = localStorage.getItem(LOCAL_WARD_CONTACTS_KEY);
      if (stored) {
        this.localWardContacts = JSON.parse(stored);
      }
    } catch (_e) {
      this.localWardContacts = [];
    }
  }

  private saveLocal(): void {
    try {
      localStorage.setItem(LOCAL_WARD_CONTACTS_KEY, JSON.stringify(this.localWardContacts));
    } catch (_e) {
      // Storage quota or private mode
    }
  }

  /**
   * Retrieves ward contacts for a specific ward.
   * Strictly enforces that callers only view contacts belonging to that ward.
   */
  public async getWardContacts(wardId: string): Promise<WardContact[]> {
    if (!wardId) return [];

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('ward_contacts')
          .select('*')
          .eq('ward_id', wardId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mapped: WardContact[] = data.map((d: any) => ({
            id: String(d.id),
            wardId: String(d.ward_id),
            name: String(d.name),
            designation: String(d.designation),
            phone: String(d.phone),
            email: d.email ? String(d.email) : undefined,
            description: d.description ? String(d.description) : undefined,
            createdBy: String(d.created_by),
            isActive: Boolean(d.is_active ?? true),
            createdAt: String(d.created_at || new Date().toISOString()),
            updatedAt: String(d.updated_at || new Date().toISOString())
          }));

          // Synchronize local cache with fetched items for this ward
          this.localWardContacts = [
            ...this.localWardContacts.filter(c => c.wardId !== wardId),
            ...mapped
          ];
          this.saveLocal();
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase ward_contacts query note:', err);
      }
    }

    return this.localWardContacts.filter(c => c.wardId === wardId && c.isActive);
  }

  /**
   * Adds a new ward contact.
   * Ward ID is strictly derived from the authenticated representative's context.
   */
  public async addWardContact(
    data: {
      name: string;
      designation: string;
      phone: string;
      email?: string;
      description?: string;
    },
    representative: UserProfile
  ): Promise<{ success: boolean; contact?: WardContact; message: string }> {
    if (!representative.wardId) {
      return { success: false, message: 'Representative has no authorized ward assigned.' };
    }

    const trimmedName = data.name.trim();
    const trimmedDesignation = data.designation.trim();
    const trimmedPhone = data.phone.trim();

    if (!trimmedName || !trimmedDesignation || !trimmedPhone) {
      return { success: false, message: 'Contact Name, Designation, and Phone Number are required.' };
    }

    const newContactId = `wc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newContact: WardContact = {
      id: newContactId,
      wardId: representative.wardId, // strictly derived from authenticated representative
      name: trimmedName,
      designation: trimmedDesignation,
      phone: trimmedPhone,
      email: data.email?.trim() || undefined,
      description: data.description?.trim() || undefined,
      createdBy: representative.id,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('ward_contacts').insert({
          id: newContact.id,
          ward_id: newContact.wardId,
          name: newContact.name,
          designation: newContact.designation,
          phone: newContact.phone,
          email: newContact.email || null,
          description: newContact.description || null,
          created_by: newContact.createdBy,
          is_active: true
        });

        if (error) {
          console.warn('Supabase ward_contacts insert note:', error);
        }
      } catch (err: any) {
        console.warn('Supabase connection error on insert:', err);
      }
    }

    this.localWardContacts = [newContact, ...this.localWardContacts];
    this.saveLocal();

    return {
      success: true,
      contact: newContact,
      message: `Contact "${newContact.name}" added to Ward ${representative.wardNumber}.`
    };
  }

  /**
   * Deactivates / removes a ward contact.
   * Only the authorized representative of that ward can delete it.
   */
  public async deleteWardContact(
    contactId: string,
    representative: UserProfile
  ): Promise<{ success: boolean; message: string }> {
    const contact = this.localWardContacts.find(c => c.id === contactId);
    if (!contact) {
      return { success: false, message: 'Contact not found.' };
    }

    if (contact.wardId !== representative.wardId) {
      return { success: false, message: 'Unauthorized: Cannot remove contacts from another ward.' };
    }

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('ward_contacts')
          .delete()
          .eq('id', contactId)
          .eq('ward_id', representative.wardId);
      } catch (err) {
        console.warn('Supabase delete contact note:', err);
      }
    }

    this.localWardContacts = this.localWardContacts.filter(c => c.id !== contactId);
    this.saveLocal();

    return { success: true, message: `Contact "${contact.name}" removed.` };
  }

  /**
   * Retrieves Common Kerala Government Contacts from Supabase with fallback to official PDF dataset.
   * Readable by all authenticated residents and representatives statewide.
   */
  public async getGovernmentContacts(filters?: {
    level?: GovernmentContactLevel | 'all';
    district?: string;
    search?: string;
  }): Promise<GovernmentContact[]> {
    let contacts = [...KERALA_GOVERNMENT_CONTACTS];

    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('government_contacts').select('*').eq('is_active', true);
        if (filters?.level && filters.level !== 'all') {
          query = query.eq('level', filters.level);
        }
        if (filters?.district && filters.district !== 'all') {
          query = query.eq('district', filters.district);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          contacts = data.map((d: any) => ({
            id: String(d.id),
            name: String(d.name),
            designation: String(d.designation),
            department: d.department ? String(d.department) : undefined,
            level: d.level as GovernmentContactLevel,
            district: d.district ? String(d.district) : undefined,
            phone: d.phone ? String(d.phone) : null,
            email: d.email ? String(d.email) : undefined,
            website: d.website ? String(d.website) : undefined,
            description: d.description ? String(d.description) : undefined,
            sourceName: String(d.source_name || 'Kerala Government — Official Contact Directory'),
            sourceUrl: d.source_url ? String(d.source_url) : undefined,
            lastVerified: String(d.last_verified || '2026-09-12'),
            isActive: Boolean(d.is_active ?? true),
            createdAt: String(d.created_at || new Date().toISOString()),
            updatedAt: String(d.updated_at || new Date().toISOString())
          }));
        }
      } catch (err) {
        console.warn('Supabase government_contacts query note:', err);
      }
    }

    // Apply in-memory filtering if fallback is used or search query provided
    if (filters?.level && filters.level !== 'all') {
      contacts = contacts.filter(c => c.level === filters.level);
    }
    if (filters?.district && filters.district !== 'all') {
      contacts = contacts.filter(c => c.district?.toLowerCase() === filters.district?.toLowerCase());
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      contacts = contacts.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.designation.toLowerCase().includes(q) ||
        (c.department && c.department.toLowerCase().includes(q)) ||
        (c.district && c.district.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q))
      );
    }

    return contacts;
  }
}

export const contactService = new ContactService();
