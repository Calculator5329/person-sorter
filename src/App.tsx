import { useOrganizer } from './hooks/useOrganizer';
import { FolderSelector } from './components/FolderSelector';
import { ProgressBar } from './components/ProgressBar';
import { PersonGallery } from './components/PersonGallery';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full px-6 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Photo Organizer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Automatically organize photos by person using face recognition
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 max-w-4xl mx-auto bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <strong className="font-bold">Error: </strong>
                <span>{error}</span>
              </div>
              <button
                onClick={reset}
                className="text-red-700 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Folder Selector */}
        {(status === 'idle' || status === 'error') && (
          <div className="mb-6 max-w-4xl mx-auto">
            <FolderSelector
              onStart={handleStart}
              disabled={false}
            />
          </div>
        )}

        {/* Progress Bar */}
        {status === 'running' && (
          <div className="mb-6 max-w-4xl mx-auto">
            <ProgressBar progress={progress} onCancel={cancel} />
          </div>
        )}

        {/* Complete Status */}
        {status === 'complete' && (
          <div className="mb-6 max-w-4xl mx-auto bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 px-4 py-3 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <strong className="font-bold">Complete! </strong>
                <span>
                  Scanned {progress.scanned} photos. Organized {progress.organized} matches into {persons.length} person folder{persons.length !== 1 ? 's' : ''}.
                </span>
              </div>
              <button
                onClick={reset}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
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

        {/* No Results Yet */}
        {status === 'idle' && persons.length === 0 && (
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
            <svg
              className="mx-auto h-24 w-24 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Ready to organize
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Select your folders and click "Organize Photos" to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
