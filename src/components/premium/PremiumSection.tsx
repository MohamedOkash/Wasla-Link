import React from 'react';

interface PremiumSectionProps {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const PremiumSection: React.FC<PremiumSectionProps> = ({
  title,
  icon,
  action,
  children,
  className = ''
}) => {
  return (
    <section className={`mb-6.5 px-4 ${className}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-black text-theme-text flex items-center gap-1.5 uppercase tracking-wider">
          {icon && <span className="text-primary flex items-center">{icon}</span>}
          {title}
        </h3>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
};

export default PremiumSection;
