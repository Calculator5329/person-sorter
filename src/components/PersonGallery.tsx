import { useState, useEffect } from 'react';
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
        <div className="text-gray-400 dark:text-gray-500 text-lg">
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
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-lg shadow-md px-6 py-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          📸 Organized Photos: {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''} • {persons.length} person{persons.length !== 1 ? 's' : ''}
        </h2>
        <button
          onClick={toggleAll}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-semibold"
        >
          {allExpanded ? '▼ Collapse All' : '▶ Expand All'}
        </button>
      </div>

      {persons.map((person) => (
        <div
          key={person.name}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all"
        >
          {/* Person Header */}
          <button
            onClick={() => togglePerson(person.name)}
            className="w-full p-5 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {person.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {person.name.replace(/_/g, ' ')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {person.photoCount} photo{person.photoCount !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
            <svg
              className={`w-6 h-6 text-gray-400 transition-transform ${
                expandedPersons.has(person.name) ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Photo Grid */}
          {expandedPersons.has(person.name) && (
            <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
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

