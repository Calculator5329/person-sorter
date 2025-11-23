import os
import sys
import threading
import time
import shutil
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import multiprocessing
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import numpy as np
import cv2
from PIL import Image, ExifTags
import insightface
from insightface.app import FaceAnalysis
from urllib.parse import unquote

import config

app = Flask(__name__)
CORS(app)

# Global state
face_app = None
face_app_lock = threading.Lock()  # Lock for face_app initialization
person_embeddings = {}
organize_state = {
    'active': False,
    'initializing': False,  # New state for initialization phase
    'progress': {
        'scanned': 0,
        'total': 0,
        'organized': 0,
        'currentFile': '',
        'currentPerson': ''
    },
    'persons': {},
    'results': [],
    'cancel_requested': False
}

def initialize_face_app():
    """Initialize InsightFace application and ensure it's ready"""
    global face_app
    
    # Use lock to prevent concurrent initialization
    with face_app_lock:
        if face_app is None:
            print("\n" + "="*50)
            print("INITIALIZING FACE DETECTION MODELS")
            print("="*50)
            print("⏳ Loading InsightFace models (this may take 10-30 seconds)...")
            
            try:
                face_app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
                print("✓ Face detection model loaded")
                
                print("⏳ Preparing face recognition engine...")
                face_app.prepare(ctx_id=0 if config.USE_GPU else -1, det_size=config.FACE_DET_SIZE)
                print("✓ Face recognition engine ready")
                
                # Ensure models are fully loaded
                time.sleep(0.5)
                
                print("="*50)
                print("✓ INITIALIZATION COMPLETE - READY TO PROCESS")
                print("="*50 + "\n")
                
            except Exception as e:
                face_app = None
                print(f"✗ Initialization failed: {e}")
                raise
        else:
            print("✓ Face detection already initialized")

def load_embeddings(embeddings_dir):
    """Load person embeddings from .npy files and pre-normalize them"""
    global person_embeddings
    person_embeddings = {}
    
    if not os.path.exists(embeddings_dir):
        print(f"Warning: Embeddings directory not found: {embeddings_dir}")
        return
    
    npy_files = list(Path(embeddings_dir).glob('*.npy'))
    print(f"Loading embeddings from: {embeddings_dir}")
    print(f"Found {len(npy_files)} .npy files")
    
    for npy_file in npy_files:
        try:
            person_name = npy_file.stem
            embedding = np.load(str(npy_file))
            # Pre-normalize embeddings for faster cosine similarity
            normalized_emb = embedding / np.linalg.norm(embedding)
            person_embeddings[person_name] = normalized_emb
            print(f"Loaded embedding for: {person_name}")
        except Exception as e:
            print(f"Error loading {npy_file}: {e}")
    
    print(f"Total embeddings loaded: {len(person_embeddings)}")

def cosine_similarity(emb1, emb2):
    """Calculate cosine similarity between two embeddings"""
    return np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))

def correct_image_orientation(image_path):
    """
    Correct image orientation based on EXIF data
    Returns corrected image as numpy array (BGR format for OpenCV)
    """
    try:
        # Open image with PIL to read EXIF
        pil_image = Image.open(image_path)
        
        # Get EXIF orientation tag
        exif = pil_image.getexif()
        orientation = None
        
        if exif:
            for tag, value in exif.items():
                if tag in ExifTags.TAGS and ExifTags.TAGS[tag] == 'Orientation':
                    orientation = value
                    break
        
        # Apply orientation correction
        if orientation:
            if orientation == 3:
                pil_image = pil_image.rotate(180, expand=True)
            elif orientation == 6:
                pil_image = pil_image.rotate(270, expand=True)
            elif orientation == 8:
                pil_image = pil_image.rotate(90, expand=True)
        
        # Convert PIL image to OpenCV format (RGB -> BGR)
        img_array = np.array(pil_image)
        if len(img_array.shape) == 2:  # Grayscale
            img_bgr = cv2.cvtColor(img_array, cv2.COLOR_GRAY2BGR)
        elif img_array.shape[2] == 4:  # RGBA
            img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGBA2BGR)
        else:  # RGB
            img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        
        return img_bgr
    
    except Exception as e:
        print(f"Error correcting orientation for {image_path}: {e}")
        # Fall back to regular cv2 imread
        return cv2.imread(image_path)

def get_image_files(folder_path):
    """Recursively get all image files from folder and subfolders"""
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.gif'}
    image_files = []
    
    folder = Path(folder_path)
    if not folder.exists():
        print(f"Folder does not exist: {folder_path}")
        return []
    
    print(f"Scanning recursively for images in: {folder_path}")
    for file in folder.rglob('*'):
        if file.is_file() and file.suffix.lower() in image_extensions:
            image_files.append(str(file))
    
    print(f"Found {len(image_files)} images across all subfolders")
    return image_files

