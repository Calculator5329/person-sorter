# Person Embeddings

This folder contains face embeddings for person recognition.

## What Are Embeddings?

Face embeddings are 512-dimensional numerical vectors that represent a person's facial features. The app uses these to identify people in photos.

## File Format

- **Format:** NumPy `.npy` files
- **Dimensions:** 512-dimensional vector (required)
- **Naming:** `person_name.npy` (filename becomes the person's name in the app)

## Quick Start

### Create an Embedding from a Photo

```python
import numpy as np
from insightface.app import FaceAnalysis
import cv2

# Initialize face detection
app = FaceAnalysis(name='buffalo_l')
app.prepare(ctx_id=0)

# Load a clear photo of the person
img = cv2.imread('photo_of_john.jpg')

# Detect faces
faces = app.get(img)

# Save the first face's embedding
if len(faces) > 0:
    embedding = faces[0].embedding
    np.save('john_doe.npy', embedding)
    print(f"✓ Saved embedding with shape: {embedding.shape}")
else:
    print("✗ No face detected in photo")
```

### Requirements for Good Embeddings

- **Clear photo** - Well-lit, in focus
- **Front-facing** - Face looking at camera
- **One person** - Photo should contain only the target person
- **Good resolution** - At least 200x200px face size
- **Neutral expression** - Normal face, no extreme expressions

## File Structure Example

```
public/embeddings/
├── john_doe.npy          # 512-dimensional vector for John
├── jane_smith.npy        # 512-dimensional vector for Jane
├── alice_johnson.npy     # 512-dimensional vector for Alice
└── README.md            # This file
```

## Verify Your Embedding

```python
import numpy as np

# Load embedding
embedding = np.load('person_name.npy')

# Check it's valid
print(f"Shape: {embedding.shape}")        # Should be (512,)
print(f"Type: {embedding.dtype}")         # Should be float32/float64
print(f"Range: {embedding.min():.2f} to {embedding.max():.2f}")
```

**Expected output:**
```
Shape: (512,)
Type: float32
Range: -2.45 to 3.21
```

## Tips

- Use multiple photos per person for better accuracy (e.g., `john_1.npy`, `john_2.npy`)
- Underscores in filenames become spaces in the app (e.g., `john_doe` → "john doe")
- Update embeddings if person's appearance changes significantly
- Keep original photos used for embeddings for reference

## Troubleshooting

**"No person embeddings loaded"**
- Add at least one `.npy` file to this folder
- Restart the backend server

**"Shape mismatch"**
- Ensure embedding is exactly 512 dimensions
- Use InsightFace buffalo_l model

**Poor matching results**
- Use clearer source photos
- Lower similarity threshold (0.4-0.5)
- Add more embeddings per person

## Need Help?

See the main README.md for more information or open an issue on GitHub.
