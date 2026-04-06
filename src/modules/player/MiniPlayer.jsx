

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { XIcon, ArrowsExpandIcon } from '@heroicons/react/outline';

const MiniPlayer = ({ videoRef, title, onClose }) => {
  const containerRef = useRef(null);
  const dragRef = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      
      const newX = e.clientX - dragRef.current.offsetX;
      const newY = e.clientY - dragRef.current.offsetY;
      
      
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;
      
      const boundedX = Math.max(0, Math.min(newX, maxX));
      const boundedY = Math.max(0, Math.min(newY, maxY));
      
      container.style.left = `${boundedX}px`;
      container.style.top = `${boundedY}px`;
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleMouseDown = (e) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    dragRef.current = {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top
    };
    isDragging.current = true;
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.8, x: 20, y: 20 }}
      animate={{ opacity: 1, scale: 1, x: 20, y: 20 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed bottom-4 right-4 w-80 bg-gray-900 rounded-lg shadow-2xl overflow-hidden z-50 cursor-move"
      onMouseDown={handleMouseDown}
    >
      {}
      <div className="bg-gray-800 px-3 py-2 flex items-center justify-between cursor-move">
        <span className="text-white text-sm font-medium truncate flex-1">
          {title}
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowsExpandIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-600 transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {}
      <div className="aspect-video bg-black">
        <video
          ref={videoRef}
          className="w-full h-full"
          controls={false}
        />
      </div>

      {}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/50">
        <p className="text-white text-sm">Arraste para mover • Clique duas vezes para expandir</p>
      </div>
    </motion.div>
  );
};

export default MiniPlayer;
