import React from 'react';

interface PremiumInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperClassName?: string;
}

export const PremiumInput = React.forwardRef<HTMLInputElement, PremiumInputProps>(({
  label,
  error,
  leftIcon,
  rightIcon,
  className = '',
  wrapperClassName = '',
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${wrapperClassName}`}>
      {label && (
        <label className="text-[10px] font-black text-theme-muted uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 text-theme-muted pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={`w-full bg-theme-card border text-xs text-theme-text rounded-xl py-3 px-3.5 outline-none transition-all duration-200 theme-transition font-medium
            ${leftIcon ? 'pl-10' : ''} 
            ${rightIcon ? 'pr-10' : ''} 
            ${error 
              ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/30' 
              : 'border-theme-border/80 focus:border-primary/80 focus:ring-1 focus:ring-primary/20'
            }
            disabled:opacity-60 disabled:cursor-not-allowed`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 text-theme-muted flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <span className="text-[10px] font-semibold text-red-500 animate-fade-in">
          {error}
        </span>
      )}
    </div>
  );
});

PremiumInput.displayName = 'PremiumInput';
export default PremiumInput;