def process_photo(photo_path, threshold, check_all_orientations=False):
    """Process a single photo and return matches using vectorized similarity"""
    global face_app, person_embeddings
    
    try:
        # Read image with orientation correction for rotated photos
        img = correct_image_orientation(photo_path)
        if img is None:
            return []
        
        # Early return if no embeddings loaded
        if len(person_embeddings) == 0:
            return []
        
        # Prepare person data for vectorized comparison
        person_names = list(person_embeddings.keys())
        person_embs_matrix = np.array([person_embeddings[name] for name in person_names])
        
        all_matches = []
        
        if check_all_orientations:
            # Check all 4 orientations: 0°, 90°, 180°, 270°
            rotations = [0, 90, 180, 270]
            for rotation in rotations:
                # Rotate image
                if rotation == 90:
                    rotated_img = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
                elif rotation == 180:
                    rotated_img = cv2.rotate(img, cv2.ROTATE_180)
                elif rotation == 270:
                    rotated_img = cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)
                else:
                    rotated_img = img
                
                # Detect faces in rotated image
                faces = face_app.get(rotated_img)
                
                # Match against person embeddings (vectorized)
                for face in faces:
                    face_embedding = face.embedding
                    # Normalize face embedding
                    face_norm = face_embedding / np.linalg.norm(face_embedding)
                    
                    # Vectorized similarity computation
                    similarities = np.dot(person_embs_matrix, face_norm)
                    
                    # Find all matches above threshold
                    match_indices = np.where(similarities >= threshold)[0]
                    
                    for idx in match_indices:
                        all_matches.append({
                            'person': person_names[idx],
                            'similarity': float(similarities[idx])
                        })
            
            # Remove duplicate matches (keep highest similarity for each person)
            if all_matches:
                best_matches = {}
                for match in all_matches:
                    person = match['person']
                    similarity = match['similarity']
                    if person not in best_matches or similarity > best_matches[person]['similarity']:
                        best_matches[person] = match
                return list(best_matches.values())
            return []
        
        else:
            # Original behavior: check only corrected orientation
            faces = face_app.get(img)
            
            # Match against person embeddings (vectorized)
            matches = []
            for face in faces:
                face_embedding = face.embedding
                # Normalize face embedding
                face_norm = face_embedding / np.linalg.norm(face_embedding)
                
                # Vectorized similarity computation - much faster than looping
                similarities = np.dot(person_embs_matrix, face_norm)
                
                # Find all matches above threshold
                match_indices = np.where(similarities >= threshold)[0]
                
                for idx in match_indices:
                    matches.append({
                        'person': person_names[idx],
                        'similarity': float(similarities[idx])
                    })
            
            return matches
    
    except Exception as e:
        print(f"Error processing {photo_path}: {e}")
        return []

def copy_to_person_folder(photo_path, person_name, output_dir, similarity):
    """Copy photo to person's folder"""
    # Create person folder
    person_folder = Path(output_dir) / person_name
    person_folder.mkdir(parents=True, exist_ok=True)
    
    # Get filename
    filename = Path(photo_path).name
    dest_path = person_folder / filename
    
    # Handle duplicates
    if dest_path.exists():
        name_part = dest_path.stem
        ext_part = dest_path.suffix
        counter = 1
        while dest_path.exists():
            dest_path = person_folder / f"{name_part}_{counter}{ext_part}"
            counter += 1
    
    # Copy file
    shutil.copy2(photo_path, dest_path)
    
    return str(dest_path)

