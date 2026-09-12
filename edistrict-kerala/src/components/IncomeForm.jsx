import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CircleCheck, CreditCard, Printer, ScrollText, TriangleAlert, X } from "lucide-react";
import { STR } from "../lib/i18n";
import { DISTRICTS, PURPOSES, DOCS, makeAckNo } from "../lib/data";
import Certificate from "./Certificate";

const blank = {
  fullName:"", gender:"", dob:"", relation:"Self", fatherName:"", address:"",
  district:"", taluk:"", village:"", pincode:"", mobile:"", email:"",
  aadhaar:"", ration:"", purpose:"", certLang:"English",
  land:"", salary:"", business:"", labour:"", nri:"", rent:"",
  members:[{name:"", rel:"", occ:"", income:""}],
};

export default function IncomeForm({ lang, go, setLastAck }) {
  const t = STR[lang];
  const [stage, setStage] = useState(1);
  const [f, setF] = useState(blank);
  const [files, setFiles] = useState({});
  const [payMode, setPayMode] = useState("UPI");
  const [err, setErr] = useState("");
  const [ack, setAck] = useState(null);

  const set = (k,v)=> setF(s=>({...s,[k]:v}));
  const total = useMemo(()=> ["land","salary","business","labour","nri","rent"].reduce((a,k)=>a+(Number(f[k])||0),0), [f]);

  function validStage1(){
    if(!f.fullName.trim()) return "Enter full name / പേര് നൽകുക";
    if(!f.gender) return "Select gender";
    if(!f.mobile || f.mobile.replace(/\D/g,"").length<10) return "Enter valid 10-digit mobile number";
    if(f.aadhaar && f.aadhaar.replace(/\D/g,"").length!==12 && f.aadhaar!=="") return "Aadhaar must be 12 digits";
    if(!f.district) return "Select district";
    if(!f.purpose) return "Select certificate purpose";
    if(!f.address.trim()) return "Enter full address";
    return "";
  }

  function next(){
    setErr("");
    if(stage===1){ const e=validStage1(); if(e){setErr(e); window.scrollTo(0,0); return;} setStage(2); window.scrollTo(0,0); }
    else if(stage===2){
      const missing = DOCS.filter(d=>d.required && !files[d.key]);
      if(missing.length){ setErr("Upload required: "+missing.map(m=>m.en).join(", ")+" (PDF/JPG demo — file name saved locally)"); window.scrollTo(0,0); return; }
      setStage(3); window.scrollTo(0,0);
    }
  }

  function submit(e){
    e.preventDefault();
    const ackNo = makeAckNo();
    const rec = { ackNo, ...f, total, files: Object.fromEntries(Object.entries(files).map(([k,v])=>[k,v.name])), payMode, fee: 15, date: new Date().toLocaleString(), status: "Under verification – Village Officer" };
    try {
      const all = JSON.parse(localStorage.getItem("edistrict_apps")||"{}");
      all[ackNo]=rec; localStorage.setItem("edistrict_apps", JSON.stringify(all));
    } catch {}
    setAck(rec); setLastAck && setLastAck(ackNo);
  }

  if(ack){
    return (
      <div className="max-w-[900px] mx-auto px-3 mt-4">
        <div className="gov-panel p-6 text-center">
          <div><CircleCheck size={42} className="mx-auto text-[#14661f]" /></div>
          <h2 className="text-[19px] font-bold text-[#14661f]">Application Submitted Successfully / അപേക്ഷ സമർപ്പിച്ചു</h2>
          <p className="text-[13px] text-[#4a5a7a] mt-1">SMS sent to +91 {f.mobile} (demo). Note your Acknowledgement Number.</p>
          <div className="inline-block mt-3 border-2 border-dashed border-[#0b3d91] bg-[#eef3ff] px-6 py-3">
            <div className="text-[12px] font-bold text-[#0b3d91]">ACKNOWLEDGEMENT NO</div>
            <div data-testid="ack-number" className="text-[22px] font-bold tracking-wide">{ack.ackNo}</div>
          </div>
          <table className="gov-table mt-4 text-left">
            <tbody>
              <tr><th className="!w-[220px]">Applicant</th><td>{ack.fullName} ({ack.gender}) — {ack.district}</td></tr>
              <tr><th>Purpose</th><td>{ack.purpose}</td></tr>
              <tr><th>Total Annual Income</th><td><b>Rs. {Number(ack.total).toLocaleString("en-IN")}</b></td></tr>
              <tr><th>Fee Paid (demo)</th><td>Rs. 15 via {ack.payMode}</td></tr>
              <tr><th>Expected issue</th><td>Within 6 working days by Village / Taluk Officer</td></tr>
            </tbody>
          </table>
          <div className="flex gap-2 justify-center mt-4 no-print">
            <button className="gov-btn" onClick={()=>window.print()}><Printer size={14} className="inline" /> Print Receipt</button>
            <button className="gov-btn gov-btn-green" onClick={()=>go("track")}>Track Status <ArrowRight size={13} className="inline" /></button>
            <button className="gov-btn gov-btn-grey" onClick={()=>go("home")}>Home</button>
          </div>
        </div>
        <div className="gov-panel mt-4 p-3">
          <div className="font-bold text-[13px] text-[#0b3d91] flex items-center gap-1"><ScrollText size={14} /> Mock Certificate Preview — same header/footer as original (demo data)</div>
          <Certificate rec={{...ack, certDate: new Date().toLocaleDateString("en-IN")}} lang={lang} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[980px] mx-auto px-3 mt-4">
      <div className="gov-panel">
        <div className="gov-heading-bar px-3 py-2">
          <div className="font-bold text-[13.5px]">{t.formTitle}</div>
          <div className="text-[11.5px] text-blue-100">eDistrict Register No: <b>ED-REG-DEMO-001</b> • Certificate Type: <b>Income Certificate</b> • Validity 1 Year</div>
        </div>

        {/* steps */}
        <div className="flex items-center gap-2 px-3 py-3 bg-[#f6f8ff] border-b border-[#c5d1e8] no-print overflow-x-auto">
          {[t.stage1,t.stage2,t.stage3].map((s,i)=>{
            const n=i+1; const cls = stage===n?"step-active":stage>n?"step-done":"";
            return (
              <div key={n} className={`flex items-center gap-2 ${cls} shrink-0`}>
                <div className="step-dot">{stage>n?<Check size={15} />:n}</div>
                <div className="text-[12px] font-bold text-[#0b3d91]">{s}</div>
                {n<3 && <div className="w-8 h-[2px] bg-[#9fb0cc] mx-1"/>}
              </div>
            );
          })}
          <div className="ml-auto text-[11.5px] text-[#4a5a7a]">Fields marked <span className="text-[#c00000] font-bold">*</span> mandatory</div>
        </div>

        {err && <div className="m-3 bg-[#fdecec] border border-[#e8a0a0] text-[#8f1111] text-[12.5px] px-3 py-2 font-bold flex items-center gap-1"><TriangleAlert size={14} className="shrink-0" /> {err}</div>}

        {stage===1 && (
          <div className="p-3 md:p-4">
            <div className="gov-subhead px-3 py-[6px] text-[13px] mb-3">{t.part1}</div>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="md:col-span-2"><label className="gov-label">1. {t.f_name} <span className="req">*</span></label><input data-testid="f-fullName" className="gov-input" value={f.fullName} onChange={e=>set("fullName",e.target.value)} placeholder="As per Aadhaar — no dot/special chars" /></div>
              <div><label className="gov-label">2. {t.f_gender} <span className="req">*</span></label><select data-testid="f-gender" className="gov-input" value={f.gender} onChange={e=>set("gender",e.target.value)}><option value="">{t.opt_select}</option><option>{t.opt_male}</option><option>{t.opt_female}</option><option>{t.opt_other}</option></select></div>
              <div><label className="gov-label">3. {t.f_dob}</label><input data-testid="f-dob" type="date" className="gov-input" value={f.dob} onChange={e=>set("dob",e.target.value)} /></div>
              <div><label className="gov-label">4. {t.f_guardian}</label><input data-testid="f-guardian" className="gov-input" value={f.fatherName} onChange={e=>set("fatherName",e.target.value)} /></div>
              <div><label className="gov-label">{t.f_relation}</label><select data-testid="f-relation" className="gov-input" value={f.relation} onChange={e=>set("relation",e.target.value)}><option>Self</option><option>Father</option><option>Mother</option><option>Spouse</option><option>Child</option><option>Other</option></select></div>
              <div className="md:col-span-3"><label className="gov-label">5. {t.f_address} <span className="req">*</span></label><textarea data-testid="f-address" className="gov-input" rows={2} value={f.address} onChange={e=>set("address",e.target.value)} placeholder="House, Street, Post Office" /></div>
              <div><label className="gov-label">6. {t.f_district} <span className="req">*</span></label><select data-testid="f-district" className="gov-input" value={f.district} onChange={e=>set("district",e.target.value)}><option value="">{t.opt_select}</option>{DISTRICTS.map(d=><option key={d}>{d}</option>)}</select></div>
              <div><label className="gov-label">{t.f_taluk}</label><input data-testid="f-taluk" className="gov-input" value={f.taluk} onChange={e=>set("taluk",e.target.value)} placeholder="e.g. Thiruvananthapuram" /></div>
              <div><label className="gov-label">{t.f_village}</label><input data-testid="f-village" className="gov-input" value={f.village} onChange={e=>set("village",e.target.value)} placeholder="e.g. Pattom" /></div>
              <div><label className="gov-label">{t.f_pin}</label><input data-testid="f-pincode" className="gov-input" maxLength={6} value={f.pincode} onChange={e=>set("pincode",e.target.value.replace(/\D/g,""))} placeholder="695004" /></div>
              <div><label className="gov-label">{t.f_mobile} <span className="req">*</span></label><input data-testid="f-mobile" className="gov-input" maxLength={10} value={f.mobile} onChange={e=>set("mobile",e.target.value.replace(/\D/g,""))} placeholder="10-digit" /></div>
              <div><label className="gov-label">{t.f_email}</label><input data-testid="f-email" className="gov-input" value={f.email} onChange={e=>set("email",e.target.value)} placeholder="optional" /></div>
              <div><label className="gov-label">{t.f_aadhaar}</label><input data-testid="f-aadhaar" className="gov-input" maxLength={12} value={f.aadhaar} onChange={e=>set("aadhaar",e.target.value.replace(/\D/g,""))} placeholder="XXXX XXXX XXXX" /></div>
              <div><label className="gov-label">{t.f_ration}</label><input data-testid="f-ration" className="gov-input" value={f.ration} onChange={e=>set("ration",e.target.value)} /></div>
              <div><label className="gov-label">{t.f_lang}</label><select data-testid="f-certLang" className="gov-input" value={f.certLang} onChange={e=>set("certLang",e.target.value)}><option>English</option><option>Malayalam</option></select></div>
              <div className="md:col-span-2"><label className="gov-label">7. {t.f_purpose} <span className="req">*</span></label><select data-testid="f-purpose" className="gov-input" value={f.purpose} onChange={e=>set("purpose",e.target.value)}><option value="">{t.opt_select}</option>{PURPOSES.map(p=><option key={p.en} value={p.en}>{lang==="ml"?p.ml:p.en}</option>)}</select></div>
            </div>

            <div className="gov-subhead px-3 py-[6px] text-[13px] mt-5 mb-3">{t.part2} — 21. Income Details (last 1 year)</div>
            <div className="grid md:grid-cols-3 gap-3">
              {[["land",t.f_land],["salary",t.f_salary],["business",t.f_business],["labour",t.f_labour],["nri",t.f_nri],["rent",t.f_rent]].map(([k,l])=>(
                <div key={k}><label className="gov-label">{l} (Rs.)</label><input data-testid={`f-${k}`} className="gov-input" inputMode="numeric" value={f[k]} onChange={e=>set(k,e.target.value.replace(/[^\d]/g,""))} placeholder="0" /></div>
              ))}
            </div>
            <div className="mt-3 bg-[#eef6ee] border border-[#9cc79c] px-3 py-2 font-bold text-[#14661f] text-[14px]">{t.f_total}: Rs. {total.toLocaleString("en-IN")} <span className="font-normal text-[11.5px] text-[#3c5a3c]">(auto-sum • excludes widow daughter/sister, family pension, festival allowance as per rules)</span></div>

            <div className="gov-subhead px-3 py-[6px] text-[13px] mt-4 mb-2">22. {t.f_members}</div>
            {f.members.map((m,i)=>(
              <div key={i} className="grid md:grid-cols-4 gap-2 mb-2">
                <input data-testid={`m-name-${i}`} className="gov-input" placeholder="Name" value={m.name} onChange={e=>set("members", f.members.map((x,j)=> j===i?{...x,name:e.target.value}:x))} />
                <input data-testid={`m-rel-${i}`} className="gov-input" placeholder="Relation" value={m.rel} onChange={e=>set("members", f.members.map((x,j)=> j===i?{...x,rel:e.target.value}:x))} />
                <input data-testid={`m-occ-${i}`} className="gov-input" placeholder="Occupation" value={m.occ} onChange={e=>set("members", f.members.map((x,j)=> j===i?{...x,occ:e.target.value}:x))} />
                <div className="flex gap-2">
                  <input data-testid={`m-income-${i}`} className="gov-input" placeholder="Income Rs." value={m.income} onChange={e=>set("members", f.members.map((x,j)=> j===i?{...x,income:e.target.value.replace(/[^\d]/g,"")}:x))} />
                  {f.members.length>1 && <button className="gov-btn-grey gov-btn !px-2" onClick={()=>set("members", f.members.filter((_,j)=>j!==i))}><X size={14} /></button>}
                </div>
              </div>
            ))}
            <button data-testid="add-member" className="gov-btn gov-btn-grey !py-[5px] text-[12px]" onClick={()=>set("members",[...f.members,{name:"",rel:"",occ:"",income:""}])}>+ Add member</button>

            <div className="flex gap-2 mt-5 no-print">
              <button data-testid="to-uploads" className="gov-btn" onClick={next}>Save & Next: Upload Documents <ArrowRight size={13} className="inline" /></button>
              <button className="gov-btn gov-btn-grey" onClick={()=>{setF(blank);}}>Clear</button>
            </div>
          </div>
        )}

        {stage===2 && (
          <div className="p-3 md:p-4">
            <div className="gov-subhead px-3 py-[6px] text-[13px] mb-2">{t.stage2} — PDF only, max 100KB per page (demo: any file, stored locally)</div>
            <table className="gov-table">
              <thead><tr><th>#</th><th>Document</th><th>File</th><th>Status</th></tr></thead>
              <tbody>
                {DOCS.map((d,i)=>(
                  <tr key={d.key}>
                    <td>{i+1}</td>
                    <td><b>{lang==="ml"?d.ml:d.en}</b> {d.required?<span className="text-[#c00000]">*</span>:<span className="text-[11px] text-[#5a6b8f]">(optional)</span>}</td>
                    <td><input data-testid={`upload-${d.key}`} type="file" accept=".pdf,.jpg,.jpeg,.png" className="text-[12px]" onChange={e=>setFiles(s=>({...s,[d.key]:e.target.files[0]}))} /></td>
                    <td>{files[d.key]?<span className="text-[#14661f] font-bold flex items-center gap-1"><Check size={13} /> {files[d.key].name.slice(0,28)}</span>:<span className="text-[#8a94ad]">Pending</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-2 mt-4 no-print">
              <button className="gov-btn gov-btn-grey" onClick={()=>setStage(1)}><ArrowLeft size={13} className="inline" /> Back</button>
              <button data-testid="to-payment" className="gov-btn" onClick={next}>Save & Next: Payment <ArrowRight size={13} className="inline" /></button>
            </div>
          </div>
        )}

        {stage===3 && (
          <form onSubmit={submit} className="p-3 md:p-4">
            <div className="gov-subhead px-3 py-[6px] text-[13px] mb-3">{t.stage3}</div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="gov-panel !border-t-0">
                <div className="gov-subhead px-3 py-2 text-[12.5px]">Verify Details</div>
                <table className="gov-table">
                  <tbody>
                    <tr><th>Name</th><td>{f.fullName}</td></tr>
                    <tr><th>District</th><td>{f.district} / {f.taluk} / {f.village}</td></tr>
                    <tr><th>Purpose</th><td>{f.purpose}</td></tr>
                    <tr><th>Total Income</th><td><b>Rs. {total.toLocaleString("en-IN")}</b></td></tr>
                    <tr><th>Docs</th><td>{Object.keys(files).length} attached</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="gov-panel gov-panel-orange">
                <div className="gov-subhead px-3 py-2 text-[12.5px] flex items-center gap-1"><CreditCard size={14} /> Fee Payment (Demo — no real gateway)</div>
                <div className="p-3 space-y-2 text-[13px]">
                  <div className="flex justify-between"><span>Govt + service fee</span><b>Rs. 15.00</b></div>
                  <div className="flex justify-between text-[#5a6b8f] text-[12px]"><span>Bank / gateway charges</span><span>Rs. 0.00 (demo)</span></div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {["UPI","Net Banking","Debit Card","Credit Card","Wallet","IMPS"].map(m=>(
                      <label key={m} data-testid={`paymode-${m}`} className={`px-2 py-1 border text-[12px] cursor-pointer ${payMode===m?"bg-[#0b3d91] text-white border-[#0b3d91] font-bold":"bg-white border-[#9fb0cc]"}`}>
                        <input type="radio" className="hidden" checked={payMode===m} onChange={()=>setPayMode(m)} />{m}
                      </label>
                    ))}
                  </div>
                  <label className="flex gap-2 items-start text-[12px] text-[#243152]"><input data-testid="agree-terms" required type="checkbox" className="mt-1" /> I agree to Terms & Conditions, certify details are true, and understand fee once paid will not be refunded for successfully submitted applications.</label>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4 no-print">
              <button type="button" className="gov-btn gov-btn-grey" onClick={()=>setStage(2)}><ArrowLeft size={13} className="inline" /> Back</button>
              <button data-testid="pay-submit" type="submit" className="gov-btn gov-btn-green">Pay Rs.15 & Generate Acknowledgement</button>
            </div>
          </form>
        )}
      </div>
      <p className="text-[11px] text-[#6b7690] mt-2">Demo note: data stays in your browser localStorage only. No backend. Print uses browser print. Malayalam toggle translates chrome + purpose/doc names.</p>
    </div>
  );
}
