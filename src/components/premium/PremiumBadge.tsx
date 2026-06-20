import React from 'react';

interface PremiumBadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  pill?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  variant = 'primary',
  pill = false,
  className = '',
  children
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-bold text-[9px] px-2 py-0.5 border leading-none';
  
  const variants = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-green-500/10 text-green-500 border-green-500/20',
    warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-500',
    danger: 'bg-red-500/10 text-red-500 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    neutral: 'bg-theme-border/30 text-theme-muted border-theme-border',
  };

  const rounding = pill ? 'rounded-full' : 'rounded-md';

  return (
    <span className={`${baseStyle} ${variants[variant]} ${rounding} ${className}`}>
      {children}
    </span>
  );
};

export default PremiumBadge;
