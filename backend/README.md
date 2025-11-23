# Photo Organizer Backend

Flask backend for face recognition and photo organization using InsightFace.

## Prerequisites

- Python 3.12 or higher
- pip (Python package manager)

## Setup Instructions

### 1. Create Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- Flask (web framework)
- InsightFace (face recognition)
- OpenCV (image processing)
- NumPy (numerical computing)
- ONNX Runtime (model inference)

### 3. Run the Server

```bash
python app.py
```

The server will start on `http://127.0.0.1:5000`

## API Endpoints

### Health Check
```
GET /api/health
```
Returns server status and embeddings count.

### Get/Set Embeddings
```
GET /api/embeddings
POST /api/embeddings
```
List available person embeddings or set embeddings directory.

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
Returns real-time progress updates.

### Get Results
```
GET /api/organize/results
```
Returns final organization results.

### Cancel Operation
```
POST /api/organize/cancel
```
Cancel ongoing photo organization.

## Configuration

Edit `config.py` to adjust:
- Face detection size
- GPU usage
- Similarity thresholds
- Cache settings
- Server host/port

## Troubleshooting

### InsightFace Model Download
On first run, InsightFace will download the `buffalo_l` model (~300MB). This requires internet connection.

### GPU Support
By default, CPU execution is used. For GPU acceleration, install:
```bash
pip install onnxruntime-gpu
```
And set `USE_GPU = True` in `config.py`.

### Memory Issues
For large photo collections, reduce `FACE_DET_SIZE` in `config.py` to `(480, 480)` or lower.

## Notes

- Person embeddings (.npy files) must be 512-dimensional vectors
- Supported image formats: JPG, JPEG, PNG, BMP, TIFF, GIF
- Photos are copied (not moved) to preserve originals
- Cache directory stores face detection results for faster reprocessing

