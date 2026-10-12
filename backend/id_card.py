"""Renders the ID card (54 x 86 mm @ 300 DPI) as PNG / PDF. Everything stays in memory."""
import io
import math
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

try:  # face detection is optional: the card still renders if OpenCV is broken/missing
    import cv2
    if not hasattr(cv2, "CascadeClassifier"):
        cv2 = None
except Exception:
    cv2 = None

DEFAULT_LOGO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "svvv.png")
DPI = 300
MM = DPI / 25.4
W, H = round(54 * MM), round(86 * MM)  # 638 x 1016 px

INK = (17, 17, 17, 255)
WHITE = (255, 255, 255, 255)
RED = (200, 30, 30, 255)

_BOLD = [
    "DejaVuSans-Bold.ttf", "arialbd.ttf", "LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
]
_REG = [
    "DejaVuSans.ttf", "arial.ttf", "LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
]


def font(bold, size):
    for p in (_BOLD if bold else _REG):
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            continue
    return ImageFont.load_default(size)


def wrap(dr, text, f, maxw):
    """Word-wrap text to maxw pixels; breaks very long words."""
    lines, cur = [], ""
    for word in text.split():
        test = (cur + " " + word).strip()
        if dr.textlength(test, font=f) <= maxw:
            cur = test
            continue
        if cur:
            lines.append(cur)
        while dr.textlength(word, font=f) > maxw and len(word) > 1:
            i = len(word) - 1
            while i > 1 and dr.textlength(word[:i], font=f) > maxw:
                i -= 1
            lines.append(word[:i])
            word = word[i:]
        cur = word
    if cur:
        lines.append(cur)
    return lines or [""]


def fit(dr, text, bold, size, maxw, minsize=12):
    while size > minsize and dr.textlength(text, font=font(bold, size)) > maxw:
        size -= 1
    return font(bold, size)


def teardrop(dr, x, y, w, h, fill):
    pts = []
    for deg in range(0, 361, 4):
        t = math.radians(deg)
        px = 0.5 + 0.69 * math.sin(t) * math.sin(t / 2)
        py = 0.5 - 0.5 * math.cos(t)
        pts.append((x + px * w, y + py * h))
    dr.polygon(pts, fill=fill)


def draw_flame(dr, x, y, w, h):
    teardrop(dr, x, y, w, h, (236, 110, 25, 255))
    teardrop(dr, x + w * 0.22, y + h * 0.38, w * 0.56, h * 0.56, (250, 190, 45, 255))


# ---------------------------------------------------------------- photo

def detect_faces(img):
    """Returns a list of faces, or None when OpenCV face detection is unavailable."""
    if cv2 is None:
        return None
    scale = 800 / max(img.size) if max(img.size) > 800 else 1
    small = img.resize((int(img.width * scale), int(img.height * scale))) if scale < 1 else img
    gray = cv2.cvtColor(np.array(small), cv2.COLOR_RGB2GRAY)
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    if cascade.empty():
        return None
    found = cascade.detectMultiScale(gray, 1.1, 5, minSize=(60, 60))
    faces = [tuple(int(v / scale) for v in r) for r in found]
    if faces:
        biggest = max(f[2] * f[3] for f in faces)
        faces = [f for f in faces if f[2] * f[3] >= 0.4 * biggest]
    return faces


def crop_ratio(img, cx, cy, cw):
    """Crop a 7:9 box of width cw centred near (cx, cy), clamped inside the image."""
    iw, ih = img.size
    cw = min(cw, iw, ih * 7 / 9)
    ch = cw * 9 / 7
    left = min(max(cx - cw / 2, 0), iw - cw)
    top = min(max(cy - ch / 2, 0), ih - ch)
    return img.crop((round(left), round(top), round(left + cw), round(top + ch)))


def red_background(img):
    arr = np.asarray(img).astype(np.int16)
    h, w, _ = arr.shape
    s = max(4, min(h, w) // 20)
    edge = np.concatenate([arr[:s].reshape(-1, 3), arr[:, :s].reshape(-1, 3), arr[:, -s:].reshape(-1, 3)])
    bg = np.median(edge, axis=0)
    dist = np.sqrt(((arr - bg) ** 2).sum(axis=2))
    mask = Image.fromarray(((dist < 55) * 255).astype(np.uint8))
    mask = mask.filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.GaussianBlur(2))
    return Image.composite(Image.new("RGB", img.size, (185, 32, 32)), img, mask)


def prepare_photo(raw, auto_crop, red_bg):
    warnings = []
    img = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert("RGB")
    faces = detect_faces(img)
    if faces is None:
        faces = []
        warnings.append("Face detection unavailable on server (reinstall opencv-python-headless)")
    elif not faces:
        warnings.append("No face detected in the photo")
    elif len(faces) > 1:
        warnings.append("Multiple faces detected - use a photo of one person")
    iw, ih = img.size
    if auto_crop and faces:
        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
        img = crop_ratio(img, x + w / 2, y + h * 0.55, w * 2.4)
    else:
        img = crop_ratio(img, iw / 2, ih / 2, iw)
    if red_bg:
        img = red_background(img)
    return img.resize((222, 285), Image.LANCZOS), warnings


def prepare_signature(raw, size=(180, 70)):
    sig = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert("RGBA")
    if sig.getchannel("A").getextrema()[0] == 255:  # no transparency: make white paper transparent
        gray = ImageOps.autocontrast(sig.convert("L"))
        alpha = ImageOps.invert(gray).point(lambda p: 0 if p < 50 else min(255, (p - 50) * 2))
        sig = Image.new("RGBA", sig.size, (20, 20, 70, 0))
        sig.putalpha(alpha)
    sig.thumbnail(size, Image.LANCZOS)
    return sig


