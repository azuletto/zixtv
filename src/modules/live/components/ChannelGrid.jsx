
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import MediaCard from '../../../shared/components/MediaCard/MediaCard';

const ChannelGrid = ({ channels, onSelectChannel }) => {
  const [visibleChannels, setVisibleChannels] = useState([]);
  const [page, setPage] = useState(1);
  const loaderRef = useRef(null);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    
    setVisibleChannels(channels.slice(0, ITEMS_PER_PAGE));
    setPage(1);
  }, [channels]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleChannels.length < channels.length) {
          const nextPage = page + 1;
          const newChannels = channels.slice(0, nextPage * ITEMS_PER_PAGE);
          setVisibleChannels(newChannels);
          setPage(nextPage);
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
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {visibleChannels.map((channel, index) => (
          <motion.div
            key={channel.id || channel.url || index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(index * 0.02, 0.5) }}
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            className="cursor-pointer"
            onClick={() => onSelectChannel(channel)}
          >
            <MediaCard item={channel} type="live" />
          </motion.div>
        ))}
      </div>
      
      {visibleChannels.length < channels.length && (
        <div ref={loaderRef} className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {visibleChannels.length === channels.length && channels.length > ITEMS_PER_PAGE && (
        <div className="text-center py-4 text-sm text-gray-500">
          {channels.length} canais carregados
        </div>
      )}
    </div>
  );
};

export default ChannelGrid;