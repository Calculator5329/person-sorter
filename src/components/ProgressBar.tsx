import type { Progress } from '../types';

interface ProgressBarProps {
  progress: Progress;
  onCancel: () => void;
}

export const ProgressBar = ({ progress, onCancel }: ProgressBarProps) => {
  const percentage = progress.total > 0 
    ? Math.round((progress.scanned / progress.total) * 100)
    : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Processing Photos
        </h3>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
        >
          Cancel
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-green-500 h-full transition-all duration-300 flex items-center justify-center text-xs text-white font-semibold"
          style={{ width: `${percentage}%` }}
        >
          {percentage > 10 && `${percentage}%`}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <div className="text-gray-600 dark:text-gray-400">Scanned</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {progress.scanned} / {progress.total}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <div className="text-gray-600 dark:text-gray-400">Organized</div>
          <div className="text-xl font-bold text-green-600 dark:text-green-400">
            {progress.organized}
          </div>
        </div>
      </div>

      {/* Current File */}
      {progress.currentFile && (
        <div className="text-sm space-y-1">
          <div className="text-gray-600 dark:text-gray-400">Current File:</div>
          <div className="text-gray-900 dark:text-white font-mono text-xs truncate">
            {progress.currentFile}
          </div>
        </div>
      )}

      {/* Current Person */}
      {progress.currentPerson && (
        <div className="text-sm space-y-1">
          <div className="text-gray-600 dark:text-gray-400">Matching Person:</div>
          <div className="text-blue-600 dark:text-blue-400 font-semibold">
            {progress.currentPerson}
          </div>
        </div>
      )}
    </div>
  );
};

