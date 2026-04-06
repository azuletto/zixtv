
import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import { PlayIcon } from '/src/shared/icons/heroiconsOutlineCompat';

const ChannelList = memo(({ channels, onSelectChannel }) => {
  const [visibleCount, setVisibleCount] = useState(50);
  const observerRef = useRef();
  const lastItemRef = useRef();

  const loadMore = useCallback(() => {
    if (visibleCount < channels.length) {
      setVisibleCount(prev => Math.min(prev + 50, channels.length));
    }
  }, [visibleCount, channels.length]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < channels.length) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (lastItemRef.current) {
      observerRef.current.observe(lastItemRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [visibleCount, channels.length, loadMore]);

  const visibleChannels = channels.slice(0, visibleCount);

  return (
    <div className="space-y-0.5">
      {visibleChannels.map((channel, index) => (
        <ChannelListItem
          key={channel.id || channel.url || index}
          channel={channel}
          onSelect={onSelectChannel}
          isLast={index === visibleChannels.length - 1}
          lastRef={lastItemRef}
        />
      ))}
    </div>
  );
});

const ChannelListItem = memo(({ channel, onSelect, isLast, lastRef }) => {
  return (
    <div
      ref={isLast ? lastRef : null}
      onClick={() => onSelect(channel)}
      className="flex items-center gap-3 p-2 rounded-lg cursor-pointer group hover:bg-white/5 transition-colors"
    >
      {}
      <div className="w-10 h-10 bg-zinc-800 rounded-md overflow-hidden flex-shrink-0">
        {channel.logo || channel.tvgLogo ? (
          <img
            src={channel.logo || channel.tvgLogo}
            alt={channel.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23333"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15h-2v-2h2v2zm0-4h-2V7h2v6z"%3E%3C/path%3E%3C/svg%3E';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-red-600/20">
            <PlayIcon className="w-4 h-4 text-red-500" />
          </div>
        )}
      </div>

      {}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm text-white font-medium truncate group-hover:text-red-500 transition-colors">
            {channel.name}
          </h3>
          <span className="text-[10px] bg-red-600 text-white px-1 rounded flex-shrink-0">LIVE</span>
        </div>
        {channel.group && (
          <p className="text-xs text-gray-500 truncate">{channel.group}</p>
        )}
      </div>
    </div>
  );
});

export default ChannelList;

