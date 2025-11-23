import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Person embeddings directory (stored in public/embeddings)
# This will be passed from the frontend based on app path
PERSON_EMB_DIR = None  # Will be set dynamically

# Cache directory for face detection
CACHE_DIR = os.path.join(BASE_DIR, "metadata", "cache")
ENABLE_CACHE = True

# Face detection settings
FACE_DET_SIZE = (640, 640)
USE_GPU = True

# Similarity threshold
DEFAULT_SIMILARITY_THRESHOLD = 0.5
MIN_SIMILARITY_THRESHOLD = 0.3
MAX_SIMILARITY_THRESHOLD = 0.9

# Flask settings
DEBUG = True
HOST = '127.0.0.1'
PORT = 5000

