# Photo Organizer Backend

Flask REST API for face recognition and photo organization using InsightFace.

## Setup

### 1. Create Virtual Environment

```bash
python -m venv venv
```

### 2. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

## Running the Server

```bash
python app.py
```

Server starts at: `http://127.0.0.1:5000`

## Dependencies

- **Flask 3.0+** - Web framework
- **Flask-CORS 4.0+** - Cross-origin resource sharing
- **InsightFace 0.7.3+** - Face recognition (buffalo_l model)
- **OpenCV 4.8+** - Image processing
- **NumPy 1.26+** - Numerical computing
- **ONNX Runtime 1.16+** - Model inference

## API Endpoints

### Health Check
```
GET /api/health
```
Returns server status and embeddings count.

### List/Load Embeddings
```
GET /api/embeddings
POST /api/embeddings
Body: { "embeddingsDir": "path/to/embeddings" }
```

### Start Organization
```
POST /api/organize/start
Body: {
  "inputFolder": "path/to/photos",
  "outputFolder": "path/to/output",
  "threshold": 0.5,
  "embeddingsDir": "path/to/embeddings"
}
```

### Get Progress
```
GET /api/organize/progress
```
Returns real-time progress updates during organization.

### Get Results
```
GET /api/organize/results
```
Returns final organization results.

### Cancel Operation
```
POST /api/organize/cancel
```

### Serve Images
```
GET /api/image?path=/path/to/image.jpg
```
Serves image files from filesystem.

## Configuration

Edit `config.py`:

```python
# Face detection settings
FACE_DET_SIZE = (640, 640)  # Detection resolution
USE_GPU = False              # GPU acceleration

# Thresholds
DEFAULT_SIMILARITY_THRESHOLD = 0.5
MIN_SIMILARITY_THRESHOLD = 0.3
MAX_SIMILARITY_THRESHOLD = 0.9

# Performance
ENABLE_CACHE = True  # Cache face detections

# Server
DEBUG = True
HOST = '127.0.0.1'
PORT = 5000
```

## How It Works

1. **Load Embeddings** - Server loads `.npy` files from embeddings directory
2. **Scan Photos** - Recursively finds all images in input folder
3. **Detect Faces** - Uses InsightFace buffalo_l model to detect faces
4. **Match Persons** - Compares face embeddings using cosine similarity
5. **Organize** - Copies matching photos to person-specific folders
6. **Report Progress** - Updates progress state every 500ms for frontend polling

## Troubleshooting

### Model Download on First Run

InsightFace downloads the buffalo_l model (~300MB) on first use. This is normal and only happens once.

### GPU Acceleration

To use GPU:
1. Install: `pip install onnxruntime-gpu`
2. Set `USE_GPU = True` in `config.py`
3. Ensure CUDA is properly installed

### Memory Issues

For large photo collections:
- Reduce `FACE_DET_SIZE` to `(480, 480)` or lower
- Process in smaller batches
- Ensure adequate RAM (4GB+ recommended)

### Permission Errors

- Backend needs read access to input folder
- Backend needs write access to output folder
- Run with appropriate permissions

## Notes

- First run downloads InsightFace model (requires internet)
- Caching improves performance on repeated scans
- Photos are copied (not moved) to preserve originals
- Supports recursive folder scanning
- Thread-safe background processing
