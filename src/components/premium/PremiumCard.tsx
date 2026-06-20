import React from 'react';

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  glass?: boolean;
  variant?: 'solid' | 'bordered' | 'gradient';
  children: React.ReactNode;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  hoverable = true,
  glass = false,
  variant = 'bordered',
  className = '',
  ...props
}) => {
  const baseStyle = 'rounded-[24px] p-4 transition-all duration-300 theme-transition';
  
  const variants = {
    solid: 'bg-theme-card shadow-sm',
    bordered: 'bg-theme-card border border-theme-border/60 shadow-sm',
    gradient: 'bg-gradient-to-br from-theme-card to-theme-bg border border-theme-border/40 shadow-sm',
  };

  const hoverStyle = hoverable 
    ? 'hover:translate-y-[-2px] hover:shadow-md hover:border-primary/20 cursor-pointer' 
    : '';

  const glassStyle = glass 
    ? 'glass-effect' 
    : '';

  return (
    <div
      className={`${baseStyle} ${glassStyle || variants[variant]} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default PremiumCard;