def split_name(name):
    words = name.split()
    if len(words) < 2:
        return [name]
    best = min(range(1, len(words)),
               key=lambda i: abs(len(" ".join(words[:i])) - len(" ".join(words[i:]))))
    return [" ".join(words[:best]), " ".join(words[best:])]


# ---------------------------------------------------------------- card

def render_card(d, photo=None, signature=None, logo=None, auto_crop=True, red_bg=False):
    """d: cleaned text fields. Returns (RGBA card image, list of warnings)."""
    warnings = []
    card = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dr = ImageDraw.Draw(card)
    dr.rounded_rectangle((0, 0, W - 1, H - 1), radius=30, fill=WHITE, outline=INK, width=4)

    # header: use the uploaded institution logo, or the college default logo
    lg = None
    if logo:
        lg = Image.open(io.BytesIO(logo))
    elif os.path.exists(DEFAULT_LOGO):
        lg = Image.open(DEFAULT_LOGO)
    if lg is not None:
        lg = lg.convert("RGBA")
        lg.thumbnail((112, 112), Image.LANCZOS)
        card.alpha_composite(lg, (22 + (112 - lg.width) // 2, 26 + (112 - lg.height) // 2))
    else:
        draw_flame(dr, 42, 30, 70, 100)

    # header: university name + address
    x0, x1 = 140, W - 22
    cx = (x0 + x1) // 2
    lines = split_name(d["univ_name"])
    size = 40
    while size > 18 and max(dr.textlength(l, font=font(True, size)) for l in lines) > x1 - x0:
        size -= 1
    f, y = font(True, size), 20
    for l in lines:
        dr.text((cx, y), l, font=f, fill=INK, anchor="ma")
        y += int(size * 1.18)
    dr.text((cx, y + 2), d["univ_address"], font=fit(dr, d["univ_address"], True, 22, x1 - x0), fill=INK, anchor="ma")
    dr.rectangle((14, 166, W - 14, 172), fill=INK)

    # institute code
    dr.text((W // 2, 184), d["college_code"], font=fit(dr, d["college_code"], True, 34, W - 60), fill=INK, anchor="ma")

    # photo block
    pw, ph = 222, 285
    px, py = (W - pw) // 2, 236  # photo centred on the card
    dr.rectangle((px - 6, py - 6, px + pw + 6, py + ph + 6), fill=INK)
    if photo:
        img, warnings = prepare_photo(photo, auto_crop, red_bg)
        card.paste(img, (px, py))
    else:
        dr.rectangle((px, py, px + pw, py + ph), fill=(225, 225, 225, 255))
        dr.text((px + pw // 2, py + ph // 2), "PHOTO", font=font(True, 26), fill=(120, 120, 120, 255), anchor="mm")

    # blood group
    bx = px + pw + 6 + 26  # blood group sits just right of the photo
    teardrop(dr, bx, 300, 44, 62, RED)
    dr.text((bx + 54, 332), d["blood_group"], font=font(True, 34), fill=INK, anchor="lm")

    # name
    dr.text((W // 2, 540), d["name"], font=fit(dr, d["name"], True, 40, W - 50), fill=INK, anchor="ma")

    # details table
    rows = [
        ("Enrollment No", d["enrollment"]),
        ("Program", d["program"]),
        ("Admission Year", d["admission_year"]),
        ("Mobile", d["mobile"]),
        ("Emergency contact", d["emergency"]),
        ("Home Address", d["address"]),
    ]
    top, lx, colon, vx, vw, limit = 598, 30, 232, 246, W - 26 - 246, 884
    lsize = 21
    while lsize > 12 and max(dr.textlength(l, font=font(True, lsize)) for l, _ in rows) > 196:
        lsize -= 1
    vs = 23
    while True:
        fv = font(False, vs)
        wrapped = [wrap(dr, v, fv, vw) for _, v in rows]
        total = sum(len(w_) * int(vs * 1.25) + 8 for w_ in wrapped)
        if top + total <= limit or vs <= 12:
            break
        vs -= 1
    fl, y = font(True, lsize), top
    for (label, _), lines_ in zip(rows, wrapped):
        base = y + vs
        dr.text((lx, base), label, font=fl, fill=INK, anchor="ls")
        dr.text((colon, base), ":", font=fv, fill=INK, anchor="ls")
        for i, l in enumerate(lines_):
            dr.text((vx, base + i * int(vs * 1.25)), l, font=fv, fill=INK, anchor="ls")
        y += len(lines_) * int(vs * 1.25) + 8

    # footer: registrar signature
    if signature:
        sig = prepare_signature(signature)
        card.alpha_composite(sig, (W - 120 - sig.width // 2, 972 - 8 - sig.height))
    dr.text((W - 120, 976), "Registrar", font=font(True, 22), fill=INK, anchor="ma")
    return card, warnings


def to_png(card, dpi=DPI):
    buf = io.BytesIO()
    card.save(buf, "PNG", dpi=(dpi, dpi))
    return buf.getvalue()


def to_pdf(card):
    """PDF page of exactly 54 x 86 mm (image at 300 DPI)."""
    flat = Image.new("RGB", card.size, "white")
    flat.paste(card, mask=card.getchannel("A"))
    buf = io.BytesIO()
    flat.save(buf, "PDF", resolution=float(DPI))
    return buf.getvalue()