import { useState } from "react";
import { Download, Landmark, Loader2, Lock, Printer } from "lucide-react";
import html2pdf from "html2pdf.js";

function inWords(num) {
  num = Math.round(Number(num) || 0);
  if (num === 0) return "Zero";
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function two(n) { return n < 20 ? a[n] : b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : ""); }
  function three(n) { const h = Math.floor(n / 100), r = n % 100; return (h ? a[h] + " Hundred" + (r ? " " : "") : "") + (r ? two(r) : ""); }
  let out = "";
  const cr = Math.floor(num / 10000000); num %= 10000000;
  const lk = Math.floor(num / 100000); num %= 100000;
  const th = Math.floor(num / 1000); num %= 1000;
  const rest = num;
  if (cr) out += three(cr) + " Crore ";
  if (lk) out += two(lk) + " Lakh ";
  if (th) out += two(th) + " Thousand ";
  if (rest) out += three(rest);
  return out.trim();
}

export function certNoFromAck(ackNo) {
  if (!ackNo) return "INC/2026/000000";
  const digits = ackNo.replace(/\D/g, "").slice(-6) || "000000";
  return `INC/${new Date().getFullYear()}/${digits}`;
}

export default function Certificate({ rec, lang }) {
  const [busy, setBusy] = useState(false);
  const certNo = certNoFromAck(rec.ackNo);
  const issueDate = rec.certDate || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const validTill = new Date(Date.now() + 365 * 24 * 3600 * 1000).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const words = inWords(rec.total);

  async function downloadPDF() {
    try {
      setBusy(true);
      const el = document.getElementById("income-cert-doc");
      if (!el) return;
      const fname = `Kerala-Income-Certificate-${certNo.replace(/\//g, "-")}.pdf`;
      await html2pdf().set({
        margin: [8, 8, 10, 8],
        filename: fname,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all"] },
      }).from(el).save();
    } finally { setBusy(false); }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2 no-print mb-2">
        <button onClick={downloadPDF} disabled={busy} className="gov-btn gov-btn-green">
          {busy ? (<><Loader2 size={14} className="inline animate-spin" /> Generating PDF…</>) : (<><Download size={14} className="inline" /> Download Certificate PDF (Mock)</>)}
        </button>
        <button onClick={() => window.print()} className="gov-btn gov-btn-grey"><Printer size={14} className="inline" /> Print</button>
        <span className="text-[11px] text-[#6b7690] self-center">PDF captures the exact header + footer below • Malayalam-safe (image render)</span>
      </div>

      {/* ======= ORIGINAL-STYLE CERTIFICATE ======= */}
      <div id="income-cert-doc" style={{ background: "#fff", color: "#111", border: "6px double #0b3d91", padding: "22px 26px 16px", fontFamily: "'Noto Sans','Noto Sans Malayalam',Arial,sans-serif" }}>
        {/* header */}
        <div style={{ textAlign: "center", borderBottom: "2px solid #0b3d91", paddingBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ width: 58, height: 58, borderRadius: 9999, border: "2px solid #0b3d91", display: "flex", alignItems: "center", justifyContent: "center" }}><Landmark size={26} color="#0b3d91" /></div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>GOVERNMENT OF KERALA • കേരള സർക്കാർ</div>
              <div style={{ fontSize: 12, color: "#333" }}>Revenue Department • റവന്യൂ വകുപ്പ്</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: "#0b3d91", letterSpacing: 0.5 }}>INCOME CERTIFICATE • വരുമാന സർട്ടിഫിക്കറ്റ്</div>
              <div style={{ fontSize: 11, color: "#444" }}>(Issued under eDistrict Project • Village / Taluk Office)</div>
            </div>
            <div style={{ width: 58, height: 58, border: "1px solid #999", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, textAlign: "center", padding: 2 }}>PHOTO<br />QR</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 8, fontWeight: 700 }}>
            <span>Certificate No: {certNo}</span>
            <span>Date of Issue: {issueDate}</span>
          </div>
        </div>

        {/* body */}
        <div style={{ fontSize: 13.5, lineHeight: 1.9, marginTop: 12 }}>
          <p>
            Certified that <b><u>&nbsp;{rec.fullName || "________________"}&nbsp;</u></b>
            {rec.gender ? ` (${rec.gender})` : ""},
            S/o / D/o / W/o <b>{rec.fatherName || "________________"}</b>,
            residing at <b>{rec.address || "________________"}</b>,
            Village <b>{rec.village || "____"}</b>, Taluk <b>{rec.taluk || "____"}</b>,
            District <b>{rec.district || "____"}</b>, Kerala — {rec.pincode || ""},
            belongs to the State of Kerala.
          </p>
          <p>
            The annual family income of the above person from all sources for the last one year,
            as verified through Ration Card <b>{rec.ration || "—"}</b>, Land Tax Receipt, Salary Certificate /
            Form-16 / IT Return and local enquiry by the Village Officer, is found to be:
          </p>
          <div style={{ border: "1px solid #0b3d91", margin: "10px 0" }}>
            <div style={{ background: "#0b3d91", color: "#fff", fontWeight: 800, fontSize: 12, padding: "5px 10px" }}>INCOME BREAK-UP (വരുമാന വിവരം)</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <tbody>
                {[
                  ["Income from Land", rec.land],
                  ["Salary / Pension", rec.salary],
                  ["Income from Business", rec.business],
                  ["Income from Labour", rec.labour],
                  ["Income of NRI Member", rec.nri],
                  ["Rental Income", rec.rent],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ border: "1px solid #9fb0cc", padding: "4px 8px" }}>{k}</td>
                    <td style={{ border: "1px solid #9fb0cc", padding: "4px 8px", textAlign: "right" }}>Rs. {(Number(v) || 0).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ border: "1px solid #0b3d91", padding: "5px 8px", fontWeight: 800 }}>TOTAL ANNUAL INCOME</td>
                  <td style={{ border: "1px solid #0b3d91", padding: "5px 8px", textAlign: "right", fontWeight: 800 }}>Rs. {(Number(rec.total) || 0).toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            <b>Rupees {words} Only</b> — issued for the purpose of <b><u>&nbsp;{rec.purpose || "General"}&nbsp;</u></b>.
            This certificate is valid for <b>ONE YEAR</b> from the date of issue (till {validTill}).
          </p>
          <p style={{ fontSize: 12, color: "#333" }}>
            Aadhaar (masked): <b>XXXX-XXXX-{String(rec.aadhaar || "").slice(-4) || "____"}</b>
            &nbsp;•&nbsp; Application Ref: <b>{rec.ackNo}</b>
            &nbsp;•&nbsp; Verify at: <b>edistrict.kerala.gov.in → Certificate Verification</b>
          </p>
        </div>

        {/* signatures */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 26, fontSize: 12.5 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 120, height: 60, border: "1px dashed #999", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#666" }}>QR CODE<br />{certNo}</div>
            <div style={{ fontSize: 10, marginTop: 4 }}>Scan to verify (demo)</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div>Place: {rec.district || "Thiruvananthapuram"}</div>
            <div>Date: {issueDate}</div>
            <div style={{ marginTop: 34, fontWeight: 800 }}>( Digitally Signed )</div>
            <div style={{ fontWeight: 700 }}>Village Officer / Tahsildar</div>
            <div>Taluk: {rec.taluk || "—"}</div>
          </div>
        </div>

        {/* footer */}
        <div style={{ marginTop: 16, borderTop: "2px solid #0b3d91", paddingTop: 8, fontSize: 10.5, color: "#333" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span><Lock size={11} style={{ display: "inline", verticalAlign: -1 }} /> This is a digitally signed certificate issued through eDistrict Kerala. No manual signature required as per IT Act 2000.</span>
            <span>Page 1 of 1</span>
          </div>
          <div style={{ marginTop: 4, background: "#f2f4f9", border: "1px solid #c5d1e8", padding: "4px 8px" }}>
            Help: edistrict.ksitm@kerala.gov.in • 0471 2525444 • Vrindavan Gardens, Saankethika, Pattom P.O, Thiruvananthapuram 695004 • KSITM / NIC Kerala
            &nbsp;•&nbsp; <b>DEMO / HACKATHON MOCK — not a real government document</b>
          </div>
        </div>
      </div>
    </div>
  );
}
