import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'colored';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
}

export default function Logo({
  className = '',
  variant = 'colored',
  size = 'md',
  showTagline = false
}: LogoProps) {
  const sizeMap = { sm: 40, md: 48, lg: 72, xl: 80 };
  const taglineSizeClasses = { sm: 'text-[9px]', md: 'text-[10px]', lg: 'text-xs', xl: 'text-sm' };
  const px = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Image
        src="/truvade.png"
        alt="TruVade"
        width={px * 3.5}
        height={px}
        className={variant === 'light' ? 'brightness-0 invert' : ''}
        priority
      />
      {showTagline && (
        <span className={`${taglineSizeClasses[size]} ${variant === 'light' ? 'text-gray-200' : 'text-gray-600'} -mt-0.5 leading-tight`}>
          Verified Shortlet Stays
        </span>
      )}
    </div>
  );
}
