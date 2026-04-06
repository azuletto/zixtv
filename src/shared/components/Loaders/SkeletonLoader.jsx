

import React from 'react';
import { motion } from 'framer-motion';

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const skeletons = {
    card: (
      <div className="space-y-3">
        <div className="w-full h-[200px] bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-4 bg-gray-800 rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-gray-800 rounded w-1/2 animate-pulse" />
      </div>
    ),
    
    banner: (
      <div className="w-full h-[400px] bg-gray-800 rounded-lg animate-pulse" />
    ),
    
    text: (
      <div className="space-y-2">
        <div className="h-4 bg-gray-800 rounded w-full animate-pulse" />
        <div className="h-4 bg-gray-800 rounded w-5/6 animate-pulse" />
        <div className="h-4 bg-gray-800 rounded w-4/6 animate-pulse" />
      </div>
    ),
    
    episode: (
      <div className="flex space-x-4">
        <div className="w-40 h-24 bg-gray-800 rounded animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-800 rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-gray-800 rounded w-1/2 animate-pulse" />
          <div className="h-3 bg-gray-800 rounded w-2/3 animate-pulse" />
        </div>
      </div>
    )
  };

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          {skeletons[type] || skeletons.card}
        </motion.div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
