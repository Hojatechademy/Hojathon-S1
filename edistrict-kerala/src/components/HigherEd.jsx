import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, AtSign, Bot, CalendarDays, ChevronLeft, ChevronRight, Flower2, Globe, GraduationCap, IndianRupee, Landmark, Link2, Megaphone, Pause, Play, Rss, School, ScrollText, Search, Users } from "lucide-react";

const SLIDES = [
  { t_en: "Onam Wishes — Higher Education Department", t_ml: "ഓണം ആശംസകൾ — ഉന്നത വിദ്യാഭ്യാസ വകുപ്പ്", c1: "#8a1f1f", c2: "#d4a017", Icon: Flower2 },
  { t_en: "Higher Education Department — Government of Kerala", t_ml: "ഉന്നത വിദ്യാഭ്യാസ വകുപ്പ് — കേരള സർക്കാർ", c1: "#0b3d91", c2: "#1560c9", Icon: GraduationCap },
  { t_en: "ICGAIFE 3.0 — IHRD AI International Conclave", t_ml: "ICGAIFE 3.0 — IHRD AI അന്തർദേശീയ കോൺക്ലേവ്", c1: "#123524", c2: "#1f8a4c", Icon: Bot },
  { t_en: "HEDN — Educational Institutions", t_ml: "HEDN — വിദ്യാഭ്യാസ സ്ഥാപനങ്ങൾ", c1: "#4a1e6b", c2: "#8a3cc9", Icon: School },
  { t_en: "Government of Kerala", t_ml: "കേരള സർക്കാർ", c1: "#7a4a00", c2: "#c97a1e", Icon: Landmark },
];

const GOS = [
  ["31/08/2026", "Additional Skill Acquisition Programme – Establishment - Smt. Akhila M., Assistant Professor, appointed as Manager in ASAP Kerala", "G.O.(Rt) No.1114/2026/HEDN"],
  ["22/08/2026", "Appointment of Finance Officer in Centre for Continuing Education Kerala – Sanctioned", "G.O.(Rt) No.1085/2026/HEDN"],
  ["20/08/2026", "Kerala State Library Council – First installment of government grant for 2026–27 – Sanctioned", "G.O.(Rt) No.1063/2026/HEDN"],
  ["18/08/2026", "Kerala Council for Historical Research (KCHR) – Annual Plan Schemes 2026-27 – Administrative Sanction", "G.O.(Rt) No.1044/2026/HEDN"],
  ["14/08/2026", "Extension of contract period of Project Assistant in Kerala State Library Council Office", "G.O.(Rt) No.1020/2026/HEDN"],
  ["14/08/2026", "State Central Library – Extension of appointment period of apprentices", "G.O.(Rt) No.1015/2026/HEDN"],
  ["20/07/2026", "Kerala Council for Historical Research (KCHR) – Charge arrangements", "G.O.(Rt) No.857/2026/HEDN"],
  ["14/07/2026", "Kerala State Science and Technology Museum (KSSTM) – Appointment of Director", "G.O.(Rt) No.828/2026/HEDN"],
  ["01/07/2026", "Kerala Common Pool Library Service – Establishment matters", "G.O.(Rt) No.770/2026/HEDN"],
  ["10/12/2016", "Payment of sixth UGC Pay Revision Arrears – Release of third installment", "G.O.(Ms) No.350/2016/H.Edn"],
];

const LEADERS = [
  { n: "Shri. V.D. Satheesan", r_en: "Chief Minister of Kerala", r_ml: "കേരള മുഖ്യമന്ത്രി", i: "VS" },
  { n: "Shri. Roji M John", r_en: "Minister for Higher Education", r_ml: "ഉന്നത വിദ്യാഭ്യാസ മന്ത്രി", i: "RJ" },
  { n: "Dr. Sharmila Mary Joseph IAS", r_en: "Secretary, Higher Education", r_ml: "സെക്രട്ടറി, ഉന്നത വിദ്യാഭ്യാസം", i: "SJ" },
  { n: "Dr. B Ashok IAS", r_en: "Principal Secretary", r_ml: "പ്രിൻസിപ്പൽ സെക്രട്ടറി", i: "BA" },
];

