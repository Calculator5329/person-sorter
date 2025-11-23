import { useState, useEffect, useCallback } from 'react';
import { organizePhotos } from '../services/api';
import type { OrganizeState, OrganizeRequest, Person } from '../types';

type OrganizerStatus = 'idle' | 'running' | 'complete' | 'error';

interface UseOrganizerReturn {
  status: OrganizerStatus;
  progress: OrganizeState['progress'];
  persons: Person[];
  error: string | null;
  start: (request: OrganizeRequest) => Promise<void>;
  cancel: () => Promise<void>;
  reset: () => void;
}

export const useOrganizer = (): UseOrganizerReturn => {
  const [status, setStatus] = useState<OrganizerStatus>('idle');
  const [progress, setProgress] = useState<OrganizeState['progress']>({
    scanned: 0,
    total: 0,
    organized: 0,
    currentFile: '',
    currentPerson: '',
  });
  const [persons, setPersons] = useState<Person[]>([]);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async (request: OrganizeRequest) => {
    try {
      setStatus('running');
      setError(null);
      setProgress({
        scanned: 0,
        total: 0,
        organized: 0,
        currentFile: '',
        currentPerson: '',
      });
      setPersons([]);

      const response = await organizePhotos.start(request);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to start organization');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  }, []);

  const cancel = useCallback(async () => {
    try {
      await organizePhotos.cancel();
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress({
      scanned: 0,
      total: 0,
      organized: 0,
      currentFile: '',
      currentPerson: '',
    });
    setPersons([]);
    setError(null);
  }, []);

  // Poll for progress when running
  useEffect(() => {
    if (status !== 'running') return;

    const interval = setInterval(async () => {
      try {
        const data = await organizePhotos.getProgress();
        
        setProgress(data.progress);
        setPersons(data.persons);

        // Check for errors from backend
        if (data.error) {
          clearInterval(interval);
          setError(data.error);
          setStatus('error');
          return;
        }

        // Check if complete
        if (!data.active) {
          clearInterval(interval);
          
          // Fetch final results
          const results = await organizePhotos.getResults();
          setPersons(results.persons);
          setStatus('complete');
        }
      } catch (err) {
        console.error('Error polling progress:', err);
        clearInterval(interval);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('error');
      }
    }, 500);

    return () => clearInterval(interval);
  }, [status]);

  return {
    status,
    progress,
    persons,
    error,
    start,
    cancel,
    reset,
  };
};

