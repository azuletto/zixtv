
import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '/src/shared/icons/heroiconsOutlineCompat';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8 pb-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="home-control home-control-hover h-9 w-9 px-0 py-0 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>
      
      <div className="flex gap-1">
        {getPageNumbers().map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`min-w-[36px] h-9 rounded-lg font-medium transition-all ${
              currentPage === page
                ? 'home-control home-control-active'
                : 'home-control home-control-hover'
            }`}
          >
            {page}
          </button>
        ))}
      </div>
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="home-control home-control-hover h-9 w-9 px-0 py-0 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Pagination;