def organize_photos_thread(input_folder, output_folder, threshold, check_all_orientations=False):
    """Background thread for organizing photos with parallel processing"""
    global organize_state, face_app
    
    try:
        # Ensure face_app is initialized before processing (with lock for safety)
        with face_app_lock:
            if face_app is None:
                error_msg = 'CRITICAL: Face detection not initialized. Cannot process images.'
                print(f"ERROR: {error_msg}")
                organize_state['active'] = False
                organize_state['initializing'] = False
                organize_state['error'] = error_msg
                return
            print("✓ Thread verified face_app is initialized")
        
        # Get all image files
        print(f"Scanning folder: {input_folder}")
        image_files = get_image_files(input_folder)
        organize_state['progress']['total'] = len(image_files)
        organize_state['progress']['scanned'] = 0
        organize_state['progress']['organized'] = 0
        
        print(f"Found {len(image_files)} images to process")
        
        if len(image_files) == 0:
            print(f"WARNING: No image files found in {input_folder}")
            print("Supported formats: .jpg, .jpeg, .png, .bmp, .tiff, .gif")
            organize_state['active'] = False
            organize_state['error'] = f'No images found in folder. Supported formats: JPG, PNG, BMP, TIFF, GIF'
            return
        
        # Use ThreadPoolExecutor for parallel processing
        # Limit workers to CPU count or 8, whichever is smaller
        max_workers = min(multiprocessing.cpu_count(), 8)
        print(f"Using {max_workers} parallel workers for processing")
        if check_all_orientations:
            print("⚠️ Multi-orientation checking enabled (will check 4 rotations per photo)")
        
        # Lock for thread-safe state updates
        state_lock = threading.Lock()
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all photo processing tasks
            future_to_photo = {
                executor.submit(process_photo, photo_path, threshold, check_all_orientations): photo_path
                for photo_path in image_files
            }
            
            # Process completed tasks as they finish
            for future in as_completed(future_to_photo):
                # Check for cancellation
                if organize_state['cancel_requested']:
                    print("Organization cancelled by user")
                    executor.shutdown(wait=False, cancel_futures=True)
                    break
                
                photo_path = future_to_photo[future]
                
                # Update scanned count (thread-safe)
                with state_lock:
                    organize_state['progress']['scanned'] += 1
                    organize_state['progress']['currentFile'] = Path(photo_path).name
                
                try:
                    # Get processing results
                    matches = future.result()
                    
                    # Copy to person folders and update state
                    for match in matches:
                        person_name = match['person']
                        similarity = match['similarity']
                        
                        with state_lock:
                            organize_state['progress']['currentPerson'] = person_name
                        
                        # Copy file (I/O operation, can be outside lock)
                        new_path = copy_to_person_folder(photo_path, person_name, output_folder, similarity)
                        
                        # Update results (thread-safe)
                        with state_lock:
                            if person_name not in organize_state['persons']:
                                organize_state['persons'][person_name] = {
                                    'name': person_name,
                                    'photoCount': 0,
                                    'photos': []
                                }
                            
                            organize_state['persons'][person_name]['photoCount'] += 1
                            organize_state['persons'][person_name]['photos'].append({
                                'originalPath': photo_path,
                                'newPath': new_path,
                                'filename': Path(photo_path).name,
                                'similarity': similarity,
                                'timestamp': time.time()
                            })
                            
                            organize_state['progress']['organized'] += 1
                
                except Exception as e:
                    print(f"Error processing {photo_path}: {e}")
        
        # Mark as complete
        organize_state['active'] = False
        organize_state['progress']['currentFile'] = ''
        organize_state['progress']['currentPerson'] = ''
        
        print(f"\n{'='*60}")
        print(f"✓ ORGANIZATION COMPLETE")
        print(f"{'='*60}")
        print(f"  Total scanned: {organize_state['progress']['scanned']}")
        print(f"  Total organized: {organize_state['progress']['organized']}")
        print(f"  Person folders: {len(organize_state['persons'])}")
        if organize_state['persons']:
            for person_name, person_data in organize_state['persons'].items():
                print(f"    - {person_name}: {person_data['photoCount']} photos")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"❌ Error in organize thread: {e}")
        organize_state['active'] = False
        organize_state['error'] = str(e)
        # Still log what we had before error
        print(f"  Persons before error: {len(organize_state.get('persons', {}))}")
        print(f"  Scanned before error: {organize_state['progress'].get('scanned', 0)}")

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'embeddings_loaded': len(person_embeddings),
        'face_app_ready': face_app is not None
    })

@app.route('/api/embeddings', methods=['GET', 'POST'])
def embeddings():
    """Get available embeddings or set embeddings directory"""
    if request.method == 'POST':
        data = request.json
        embeddings_dir = data.get('embeddingsDir')
        
        if embeddings_dir and os.path.exists(embeddings_dir):
            load_embeddings(embeddings_dir)
            return jsonify({
                'success': True,
                'loaded': len(person_embeddings),
                'persons': list(person_embeddings.keys())
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid embeddings directory'
            }), 400
    
    return jsonify({
        'persons': list(person_embeddings.keys()),
        'count': len(person_embeddings)
    })

