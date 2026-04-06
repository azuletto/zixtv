
import React from 'react';
import { ViewGridIcon, ViewListIcon } from '/src/shared/icons/heroiconsOutlineCompat';

const ViewModeToggle = ({ viewMode, setViewMode }) => {
  return (
    <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
      <button
        onClick={() => setViewMode('grid')}
        className={`p-1.5 rounded-md transition-colors ${
          viewMode === 'grid'
            ? 'bg-red-600 text-white'
            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
        }`}
        title="Visualização em grade"
      >
        <ViewGridIcon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setViewMode('categories')}
        className={`p-1.5 rounded-md transition-colors ${
          viewMode === 'categories'
            ? 'bg-red-600 text-white'
            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
        }`}
        title="Visualização por categorias"
      >
        <ViewListIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ViewModeToggle;

