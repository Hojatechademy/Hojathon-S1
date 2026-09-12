export const DISTRICTS = [
  "Thiruvananthapuram","Kollam","Pathanamthitta","Alappuzha","Kottayam","Idukki",
  "Ernakulam","Thrissur","Palakkad","Malappuram","Kozhikode","Wayanad","Kannur","Kasaragod"
];

export const PURPOSES = [
  { en: "Scholarship / Fee Concession", ml: "സ്കോളർഷിപ്പ് / ഫീസ് ഇളവ്" },
  { en: "School / College Admission", ml: "സ്കൂൾ / കോളേജ് പ്രവേശനം" },
  { en: "Bank Loan", ml: "ബാങ്ക് ലോൺ" },
  { en: "Pension", ml: "പെൻഷൻ" },
  { en: "Property Tax Relaxation", ml: "പ്രോപ്പർട്ടി ടാക്സ് ഇളവ്" },
  { en: "Govt Scheme / Subsidy", ml: "സർക്കാർ പദ്ധതി / സബ്സിഡി" },
  { en: "Other", ml: "മറ്റുള്ളവ" },
];

export const DOCS = [
  { key: "ration", en: "Ration Card", ml: "റേഷൻ കാർഡ്", required: true },
  { key: "income", en: "Proof of Income (Salary Certificate / Form 16 / IT Return)", ml: "വരുമാന തെളിവ്", required: true },
  { key: "landtax", en: "Land Tax Receipt", ml: "ഭൂനികുതി രസീത്", required: true },
  { key: "basictax", en: "Basic Tax Payment Receipt", ml: "അടിസ്ഥാന നികുതി രസീത്", required: true },
  { key: "idproof", en: "ID Proof (Aadhaar / Voter ID)", ml: "തിരിച്ചറിയൽ രേഖ", required: true },
  { key: "affidavit", en: "Affidavit", ml: "സത്യവാങ്മൂലം", required: false },
];

export const FEE = { akshaya: 18, govt: 7, scanPerPage: 3, online: 15 };

export function makeAckNo() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  const r = Math.floor(100000 + Math.random()*900000);
  return `EDK/${ymd}/${r}`;
}
