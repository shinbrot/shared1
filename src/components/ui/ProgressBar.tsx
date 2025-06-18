import React from 'react';

interface ProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = '',
  showPercentage = true
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-right">
          <span className="text-sm text-slate-400">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
};