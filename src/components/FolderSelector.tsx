import { useState, useEffect } from 'react';

interface FolderSelectorProps {
  onStart: (inputFolder: string, outputFolder: string, threshold: number, embeddingsDir: string) => void;
  disabled: boolean;
}

export const FolderSelector = ({ onStart, disabled }: FolderSelectorProps) => {
  const [inputFolder, setInputFolder] = useState<string>('');
  const [outputFolder, setOutputFolder] = useState<string>('');
  const [threshold, setThreshold] = useState<number>(0.5);
  const [embeddingsDir, setEmbeddingsDir] = useState<string>('');

  useEffect(() => {
    // Get embeddings directory on mount
    const getEmbeddingsPath = async () => {
      if (window.electronAPI) {
        const publicPath = await window.electronAPI.getPublicPath();
        const embeddingsPath = `${publicPath}\\embeddings`;
        setEmbeddingsDir(embeddingsPath);
      }
    };
    getEmbeddingsPath();
  }, []);

  const handleSelectInputFolder = async () => {
    if (window.electronAPI) {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        setInputFolder(folder);
      }
    }
  };

  const handleSelectOutputFolder = async () => {
    if (window.electronAPI) {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        setOutputFolder(folder);
      }
    }
  };

  const handleStart = () => {
    if (inputFolder && outputFolder && embeddingsDir) {
      onStart(inputFolder, outputFolder, threshold, embeddingsDir);
    }
  };

  const canStart = inputFolder && outputFolder && !disabled;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Photo Organizer
      </h2>

      {/* Input Folder */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Input Folder (Photos to organize)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputFolder}
            readOnly
            placeholder="Select folder containing photos..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={handleSelectInputFolder}
            disabled={disabled}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            Browse
          </button>
        </div>
      </div>

      {/* Output Folder */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Output Folder (Where to organize)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={outputFolder}
            readOnly
            placeholder="Select output folder..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={handleSelectOutputFolder}
            disabled={disabled}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            Browse
          </button>
        </div>
      </div>

      {/* Similarity Threshold */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Similarity Threshold: {threshold.toFixed(2)}
        </label>
        <input
          type="range"
          min="0.3"
          max="0.9"
          step="0.05"
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>0.3 (More matches)</span>
          <span>0.9 (Stricter)</span>
        </div>
      </div>

      {/* Embeddings Info */}
      {embeddingsDir && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Embeddings folder: {embeddingsDir}
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={!canStart}
        className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
      >
        {disabled ? 'Organizing...' : 'Organize Photos'}
      </button>
    </div>
  );
};

