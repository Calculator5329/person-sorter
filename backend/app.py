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
import insightface
from insightface.app import FaceAnalysis
from urllib.parse import unquote

import config

app = Flask(__name__)
CORS(app)

# Global state
face_app = None
person_embeddings = {}
organize_state = {
    'active': False,
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
    """Initialize InsightFace application"""
    global face_app
    if face_app is None:
        print("Initializing InsightFace...")
        face_app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
        face_app.prepare(ctx_id=0 if config.USE_GPU else -1, det_size=config.FACE_DET_SIZE)
        print("InsightFace initialized successfully")

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

def get_image_files(folder_path):
    """Recursively get all image files from folder"""
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.gif'}
    image_files = []
    
    folder = Path(folder_path)
    if not folder.exists():
        return []
    
    for file in folder.rglob('*'):
        if file.suffix.lower() in image_extensions:
            image_files.append(str(file))
    
    return image_files

def process_photo(photo_path, threshold):
    """Process a single photo and return matches using vectorized similarity"""
    global face_app, person_embeddings
    
    try:
        # Read image
        img = cv2.imread(photo_path)
        if img is None:
            return []
        
        # Detect faces
        faces = face_app.get(img)
        
        # Early return if no embeddings loaded
        if len(person_embeddings) == 0:
            return []
        
        # Prepare person data for vectorized comparison
        person_names = list(person_embeddings.keys())
        person_embs_matrix = np.array([person_embeddings[name] for name in person_names])
        
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

def organize_photos_thread(input_folder, output_folder, threshold):
    """Background thread for organizing photos with parallel processing"""
    global organize_state
    
    try:
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
        
        # Lock for thread-safe state updates
        state_lock = threading.Lock()
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all photo processing tasks
            future_to_photo = {
                executor.submit(process_photo, photo_path, threshold): photo_path
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
        
        print(f"Organization complete - Processed {organize_state['progress']['scanned']} images")
        
    except Exception as e:
        print(f"Error in organize thread: {e}")
        organize_state['active'] = False
        organize_state['error'] = str(e)

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
    
    print(f"\n=== Organization Request ===")
    print(f"Input folder: {input_folder}")
    print(f"Output folder: {output_folder}")
    print(f"Threshold: {threshold}")
    print(f"Embeddings dir: {embeddings_dir}")
    
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
    
    # Initialize face app if needed
    if face_app is None:
        try:
            initialize_face_app()
        except Exception as e:
            return jsonify({'error': f'Failed to initialize face detection: {str(e)}'}), 500
    
    # Reset state
    organize_state = {
        'active': True,
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
    
    # Start background thread
    thread = threading.Thread(
        target=organize_photos_thread,
        args=(input_folder, output_folder, threshold),
        daemon=True
    )
    thread.start()
    
    return jsonify({
        'success': True,
        'message': 'Organization started'
    })

@app.route('/api/organize/progress', methods=['GET'])
def organize_progress():
    """Get current organization progress"""
    return jsonify({
        'active': organize_state['active'],
        'progress': organize_state['progress'],
        'persons': list(organize_state['persons'].values()),
        'error': organize_state.get('error', None)
    })

@app.route('/api/organize/results', methods=['GET'])
def organize_results():
    """Get final organization results"""
    return jsonify({
        'persons': list(organize_state['persons'].values()),
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

