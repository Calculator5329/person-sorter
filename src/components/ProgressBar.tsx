import { Scan, StopCircle, FileImage, User } from 'lucide-react';
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
    <div className="bg-zinc-900 rounded-2xl border border-white/5 p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-3">
          <Scan className="w-6 h-6 text-blue-500 animate-pulse" strokeWidth={2} />
          Processing Photos
        </h3>
        <button
          onClick={onCancel}
          className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] text-sm flex items-center gap-2"
        >
          <StopCircle className="w-4 h-4" strokeWidth={2} />
          Cancel
        </button>
      </div>

      {/* Progress Bar - Matte with no gradients */}
      <div className="w-full bg-zinc-800 rounded-full h-5 overflow-hidden border border-white/5">
        <div
          className="bg-blue-600 h-full transition-all duration-300 flex items-center justify-center text-xs text-white font-bold relative"
          style={{ width: `${percentage}%` }}
        >
          {percentage > 15 && (
            <span className="relative z-10">{percentage}%</span>
          )}
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
        </div>
      </div>

      {/* Stats - Matte Cards */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-zinc-950 border border-white/5 p-4 rounded-2xl hover:border-cyan-400/30 hover:shadow-[0_0_15px_rgba(34,211,238,0.1)] transition-all duration-300">
          <div className="text-zinc-400 text-xs font-medium mb-1">Scanned</div>
          <div className="text-2xl font-bold text-cyan-400">
            {progress.scanned} <span className="text-zinc-600 text-sm">/ {progress.total}</span>
          </div>
        </div>
        <div className="bg-zinc-950 border border-white/5 p-4 rounded-2xl hover:border-emerald-400/30 hover:shadow-[0_0_15px_rgba(52,211,153,0.1)] transition-all duration-300">
          <div className="text-zinc-400 text-xs font-medium mb-1">Organized</div>
          <div className="text-2xl font-bold text-emerald-400">
            {progress.organized}
          </div>
        </div>
      </div>

      {/* Current File */}
      {progress.currentFile && (
        <div className="text-sm space-y-2 bg-zinc-950 border border-white/5 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
            <FileImage className="w-4 h-4" strokeWidth={2} />
            Current File:
          </div>
          <div className="text-zinc-100 font-mono text-xs truncate">
            {progress.currentFile}
          </div>
        </div>
      )}

      {/* Current Person */}
      {progress.currentPerson && (
        <div className="text-sm space-y-2 bg-zinc-950 border border-blue-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
            <User className="w-4 h-4" strokeWidth={2} />
            Matching Person:
          </div>
          <div className="text-blue-400 font-semibold text-base">
            {progress.currentPerson}
          </div>
        </div>
      )}
    </div>
  );
};

