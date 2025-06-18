import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-200">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3 rounded-lg border border-slate-600 
          bg-slate-800/50 backdrop-blur-sm text-white placeholder-slate-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-all duration-200
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-slate-400">{helperText}</p>
      )}
    </div>
  );
};