@app.route('/api/organize/start', methods=['POST'])
def organize_start():
    """Start photo organization"""
    global organize_state
    
    # Check if already running
    if organize_state['active']:
        return jsonify({'error': 'Organization already in progress'}), 400
    
    # Get request data
    data = request.json
    input_folder = data.get('inputFolder')
    output_folder = data.get('outputFolder')
    threshold = data.get('threshold', config.DEFAULT_SIMILARITY_THRESHOLD)
    embeddings_dir = data.get('embeddingsDir')
    check_all_orientations = data.get('checkAllOrientations', False)
    
    print(f"\n=== Organization Request ===")
    print(f"Input folder: {input_folder}")
    print(f"Output folder: {output_folder}")
    print(f"Threshold: {threshold}")
    print(f"Embeddings dir: {embeddings_dir}")
    print(f"Check all orientations: {check_all_orientations}")
    
    # Validate inputs
    if not input_folder or not os.path.exists(input_folder):
        error_msg = f'Invalid input folder: {input_folder}'
        print(f"ERROR: {error_msg}")
        return jsonify({'error': error_msg}), 400
    
    if not output_folder:
        error_msg = 'Output folder not specified'
        print(f"ERROR: {error_msg}")
        return jsonify({'error': error_msg}), 400
    
    # Load embeddings if directory provided
    if embeddings_dir:
        load_embeddings(embeddings_dir)
    
    if not person_embeddings:
        error_msg = f'No person embeddings loaded. Add .npy files to {embeddings_dir or "public/embeddings"}'
        print(f"ERROR: {error_msg}")
        return jsonify({'error': error_msg}), 400
    
    print(f"Using {len(person_embeddings)} person embeddings: {list(person_embeddings.keys())}")
    
    # Set initializing state FIRST so UI shows loading
    organize_state['initializing'] = True
    organize_state['active'] = False
    organize_state['progress']['currentFile'] = 'Initializing face detection models...'
    
    # Initialize face app if needed - MUST complete before starting thread
    if face_app is None:
        print("⚠ Face detection not initialized. Starting initialization...")
        try:
            initialize_face_app()
        except Exception as e:
            error_msg = f'Failed to initialize face detection: {str(e)}'
            print(f"ERROR: {error_msg}")
            organize_state['initializing'] = False
            organize_state['error'] = error_msg
            return jsonify({'error': error_msg}), 500
    
    # Double-check face_app is actually ready
    if face_app is None:
        error_msg = 'Face detection failed to initialize properly'
        print(f"ERROR: {error_msg}")
        organize_state['initializing'] = False
        organize_state['error'] = error_msg
        return jsonify({'error': error_msg}), 500
    
    print("✓ Face detection verified and ready")
    
    # NOW reset state and mark as active
    organize_state = {
        'active': True,
        'initializing': False,
        'progress': {
            'scanned': 0,
            'total': 0,
            'organized': 0,
            'currentFile': 'Starting to scan files...',
            'currentPerson': ''
        },
        'persons': {},
        'results': [],
        'cancel_requested': False
    }
    
    print("🚀 Starting background processing thread...")
    
    # Start background thread - ONLY after initialization is 100% complete
    thread = threading.Thread(
        target=organize_photos_thread,
        args=(input_folder, output_folder, threshold, check_all_orientations),
        daemon=True
    )
    thread.start()
    
    print("✓ Organization thread started successfully")
    
    return jsonify({
        'success': True,
        'message': 'Organization started'
    })

@app.route('/api/organize/progress', methods=['GET'])
def organize_progress():
    """Get current organization progress"""
    persons_list = list(organize_state['persons'].values())
    
    # Debug logging when returning data
    if not organize_state['active'] and not organize_state.get('initializing', False):
        # Organization is complete
        print(f"📡 Progress request (COMPLETE): {len(persons_list)} persons, {organize_state['progress']['scanned']} scanned")
    
    return jsonify({
        'active': organize_state['active'],
        'initializing': organize_state.get('initializing', False),
        'progress': organize_state['progress'],
        'persons': persons_list,
        'error': organize_state.get('error', None)
    })

@app.route('/api/organize/results', methods=['GET'])
def organize_results():
    """Get final organization results"""
    persons_list = list(organize_state['persons'].values())
    print(f"\n📊 Results requested:")
    print(f"  Persons: {len(persons_list)}")
    print(f"  Scanned: {organize_state['progress']['scanned']}")
    print(f"  Organized: {organize_state['progress']['organized']}")
    
    return jsonify({
        'persons': persons_list,
        'totalScanned': organize_state['progress']['scanned'],
        'totalOrganized': organize_state['progress']['organized']
    })

@app.route('/api/organize/cancel', methods=['POST'])
def organize_cancel():
    """Cancel ongoing organization"""
    organize_state['cancel_requested'] = True
    organize_state['active'] = False
    
    return jsonify({
        'success': True,
        'message': 'Organization cancelled'
    })

@app.route('/api/image', methods=['GET'])
def serve_image():
    """Serve image file from filesystem"""
    image_path = request.args.get('path')
    
    if not image_path:
        return jsonify({'error': 'No path provided'}), 400
    
    # Decode URL-encoded path
    image_path = unquote(image_path)
    
    if not os.path.exists(image_path):
        return jsonify({'error': 'Image not found'}), 404
    
    try:
        return send_file(image_path, mimetype='image/jpeg')
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting Photo Organizer Backend...")
    print(f"Server will run on {config.HOST}:{config.PORT}")
    
    # Run Flask app
    app.run(
        host=config.HOST,
        port=config.PORT,
        debug=config.DEBUG
    )

