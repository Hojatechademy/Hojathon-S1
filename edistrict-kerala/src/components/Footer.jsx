import { ExternalLink, Monitor } from "lucide-react";
import { STR } from "../lib/i18n";

export default function Footer({ lang }) {
  const t = STR[lang];
  return (
    <footer className="no-print mt-8">
      <div className="bg-[#0b3d91] text-white">
        <div className="max-w-[1180px] mx-auto px-3 py-6 grid md:grid-cols-4 gap-6 text-[12.5px]">
          <div>
            <div className="font-bold text-[13.5px] mb-2 border-b border-white/20 pb-1">{t.govtWebsites}</div>
            <div className="grid grid-cols-2 gap-2 opacity-95">
              {["kerala.gov.in","services.kerala.gov.in","india.gov.in","digilocker.gov.in","digitalindia.gov.in","meity.gov.in"].map(s=>(
                <div key={s} className="bg-white text-[#0b3d91] px-2 py-1 font-bold text-[11px] truncate flex items-center gap-1"><ExternalLink size={11} className="shrink-0" /> {s}</div>
              ))}
            </div>
          </div>
          <div>
            <div className="font-bold text-[13.5px] mb-2 border-b border-white/20 pb-1">{t.policies}</div>
            <ul className="space-y-1 opacity-90 list-disc ml-4">
              <li>Terms and Conditions</li>
              <li>Privacy Policy</li>
              <li>Cancellation and Refund-Policy</li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-[13.5px] mb-2 border-b border-white/20 pb-1">{t.quickLinks}</div>
            <ul className="space-y-1 opacity-90 list-disc ml-4">
              <li>Government Orders</li>
              <li>Cause List</li>
              <li>Download SoP</li>
              <li>Certificate Verification</li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-[13.5px] mb-2 border-b border-white/20 pb-1">{t.contactUs}</div>
            <div className="opacity-90 leading-relaxed">
              Email: edistrict.ksitm@kerala.gov.in<br/>
              Phone: 0471 2525444<br/>
              Vrindavan Gardens, Saankethika, near EPF Office,<br/>
              Pattom P.O, Thiruvananthapuram, Kerala 695004
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#061f4d] text-white/85 text-[11.5px]">
        <div className="max-w-[1180px] mx-auto px-3 py-3 flex flex-col md:flex-row gap-2 md:items-center justify-between">
          <span className="flex items-start gap-1"><Monitor size={13} className="mt-[1px] shrink-0" /> {t.issuedBy}</span>
          <span>© eDistrict Kerala — Demo clone for Hackathon MVP (Frontend only, no backend)</span>
        </div>
      </div>
    </footer>
  );
}
