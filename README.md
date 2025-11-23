# Photo Organizer with Face Recognition

A desktop application that automatically organizes photos by person using face recognition. Built with Electron, React, Vite, and a Python Flask backend using InsightFace.

## Features

- 🖼️ Automatic face detection in photos
- 👤 Person recognition using pre-trained embeddings
- 📁 Native folder selection dialogs
- 📊 Real-time progress tracking
- 🎯 Adjustable similarity threshold
- ⚡ Fast processing with caching
- 🎨 Modern, responsive UI with dark mode support

## Prerequisites

### Required Software

- **Python 3.12+** - [Download](https://www.python.org/downloads/)
- **Node.js 20+** - [Download](https://nodejs.org/)
- **npm 10+** (comes with Node.js)
- **Git** - [Download](https://git-scm.com/)

### System Requirements

- 4GB+ RAM recommended
- Windows, macOS, or Linux
- 1GB free disk space (for models and dependencies)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd person-sorter
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Return to project root
cd ..
```

### 3. Frontend Setup

```bash
# Install Node.js dependencies
npm install
```

### 4. Add Person Embeddings

Person embeddings are stored in `public/embeddings/` as `.npy` files.

**Important:** Each `.npy` file should contain a 512-dimensional face embedding vector for one person. The filename (without extension) becomes the person's name.

Example structure:
```
public/embeddings/
  ├── john_doe.npy
  ├── jane_smith.npy
  └── alice_johnson.npy
```

**To generate embeddings:**
- Use InsightFace or compatible face recognition tool
- Extract a single face embedding from a clear photo of each person
- Save as `.npy` file (NumPy array format)
- Embedding must be 512-dimensional vector

**Quick test (optional):** Some sample embeddings are included in the repository for testing.

## Running the Application

### Option 1: Development Mode (Recommended for testing)

You'll need **two terminal windows**:

**Terminal 1 - Backend:**
```bash
cd backend
# Activate venv first (see above)
python app.py
```

**Terminal 2 - Frontend:**
```bash
npm run electron:dev
```

The Electron app will open automatically once both servers are running.

### Option 2: Production Build

```bash
# Build the application
npm run electron:build

# Installer will be in the 'release' folder
```

## How to Use

1. **Launch the application** (backend must be running)

2. **Select Input Folder** - Click "Browse" to select the folder containing photos you want to organize

3. **Select Output Folder** - Click "Browse" to select where organized photos should be copied

4. **Adjust Similarity Threshold** (optional)
   - Lower (0.3-0.5): More matches, may include false positives
   - Higher (0.6-0.9): Stricter matching, fewer false positives

5. **Click "Organize Photos"** - The app will:
   - Scan all images in the input folder (recursively)
   - Detect faces in each photo
   - Compare against your person embeddings
   - Copy matching photos to `{output_folder}/{person_name}/`

6. **Monitor Progress** - Watch real-time updates showing:
   - Number of photos scanned
   - Number of photos organized
   - Current file being processed
   - Current person being matched

7. **View Results** - See organized photos grouped by person
   - Click person cards to expand/collapse galleries
   - View similarity scores for each match

## Configuration

### Backend Configuration

Edit `backend/config.py` to customize:

```python
# Face detection resolution (higher = slower but more accurate)
FACE_DET_SIZE = (640, 640)

# Use GPU acceleration (requires onnxruntime-gpu)
USE_GPU = False

# Similarity thresholds
DEFAULT_SIMILARITY_THRESHOLD = 0.5
MIN_SIMILARITY_THRESHOLD = 0.3
MAX_SIMILARITY_THRESHOLD = 0.9

# Caching
ENABLE_CACHE = True
```

### Frontend Configuration

Edit `vite.config.ts` to change:
- Dev server port (default: 3000)
- Backend proxy settings
- Build output directory

## Project Structure

```
person-sorter/
├── backend/               # Python Flask backend
│   ├── app.py            # Main Flask application
│   ├── config.py         # Configuration settings
│   ├── requirements.txt  # Python dependencies
│   └── metadata/
│       └── cache/        # Face detection cache
├── electron/             # Electron main process
│   ├── main.js          # Main process entry
│   └── preload.js       # Preload script (IPC)
├── public/
│   └── embeddings/      # Person embeddings (.npy files)
├── src/
│   ├── components/      # React components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API service layer
│   ├── types/           # TypeScript types
│   ├── App.tsx          # Main React component
│   └── main.tsx         # React entry point
└── package.json
```

## Troubleshooting

### Backend won't start

**Issue:** `ModuleNotFoundError: No module named 'insightface'`

**Solution:**
```bash
cd backend
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### InsightFace model download

**Issue:** First run downloads ~300MB model

**Solution:** This is normal. Requires internet connection on first run. Model is cached for future use.

### No faces detected

**Possible causes:**
- Photos are too small or low quality
- Faces are not clearly visible
- Face detection threshold too high

**Solution:** Try photos with clear, front-facing faces of at least 200x200px

### No matches found

**Possible causes:**
- No embeddings in `public/embeddings/`
- Similarity threshold too high
- Embeddings don't match faces in photos

**Solution:**
- Verify `.npy` files exist in `public/embeddings/`
- Lower similarity threshold to 0.4-0.5
- Ensure embeddings are from the same face recognition model

### Electron app won't open

**Issue:** `Cannot GET /`

**Solution:** Make sure Vite dev server is running on port 3000:
```bash
npm run dev
```

### Permission errors

**Issue:** Cannot read/write files

**Solution:** Run with appropriate permissions or select folders you have access to

## Tech Stack

**Frontend:**
- React 19
- TypeScript
- Vite 7
- Tailwind CSS
- Axios
- Electron 39

**Backend:**
- Python 3.12+
- Flask 3
- InsightFace (buffalo_l model)
- OpenCV
- NumPy
- ONNX Runtime

## Development

### Available Scripts

```bash
# Development
npm run dev                # Start Vite dev server
npm run electron:dev       # Start Electron in dev mode

# Building
npm run build             # Build for production
npm run electron:build    # Build Electron app

# Linting
npm run lint              # Run ESLint
```

### API Endpoints

See `backend/README.md` for detailed API documentation.

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Acknowledgments

- InsightFace for the face recognition model
- Electron for desktop app framework
- React and Vite for the UI framework

## Support

For issues and questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review `backend/README.md` for backend-specific issues
- Open an issue on GitHub

## Future Enhancements

- [ ] Generate embeddings from within the app
- [ ] Support for video file processing
- [ ] Batch processing optimizations
- [ ] Export organization reports
- [ ] Undo functionality
- [ ] Move files instead of copy option
- [ ] Cloud storage integration
- [ ] Multi-language support
