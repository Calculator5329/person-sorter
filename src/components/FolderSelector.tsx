import { useState, useEffect } from 'react';
import { FolderOpen, FolderInput, Database, Play, Sliders } from 'lucide-react';

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
    <div className="bg-zinc-900 rounded-2xl border border-white/5 p-6 space-y-5">
      <h2 className="text-2xl font-bold text-zinc-100 mb-4 flex items-center gap-3">
        <FolderOpen className="w-7 h-7 text-blue-500" strokeWidth={1.5} />
        Configuration
      </h2>

      {/* Input Folder */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <FolderInput className="w-4 h-4 text-cyan-400" strokeWidth={2} />
          Input Folder (Photos to organize)
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={inputFolder}
            readOnly
            placeholder="Select folder containing photos..."
            className="flex-1 px-4 py-2.5 border border-white/5 rounded-2xl bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/30 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all duration-300"
          />
          <button
            onClick={handleSelectInputFolder}
            disabled={disabled}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:shadow-none text-sm"
          >
            Browse
          </button>
        </div>
      </div>

      {/* Output Folder */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <FolderOpen className="w-4 h-4 text-cyan-400" strokeWidth={2} />
          Output Folder (Where to organize)
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={outputFolder}
            readOnly
            placeholder="Select output folder..."
            className="flex-1 px-4 py-2.5 border border-white/5 rounded-2xl bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/30 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all duration-300"
          />
          <button
            onClick={handleSelectOutputFolder}
            disabled={disabled}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:shadow-none text-sm"
          >
            Browse
          </button>
        </div>
      </div>

      {/* Similarity Threshold */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <Sliders className="w-4 h-4 text-cyan-400" strokeWidth={2} />
          Similarity Threshold: <span className="text-cyan-400 font-bold">{threshold.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min="0.3"
          max="0.9"
          step="0.05"
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all duration-300"
        />
        <div className="flex justify-between text-xs text-zinc-500">
          <span>0.3 (More matches)</span>
          <span>0.9 (Stricter)</span>
        </div>
      </div>

      {/* Embeddings Info */}
      {embeddingsDir && (
        <div className="flex items-start gap-2 text-sm text-zinc-500 bg-zinc-950 border border-white/5 rounded-2xl p-3">
          <Database className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
          <div>
            <div className="text-zinc-400 font-medium mb-1">Embeddings folder:</div>
            <div className="text-zinc-600 font-mono text-xs break-all">{embeddingsDir}</div>
          </div>
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={!canStart}
        className="w-full px-6 py-3.5 bg-emerald-400 hover:bg-emerald-500 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-600 font-bold rounded-full transition-all duration-300 hover:shadow-[0_0_25px_rgba(52,211,153,0.4)] disabled:shadow-none flex items-center justify-center gap-2 text-base"
      >
        <Play className="w-5 h-5" fill="currentColor" strokeWidth={2} />
        {disabled ? 'Organizing...' : 'Organize Photos'}
      </button>
    </div>
  );
};

