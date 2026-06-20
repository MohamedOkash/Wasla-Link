import React from 'react';

interface PremiumEmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const PremiumEmptyState: React.FC<PremiumEmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-theme-card/30 rounded-[32px] border border-theme-border/40 ${className}`}>
      {icon && (
        <div className="p-4 bg-theme-card border border-theme-border/60 text-primary rounded-full shadow-sm mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-black text-theme-text mb-1">
        {title}
      </h3>
      <p className="text-[11px] text-theme-muted font-medium max-w-[240px] leading-normal mb-4">
        {description}
      </p>
      {action && <div className="animate-pop-in">{action}</div>}
    </div>
  );
};

export default PremiumEmptyState;
