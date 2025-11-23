# Photo Organizer with Face Recognition

Automatically organize your photos by person using AI face recognition. This desktop application scans your photo folders, detects faces, and sorts them into person-specific folders.

## Features

- 🔍 Automatic face detection using InsightFace
- 👤 Person recognition with similarity scoring
- 📁 Native folder selection dialogs
- 📊 Real-time progress tracking
- 🎨 Modern full-screen interface
- ⚡ Fast processing with intelligent caching

## Prerequisites

**Required Software:**

- **Python 3.12+** - [Download here](https://www.python.org/downloads/)
- **Node.js 20+** - [Download here](https://nodejs.org/)
- **npm 10+** (comes with Node.js)

## Installation

### 1. Clone or Download the Repository

```bash
git clone <repository-url>
cd person-sorter
```

### 2. Install Python Dependencies

```bash
cd backend
python -m venv venv

# Activate virtual environment:
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install packages:
pip install -r requirements.txt

cd ..
```

**Python Dependencies (installed automatically):**
- Flask 3.0+ (web framework)
- Flask-CORS 4.0+ (CORS handling)
- InsightFace 0.7.3+ (face recognition)
- OpenCV 4.8+ (image processing)
- NumPy 1.26+ (numerical computing)
- ONNX Runtime 1.16+ (model inference)

### 3. Install Node.js Dependencies

```bash
npm install
```

**Node.js Dependencies (installed automatically):**
- React 19
- Electron 39
- Vite 7
- Axios (API calls)
- Tailwind CSS 3 (styling)
- TypeScript 5.9

### 4. Add Person Embeddings

**CRITICAL STEP:** The app needs at least one person embedding to work.

1. Place `.npy` files in `public/embeddings/`
2. Each file = one person (e.g., `john_doe.npy`)
3. Files must contain 512-dimensional face embedding vectors

**How to create embeddings:**

```python
import numpy as np
from insightface.app import FaceAnalysis
import cv2

# Initialize face detection
app = FaceAnalysis(name='buffalo_l')
app.prepare(ctx_id=0)

# Load a clear photo of the person
img = cv2.imread('photo_of_person.jpg')
faces = app.get(img)

# Save the first face's embedding
if len(faces) > 0:
    embedding = faces[0].embedding
    np.save('public/embeddings/person_name.npy', embedding)
    print(f"✓ Saved embedding: {embedding.shape}")
```

See `public/embeddings/README.md` for more details.

## Running the Application

You need **two separate terminal windows**:

### Terminal 1: Start Backend Server

```bash
cd backend

# Activate virtual environment:
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Start Flask server:
python app.py
```

Wait for: `Running on http://127.0.0.1:5000`

### Terminal 2: Start Electron App

```bash
npm run electron:dev
```

The application window will open automatically!

## How to Use

1. **Click "Browse"** next to "Input Folder" → select folder with your photos
2. **Click "Browse"** next to "Output Folder" → select where to save organized photos
3. **Adjust Similarity Threshold** (optional):
   - Lower (0.3-0.4): More matches, may include false positives
   - Higher (0.6-0.8): Stricter matching, fewer false positives
   - Default: 0.5 (recommended)
4. **Click "Organize Photos"** to start
5. **Watch Progress** - Real-time updates show:
   - Photos scanned
   - Photos organized
   - Current file being processed
   - Person being matched
6. **View Results** - Photos grouped by person with thumbnails
   - Click person cards to expand/collapse
   - See similarity scores on each photo
   - All photos displayed in full-width grid

## Configuration

### Backend Settings

Edit `backend/config.py`:

```python
# Face detection resolution (higher = slower but more accurate)
FACE_DET_SIZE = (640, 640)

# Use GPU acceleration (requires onnxruntime-gpu)
USE_GPU = False

# Similarity thresholds
DEFAULT_SIMILARITY_THRESHOLD = 0.5  # Default value
MIN_SIMILARITY_THRESHOLD = 0.3      # Minimum allowed
MAX_SIMILARITY_THRESHOLD = 0.9      # Maximum allowed

# Caching (improves performance on re-runs)
ENABLE_CACHE = True
```

### Frontend Settings

Edit `vite.config.ts` to change:
- Dev server port (default: 3000)
- Backend proxy settings

## Troubleshooting

### Backend Won't Start

**Error:** `ModuleNotFoundError: No module named 'insightface'`

**Fix:**
```bash
cd backend
venv\Scripts\activate  # or source venv/bin/activate
pip install -r requirements.txt
```

### No Faces Detected

**Possible causes:**
- Photos too small or low quality (use 200x200px minimum)
- Faces not clearly visible or obscured
- Photos not in supported formats

**Fix:** Use clear, front-facing photos in JPG, PNG, BMP, TIFF, or GIF format

### "No Person Embeddings Loaded"

**Cause:** No `.npy` files in `public/embeddings/`

**Fix:**
1. Add at least one `.npy` embedding file
2. Verify file is 512-dimensional NumPy array
3. Restart backend to load embeddings

### Images Not Showing

**Cause:** Backend not running or CORS issue

**Fix:**
1. Ensure backend is running on port 5000
2. Check backend terminal for errors
3. Refresh Electron window (Ctrl+R)

### First Run Downloads Model

**Expected behavior:** InsightFace downloads ~300MB model on first run

**Fix:** Be patient, requires internet connection. Model is cached for future use.

## Tech Stack

**Frontend:**
- React 19 with TypeScript
- Electron 39 (desktop framework)
- Vite 7 (build tool)
- Tailwind CSS 3 (styling)
- Axios (HTTP client)

**Backend:**
- Python 3.12+
- Flask 3 (REST API)
- InsightFace (face recognition)
- OpenCV (image processing)
- NumPy (numerical operations)
- ONNX Runtime (model inference)

## Project Structure

```
person-sorter/
├── backend/                # Python Flask backend
│   ├── app.py             # Main server & API endpoints
│   ├── config.py          # Configuration settings
│   ├── requirements.txt   # Python dependencies
│   └── metadata/cache/    # Face detection cache
├── electron/              # Electron main process
│   ├── main.cjs          # Main process (native APIs)
│   └── preload.cjs       # Preload script (IPC bridge)
├── public/embeddings/     # Person face embeddings (.npy)
├── src/
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API service layer
│   ├── types/           # TypeScript types
│   ├── App.tsx          # Main React component
│   └── main.tsx         # React entry point
├── package.json          # Node.js dependencies
└── README.md            # This file
```

## Building for Production

To create a distributable application:

```bash
# Build the frontend
npm run build

# Package as Electron app
npm run electron:build
```

Installers will be created in the `release/` folder:
- Windows: `.exe` installer
- macOS: `.dmg` disk image
- Linux: `.AppImage` executable

## Supported Image Formats

- JPG / JPEG
- PNG
- BMP
- TIFF
- GIF

## Notes

- Photos are **copied** (not moved) to preserve originals
- Organize photos to different output folders for different projects
- One person can have multiple embeddings for better accuracy
- Similarity scores show confidence level (higher = more confident match)
- Use GPU acceleration for faster processing (requires ONNX Runtime GPU)

## License

MIT License - See LICENSE file for details

## Support

For issues:
1. Check this README's troubleshooting section
2. Review `backend/README.md` for backend-specific details
3. Check `public/embeddings/README.md` for embedding help
4. Open an issue on GitHub

---

**Made with ❤️ using React, Electron, and InsightFace**
