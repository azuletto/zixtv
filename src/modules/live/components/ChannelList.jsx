
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PlayIcon } from '@heroicons/react/outline';

const ChannelList = ({ channels, onSelectChannel }) => {
  const [visibleChannels, setVisibleChannels] = useState([]);
  const [page, setPage] = useState(1);
  const loaderRef = useRef(null);
  const ITEMS_PER_PAGE = 30;

  useEffect(() => {
    setVisibleChannels(channels.slice(0, ITEMS_PER_PAGE));
    setPage(1);
  }, [channels]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleChannels.length < channels.length) {
          const newChannels = channels.slice(0, (page + 1) * ITEMS_PER_PAGE);
          setVisibleChannels(newChannels);
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [visibleChannels, channels, page]);

  return (
    <div className="space-y-1">
      {visibleChannels.map((channel, index) => (
        <motion.div
          key={channel.id || channel.url || index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.min(index * 0.01, 0.3) }}
          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          onClick={() => onSelectChannel(channel)}
          className="flex items-center gap-4 p-3 rounded-lg cursor-pointer group"
        >
          {}
          <div className="w-12 h-12 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
            {channel.logo || channel.tvgLogo ? (
              <img
                src={channel.logo || channel.tvgLogo}
                alt={channel.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23333"%3E%3Cpath d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 8h-4v4h-4v-4H6V9h4V5h4v4h4v2z"%3E%3C/path%3E%3C/svg%3E';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-red-600/20 text-red-500">
                <PlayIcon className="w-5 h-5" />
              </div>
            )}
          </div>

          {}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium truncate group-hover:text-red-500 transition-colors">
              {channel.name}
            </h3>
            {channel.group && (
              <p className="text-xs text-gray-500 truncate">{channel.group}</p>
            )}
          </div>

          {}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-red-500 font-medium">AO VIVO</span>
          </div>
        </motion.div>
      ))}
      
      {visibleChannels.length < channels.length && (
        <div ref={loaderRef} className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default ChannelList;