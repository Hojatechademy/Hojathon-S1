import { motion } from "framer-motion";
import { ArrowRight, ChartColumn, CircleCheck, CircleHelp, FolderOpen, IndianRupee, KeyRound, Megaphone, Paperclip, Puzzle, ReceiptText, ScrollText, Star } from "lucide-react";
import { STR } from "../lib/i18n";

export default function Home({ lang, go }) {
  const t = STR[lang];
  return (
    <div>
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#0b3d91] via-[#1450b8] to-[#0b3d91] text-white border-b-4 border-[#e8762b]">
        <div className="max-w-[1180px] mx-auto px-3 py-6 md:py-8 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1">
            <div className="text-[12px] font-bold tracking-wide bg-[#e8762b] inline-block px-2 py-[2px] mb-2">KERALA STATE IT MISSION • NIC KERALA</div>
            <h1 className="text-[22px] md:text-[30px] font-bold leading-tight">
              {lang==="ml" ? "ഇ-ഡിസ്ട്രിക്റ്റ് സർവീസ് - കേരള സർക്കാർ" : "eDistrict - Services from Government of Kerala"}
            </h1>
            <p className="text-[12.5px] md:text-[13.5px] text-blue-100 mt-2 max-w-[760px]">{lang==="ml"? t.aboutMl : t.aboutEn}</p>
            <div className="flex flex-wrap gap-2 mt-4 no-print">
              <button onClick={()=>go("form")} className="gov-btn gov-btn-orange flex items-center gap-1">{t.applyIncome} <ArrowRight size={14} /></button>
              <button onClick={()=>go("track")} className="gov-btn gov-btn-green">{t.checkStatus}</button>
              <button className="gov-btn gov-btn-grey">{t.createAccountNow}</button>
            </div>
          </div>
          <div className="gov-panel !border-t-0 w-full md:w-[300px] text-[#0b3d91] shrink-0">
            <div className="gov-subhead px-3 py-2 text-[13px] flex items-center gap-1"><KeyRound size={14} /> Portal User Login / ലോഗിൻ</div>
            <div className="p-3 space-y-2 bg-white">
              <input className="gov-input" placeholder={lang==="ml"?"ലോഗിൻ പേര്":"Login Name"} />
              <input className="gov-input" type="password" placeholder="Password" />
              <button onClick={()=>go("form")} className="gov-btn w-full">{t.signIn}</button>
              <div className="text-[11.5px] text-center text-[#4a5a7a]">New user? <span className="text-[#0b3d91] font-bold underline cursor-pointer">{t.createAccount}</span> | Forgot Password?</div>
            </div>
          </div>
        </div>
      </div>

      <div className="notice-marquee no-print">
        <div className="max-w-[1180px] mx-auto px-3 py-[6px] text-[12.5px] flex gap-2">
          <b className="flex items-center gap-1 shrink-0"><Megaphone size={14} /> {t.notice}:</b>
          <marquee className="flex-1">{t.noticeText}</marquee>
        </div>
      </div>

      <div className="max-w-[1180px] mx-auto px-3 mt-4 grid md:grid-cols-4 gap-3">
        {[
          { title: t.serviceDetails, sub: t.serviceDetailsSub, icon: <FolderOpen size={30} className="text-[#0b3d91]" />, cls: "" },
          { title: t.facilities, sub: t.facilitiesSub, icon: <Puzzle size={30} className="text-[#0b3d91]" />, cls: "gov-panel-orange" },
          { title: t.faqTitle, sub: t.faqSub, icon: <CircleHelp size={30} className="text-[#0b3d91]" />, cls: "gov-panel-green" },
          { title: t.dashTitle, sub: t.dashSub, icon: <ChartColumn size={30} className="text-[#0b3d91]" />, cls: "" },
        ].map((c,i)=>(
          <motion.div key={i} initial={{opacity:0, y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}} className={`gov-panel ${c.cls} p-4`}>
            <div>{c.icon}</div>
            <div className="font-bold text-[#0b3d91] text-[14px] mt-1">{c.title}</div>
            <div className="text-[11.5px] text-[#4a5a7a] min-h-[32px]">{c.sub}</div>
            <div className="text-[12px] font-bold text-[#d25f0e] mt-1 cursor-pointer flex items-center gap-1" onClick={()=>go("form")}>Click here to view <ArrowRight size={12} /></div>
          </motion.div>
        ))}
      </div>

      {/* Income certificate highlight */}
      <div className="max-w-[1180px] mx-auto px-3 mt-4">
        <div className="gov-panel overflow-hidden">
          <div className="gov-subhead px-3 py-2 text-[13.5px] flex justify-between">
            <span className="flex items-center gap-1"><ScrollText size={15} /> {t.incomeCert} — {lang==="ml"?"വിവരങ്ങൾ":"Details"} (Form 1A / Part-II B)</span>
            <span className="no-print font-normal text-[12px]">Validity: 1 Year • Time: 6 working days • Fee: Rs.15 online</span>
          </div>
          <div className="grid md:grid-cols-3">
            <div className="p-4 border-r border-[#c5d1e8]">
              <div className="font-bold text-[13px] text-[#0b3d91] mb-2 flex items-center gap-1"><CircleCheck size={14} className="text-[#14661f]" /> {lang==="ml"?"ആവശ്യമായ ഫീൽഡുകൾ":"Required Fields"}</div>
              <ul className="text-[12.5px] list-disc ml-4 space-y-1 text-[#243152]">
                <li>Name, Gender, DOB, Address, District/Taluk/Village</li>
                <li>Aadhaar, Mobile, Ration Card, Purpose, Language</li>
                <li>Income: Land, Salary/Pension, Business, Labour, NRI, Rent</li>
                <li>Family members + Total Annual Income</li>
              </ul>
            </div>
            <div className="p-4 border-r border-[#c5d1e8] bg-[#fbfcff]">
              <div className="font-bold text-[13px] text-[#0b3d91] mb-2 flex items-center gap-1"><Paperclip size={14} /> {lang==="ml"?"അപ്‌ലോഡ് രേഖകൾ":"Documents to Upload"}</div>
              <ul className="text-[12.5px] list-disc ml-4 space-y-1 text-[#243152]">
                <li>Ration Card, ID Proof (Aadhaar/Voter ID)</li>
                <li>Salary Certificate / Form 16 / IT Return</li>
                <li>Land Tax + Basic Tax Receipt</li>
                <li>Affidavit (if applicable) — PDF, 100KB/page</li>
              </ul>
            </div>
            <div className="p-4">
              <div className="font-bold text-[13px] text-[#0b3d91] mb-2 flex items-center gap-1"><IndianRupee size={14} /> Fee & Issue</div>
              <table className="gov-table">
                <tbody>
                  <tr><td>Akshaya charge</td><td><b>Rs.18</b></td></tr>
                  <tr><td>Govt charge</td><td><b>Rs.7</b></td></tr>
                  <tr><td>Scan/print per page</td><td><b>Rs.3</b></td></tr>
                  <tr><td>SC/ST • BPL</td><td><b>Rs.10 / Rs.20</b></td></tr>
                  <tr><td>Issued by</td><td><b>Village / Taluk Officer</b></td></tr>
                </tbody>
              </table>
              <button onClick={()=>go("form")} className="gov-btn w-full mt-3 no-print">{t.applyIncome}</button>
            </div>
          </div>
        </div>
      </div>

      {/* All services strip */}
      <div className="max-w-[1180px] mx-auto px-3 mt-4">
        <div className="gov-panel">
          <div className="gov-subhead px-3 py-2 text-[13px] flex items-center gap-1"><ReceiptText size={14} /> Revenue Certificates issued via eDistrict</div>
          <div className="p-3 flex flex-wrap gap-2 text-[12px]">
            {["Caste","Community","Income","Nativity","Domicile","Possession","Valuation","Solvency","Legal Heir","Dependency","Destitute","Residence","Identification","Minority","Non-Creamy Layer","One & Same","Widow-Widower","Inter-Caste Marriage"].map(s=>(
              <span key={s} onClick={()=> s==="Income" && go("form")} className={`px-2 py-1 border flex items-center gap-1 ${s==="Income"?"bg-[#0b3d91] text-white font-bold border-[#0b3d91] cursor-pointer":"bg-[#eef3ff] text-[#0b3d91] border-[#c5d1e8]"}`}>{s}{s==="Income" && <Star size={11} />}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
