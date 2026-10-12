# Kardivo

Kardivo is a browser-based university ID card studio. A React/Vite frontend collects student details and a photograph, and a FastAPI backend renders a print-ready card (CR80, 54 x 86 mm) as PNG or PDF.

## Features

- Guided student and institution data entry with inline validation
- Photo input by JPG/PNG upload or live camera capture
- Crop, zoom and positioning controls, with optional face auto-centering and red-background replacement
- Optional institution logo (defaults to the bundled college logo) and registrar signature
- Card preview generated on demand, with zoom controls and an "Outdated" indicator when the form changes after generation
- Export as 300 DPI PNG or a 54 x 86 mm PDF, or print directly from the browser
- In-memory processing: uploaded images and generated cards are never written to disk

## Tech stack

- Frontend: React 19, Vite 8, Oxlint
- Backend: FastAPI, Pillow, NumPy, OpenCV (face detection is optional; the card still renders without it)

## Project structure

```text
.
├── backend/
│   ├── id_card.py          # Card rendering (Pillow) and photo processing
│   ├── main.py             # FastAPI app, validation, endpoints
│   ├── requirements.txt
│   └── svvv.png            # Default institution logo
├── frontend/
│   ├── public/
│   │   └── kardivo-logo.png
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   └── component/
│   │       ├── hero.jsx        # Main studio UI, camera, crop, export
│   │       ├── details.jsx     # Form sections
│   │       └── validation.js   # Client-side validation rules
│   ├── package.json
│   └── vite.config.js
├── docs/
│   └── screenshots/
└── README.md
```

## Requirements

- Python 3.10 or newer
- Node.js 20.19+ or 22.12+ (required by Vite 8)
- npm

## Run locally

### 1. Start the backend

From the repository root:

**Windows (PowerShell)**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**macOS / Linux**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API is available at `http://localhost:8000`.

### 2. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

### Configuration

| Variable | Where | Default | Purpose |
| --- | --- | --- | --- |
| `VITE_API_URL` | Frontend | `http://localhost:8000` | Backend base URL |
| `ALLOWED_ORIGINS` | Backend | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated CORS origins |

Example (PowerShell):

```powershell
$env:VITE_API_URL = "http://localhost:8000"
npm run dev
```

## Frontend commands

Run from `frontend/`:

```bash
npm run dev      # Start the development server
npm run build    # Create a production build
npm run lint     # Run Oxlint
npm run preview  # Preview the production build
```

## API

Both endpoints accept multipart form data.

- `POST /api/generate` - strictly validates the form and returns the print-quality card as PNG (300 DPI) or PDF (54 x 86 mm), selected with the `fmt` field. The web app uses this endpoint for previews and exports.
- `POST /api/preview` - lenient, lower-resolution PNG preview that tolerates incomplete forms.

Validation errors return HTTP 422 with a per-field `errors` object. Non-fatal photo issues (no face found, multiple faces) are returned in the `X-Warnings` response header.

### Input rules

| Field | Rule |
| --- | --- |
| Name | Letters, spaces and dots; max 40 characters |
| Enrollment number | Alphanumeric, required |
| Admission year | `YYYY-YY`, e.g. `2022-23` |
| Mobile / emergency contact | 10-digit Indian mobile number (starts with 6-9); must differ from each other |
| Address | Required; max 120 characters |
| Images | JPG or PNG, max 5 MB each |

## Screenshots

### Photo crop and adjustment

![Photo crop settings](docs/screenshots/01-photo-crop.png)

### Student and institution form

![ID card data form](docs/screenshots/02-form.png)

### Card preview workspace

![ID card preview](docs/screenshots/03-preview.png)

### Generated ID card

![Generated university ID card](docs/screenshots/04-generated-id-card.png)

## Privacy

The backend processes uploaded images and generated cards in memory only. It does not persist personal data, uploads or generated output to disk, and responses are sent with `Cache-Control: no-store`.