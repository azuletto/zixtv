

import React from 'react';

const Spinner = ({ size = 'md', color = 'red' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const colors = {
    red: 'border-red-600/30 border-t-red-600',
    white: 'border-white',
    gray: 'border-gray-400'
  };

  const sizeClass = sizes[size] || sizes.md;
  const colorClass = colors[color] || colors.red;

  return (
    <div className={`relative ${sizeClass}`}>
      <div className={`absolute inset-0 rounded-full border-4 ${colorClass} animate-spin`} />
    </div>
  );
};

export default Spinner;
