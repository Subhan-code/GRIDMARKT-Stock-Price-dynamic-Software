import React from 'react';

interface BrutalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'success';
}

export const BrutalButton: React.FC<BrutalButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  let bgClass = 'bg-white';
  let textClass = 'text-black';

  if (variant === 'danger') {
    bgClass = 'bg-red-600';
    textClass = 'text-white';
  } else if (variant === 'success') {
    bgClass = 'bg-green-600';
    textClass = 'text-white';
  }

  return (
    <button
      className={`
        ${bgClass} ${textClass}
        border-2 border-black
        font-bold uppercase tracking-widest
        px-6 py-4
        active:translate-x-[2px] active:translate-y-[2px]
        active:shadow-none
        brutal-shadow
        transition-all duration-75
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};
