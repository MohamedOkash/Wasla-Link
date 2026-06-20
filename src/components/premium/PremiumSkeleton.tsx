import React from 'react';

interface PremiumSkeletonProps {
  variant?: 'text' | 'rect' | 'circle' | 'card' | 'list-item';
  count?: number;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const PremiumSkeleton: React.FC<PremiumSkeletonProps> = ({
  variant = 'rect',
  count = 1,
  width,
  height,
  className = ''
}) => {
  const baseStyle = 'bg-theme-border/40 animate-pulse rounded-lg';
  
  const getStyles = () => {
    switch (variant) {
      case 'text':
        return 'h-3 w-3/4';
      case 'circle':
        return 'rounded-full h-10 w-10';
      case 'card':
        return 'h-36 w-36 rounded-[24px] p-3 border border-theme-border/40 flex flex-col justify-between';
      case 'list-item':
        return 'h-18 w-full rounded-2xl flex gap-3 p-3';
      case 'rect':
      default:
        return '';
    }
  };

  const styleObj: React.CSSProperties = {};
  if (width !== undefined) styleObj.width = width;
  if (height !== undefined) styleObj.height = height;

  const renderSingle = (index: number) => {
    if (variant === 'card') {
      return (
        <div key={index} className={`${baseStyle} ${getStyles()} ${className}`} style={styleObj}>
          <div className="h-20 w-full bg-theme-border/60 rounded-xl"></div>
          <div className="space-y-1.5 mt-2">
            <div className="h-2.5 w-3/4 bg-theme-border/60 rounded"></div>
            <div className="h-2 w-1/2 bg-theme-border/60 rounded"></div>
          </div>
        </div>
      );
    }

    if (variant === 'list-item') {
      return (
        <div key={index} className={`${baseStyle} ${getStyles()} ${className}`} style={styleObj}>
          <div className="w-12 h-12 bg-theme-border/60 rounded-xl flex-shrink-0"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 w-1/3 bg-theme-border/60 rounded"></div>
            <div className="h-2.5 w-1/2 bg-theme-border/60 rounded"></div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={index}
        className={`${baseStyle} ${getStyles()} ${className}`}
        style={styleObj}
      />
    );
  };

  if (count > 1) {
    return (
      <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 w-full">
        {Array.from({ length: count }).map((_, i) => renderSingle(i))}
      </div>
    );
  }

  return renderSingle(0);
};

export default PremiumSkeleton;
