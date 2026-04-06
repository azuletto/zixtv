

import React from 'react';
import { motion } from 'framer-motion';

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
    red: 'border-red-600',
    white: 'border-white',
    gray: 'border-gray-400'
  };

  const sizeClass = sizes[size] || sizes.md;
  const colorClass = colors[color] || colors.red;

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={`${sizeClass} border-4 border-t-transparent ${colorClass} rounded-full`}
    />
  );
};

export default Spinner;
