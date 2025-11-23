import { useOrganizer } from './hooks/useOrganizer';
import { FolderSelector } from './components/FolderSelector';
import { ProgressBar } from './components/ProgressBar';
import { PersonGallery } from './components/PersonGallery';
import { Image, AlertCircle, CheckCircle2, X } from 'lucide-react';

function App() {
  const { status, progress, persons, error, start, cancel, reset } = useOrganizer();

  const handleStart = async (
    inputFolder: string,
    outputFolder: string,
    threshold: number,
    embeddingsDir: string
  ) => {
    await start({
      inputFolder,
      outputFolder,
      threshold,
      embeddingsDir,
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="w-full px-6 py-6">
        {/* Header - Frosted Glass Sticky Effect */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-4xl font-bold text-zinc-100 mb-2 tracking-tight">
            Photo Organizer
          </h1>
          <p className="text-zinc-400 text-sm">
            Automatically organize photos by person using face recognition
          </p>
        </div>

        {/* Error Display - Matte with Rose accent */}
        {error && (
          <div className="mb-6 max-w-4xl mx-auto bg-zinc-900 border border-rose-500/30 rounded-2xl px-5 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500 hover:border-rose-500/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)] transition-all duration-300">
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                <div className="text-sm">
                  <span className="font-bold text-zinc-100">Error: </span>
                  <span className="text-zinc-300">{error}</span>
                </div>
              </div>
              <button
                onClick={reset}
                className="text-rose-500 hover:text-rose-400 transition-colors duration-300 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Folder Selector */}
        {(status === 'idle' || status === 'error') && (
          <div className="mb-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <FolderSelector
              onStart={handleStart}
              disabled={false}
            />
          </div>
        )}

        {/* Progress Bar */}
        {status === 'running' && (
          <div className="mb-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ProgressBar progress={progress} onCancel={cancel} />
          </div>
        )}

        {/* Complete Status - Matte with Emerald accent */}
        {status === 'complete' && (
          <div className="mb-6 max-w-4xl mx-auto bg-zinc-900 border border-emerald-400/30 rounded-2xl px-5 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500 hover:border-emerald-400/50 hover:shadow-[0_0_20px_rgba(52,211,153,0.15)] transition-all duration-300">
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div className="text-sm">
                  <span className="font-bold text-zinc-100">Complete! </span>
                  <span className="text-zinc-300">
                    Scanned {progress.scanned} photos. Organized {progress.organized} matches into {persons.length} person folder{persons.length !== 1 ? 's' : ''}.
                  </span>
                </div>
              </div>
              <button
                onClick={reset}
                className="px-5 py-2 bg-emerald-400 hover:bg-emerald-500 text-zinc-950 font-semibold rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(52,211,153,0.3)] text-sm flex-shrink-0"
              >
                Organize More
              </button>
            </div>
          </div>
        )}

        {/* Results Gallery */}
        {(status === 'running' || status === 'complete') && persons.length > 0 && (
          <PersonGallery persons={persons} isComplete={status === 'complete'} />
        )}

        {/* No Results Yet - Matte Card */}
        {status === 'idle' && persons.length === 0 && (
          <div className="max-w-4xl mx-auto bg-zinc-900 rounded-2xl border border-white/5 p-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Image className="mx-auto h-24 w-24 text-zinc-700" strokeWidth={1.5} />
            <h3 className="mt-6 text-lg font-semibold text-zinc-100">
              Ready to organize
            </h3>
            <p className="mt-2 text-zinc-400 text-sm">
              Select your folders and click "Organize Photos" to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
