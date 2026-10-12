import { BLOOD } from "./validation";

function F({ label, error, children, className = "" }) {
  return (
    <label className={`field ${className}`}>
      <span className="lbl">{label}</span>
      {children}
      {error && <em className="err">{error}</em>}
    </label>
  );
}

function Section({ title, tag, children }) {
  return (
    <section className="sec">
      <div className="sec-h">
        <span>{title}</span>
        <small>{tag}</small>
      </div>
      <div className="sec-b">{children}</div>
    </section>
  );
}

export default function Details({ v, set, errors, show, files, setFile }) {
  const err = (k) => ((show || v[k]) ? errors[k] : "");
  return (
    <>
      <Section title="Institution" tag="Header Data">
        <F label="Institution name">
          <input value={v.univ_name} maxLength={80} onChange={(e) => set("univ_name", e.target.value)} />
        </F>
        <div className="g3">
          <F label="Campus / Location" className="c2">
            <input value={v.univ_address} maxLength={80} onChange={(e) => set("univ_address", e.target.value)} />
          </F>
          <F label="Institute code" error={err("college_code")}>
            <input className="ctr strong" value={v.college_code} maxLength={12} placeholder="SVIIT"
              onChange={(e) => set("college_code", e.target.value.toUpperCase())} />
          </F>
        </div>
        <F label="Institution logo (JPG/PNG, optional; defaults to college logo)">
          <input type="file" accept="image/jpeg,image/png" onChange={(e) => setFile("logo", e.target.files[0])} />
          {files.logo && <small className="fname">{files.logo.name}</small>}
        </F>
      </Section>

      <Section title="Student Information" tag="Card Body">
        <F label="Full name" error={err("name")}>
          <input className="strong up" value={v.name} maxLength={40} placeholder="Full name"
            onChange={(e) => set("name", e.target.value.toUpperCase())} />
        </F>
        <div className="g2">
          <F label="Enrollment number" error={err("enrollment")}>
            <input className="mono" value={v.enrollment} maxLength={30} placeholder="22100BTAIMLM11253"
              onChange={(e) => set("enrollment", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} />
          </F>
          <F label="Blood group" error={err("blood_group")}>
            <select className="blood" value={v.blood_group} onChange={(e) => set("blood_group", e.target.value)}>
              <option value="">Select</option>
              {BLOOD.map((b) => <option key={b} value={b}>{b.replace("-", "\u2212")}</option>)}
            </select>
          </F>
        </div>
        <div className="g2">
          <F label="Program / Degree" error={err("program")}>
            <input value={v.program} maxLength={30} placeholder="B.Tech/CSE_AIML"
              onChange={(e) => set("program", e.target.value)} />
          </F>
          <F label="Admission year" error={err("admission_year")}>
            <input className="mono" value={v.admission_year} maxLength={7} placeholder="2022-23"
              onChange={(e) => set("admission_year", e.target.value.replace(/[^0-9-]/g, ""))} />
          </F>
        </div>
        <div className="g2">
          <F label="Contact number" error={err("mobile")}>
            <input className="mono" value={v.mobile} inputMode="numeric" placeholder="10 digits"
              onChange={(e) => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} />
          </F>
          <F label="Emergency contact" error={err("emergency")}>
            <input className="mono" value={v.emergency} inputMode="numeric" placeholder="10 digits"
              onChange={(e) => set("emergency", e.target.value.replace(/\D/g, "").slice(0, 10))} />
          </F>
        </div>
        <F label={`Home address (${v.address.length}/120)`} error={err("address")}>
          <textarea rows={2} value={v.address} maxLength={120} placeholder="House no, street, area, city"
            onChange={(e) => set("address", e.target.value)} />
        </F>
      </Section>

      <Section title="Signature" tag="Assets">
        <F label="Registrar signature (optional, JPG/PNG)">
          <input type="file" accept="image/jpeg,image/png" onChange={(e) => setFile("signature", e.target.files[0])} />
          {files.signature && <small className="fname">{files.signature.name}</small>}
        </F>
      </Section>
    </>
  );
}