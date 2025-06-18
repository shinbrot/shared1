import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  noPadding = false 
}) => {
  return (
    <div className={`
      bg-slate-800/30 backdrop-blur-md border border-slate-700/50 
      rounded-xl shadow-2xl
      ${noPadding ? '' : 'p-6'}
      ${className}
    `}>
      {children}
    </div>
  );
};