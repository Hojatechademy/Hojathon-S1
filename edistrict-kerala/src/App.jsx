import { useEffect, useState } from "react";
import { ArrowRight, GraduationCap } from "lucide-react";
import Lenis from "lenis";
import TopBar from "./components/TopBar";
import Footer from "./components/Footer";
import Home from "./components/Home";
import IncomeForm from "./components/IncomeForm";
import TrackStatus from "./components/TrackStatus";
import HigherEd from "./components/HigherEd";

// Single Vercel deploy, portals differ only by URL params:
//   /                              -> eDistrict home
//   ?site=edistrict&page=form      -> eDistrict income form
//   ?site=edistrict&page=track     -> eDistrict status check
//   ?site=highered                 -> Higher Education Dept clone
const SITES = ["edistrict", "highered"];
const PAGES = ["home", "form", "track"];

function readParams() {
  try {
    const sp = new URLSearchParams(window.location.search);
    const site = sp.get("site");
    const page = sp.get("page");
    return {
      site: SITES.includes(site) ? site : "edistrict",
      page: PAGES.includes(page) ? page : "home",
    };
  } catch {
    return { site: "edistrict", page: "home" };
  }
}

function writeParams(site, page) {
  try {
    const sp = new URLSearchParams();
    // keep params always explicit so each UI has its own shareable link
    sp.set("site", site);
    if (site === "edistrict" && page && page !== "home") sp.set("page", page);
    const qs = sp.toString();
    window.history.pushState({ site, page }, "", qs ? `?${qs}` : window.location.pathname);
  } catch { /* ignore */ }
}

export default function App() {
  const [portal, setPortal] = useState(() => readParams().site);
  const [view, setView] = useState(() => readParams().page);
  const [lang, setLang] = useState("en");
  const [lastAck, setLastAck] = useState("");

  useEffect(() => {
    // Lenis smooth scroll — kept very subtle to preserve old govt feel (pixel-perfect mode)
    try {
      const lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
      let raf;
      const loop = (t) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
      return () => { cancelAnimationFrame(raf); lenis.destroy(); };
    } catch { return undefined; }
  }, []);

  // keep state in sync with browser back/forward
  useEffect(() => {
    const onPop = () => {
      const p = readParams();
      setPortal(p.site);
      setView(p.page);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const go = (v) => {
    const page = PAGES.includes(v) ? v : "home";
    setView(page);
    writeParams("edistrict", page);
    window.scrollTo(0, 0);
  };
  const goPortal = (p) => {
    const site = SITES.includes(p) ? p : "edistrict";
    setPortal(site);
    if (site === "edistrict") setView((cur) => cur);
    writeParams(site, site === "edistrict" ? view : undefined);
    window.scrollTo(0, 0);
  };

  if (portal === "highered") {
    return (
      <div className={lang === "ml" ? "font-mal" : ""}>
        <HigherEd lang={lang} setLang={setLang} onBack={() => goPortal("edistrict")} />
      </div>
    );
  }

  return (
    <div className={lang === "ml" ? "font-mal" : ""}>
      <div className="no-print bg-[#061f4d] text-white text-[11.5px]">
        <div className="max-w-[1180px] mx-auto px-3 h-[28px] flex items-center gap-2">
          <span className="opacity-70">Portals:</span>
          <button className="px-2 font-bold bg-white text-[#061f4d]">eDistrict</button>
          <button onClick={() => goPortal("highered")} className="px-2 underline opacity-90 hover:opacity-100 flex items-center gap-1"><GraduationCap size={12} /> Higher Education Dept <ArrowRight size={12} /></button>
        </div>
      </div>
      <TopBar lang={lang} setLang={setLang} go={go} />
      <main className="min-h-[60vh] pb-4">
        {view === "home" && <Home lang={lang} go={go} />}
        {view === "form" && <IncomeForm lang={lang} go={go} setLastAck={setLastAck} />}
        {view === "track" && <TrackStatus lang={lang} go={go} lastAck={lastAck} />}
      </main>
      <Footer lang={lang} />
    </div>
  );
}
