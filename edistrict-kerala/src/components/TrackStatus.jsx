import { useState } from "react";
import { Check, Printer, ScrollText, Search, TriangleAlert } from "lucide-react";
import { STR } from "../lib/i18n";
import Certificate from "./Certificate";

export default function TrackStatus({ lang, go, lastAck }) {
  const t = STR[lang];
  const [q, setQ] = useState(lastAck||"");
  const [res, setRes] = useState(null);
  const [err, setErr] = useState("");

  function search(){
    setErr(""); setRes(null);
    const v = q.trim();
    if(!v){ setErr("Enter acknowledgement number, e.g. EDK/20260101/123456"); return; }
    try {
      const all = JSON.parse(localStorage.getItem("edistrict_apps")||"{}");
      if(all[v]){ setRes(all[v]); return; }
    } catch {}
    // demo fallback record so UI never looks empty
    if(v.toUpperCase().startsWith("EDK")){
      setRes({ ackNo: v, fullName: "(Demo) Applicant", district: "Thiruvananthapuram", purpose: "Scholarship / Fee Concession", total: 185000, fee: 15, payMode: "UPI", date: new Date().toLocaleString(), status: "Under verification – Village Officer", files: { ration: "ration.pdf", income: "salary.pdf" } });
    } else setErr("No record found in this browser demo. Submit a form first — records are stored in localStorage only.");
  }

  return (
    <div className="max-w-[860px] mx-auto px-3 mt-4">
      <div className="gov-panel">
        <div className="gov-heading-bar px-3 py-2 font-bold text-[13.5px] flex items-center gap-1"><Search size={14} /> {t.trackApp} / {t.certVerify}</div>
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-2 no-print">
            <input className="gov-input !py-[9px]" value={q} onChange={e=>setQ(e.target.value)} placeholder="EDK/YYYYMMDD/XXXXXX" />
            <button className="gov-btn shrink-0" onClick={search}>Search</button>
            <button className="gov-btn gov-btn-grey shrink-0" onClick={()=>go("form")}>New Application</button>
          </div>
          {err && <div className="mt-3 bg-[#fdecec] border border-[#e8a0a0] text-[#8f1111] text-[12.5px] px-3 py-2 font-bold flex items-center gap-1"><TriangleAlert size={14} className="shrink-0" /> {err}</div>}
          {res && (
            <div className="mt-4">
              <div className="gov-subhead px-3 py-[6px] text-[13px]">Application: {res.ackNo}</div>
              <table className="gov-table mt-2">
                <tbody>
                  <tr><th className="!w-[200px]">Applicant</th><td>{res.fullName}</td></tr>
                  <tr><th>District</th><td>{res.district}</td></tr>
                  <tr><th>Purpose</th><td>{res.purpose}</td></tr>
                  <tr><th>Annual Income</th><td><b>Rs. {Number(res.total||0).toLocaleString("en-IN")}</b></td></tr>
                  <tr><th>Applied On</th><td>{res.date}</td></tr>
                  <tr><th>Status</th><td><span className="bg-[#fff3cd] border border-[#e6c87a] px-2 py-[2px] font-bold text-[#6b4a00] flex items-center gap-1 w-fit"><span className="w-2 h-2 rounded-full bg-[#b8860b] inline-block" /> {res.status}</span></td></tr>
                </tbody>
              </table>
              {/* timeline */}
              <div className="grid grid-cols-4 gap-1 mt-3 text-center text-[11px] font-bold">
                {["Submitted","Village Verify","Taluk Approve","Certificate Ready"].map((s,i)=>(
                  <div key={s} className={`border px-1 py-2 flex items-center justify-center gap-1 ${i===0?"bg-[#14661f] text-white border-[#14661f]":i===1?"bg-[#fff3cd] text-[#6b4a00] border-[#e6c87a]":"bg-white text-[#8a94ad] border-[#c5d1e8]"}`}>{i===0?<Check size={12} />:<span className="w-2 h-2 rounded-full border border-current inline-block" />} {s}</div>
                ))}
              </div>
              <div className="flex gap-2 mt-4 no-print">
                <button className="gov-btn" onClick={()=>window.print()}><Printer size={14} className="inline" /> Print / Download Receipt</button>
                <button className="gov-btn gov-btn-grey" onClick={()=>go("home")}>Home</button>
              </div>
              <p className="text-[11px] text-[#6b7690] mt-2">SLA: 6 working days • Validity once issued: 1 Year • Issuer: Village / Taluk Officer • Help: edistrict.ksitm@kerala.gov.in, 0471 2525444</p>
              <div className="mt-3 border-t border-[#c5d1e8] pt-3">
                <div className="font-bold text-[13px] text-[#0b3d91] flex items-center gap-1"><ScrollText size={14} /> Mock Certificate (same header/footer as original) — download as PDF below</div>
                <Certificate rec={res} lang={lang} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
