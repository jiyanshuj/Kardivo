# Kardivo

Kardivo is a browser-based university ID card studio. It combines a React/Vite
frontend with a FastAPI image-rendering backend to collect student details,
crop and process a photograph, preview the card, and export a print-ready PNG
or PDF.

## Features

- Guided student and institution data entry
- JPG/PNG photo upload with crop, zoom, and positioning controls
- Optional face-centering and red-background replacement
- Optional institution logo and signature images
- Live card preview at the CR80 physical size of 54 x 86 mm
- High-resolution PNG and PDF export at 300 DPI
- In-memory processing; uploaded images and generated cards are not written to
  disk or stored on the server

## Tech stack

- Frontend: React 19, Vite
- Backend: FastAPI, Pillow, NumPy, OpenCV

## Project structure

```text
.
├── backend/
│   ├── id_card.py
│   ├── main.py
│   ├── requirements.txt
│   └── svvv.png
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── docs/
│   └── screenshots/
└── README.md
```

## Requirements

- Python 3.10 or newer
- Node.js 18 or newer
- npm

## Run locally

### 1. Start the backend

From the repository root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API is available at `http://localhost:8000`.

### 2. Start the frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in a browser. If the backend runs on a different
origin, set `VITE_API_URL` before starting the frontend:

```powershell
$env:VITE_API_URL = "http://localhost:8000"
npm run dev
```

For non-local frontend origins, configure the backend's allowed origins with
the `ALLOWED_ORIGINS` environment variable.

## Frontend commands

Run these commands from `frontend/`:

```bash
npm run dev      # Start the development server
npm run build    # Create a production build
npm run lint     # Run Oxlint
npm run preview  # Preview the production build
```

## API

The backend exposes two multipart form endpoints:

- `POST /api/preview` - returns a fast, lower-resolution PNG preview and
  tolerates incomplete form data.
- `POST /api/generate` - validates the form and returns a print-quality PNG
  or PDF based on the requested format.

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

The backend processes uploaded images and generated cards in memory. It does
not persist personal data, uploads, or generated output to disk.
