# Person Embeddings

This directory contains face embeddings for person recognition.

## What are embeddings?

Face embeddings are numerical representations (vectors) of a person's facial features, used to identify that person in photos.

## File Format

- **Format:** NumPy `.npy` files
- **Dimensions:** 512-dimensional vector (required by InsightFace buffalo_l model)
- **Naming:** `person_name.npy` (the filename becomes the person's name)

## How to Add Embeddings

### Option 1: Generate from Photos (Advanced)

You can generate embeddings using InsightFace:

```python
import numpy as np
from insightface.app import FaceAnalysis

# Initialize face app
app = FaceAnalysis(name='buffalo_l')
app.prepare(ctx_id=0)

# Load image and detect faces
import cv2
img = cv2.imread('path/to/photo.jpg')
faces = app.get(img)

# Save the first face's embedding
if len(faces) > 0:
    embedding = faces[0].embedding
    np.save('john_doe.npy', embedding)
    print(f"Saved embedding with shape: {embedding.shape}")
```

### Option 2: Use Pre-generated Embeddings

If you have embeddings from another source:

1. Ensure they are 512-dimensional vectors
2. Save as `.npy` files using NumPy
3. Name the file after the person (e.g., `jane_smith.npy`)
4. Place in this directory

## Example Structure

```
embeddings/
├── john_doe.npy          # 512-dimensional vector
├── jane_smith.npy        # 512-dimensional vector
├── alice_johnson.npy     # 512-dimensional vector
└── bob_williams.npy      # 512-dimensional vector
```

## Verification

To verify your embedding file:

```python
import numpy as np

# Load embedding
embedding = np.load('person_name.npy')

# Check shape (should be (512,) or (1, 512))
print(f"Shape: {embedding.shape}")

# Check it's a valid array
print(f"Type: {embedding.dtype}")
print(f"Min: {embedding.min()}, Max: {embedding.max()}")
```

Expected output:
```
Shape: (512,)
Type: float32 or float64
Min: [some negative number], Max: [some positive number]
```

## Tips

- **Quality matters:** Use clear, front-facing photos for best results
- **One embedding per person:** Each `.npy` file should contain one person's face embedding
- **Consistent lighting:** Photos with good lighting produce better embeddings
- **Multiple photos:** You can create multiple embeddings for the same person to improve accuracy (e.g., `john_doe_1.npy`, `john_doe_2.npy`)

## Troubleshooting

**Error: "No person embeddings loaded"**
- Ensure `.npy` files exist in this directory
- Check that files are valid NumPy arrays
- Verify embeddings are 512-dimensional

**Error: "Shape mismatch"**
- Embeddings must be 512-dimensional vectors
- Check using `np.load('file.npy').shape`

**Poor matching results**
- Try lowering the similarity threshold (0.4-0.5)
- Use better quality source photos for embeddings
- Ensure embeddings are from InsightFace buffalo_l model

## Need Help?

See the main README.md in the project root for more information.

