import { Flag, Landmark } from "lucide-react";
import { STR } from "../lib/i18n";

export default function TopBar({ lang, setLang, go }) {
  const t = STR[lang];
  return (
    <div className="no-print">
      <div className="tricolor" />
      <div className="bg-[#082c6a] text-white text-[11.5px]">
        <div className="max-w-[1180px] mx-auto px-3 flex items-center justify-between h-[30px]">
          <div className="flex items-center gap-3 truncate">
            <span className="font-bold flex items-center gap-1"><Flag size={12} /> {t.govtKerala} | {t.edistrict}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang("en")} className={`px-2 py-[1px] border ${lang==="en"?"bg-white text-[#082c6a] font-bold":"border-white/50"}`}>English</button>
            <button onClick={() => setLang("ml")} className={`px-2 py-[1px] border ${lang==="ml"?"bg-white text-[#082c6a] font-bold":"border-white/50"}`}>മലയാളം</button>
          </div>
        </div>
      </div>

      {/* Crest header */}
      <div className="bg-white border-b border-[#c5d1e8]">
        <div className="max-w-[1180px] mx-auto px-3 py-2 flex items-center gap-3">
          <div className="w-[52px] h-[52px] shrink-0 rounded-full bg-[#0b3d91] text-white flex flex-col items-center justify-center leading-none border-2 border-[#e8762b]">
            <span className="text-[9px] font-bold">GOK</span>
            <span className="flex justify-center"><Landmark size={18} /></span>
          </div>
          <div className="min-w-0">
            <div className="text-[19px] md:text-[24px] font-bold text-[#0b3d91] leading-tight truncate">
              {lang==="ml" ? "ഇ-ഡിസ്ട്രിക്റ്റ് കേരളം" : "e-District Kerala"}
            </div>
            <div className="text-[11.5px] md:text-[12.5px] text-[#4a5a7a]">{t.tagline} — Kerala State IT Mission / NIC Kerala</div>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-2">
            <button onClick={() => go("form")} className="gov-btn gov-btn-orange !py-[6px] !px-3 text-[12px]">{t.applyIncome}</button>
            <button onClick={() => go("track")} className="gov-btn gov-btn-grey !py-[6px] !px-3 text-[12px]">{t.checkStatus}</button>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="gov-heading-bar">
        <div className="max-w-[1180px] mx-auto px-2 flex overflow-x-auto">
          {[["home",t.home],["form",t.incomeCert],["track",t.trackApp],["services",t.govtOrders],["faq",t.faqTitle]].map(([k,l])=>(
            <div key={k} onClick={() => (k==="home"||k==="form"||k==="track") && go(k)} className="nav-link">{l}</div>
          ))}
          <div className="nav-link hidden md:block">{t.revenueCourt}</div>
          <div className="nav-link hidden md:block">{t.certVerify}</div>
          <div className="nav-link hidden md:block">{t.createAccount}</div>
          <div className="nav-link">{t.signIn}</div>
        </div>
      </div>
    </div>
  );
}
