/**
 * Componente de Debug para Navegação por Teclado
 * 
 * Mostra informações em tempo real sobre qual elemento está focado
 * e ajuda a testar a navegação por teclado
 */

import React, { useEffect, useState } from 'react';
import { useNavigationStore } from '../../app/store/navigationStore';

export const KeyboardNavigationDebugger = () => {
  const { focusableElements, currentFocusedId, isSidebarOpen } = useNavigationStore();
  const [isVisible, setIsVisible] = useState(true);

  // Toggle visibilidade com Ctrl+D
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 z-[999]"
        title="Ctrl+D para mostrar/esconder debug"
      >
        Keyboard Debug
      </button>
    );
  }

  const focusedElement = focusableElements.find(el => el.id === currentFocusedId);
  const elementsByGroup = focusableElements.reduce((acc, el) => {
    if (!acc[el.group]) acc[el.group] = [];
    acc[el.group].push(el);
    return acc;
  }, {});

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/95 border-t border-red-600 p-4 z-[999] max-h-[40vh] overflow-y-auto font-mono text-xs">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-red-600/30">
          <h3 className="text-red-500 font-bold text-sm">⌨️ Keyboard Navigation Debug</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-red-500 hover:text-red-400 text-lg"
          >
            ✕
          </button>
        </div>

        {/* Status */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <span className="text-gray-400">Total Elements:</span>
            <span className="text-green-400 ml-2 font-bold">{focusableElements.length}</span>
          </div>
          <div>
            <span className="text-gray-400">Sidebar:</span>
            <span className={`ml-2 font-bold ${isSidebarOpen ? 'text-green-400' : 'text-gray-500'}`}>
              {isSidebarOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Focused:</span>
            <span className="text-yellow-400 ml-2 font-bold">{currentFocusedId || 'None'}</span>
          </div>
          <div>
            <span className="text-gray-400">Groups:</span>
            <span className="text-blue-400 ml-2 font-bold">{Object.keys(elementsByGroup).length}</span>
          </div>
        </div>

        {/* Focused Element Info */}
        {focusedElement && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-600/30 rounded">
            <div className="font-bold text-red-400 mb-2">📍 Currently Focused:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-gray-400">ID:</span> <span className="text-white">{focusedElement.id}</span></div>
              <div><span className="text-gray-400">Group:</span> <span className="text-white">{focusedElement.group}</span></div>
              <div><span className="text-gray-400">Visible:</span> <span className={focusedElement.ref?.offsetParent ? 'text-green-400' : 'text-red-400'}>{focusedElement.ref?.offsetParent ? 'Yes' : 'No'}</span></div>
              <div><span className="text-gray-400">Disabled:</span> <span className={focusedElement.disabled ? 'text-orange-400' : 'text-green-400'}>{focusedElement.disabled ? 'Yes' : 'No'}</span></div>
            </div>
          </div>
        )}

        {/* Elements by Group */}
        <div className="space-y-2">
          <div className="font-bold text-blue-400 mb-2">📋 Elements by Group:</div>
          {Object.entries(elementsByGroup).map(([group, elements]) => (
            <details key={group} className="p-2 bg-zinc-900/50 border border-zinc-700 rounded cursor-pointer hover:border-zinc-600">
              <summary className="font-semibold text-yellow-400 select-none">
                {group} ({elements.length})
              </summary>
              <div className="mt-2 space-y-1 text-xs">
                {elements.map(el => (
                  <div
                    key={el.id}
                    className={`p-1.5 rounded transition-colors ${
                      el.id === currentFocusedId
                        ? 'bg-red-600/30 border border-red-500 text-red-300'
                        : el.disabled
                        ? 'text-gray-500 opacity-50'
                        : 'text-gray-300 hover:bg-zinc-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        el.id === currentFocusedId ? 'bg-red-500' : 'bg-gray-600'
                      }`} />
                      <span className="font-mono flex-1 truncate">{el.id}</span>
                      {el.disabled && <span className="text-orange-400 text-[10px]">DISABLED</span>}
                      {el.ref?.offsetParent === null && <span className="text-gray-500 text-[10px]">HIDDEN</span>}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>

        {/* Keyboard Shortcuts Reference */}
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600/30 rounded">
          <div className="font-bold text-blue-400 mb-2">⌨️ Shortcuts:</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
            <div><span className="text-gray-400">↑ ↓ ← →</span> <span className="text-white">Navigate</span></div>
            <div><span className="text-gray-400">Enter</span> <span className="text-white">Select</span></div>
            <div><span className="text-gray-400">Space</span> <span className="text-white">Toggle</span></div>
            <div><span className="text-gray-400">Menu</span> <span className="text-white">Sidebar</span></div>
            <div><span className="text-gray-400">Tab</span> <span className="text-white">Next Item</span></div>
            <div><span className="text-gray-400">Ctrl+D</span> <span className="text-white">Toggle Debug</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardNavigationDebugger;
