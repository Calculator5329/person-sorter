import { useState } from 'react';
import type { Photo } from '../types';

interface PhotoCardProps {
  photo: Photo;
}

export const PhotoCard = ({ photo }: PhotoCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Use backend to serve images
  const imageUrl = `/api/image?path=${encodeURIComponent(photo.newPath)}`;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group">
      {/* Image */}
      <div className="aspect-square bg-gray-200 dark:bg-gray-700 relative">
        {/* Loading spinner */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        <img
          src={imageUrl}
          alt={photo.filename}
          className={`w-full h-full object-cover transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            setImageError(true);
            setImageLoaded(true);
            // Fallback if image can't be loaded
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EError%3C/text%3E%3C/svg%3E';
          }}
        />
        
        {/* Similarity Badge - Always visible */}
        <div className="absolute top-1 right-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          {(photo.similarity * 100).toFixed(0)}%
        </div>
        
        {/* Filename overlay on hover */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2">
          <div className="text-white text-xs truncate" title={photo.filename}>
            {photo.filename}
          </div>
        </div>
      </div>
    </div>
  );
};

