"""ID card API.  Run:  uvicorn main:app --reload --port 8000

Nothing is written to disk and no personal data is logged: uploads and
rendered cards live in memory only and vanish when the request ends.
"""
import io
import os
import re
from typing import Optional

from fastapi import Depends, FastAPI, File, Form, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from PIL import Image

from id_card import W, render_card, to_pdf, to_png

MAX_BYTES = 5 * 1024 * 1024
DEFAULT_UNIV = "Shri Vaishnav Vidyapeeth Vishwavidyalaya"
DEFAULT_ADDR = "Ujjain Road, Indore - 453111"
BLOOD = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}

app = FastAPI(title="University ID Card Generator", docs_url=None, redoc_url=None)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(","),
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Warnings"],
)


class ApiError(Exception):
    def __init__(self, errors):
        self.errors = errors


@app.exception_handler(ApiError)
async def api_error(_, exc):
    field = next(iter(exc.errors))
    return JSONResponse(status_code=422, content={"field": field, "message": exc.errors[field], "errors": exc.errors})


@app.middleware("http")
async def limit_body(request: Request, call_next):
    if int(request.headers.get("content-length") or 0) > 3 * MAX_BYTES + 100_000:
        return JSONResponse(status_code=413, content={"field": "photo", "message": "Upload too large (max 5 MB per image)"})
    return await call_next(request)


# ---------------------------------------------------------------- input handling

def clean(s, limit=None):
    s = re.sub(r"[\x00-\x1f\x7f]", " ", s or "")
    s = re.sub(r"\s+", " ", s).strip()
    return s[:limit] if limit else s


def validate(f, strict):
    d = {
        "college_code": clean(f["college_code"], 12).upper(),
        "name": clean(f["name"], 60).upper(),
        "blood_group": clean(f["blood_group"], 4).upper(),
        "enrollment": clean(f["enrollment"], 30).upper().replace(" ", ""),
        "program": clean(f["program"], 40),
        "admission_year": clean(f["admission_year"], 7),
        "mobile": clean(f["mobile"], 10),
        "emergency": clean(f["emergency"], 10),
        "address": clean(f["address"], 300),
        "univ_name": clean(f["univ_name"], 80) or DEFAULT_UNIV,
        "univ_address": clean(f["univ_address"], 80) or DEFAULT_ADDR,
    }
    if not strict:
        d["address"] = d["address"][:120]
        return d, {}

    e = {}
    if not d["college_code"] or not re.fullmatch(r"[A-Z0-9 -]{1,12}", d["college_code"]):
        e["college_code"] = "Institute code is required (letters/numbers, max 12)"
    if not d["name"]:
        e["name"] = "Name is required"
    elif not re.fullmatch(r"[A-Z. ]+", d["name"]):
        e["name"] = "Name may contain letters, spaces and dots only"
    elif len(d["name"]) > 40:
        e["name"] = "Name must be 40 characters or fewer"
    if d["blood_group"] not in BLOOD:
        e["blood_group"] = "Select a valid blood group"
    if not re.fullmatch(r"[A-Z0-9]+", d["enrollment"]):
        e["enrollment"] = "Enrollment number must be alphanumeric"
    if not re.fullmatch(r"[A-Za-z0-9 ./_&()-]{1,30}", d["program"]):
        e["program"] = "Program is required (max 30 characters)"
    m = re.fullmatch(r"(\d{4})-(\d{2})", d["admission_year"])
    if not m or int(m.group(2)) != (int(m.group(1)) + 1) % 100:
        e["admission_year"] = "Use format YYYY-YY, e.g. 2022-23"
    for k in ("mobile", "emergency"):
        if not re.fullmatch(r"[6-9]\d{9}", d[k]):
            e[k] = "Enter a valid 10-digit Indian mobile number"
    if "emergency" not in e and "mobile" not in e and d["mobile"] == d["emergency"]:
        e["emergency"] = "Emergency contact must differ from mobile number"
    if not d["address"]:
        e["address"] = "Address is required"
    elif len(d["address"]) > 120:
        e["address"] = "Address must be 120 characters or fewer"
    return d, e


def read_image(up: Optional[UploadFile], field, required):
    if up is None or not up.filename:
        if required:
            raise ApiError({field: "Photo is required"})
        return None
    data = up.file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise ApiError({field: "Image is larger than 5 MB"})
    try:
        im = Image.open(io.BytesIO(data))
        fmt = im.format
        im.verify()
    except Exception:
        raise ApiError({field: "Not a valid image file"})
    if fmt not in ("JPEG", "PNG"):
        raise ApiError({field: "Only JPG or PNG images are allowed"})
    return data


async def form_fields(
    college_code: str = Form(""), name: str = Form(""), blood_group: str = Form(""),
    enrollment: str = Form(""), program: str = Form(""), admission_year: str = Form(""),
    mobile: str = Form(""), emergency: str = Form(""), address: str = Form(""),
    univ_name: str = Form(DEFAULT_UNIV), univ_address: str = Form(DEFAULT_ADDR),
    auto_crop: bool = Form(True), red_bg: bool = Form(False), fmt: str = Form("png"),
):
    return locals()


def build(f, photo, signature, logo, strict):
    data, errors = validate(f, strict)
    imgs = {}
    for key, up, req in (("photo", photo, strict), ("signature", signature, False), ("logo", logo, False)):
        try:
            imgs[key] = read_image(up, key, req)
        except ApiError as ex:
            errors.update(ex.errors)
    if errors:
        raise ApiError(errors)
    return render_card(data, imgs["photo"], imgs["signature"], imgs["logo"], f["auto_crop"], f["red_bg"])


# ---------------------------------------------------------------- endpoints

@app.post("/api/preview")
def preview(f: dict = Depends(form_fields), photo: Optional[UploadFile] = File(None),
            signature: Optional[UploadFile] = File(None), logo: Optional[UploadFile] = File(None)):
    """Fast, lenient, low-resolution preview (never fails on incomplete forms)."""
    card, warnings = build(f, photo, signature, logo, strict=False)
    small = card.resize((W // 2, card.height // 2))
    return Response(to_png(small, 150), media_type="image/png",
                    headers={"X-Warnings": "|".join(warnings), "Cache-Control": "no-store"})


@app.post("/api/generate")
def generate(f: dict = Depends(form_fields), photo: Optional[UploadFile] = File(None),
             signature: Optional[UploadFile] = File(None), logo: Optional[UploadFile] = File(None)):
    """Strict validation, then the print-quality card as PNG (300 DPI) or PDF (54 x 86 mm)."""
    card, warnings = build(f, photo, signature, logo, strict=True)
    if f["fmt"] == "pdf":
        body, mime, fname = to_pdf(card), "application/pdf", "id-card.pdf"
    else:
        body, mime, fname = to_png(card), "image/png", "id-card.png"
    return Response(body, media_type=mime, headers={
        "Content-Disposition": f'attachment; filename="{fname}"',
        "X-Warnings": "|".join(warnings),
        "Cache-Control": "no-store",
    })