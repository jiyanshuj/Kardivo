import { useCallback, useEffect, useRef, useState } from "react";
import Details from "./details";
import { validate } from "./validation";

const API = import.meta.env.VITE_API_URL || "https://kardivo.onrender.com";
const CW = 280, CH = 360; // crop canvas (7:9 passport ratio)

const EMPTY = {
  college_code: "SVIIT", name: "", blood_group: "", enrollment: "", program: "",
  admission_year: "", mobile: "", emergency: "", address: "",
  univ_name: "Shri Vaishnav Vidyapeeth Vishwavidyalaya",
  univ_address: "Ujjain Road, Indore - 453111",
};

const SAMPLE = {
  ...EMPTY, name: "RAHUL SHARMA", blood_group: "B+", enrollment: "22100BTAIMLM10001",
  program: "B.Tech/CSE_AIML", admission_year: "2022-23", mobile: "9876543210",
  emergency: "9123456780", address: "12 Sample Nagar, Near City Mall, Indore",
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
:root{--navy:#0F1A2E;--navy-h:#1E293B;--blue:#304674;--canvas:#F8FAFC;--line:#E2E8F0;--line2:#CBD5E1;--line3:#94A3B8;--t2:#475569;--t3:#64748B;--err:#991B1B;
--sh1:0 1px 2px 0 rgba(15,26,46,.04);--sh2:0 4px 6px -1px rgba(15,26,46,.07),0 2px 4px -2px rgba(15,26,46,.05);--sh3:0 20px 25px -5px rgba(15,26,46,.10),0 8px 10px -6px rgba(15,26,46,.04)}
*{box-sizing:border-box}
html,body,#root{margin:0;height:100%;background:var(--canvas);color:var(--navy);font-family:'Inter',system-ui,sans-serif;font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased}
button,input,select,textarea{font:inherit}
.app{display:flex;flex-direction:column;height:100vh;overflow:hidden}
/* header */
.hdr{height:56px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 20px;background:#fff;border-bottom:1px solid var(--line)}
.hl,.hr{display:flex;align-items:center;gap:12px;min-width:0}
.mark{width:42px;height:42px;flex-shrink:0;display:block;object-fit:contain;border-radius:4px}
.ttl{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600;letter-spacing:-.01em;white-space:nowrap}
.sub{font-size:11px;color:var(--t3);white-space:nowrap}
.tag{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.04em;text-transform:uppercase;color:var(--t2);padding:2px 6px;background:#F1F5F9;border:1px solid var(--line);border-radius:4px}
.rec{display:flex;align-items:center;gap:8px;padding:4px 10px;background:var(--canvas);border:1px solid var(--line);border-radius:4px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--t2)}
.rec b{color:var(--navy);font-weight:600}
.dot{width:8px;height:8px;border-radius:9999px;background:var(--line3);flex-shrink:0}
.dot.ok{background:#16A34A}
.vsep{width:1px;height:16px;background:var(--line)}
/* buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:36px;padding:0 12px;background:var(--navy);border:1px solid var(--navy);border-radius:4px;color:#fff;font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap;transition:background .15s,border-color .15s}
.btn:hover{background:var(--navy-h)}
.btn:active{transform:translateY(.5px)}
.btn.sec{background:#fff;color:var(--navy);border-color:var(--line2)}
.btn.sec:hover{background:#F1F5F9;border-color:var(--line3)}
.btn.dense{height:30px}
.btn:disabled{opacity:.45;cursor:not-allowed;transform:none}
.btn.sec:disabled:hover{background:#fff;border-color:var(--line2)}
.btn.full{flex:1}
/* body */
.main{flex:1;display:flex;min-height:0}
.side{width:375px;flex-shrink:0;display:flex;flex-direction:column;background:#fff;border-right:1px solid var(--line)}
.side-h{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--canvas);border-bottom:1px solid var(--line)}
.side-h h2{margin:0;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase}
.side-b{flex:1;overflow-y:auto;padding:14px 16px 8px}
.side-f{display:flex;gap:8px;padding:12px;background:var(--canvas);border-top:1px solid var(--line)}
.sec{margin-bottom:18px}
.sec-h{display:flex;justify-content:space-between;align-items:baseline;padding-bottom:6px;margin-bottom:10px;border-bottom:1px solid var(--line)}
.sec-h span{font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#334155}
.sec-h small{font-size:10px;color:#94A3B8;font-weight:500}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.g3{display:grid;grid-template-columns:2fr 1fr;gap:8px}
.field{display:block;margin-bottom:10px;min-width:0}
.lbl{display:block;margin-bottom:4px;font-size:12px;font-weight:500;color:var(--t2)}
input,select,textarea{width:100%;height:36px;padding:0 10px;background:#fff;border:1px solid var(--line2);border-radius:4px;color:var(--navy);font-size:13px;outline:0}
textarea{height:auto;padding:8px 10px;resize:none;line-height:1.45}
input:hover,select:hover,textarea:hover{border-color:var(--line3)}
input:focus,select:focus,textarea:focus{border-color:var(--blue);box-shadow:0 0 0 1px var(--blue)}
input[type=file]{height:auto;padding:6px;font-size:12px;background:var(--canvas);border-style:dashed}
input[type=checkbox],input[type=range]{width:auto;height:auto;padding:0;border:0;box-shadow:none;accent-color:var(--navy)}
input[type=range]{width:100%}
.mono{font-family:'JetBrains Mono',monospace;font-weight:500;font-size:12px}
.strong{font-weight:600}.ctr{text-align:center;letter-spacing:.04em}.up{text-transform:uppercase;letter-spacing:.04em}
.blood{font-weight:600;color:#B91C1C}
.fname{display:block;margin-top:4px;font-size:11px;color:var(--t3)}
.err{display:block;margin-top:4px;padding-left:8px;border-left:2px solid #DC2626;color:var(--err);font-size:11px;font-style:normal;font-weight:500}
/* chips */
.chip{display:inline-flex;align-items:center;height:22px;padding:0 8px;border:1px solid;border-radius:4px;font-size:11px;font-weight:600;letter-spacing:.03em;text-transform:uppercase}
.chip.ok{background:#F0FDF4;border-color:#BBF7D0;color:#166534}
.chip.draft{background:var(--canvas);border-color:var(--line);color:var(--t2)}
.chip.bad{background:#FEF2F2;border-color:#FECACA;color:var(--err)}
/* photo slot */
.photo{display:flex;align-items:center;gap:12px;padding:10px;background:var(--canvas);border:1px solid var(--line);border-radius:4px;margin-bottom:10px}
.thumb{width:48px;height:62px;flex-shrink:0;object-fit:cover;border:1px solid var(--line2);border-radius:4px;background:#E2E8F0;display:grid;place-items:center;color:var(--t3);font-size:10px}
.photo-a{display:flex;flex-direction:column;gap:6px;flex:1}
.photo-a .row{display:flex;gap:6px}
/* canvas */
.cv{flex:1;min-width:0;display:flex;flex-direction:column;background-color:var(--canvas);background-image:radial-gradient(#CBD5E1 1.15px,transparent 1.15px);background-size:22px 22px;position:relative}
.tools{position:absolute;top:16px;left:50%;transform:translateX(-50%);z-index:5;display:flex;align-items:center;gap:10px;padding:6px 12px;background:#fff;border:1px solid var(--line2);border-radius:4px;box-shadow:var(--sh2);font-size:12px}
.tools input[type=range]{width:90px}
.tools button{width:24px;height:24px;display:grid;place-items:center;background:none;border:0;border-radius:4px;color:var(--t2);cursor:pointer;font-size:14px}
.tools button:hover{background:#F1F5F9}
.stage{flex:1;display:flex;align-items:center;justify-content:center;padding:72px 32px 32px;overflow:auto}
.cardwrap{transform-origin:center;transition:transform .15s ease-out}
.cardframe{width:min(340px,100%);aspect-ratio:54/86;background:#fff;border:1px solid var(--line2);border-radius:12px;box-shadow:var(--sh3);overflow:hidden}
.cardframe img{width:100%;height:100%;object-fit:cover;display:block}
.empty{width:300px;aspect-ratio:54/86;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:24px;text-align:center;border:1px dashed var(--line3);border-radius:12px;background:rgba(255,255,255,.7);color:var(--t3);font-size:12px;line-height:1.5}
.empty b{color:var(--navy);font-size:13px;font-weight:600}
.panel{width:min(640px,100%);padding:20px;background:#fff;border:1px solid var(--line2);border-radius:8px;box-shadow:var(--sh2)}
.panel h3{margin:0 0 12px;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase}
.vid{width:100%;max-width:360px;display:block;margin:0 auto;border:1px solid var(--line2);border-radius:4px;background:#E2E8F0}
.prow{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.crop-editor{display:grid;grid-template-columns:minmax(200px,280px) 1fr;gap:20px;align-items:start}
.crop-prev{padding:8px;background:#F1F5F9;border:1px solid var(--line);border-radius:4px}
.crop{width:100%;height:auto;aspect-ratio:7/9;display:block;border:1px solid var(--line2);background:#E2E8F0}
.range{display:block;margin-bottom:14px;font-size:12px;font-weight:500;color:var(--t2)}
.range input{margin-top:6px}
.chk{display:flex;align-items:center;gap:8px;margin:8px 0;font-size:12px;color:var(--t2)}
.opts{padding-top:12px;border-top:1px solid var(--line)}
/* status bar */
.status{height:40px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 24px;background:#fff;border-top:1px solid var(--line);font-size:12px;color:var(--t2)}
.status .l{display:flex;align-items:center;gap:10px;flex-wrap:wrap;overflow:hidden;white-space:nowrap}
.status .sep{color:var(--line2)}
.status .m{font-family:'JetBrains Mono',monospace}
.toast{position:fixed;left:50%;bottom:56px;transform:translateX(-50%);z-index:50;max-width:min(90%,420px);padding:10px 14px;background:var(--navy);border:1px solid var(--navy);border-radius:4px;box-shadow:var(--sh3);color:#fff;font-size:13px}
@media(max-width:1100px){.rec{display:none}.sub{display:none}}
@media(max-width:900px){
 .app{height:auto;min-height:100vh;overflow:visible}
 .main{flex-direction:column}
 .side{width:100%;border-right:0;border-bottom:1px solid var(--line)}
 .side-b{overflow:visible}
 .cv{min-height:640px}
 .hdr{height:auto;flex-wrap:wrap;padding:10px 16px}
 .tag,.status .hide-m{display:none}
 .crop-editor{grid-template-columns:1fr}
 .stage{padding:64px 16px 24px}
}
`;

export default function Hero() {
  const [mode, setMode] = useState("choose"); // choose | camera | crop
  const [source, setSource] = useState(null);
  const [fromCam, setFromCam] = useState(false);
  const [imgReady, setImgReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [ox, setOx] = useState(0);
  const [oy, setOy] = useState(0);
  const [photo, setPhoto] = useState(null);
  const [autoCrop, setAutoCrop] = useState(true);
  const [redBg, setRedBg] = useState(false);
  const [v, setV] = useState(EMPTY);
  const [files, setFiles] = useState({ signature: null, logo: null });
  const [serverErr, setServerErr] = useState({});
  const [show, setShow] = useState(false);
  const [result, setResult] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [facing, setFacing] = useState("user");
  const [stream, setStream] = useState(null);
  const [view, setView] = useState(100); // preview zoom %

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const streamRef = useRef(null);

  const errors = { ...validate(v), ...serverErr };
  const valid = !Object.keys(validate(v)).length && !!photo;

  function notify(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 4500);
  }

  function set(k, val) {
    setV((p) => ({ ...p, [k]: val }));
    setServerErr({});
    setDirty(true);
  }

  function setFile(k, file) {
    if (!file) { setDirty(true); return setFiles((p) => ({ ...p, [k]: null })); }
    if (!/^image\/(jpeg|png)$/.test(file.type)) return notify("Only JPG or PNG images are allowed");
    if (file.size > 5 * 1024 * 1024) return notify("Image must be 5 MB or smaller");
    setFiles((p) => ({ ...p, [k]: file }));
    setDirty(true);
  }

  // ------------------------------------------------------------ camera
  function stopCam() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  }

  async function startCam(f = facing) {
    stopCam();
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: f }, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = s;
      setStream(s);
      setMode("camera");
    } catch (e) {
      notify(e?.name === "NotAllowedError"
        ? "Camera permission denied. Please upload a photo instead."
        : "Camera not available. Please upload a photo instead.");
      setMode("choose");
    }
  }

  function switchCam() {
    const next = facing === "user" ? "environment" : "user";
    setFacing(next);
    startCam(next);
  }

  function capture() {
    const vid = videoRef.current;
    if (!vid || !vid.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = vid.videoWidth;
    c.height = vid.videoHeight;
    c.getContext("2d").drawImage(vid, 0, 0);
    stopCam();
    openCrop(c.toDataURL("image/jpeg", 0.95), true);
  }

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream, mode]);

  useEffect(() => () => stopCam(), []);

  // ------------------------------------------------------------ file + crop
  function onFile(e) {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    if (!/^image\/(jpeg|png)$/.test(f.type)) return notify("Only JPG or PNG images are allowed");
    if (f.size > 5 * 1024 * 1024) return notify("Image must be 5 MB or smaller");
    const r = new FileReader();
    r.onload = () => openCrop(r.result, false);
    r.readAsDataURL(f);
  }

  function openCrop(src, cam) {
    setFromCam(cam);
    setZoom(1); setOx(0); setOy(0);
    setImgReady(false);
    setSource(src);
    setMode("crop");
  }

  useEffect(() => {
    if (!source) return;
    const img = new Image();
    img.onload = () => { imgRef.current = img; setImgReady(true); };
    img.src = source;
  }, [source]);

  const drawCrop = useCallback((ctx, w, h) => {
    const img = imgRef.current;
    const base = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * base, dh = img.naturalHeight * base;
    const x = (w - dw) / 2 + (ox / 100) * ((dw - w) / 2);
    const y = (h - dh) / 2 + (oy / 100) * ((dh - h) / 2);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, x, y, dw, dh);
  }, [ox, oy, zoom]);

  useEffect(() => {
    if (mode === "crop" && imgReady && canvasRef.current) drawCrop(canvasRef.current.getContext("2d"), CW, CH);
  }, [drawCrop, imgReady, mode]);

  function usePhoto() {
    const c = document.createElement("canvas");
    c.width = 560; c.height = 720;
    drawCrop(c.getContext("2d"), 560, 720);
    c.toBlob((b) => {
      if (photo) URL.revokeObjectURL(photo.url);
      setPhoto({ blob: b, url: URL.createObjectURL(b) });
      setMode("choose");
      setDirty(true);
    }, "image/jpeg", 0.92);
  }

  // ------------------------------------------------------------ backend calls (unchanged)
  function buildForm() {
    const fd = new FormData();
    Object.entries(v).forEach(([k, val]) => fd.append(k, val));
    fd.append("auto_crop", autoCrop);
    fd.append("red_bg", redBg);
    if (photo) fd.append("photo", photo.blob, "photo.jpg");
    if (files.signature) fd.append("signature", files.signature);
    if (files.logo) fd.append("logo", files.logo);
    return fd;
  }

  async function call(fmt) {
    const fd = buildForm();
    fd.append("fmt", fmt);
    let res;
    try {
      res = await fetch(`${API}/api/generate`, { method: "POST", body: fd });
    } catch {
      throw new Error("Cannot reach the server. Is the backend running?");
    }
    if (!res.ok) {
      let j = {};
      try { j = await res.json(); } catch { /* not json */ }
      setServerErr(j.errors || {});
      setShow(true);
      throw new Error(j.message || "Server error");
    }
    return res.blob();
  }

  async function generate() {
    setShow(true);
    if (!photo) return notify("Add a photo first");
    if (Object.keys(validate(v)).length) return notify("Please fix the highlighted fields");
    setBusy(true);
    try {
      const b = await call("png");
      setResult((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(b); });
      setDirty(false);
    } catch (e) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  }

  function save(url, name) {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  }

  // Builds a single-page PDF (exactly 54 x 86 mm) around a JPEG, no dependencies.
  function buildPdf(jpeg, w, h) {
    const W = (54 / 25.4) * 72, H = (86 / 25.4) * 72;
    const enc = new TextEncoder();
    const parts = [], offs = [];
    let len = 0;
    const push = (x) => { const b = typeof x === "string" ? enc.encode(x) : x; parts.push(b); len += b.length; };
    const obj = (n, body) => { offs[n] = len; push(`${n} 0 obj\n`); body(); push("\nendobj\n"); };
    const content = `q ${W.toFixed(3)} 0 0 ${H.toFixed(3)} 0 0 cm /Im0 Do Q`;
    push("%PDF-1.4\n");
    obj(1, () => push("<</Type/Catalog/Pages 2 0 R>>"));
    obj(2, () => push("<</Type/Pages/Kids[3 0 R]/Count 1>>"));
    obj(3, () => push(`<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${W.toFixed(3)} ${H.toFixed(3)}]/Resources<</XObject<</Im0 4 0 R>>>>/Contents 5 0 R>>`));
    obj(4, () => {
      push(`<</Type/XObject/Subtype/Image/Width ${w}/Height ${h}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ${jpeg.length}>>\nstream\n`);
      push(jpeg);
      push("\nendstream");
    });
    obj(5, () => push(`<</Length ${content.length}>>\nstream\n${content}\nendstream`));
    const xref = len;
    push(`xref\n0 6\n0000000000 65535 f \n`);
    for (let i = 1; i <= 5; i++) push(`${String(offs[i]).padStart(10, "0")} 00000 n \n`);
    push(`trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF`);
    return new Blob(parts, { type: "application/pdf" });
  }

  async function pngToPdf(pngBlob) {
    const bmp = await createImageBitmap(pngBlob);
    const c = document.createElement("canvas");
    c.width = bmp.width; c.height = bmp.height;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(bmp, 0, 0);
    const jpg = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.95));
    const bytes = new Uint8Array(await jpg.arrayBuffer());
    return buildPdf(bytes, c.width, c.height);
  }

  async function downloadPdf() {
    setBusy(true);
    try {
      const png = await call("png");
      const b = await pngToPdf(png);
      const url = URL.createObjectURL(b);
      save(url, "id-card.pdf");
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  }

  function printCard() {
    const w = window.open("", "_blank");
    if (!w) return notify("Allow pop-ups to print");
    w.document.write(
      `<html><head><title>ID Card</title><style>@page{size:54mm 86mm;margin:0}html,body{margin:0}` +
      `img{width:54mm;height:86mm;display:block}</style></head><body><img src="${result}"></body></html>`
    );
    w.document.close();
    const im = w.document.querySelector("img");
    const go = () => { w.focus(); w.print(); };
    if (im.complete) go(); else im.onload = go;
  }

  function reset() {
    if (photo) URL.revokeObjectURL(photo.url);
    if (result) URL.revokeObjectURL(result);
    setPhoto(null); setResult(null); setV(EMPTY); setFiles({ signature: null, logo: null });
    setServerErr({}); setShow(false); setSource(null); setMode("choose"); setRedBg(false);
    setDirty(false); setView(100);
  }

  const hasResult = !!result;
  const stale = hasResult && dirty;
  const chip = stale ? ["draft", "Outdated"] : hasResult ? ["ok", "Verified"] : ["draft", "Draft"];

  // ------------------------------------------------------------ UI
  return (
    <>
      <style>{css}</style>
      <div className="app">
        <header className="hdr">
          <div className="hl">
            <img className="mark" src="/kardivo-logo.png" alt="kardivo logo" />
            <div>
              <div className="ttl">SVVV Student Registrar Office <span className="tag">Production Studio</span></div>
              <div className="sub">Student Identity Card Production &amp; Verification System</div>
            </div>
            <div className="rec">
              <span className={`dot ${valid ? "ok" : ""}`} />
              Record: <b>{v.enrollment || "—"}</b>
            </div>
          </div>
          <div className="hr">
            <button className="btn sec dense" onClick={() => { setV(SAMPLE); setServerErr({}); setDirty(true); }}>Fill sample data</button>
            <button className="btn sec dense" disabled={!hasResult} onClick={() => save(result, "id-card.png")}>High-Res PNG</button>
            <button className="btn sec dense" disabled={!hasResult || busy} onClick={downloadPdf}>{busy ? "Preparing..." : "Export PDF"}</button>
            <button className="btn dense" disabled={!hasResult} onClick={printCard}>Print ID Card</button>
          </div>
        </header>

        <div className="main">
          {/* ---------------- left: data entry ---------------- */}
          <aside className="side">
            <div className="side-h">
              <h2>Card Data &amp; Credentials</h2>
              <span className="tag">Edit mode</span>
            </div>
            <div className="side-b">
              <section className="sec">
                <div className="sec-h"><span>Photograph</span><small>Required</small></div>
                <div className="photo">
                  {photo ? <img className="thumb" src={photo.url} alt="Selected" /> : <div className="thumb">No photo</div>}
                  <div className="photo-a">
                    <div className="row">
                      <label className="btn sec dense full">
                        {photo ? "Replace" : "Upload"}
                        <input type="file" accept="image/jpeg,image/png" hidden onChange={onFile} />
                      </label>
                      <button className="btn sec dense full" onClick={() => startCam()}>Camera</button>
                    </div>
                    <span className="lbl" style={{ margin: 0 }}>JPG/PNG, max 5 MB, face clearly visible</span>
                  </div>
                </div>
                {show && !photo && <em className="err">Photo is required</em>}
              </section>

              <Details v={v} set={set} errors={errors} show={show} files={files} setFile={setFile} />
            </div>
            <div className="side-f">
              <button className="btn sec full" onClick={reset}>Reset Form</button>
              <button className="btn full" onClick={generate} disabled={busy}>{busy ? "Generating..." : "Generate Preview"}</button>
            </div>
          </aside>

          {/* ---------------- center: workspace ---------------- */}
          <section className="cv">
            {mode === "choose" && (
              <div className="tools">
                <span className={`chip ${chip[0]}`}>{chip[1]}</span>
                <span className="vsep" />
                <button onClick={() => setView((z) => Math.max(70, z - 10))} title="Zoom out">−</button>
                <input type="range" min="70" max="130" value={view} onChange={(e) => setView(+e.target.value)} />
                <button onClick={() => setView((z) => Math.min(130, z + 10))} title="Zoom in">+</button>
                <span className="m" style={{ fontFamily: "JetBrains Mono,monospace", minWidth: 36, textAlign: "right" }}>{view}%</span>
                <button onClick={() => setView(100)} title="Reset zoom">↺</button>
              </div>
            )}

            <div className="stage">
              {mode === "camera" && (
                <div className="panel">
                  <h3>Capture Photograph</h3>
                  <video ref={videoRef} className="vid" autoPlay playsInline muted />
                  <div className="prow">
                    <button className="btn" onClick={capture}>Capture</button>
                    <button className="btn sec" onClick={switchCam}>Switch camera</button>
                    <button className="btn sec" onClick={() => { stopCam(); setMode("choose"); }}>Cancel</button>
                  </div>
                </div>
              )}

              {mode === "crop" && (
                <div className="panel">
                  <h3>Crop Settings</h3>
                  <div className="crop-editor">
                    <div className="crop-prev">
                      <canvas ref={canvasRef} width={CW} height={CH} className="crop" />
                    </div>
                    <div>
                      <label className="range">Zoom
                        <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(+e.target.value)} />
                      </label>
                      <label className="range">Horizontal position
                        <input type="range" min="-100" max="100" value={ox} onChange={(e) => setOx(+e.target.value)} />
                      </label>
                      <label className="range">Vertical position
                        <input type="range" min="-100" max="100" value={oy} onChange={(e) => setOy(+e.target.value)} />
                      </label>
                      <div className="opts">
                        <label className="chk">
                          <input type="checkbox" checked={autoCrop} onChange={(e) => { setAutoCrop(e.target.checked); setDirty(true); }} />
                          Auto-center on face
                        </label>
                        <label className="chk">
                          <input type="checkbox" checked={redBg} onChange={(e) => { setRedBg(e.target.checked); setDirty(true); }} />
                          Replace background with red
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="prow">
                    <button className="btn" onClick={usePhoto} disabled={!imgReady}>Use photo</button>
                    <button className="btn sec" onClick={() => (fromCam ? startCam() : setMode("choose"))}>
                      {fromCam ? "Retake" : "Choose another"}
                    </button>
                  </div>
                </div>
              )}

              {mode === "choose" && (
                <div className="cardwrap" style={{ transform: `scale(${view / 100})` }}>
                  {result ? (
                    <div className="cardframe" style={{ opacity: stale ? 0.6 : 1 }}>
                      <img src={result} alt="Generated ID card" />
                    </div>
                  ) : (
                    <div className="empty">
                      <b>No preview yet</b>
                      Add a photograph, complete the card data, then choose “Generate Preview”.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="status">
              <div className="l">
                <span style={{ fontWeight: 500 }}>
                  {stale ? "Preview outdated — regenerate to sync" : hasResult ? "Preview synchronized" : "Awaiting data"}
                </span>
                <span className="sep hide-m">•</span>
                <span className="hide-m">CR80 Physical Dimensions: 54.00 × 86.00 mm</span>
                <span className="sep hide-m">•</span>
                <span className="m hide-m">PNG 300 DPI</span>
              </div>
              <span className="hide-m" style={{ fontSize: 11, color: "var(--t3)" }}>Nothing is stored on the server</span>
            </div>
          </section>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}