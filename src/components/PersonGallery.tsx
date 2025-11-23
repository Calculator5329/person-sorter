import { useState, useEffect } from 'react';
import { Images, ChevronDown, ChevronsUp, ChevronsDown } from 'lucide-react';
import type { Person } from '../types';
import { PhotoCard } from './PhotoCard';

interface PersonGalleryProps {
  persons: Person[];
  isComplete?: boolean;
}

export const PersonGallery = ({ persons, isComplete = false }: PersonGalleryProps) => {
  const [expandedPersons, setExpandedPersons] = useState<Set<string>>(new Set());
  
  // Auto-expand all persons when organization is complete
  useEffect(() => {
    if (isComplete && persons.length > 0) {
      setExpandedPersons(new Set(persons.map(p => p.name)));
    }
  }, [isComplete, persons]);
  
  const togglePerson = (personName: string) => {
    setExpandedPersons(prev => {
      const next = new Set(prev);
      if (next.has(personName)) {
        next.delete(personName);
      } else {
        next.add(personName);
      }
      return next;
    });
  };

  if (persons.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-2xl border border-white/5 p-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-zinc-400 text-lg">
          No results yet. Organize photos to see them here.
        </div>
      </div>
    );
  }

  const totalPhotos = persons.reduce((sum, p) => sum + p.photoCount, 0);
  const allExpanded = persons.every(p => expandedPersons.has(p.name));

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedPersons(new Set());
    } else {
      setExpandedPersons(new Set(persons.map(p => p.name)));
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Bar - Frosted Glass Sticky */}
      <div className="flex justify-between items-center backdrop-blur-md bg-zinc-900/80 border border-white/5 rounded-2xl px-6 py-4 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300">
        <div className="flex items-center gap-3">
          <Images className="w-6 h-6 text-cyan-400" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-zinc-100">
            Organized Photos: <span className="text-cyan-400">{totalPhotos}</span> photo{totalPhotos !== 1 ? 's' : ''} • <span className="text-blue-500">{persons.length}</span> person{persons.length !== 1 ? 's' : ''}
          </h2>
        </div>
        <button
          onClick={toggleAll}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] text-sm flex items-center gap-2"
        >
          {allExpanded ? (
            <>
              <ChevronsUp className="w-4 h-4" />
              Collapse All
            </>
          ) : (
            <>
              <ChevronsDown className="w-4 h-4" />
              Expand All
            </>
          )}
        </button>
      </div>

      {/* Person Cards */}
      {persons.map((person) => (
        <div
          key={person.name}
          className="bg-zinc-900 rounded-2xl border border-white/5 overflow-hidden hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-300"
        >
          {/* Person Header */}
          <button
            onClick={() => togglePerson(person.name)}
            className="w-full p-5 flex justify-between items-center hover:bg-zinc-800/50 transition-all duration-300 group"
          >
            <div className="flex items-center gap-4">
              {/* Avatar - Matte with accent */}
              <div className="w-14 h-14 bg-zinc-800 border-2 border-blue-500/30 rounded-full flex items-center justify-center text-blue-500 font-bold text-2xl shadow-[0_0_15px_rgba(59,130,246,0.2)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] transition-all duration-300">
                {person.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-bold text-zinc-100">
                  {person.name.replace(/_/g, ' ')}
                </h3>
                <p className="text-sm text-zinc-400">
                  {person.photoCount} photo{person.photoCount !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-6 h-6 text-zinc-400 transition-transform duration-300 ${
                expandedPersons.has(person.name) ? 'rotate-180' : ''
              }`}
              strokeWidth={2}
            />
          </button>

          {/* Photo Grid */}
          {expandedPersons.has(person.name) && (
            <div className="p-6 pt-4 border-t border-white/5 bg-zinc-950">
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-3">
                {person.photos.map((photo, index) => (
                  <PhotoCard key={`${photo.filename}-${index}`} photo={photo} />
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

