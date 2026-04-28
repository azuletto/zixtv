
import React from 'react';
import { ViewGridIcon, ViewListIcon } from '/src/shared/icons/heroiconsOutlineCompat';
import { useFocusable } from '../../hooks/useFocusable';

const ViewModeToggle = ({ viewMode, setViewMode }) => {
  const { ref: gridModeRef, isFocused: isGridFocused } = useFocusable('view-mode-grid', {
    group: 'content-controls',
    onSelect: () => setViewMode('grid'),
  });

  const { ref: categoriesModeRef, isFocused: isCategoriesFocused } = useFocusable('view-mode-categories', {
    group: 'content-controls',
    onSelect: () => setViewMode('categories'),
  });

  return (
    <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/80 p-1 backdrop-blur-sm">
      <button
        ref={gridModeRef}
        onClick={() => setViewMode('grid')}
        className={`home-control h-8 w-8 rounded-md border-0 px-0 py-0 ${
          viewMode === 'grid'
            ? 'home-control-active'
            : isGridFocused
              ? 'home-control-active'
              : 'bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white'
        }`}
        title="Visualização em grade"
      >
        <ViewGridIcon className="w-4 h-4" />
      </button>
      <button
        ref={categoriesModeRef}
        onClick={() => setViewMode('categories')}
        className={`home-control h-8 w-8 rounded-md border-0 px-0 py-0 ${
          viewMode === 'categories'
            ? 'home-control-active'
            : isCategoriesFocused
              ? 'home-control-active'
              : 'bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white'
        }`}
        title="Visualização por categorias"
      >
        <ViewListIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ViewModeToggle;
