import { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
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
    <div className="bg-zinc-900 rounded-2xl border border-white/5 overflow-hidden hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Image */}
      <div className="aspect-square bg-zinc-800 relative">
        {/* Loading spinner */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" strokeWidth={2} />
          </div>
        )}
        
        {/* Error state */}
        {imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
            <AlertCircle className="w-8 h-8 text-zinc-600 mb-2" strokeWidth={1.5} />
            <span className="text-zinc-500 text-xs">Failed to load</span>
          </div>
        )}
        
        <img
          src={imageUrl}
          alt={photo.filename}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded && !imageError ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
        />
        
        {/* Similarity Badge - Always visible with matte design */}
        <div className="absolute top-2 right-2 bg-zinc-950/90 backdrop-blur-sm border border-cyan-400/30 text-cyan-400 text-xs font-semibold px-2.5 py-1 rounded-full">
          {(photo.similarity * 100).toFixed(0)}%
        </div>
        
        {/* Filename overlay on hover - Frosted glass effect */}
        <div className="absolute inset-x-0 bottom-0 backdrop-blur-md bg-zinc-900/80 opacity-0 group-hover:opacity-100 transition-all duration-300 p-2.5">
          <div className="text-zinc-100 text-xs truncate font-medium" title={photo.filename}>
            {photo.filename}
          </div>
        </div>
      </div>
    </div>
  );
};