const SCHOLARSHIPS = [
  { n: "KSHEC Scholarship Portal", d: "Higher Education Scholarships (HEC) for eligible UG students in Kerala colleges.", l: "scholarship.kshec.kerala.gov.in" },
  { n: "DCE Scholarship Portal", d: "CM Prathibha / merit scholarships by the Department of Collegiate Education.", l: "cmprathibhapuraskaram.kerala.gov.in" },
  { n: "e-Grantz Portal", d: "Post-Matric scholarships & fee reimbursement for SC/ST/OBC students.", l: "egrantz.kerala.gov.in" },
  { n: "National Scholarship Portal", d: "Central Government scholarships for college & university students.", l: "scholarships.gov.in" },
];

export default function HigherEd({ lang, setLang, onBack }) {
  const ml = lang === "ml";
  const [slide, setSlide] = useState(0);
  const [play, setPlay] = useState(true);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("home");
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric", weekday: "long" });

  useEffect(() => {
    if (!play) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 4000);
    return () => clearInterval(id);
  }, [play]);

  const gos = useMemo(() => {
    const v = q.trim().toLowerCase();
    if (!v) return GOS;
    return GOS.filter((g) => g.join(" ").toLowerCase().includes(v));
  }, [q]);

  const goSec = (id) => { setTab(id); document.getElementById("hedn-" + id)?.scrollIntoView({ behavior: "smooth" }); };

  const NAV = [
    ["home", ml ? "ഹോം" : "Home"],
    ["profile", ml ? "വകുപ്പ്" : "Profile"],
    ["academic", ml ? "അക്കാദമിക്" : "Academic"],
    ["universities", ml ? "സർവകലാശാലകൾ" : "Universities"],
    ["scholarships", ml ? "സ്കോളർഷിപ്പ്" : "Scholarships"],
    ["orders", ml ? "ഉത്തരവുകൾ" : "Govt Orders"],
    ["contact", ml ? "ബന്ധപ്പെടുക" : "Contact Us"],
  ];

  const s = SLIDES[slide];

  return (
    <div className={ml ? "font-mal" : ""}>
      <div className="no-print bg-[#5c1212] text-white text-[11.5px]">
        <div className="max-w-[1180px] mx-auto px-3 h-[30px] flex items-center justify-between gap-2">
          <span className="truncate flex items-center gap-1"><CalendarDays size={13} /> {today} &nbsp;|&nbsp; {ml ? "ഉന്നത വിദ്യാഭ്യാസം, കേരള സർക്കാർ" : "Higher Education, GOK"}</span>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onBack} className="underline font-bold flex items-center gap-1"><ArrowLeft size={12} /> eDistrict</button>
            <button onClick={() => setLang("en")} className={`px-2 border ${!ml ? "bg-white text-[#5c1212] font-bold" : "border-white/50"}`}>English</button>
            <button onClick={() => setLang("ml")} className={`px-2 border ${ml ? "bg-white text-[#5c1212] font-bold" : "border-white/50"}`}>മലയാളം</button>
          </div>
        </div>
      </div>

      {/* Masthead */}
      <div className="bg-white border-b-4 border-[#d4a017]">
        <div className="max-w-[1180px] mx-auto px-3 py-3 flex items-center gap-3">
          <div className="w-[58px] h-[58px] shrink-0 rounded-full bg-[#5c1212] text-white flex items-center justify-center border-2 border-[#d4a017]"><GraduationCap size={28} /></div>
          <div className="min-w-0">
            <div className="text-[20px] md:text-[26px] font-bold text-[#5c1212] leading-tight truncate">{ml ? "ഉന്നത വിദ്യാഭ്യാസ വകുപ്പ്" : "Higher Education Department"}</div>
            <div className="text-[12px] text-[#6b5a2a]">{ml ? "കേരള സർക്കാർ • Govt. of Kerala" : "Government of Kerala • കേരള സർക്കാർ"}</div>
          </div>
          <div className="ml-auto hidden md:flex items-center gap-2">
            <div className="flex items-center border border-[#c9b98a] bg-[#fdf8ea] px-2 py-1 gap-1">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={ml ? "തിരയുക…" : "Search GOs…"} className="bg-transparent outline-none text-[12.5px] w-[160px]" />
              <Search size={14} className="text-[#6b5a2a]" />
            </div>
            <div className="flex gap-1">
              <span className="w-7 h-7 flex items-center justify-center bg-[#1877f2] text-white rounded-sm cursor-pointer"><Globe size={14} /></span>
              <span className="w-7 h-7 flex items-center justify-center bg-[#ff0000] text-white rounded-sm cursor-pointer"><Rss size={14} /></span>
              <span className="w-7 h-7 flex items-center justify-center bg-[#1da1f2] text-white rounded-sm cursor-pointer"><AtSign size={14} /></span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="bg-[#5c1212] text-white no-print sticky top-0 z-40 shadow">
        <div className="max-w-[1180px] mx-auto px-2 flex overflow-x-auto">
          {NAV.map(([k, l]) => (
            <div key={k} onClick={() => goSec(k)} className={`px-4 py-[10px] text-[13px] font-semibold whitespace-nowrap cursor-pointer border-r border-white/15 hover:bg-white/10 ${tab === k ? "bg-[#d4a017] !text-[#3d0d0d]" : ""}`}>{l}</div>
          ))}
        </div>
      </div>

      {/* Slider */}
      <div id="hedn-home" className="max-w-[1180px] mx-auto px-3 mt-3">
        <div className="relative overflow-hidden border border-[#c9b98a] shadow" style={{ background: `linear-gradient(100deg, ${s.c1}, ${s.c2})` }}>
          <div className="h-[210px] md:h-[300px] flex items-center px-6 md:px-14 text-white">
            <div>
              <div><s.Icon size={56} strokeWidth={1.5} /></div>
              <div className="text-[19px] md:text-[30px] font-bold mt-2 drop-shadow">{ml ? s.t_ml : s.t_en}</div>
              <div className="text-[12px] md:text-[13px] opacity-90 mt-1">{ml ? "ഉന്നത വിദ്യാഭ്യാസ വകുപ്പ് • കേരള സർക്കാർ" : "Higher Education Department • Government of Kerala"}</div>
            </div>
          </div>
          <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2 no-print">
            <button onClick={() => setSlide((slide - 1 + SLIDES.length) % SLIDES.length)} className="bg-black/50 text-white text-[11px] px-2 py-[3px] flex items-center gap-1"><ChevronLeft size={12} /> Prev</button>
            {SLIDES.map((_, i) => (
              <span key={i} onClick={() => setSlide(i)} className={`w-3 h-3 rounded-full cursor-pointer ${i === slide ? "bg-[#d4a017]" : "bg-white/60"}`} />
            ))}
            <button onClick={() => setPlay(!play)} className="bg-black/50 text-white text-[11px] px-2 py-[3px] flex items-center gap-1">{play ? (<><Pause size={12} /> Pause</>) : (<><Play size={12} /> Play</>)}</button>
            <button onClick={() => setSlide((slide + 1) % SLIDES.length)} className="bg-black/50 text-white text-[11px] px-2 py-[3px] flex items-center gap-1">Next <ChevronRight size={12} /></button>
          </div>
        </div>
        <div className="bg-[#fff6d9] border border-t-0 border-[#d9bd6a] text-[#5c4300] text-[12.5px] px-3 py-[6px] flex gap-2">
          <b className="shrink-0 flex items-center gap-1"><Megaphone size={14} /> {ml ? "പുതിയത്" : "What's New"}:</b>
          <marquee className="flex-1">Application for Principals in Government Law Colleges • State Level Coordination Committee for NEET (UG) 2026 Re-examination re-constituted • CM Nava Kerala Post Doctoral Fellowships • KIRF Rankings 2025</marquee>
        </div>
      </div>

      {/* Welcome + quote */}
      <div className="max-w-[1180px] mx-auto px-3 mt-4 grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white border border-[#c9b98a] border-t-[3px] border-t-[#5c1212] p-4 shadow-sm">
          <h2 className="text-[17px] font-bold text-[#5c1212] border-b border-[#e5d6a8] pb-2 flex items-center gap-1"><Landmark size={17} /> {ml ? "ഉന്നത വിദ്യാഭ്യാസ വകുപ്പിലേക്ക് സ്വാഗതം" : "Welcome to Higher Education Department"}</h2>
          <p className="text-[13px] italic text-[#5a4a1a] bg-[#fdf8ea] border-l-4 border-[#d4a017] px-3 py-2 mt-3">
            “Education should be imparted with a view to the type of society that we wish to build. We are working for a modern democracy built on the values of human dignity and equality.”
          </p>
          <p className="text-[13px] mt-3 text-[#2b2b2b]" id="hedn-profile">
            {ml
              ? "ഉന്നത വിദ്യാഭ്യാസ വകുപ്പിന് പ്രിൻസിപ്പൽ സെക്രട്ടറിയാണ് മേധാവി. കൊളീജിയറ്റ് വിദ്യാഭ്യാസവും സാങ്കേതിക വിദ്യാഭ്യാസവും ഈ വകുപ്പിന് കീഴിലാണ്. സർക്കാർ കോളേജുകൾ ആരംഭിക്കലും പുതിയ കോഴ്സുകളും എയ്ഡഡ് കോളേജ് ജീവനക്കാരുടെ ശമ്പളവും ഡയറക്ടറേറ്റ് ഓഫ് കൊളീజിയറ്റ് എഡ്യൂക്കേഷൻ വഴിയാണ്."
              : "A Principal Secretary to Government heads the Department of Higher Education. Collegiate Education and Technical Education come under this department. The Directorate of Collegiate Education makes arrangements for starting new Government colleges and courses, and for payment of salary to the staff of aided colleges. The department aims to convert Higher Education Institutions into Centres of Excellence through academic excellence, equity of access, vocational support and advanced technology."}
          </p>
          <div className="grid sm:grid-cols-3 gap-2 mt-3 text-[12px]">
            {[
              [ml ? "ദർശനം" : "Vision", ml ? "അക്കാദമിക-ഭരണ മേഖലകളിൽ മികവ്" : "Excellence in academic & administrative streams"],
              [ml ? "ദൗത്യം" : "Mission", ml ? "എല്ലാവർക്കും തുല്യ അവസരം" : "Equitable access for all eligible persons"],
              [ml ? "ലക്ഷ്യം" : "Goal", ml ? "സ്ഥാപനങ്ങളെ മികവിന്റെ കേന്ദ്രങ്ങൾ" : "Institutions as Centres of Excellence"],
            ].map(([h, b]) => (
              <div key={h} className="border border-[#c9b98a] bg-[#fffdf4] p-2"><b className="text-[#5c1212]">{h}</b><br />{b}</div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white border border-[#c9b98a] border-t-[3px] border-t-[#d4a017] shadow-sm">
            <div className="bg-[#5c1212] text-white text-[13px] font-bold px-3 py-2 flex items-center gap-1"><Link2 size={14} /> {ml ? "ക്വിക്ക് ലിങ്കുകൾ" : "Quick Links"}</div>
            <ul className="text-[12.5px] divide-y divide-[#eee3c2]">
              {["Know the Department", "Collegiate Education", "Technical Education", "IHRD", "LBS Centre", "KSHEC", "e-Grantz", "AUS / Admissions"].map((l) => (
                <li key={l} className="px-3 py-[7px] hover:bg-[#fdf6dd] cursor-pointer flex items-center gap-1"><ChevronRight size={13} className="shrink-0" /> {l}</li>
              ))}
            </ul>
          </div>
          <div id="hedn-academic" className="bg-white border border-[#c9b98a] shadow-sm">
            <div className="bg-[#5c1212] text-white text-[13px] font-bold px-3 py-2 flex items-center gap-1"><GraduationCap size={14} /> {ml ? "അക്കാദമിക്" : "Academic"}</div>
            <ul className="text-[12.5px] divide-y divide-[#eee3c2]">
              {["Institutions – Government / Aided / Self-financing", "Regulations & Curriculum", "Academic Calendar", "University Acts & Statutes", "Lakshadweep Quota", "Admissions"].map((l) => (
                <li key={l} className="px-3 py-[7px] hover:bg-[#fdf6dd] cursor-pointer flex items-center gap-1"><ChevronRight size={13} className="shrink-0" /> {l}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Leaders */}
      <div className="max-w-[1180px] mx-auto px-3 mt-4">
        <div className="bg-white border border-[#c9b98a] border-t-[3px] border-t-[#5c1212] p-4 shadow-sm">
          <h2 className="text-[15px] font-bold text-[#5c1212] flex items-center gap-1"><Users size={15} /> {ml ? "നേതൃത്വം" : "Leadership"}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            {LEADERS.map((l) => (
              <div key={l.n} className="border border-[#c9b98a] bg-[#fffdf4] text-center p-3">
                <div className="w-[64px] h-[64px] mx-auto rounded-full bg-[#5c1212] text-[#f5d97a] font-bold text-[20px] flex items-center justify-center border-2 border-[#d4a017]">{l.i}</div>
                <div className="font-bold text-[12.5px] mt-2">{l.n}</div>
                <div className="text-[11.5px] text-[#6b5a2a]">{ml ? l.r_ml : l.r_en}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Universities strip */}
      <div id="hedn-universities" className="max-w-[1180px] mx-auto px-3 mt-4">
        <div className="bg-white border border-[#c9b98a] border-t-[3px] border-t-[#d4a017] p-4 shadow-sm">
          <h2 className="text-[15px] font-bold text-[#5c1212] flex items-center gap-1"><School size={15} /> {ml ? "സർവകലാശാലകളും സ്ഥാപനങ്ങളും" : "Universities & Institutions"}</h2>
          <div className="flex flex-wrap gap-2 mt-3 text-[12px]">
            {["University of Kerala", "MG University", "Calicut University", "Kannur University", "CUSAT", "KTU (APJ Abdul Kalam)", "Sree Sankaracharya", "Thunchath Ezhuthachan Malayalam University", "NUALS", "KAU", "KUHS", "SSUS", "Central University of Kerala", "IIT Palakkad", "IISER TVM", "NIT Calicut"].map((u) => (
              <span key={u} className="px-2 py-1 bg-[#f7efD6] border border-[#c9b98a] text-[#5c1212] flex items-center gap-1"><ChevronRight size={12} className="shrink-0" /> {u}</span>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-center">
            {[["15+", ml ? "സർവകലാശാലകൾ" : "Universities"], ["150+", ml ? "സർക്കാർ/എയ്ഡഡ് കോളേജുകൾ" : "Govt / Aided Colleges"], ["130+", ml ? "സ്വാശ്രയ എഞ്ചിനീയറിംഗ്" : "Self-financing Engg."], ["45+", ml ? "പോളിടെക്നിക്കുകൾ" : "Polytechnics"]].map(([n, l]) => (
              <div key={l} className="bg-[#5c1212] text-white py-3"><div className="text-[22px] font-bold text-[#f5d97a]">{n}</div><div className="text-[11.5px]">{l}</div></div>
            ))}
          </div>
        </div>
      </div>

      {/* Scholarships */}
      <div id="hedn-scholarships" className="max-w-[1180px] mx-auto px-3 mt-4">
        <div className="bg-white border border-[#c9b98a] border-t-[3px] border-t-[#1f8a4c] p-4 shadow-sm">
          <h2 className="text-[15px] font-bold text-[#5c1212] flex items-center gap-1"><IndianRupee size={15} /> {ml ? "സ്കോളർഷിപ്പുകൾ" : "Scholarships"}</h2>
          <div className="grid md:grid-cols-4 gap-3 mt-3">
            {SCHOLARSHIPS.map((s2) => (
              <div key={s2.n} className="border border-[#9cc79c] bg-[#f4fbf4] p-3">
                <div className="font-bold text-[13px] text-[#14661f]">{s2.n}</div>
                <div className="text-[12px] mt-1 min-h-[54px]">{s2.d}</div>
                <div className="text-[11px] font-bold text-[#0b3d91] break-all mt-1 flex items-center gap-1"><Link2 size={11} className="shrink-0" /> {s2.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Govt orders */}
      <div id="hedn-orders" className="max-w-[1180px] mx-auto px-3 mt-4">
        <div className="bg-white border border-[#c9b98a] border-t-[3px] border-t-[#5c1212] shadow-sm">
          <div className="px-4 py-2 flex items-center gap-2 border-b border-[#e5d6a8]">
            <h2 className="text-[15px] font-bold text-[#5c1212] flex items-center gap-1"><ScrollText size={15} /> {ml ? "സർക്കാർ ഉത്തരവുകൾ" : "Government Orders"}</h2>
            <span className="ml-auto text-[11.5px] text-[#6b5a2a] no-print flex items-center gap-1"><Search size={12} /> {gos.length} shown — type in header search to filter</span>
          </div>
          <table className="w-full text-[12.5px]" style={{ borderCollapse: "collapse" }}>
            <thead><tr className="bg-[#f3e8c8] text-[#5c1212]"><th className="text-left p-2 w-[100px] border border-[#d9c98f]">Date</th><th className="text-left p-2 border border-[#d9c98f]">Subject</th><th className="text-left p-2 w-[230px] border border-[#d9c98f]">G.O. Number</th></tr></thead>
            <tbody>
              {gos.map((g, i) => (
                <tr key={i} className={i % 2 ? "bg-[#fffdf4]" : ""}>
                  <td className="p-2 border border-[#e5d6a8] whitespace-nowrap">{g[0]}</td>
                  <td className="p-2 border border-[#e5d6a8]">{g[1]}</td>
                  <td className="p-2 border border-[#e5d6a8] font-semibold text-[#0b3d91]">{g[2]}</td>
                </tr>
              ))}
              {!gos.length && <tr><td colSpan={3} className="p-3 text-center text-[#888]">No orders match “{q}”.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <footer id="hedn-contact" className="mt-6 no-print">
        <div className="bg-[#3d0d0d] text-white">
          <div className="max-w-[1180px] mx-auto px-3 py-6 grid md:grid-cols-3 gap-6 text-[12.5px]">
            <div>
              <div className="font-bold text-[#f5d97a] mb-2 border-b border-white/20 pb-1">Higher Education Department</div>
              <p className="opacity-90">Department of Higher Education, Government Secretariat, Thiruvananthapuram, Kerala 695001. Collegiate Education • Technical Education • Universities.</p>
            </div>
            <div>
              <div className="font-bold text-[#f5d97a] mb-2 border-b border-white/20 pb-1">Policies</div>
              <ul className="space-y-1 opacity-90 list-disc ml-4"><li>Administrator</li><li>Terms And Conditions</li><li>Privacy Policy</li><li>Hyperlinking Policy</li></ul>
            </div>
            <div>
              <div className="font-bold text-[#f5d97a] mb-2 border-b border-white/20 pb-1">{ml ? "ബന്ധപ്പെടുക" : "Contact Us"}</div>
              <div className="opacity-90">Principal Secretary,<br />Higher Education Department,<br />Govt. Secretariat, Thiruvananthapuram.</div>
            </div>
          </div>
        </div>
        <div className="bg-[#230808] text-white/80 text-[11.5px]">
          <div className="max-w-[1180px] mx-auto px-3 py-3 flex flex-col md:flex-row gap-1 justify-between">
            <span>Higher Education Department Portal of Govt. of Kerala — designed and developed by ITD, IHRD Thiruvananthapuram.</span>
            <span>Hackathon demo clone (frontend only).</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
