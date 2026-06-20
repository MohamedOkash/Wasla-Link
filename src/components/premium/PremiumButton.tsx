import React from 'react';

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-98 disabled:opacity-50 disabled:pointer-events-none focus:outline-none';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30',
    secondary: 'bg-theme-card text-theme-text border border-theme-border hover:bg-theme-border-hover',
    outline: 'bg-transparent text-theme-text border border-theme-border hover:border-primary/45 hover:bg-theme-border/20',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-500/20 hover:shadow-md',
    ghost: 'bg-transparent text-theme-muted hover:text-theme-text hover:bg-theme-border/40',
    glass: 'glass-effect text-theme-text hover:bg-theme-border-hover/30',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-[10px] gap-1',
    md: 'px-4.5 py-2.5 text-xs gap-1.5',
    lg: 'px-6 py-3.5 text-sm gap-2',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default PremiumButton;
