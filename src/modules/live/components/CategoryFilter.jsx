
import React from 'react';
import { motion } from 'framer-motion';

const CategoryFilter = ({ categories, selectedCategory, onSelectCategory, channelCounts }) => {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelectCategory('all')}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          selectedCategory === 'all'
            ? 'bg-red-600 text-white shadow-lg shadow-red-600/25'
            : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
        }`}
      >
        Todos
        <span className="ml-1 text-xs opacity-75">
          ({Object.values(channelCounts).reduce((a, b) => a + b, 0)})
        </span>
      </button>
      
      {categories.map((category) => (
        <motion.button
          key={category}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelectCategory(category)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            selectedCategory === category
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/25'
              : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
          }`}
        >
          {category}
          <span className="ml-1 text-xs opacity-75">
            ({channelCounts[category] || 0})
          </span>
        </motion.button>
      ))}
    </div>
  );
};

export default CategoryFilter;