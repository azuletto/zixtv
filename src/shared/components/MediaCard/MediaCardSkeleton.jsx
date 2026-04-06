
import React from 'react';
import { motion } from 'framer-motion';

const MediaCardSkeleton = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 }}
          className="relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800"
        >
          {}
          <div className="w-full aspect-[2/3] bg-gradient-to-r from-zinc-800 to-zinc-900 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          {}
          <div className="p-3 space-y-2">
            <div className="h-4 bg-zinc-800 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-zinc-800 rounded w-1/2 animate-pulse" />
          </div>

          {}
          {Math.random() > 0.5 && (
            <div className="absolute top-2 left-2">
              <div className="h-5 bg-zinc-800 rounded-full w-16 animate-pulse border border-zinc-700" />
            </div>
          )}

          {}
          {Math.random() > 0.7 && (
            <div className="absolute top-2 right-2">
              <div className="h-5 bg-zinc-800 rounded-full w-10 animate-pulse border border-zinc-700" />
            </div>
          )}
        </motion.div>
      ))}
    </>
  );
};

export const HeroBannerSkeleton = () => (
  <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] w-full bg-zinc-900">
    <div className="absolute inset-0 bg-gradient-to-r from-zinc-800 to-zinc-900 animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
      
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 md:p-12 lg:p-16 max-w-3xl">
        <div className="h-8 sm:h-10 md:h-12 lg:h-16 bg-zinc-800 rounded-lg w-3/4 mb-3 sm:mb-4 animate-pulse" />
        
        <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
          <div className="h-5 sm:h-6 bg-zinc-800 rounded w-12 sm:w-16 animate-pulse" />
          <div className="h-5 sm:h-6 bg-zinc-800 rounded w-16 sm:w-20 animate-pulse" />
          <div className="h-5 sm:h-6 bg-zinc-800 rounded w-14 sm:w-18 animate-pulse" />
        </div>
        
        <div className="space-y-2 mb-4 sm:mb-6 md:mb-8">
          <div className="h-4 sm:h-5 bg-zinc-800 rounded w-full animate-pulse" />
          <div className="h-4 sm:h-5 bg-zinc-800 rounded w-5/6 animate-pulse" />
          <div className="h-4 sm:h-5 bg-zinc-800 rounded w-4/6 animate-pulse" />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="h-10 sm:h-12 bg-zinc-800 rounded-lg w-28 sm:w-32 animate-pulse" />
          <div className="h-10 sm:h-12 bg-zinc-800 rounded-lg w-36 sm:w-40 animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

export const CategoryRowSkeleton = ({ title = "Carregando..." }) => (
  <div className="mb-8 px-4 sm:px-8 md:px-16">
    <div className="h-6 sm:h-7 md:h-8 bg-zinc-800 rounded w-40 sm:w-48 mb-4 animate-pulse" />
    <div className="flex space-x-2 sm:space-x-3 md:space-x-4 overflow-x-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex-none w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]">
          <MediaCardSkeleton count={1} />
        </div>
      ))}
    </div>
  </div>
);

export const EpisodeListSkeleton = ({ count = 5 }) => (
  <div className="space-y-2 p-4">
    {Array.from({ length: count }).map((_, i) => (
      <div 
        key={i} 
        className="flex flex-col sm:flex-row gap-4 bg-zinc-900/50 rounded-xl border border-zinc-800 p-4"
      >
        <div className="flex items-center justify-center sm:justify-start">
          <div className="w-8 h-8 bg-zinc-800 rounded-full animate-pulse" />
        </div>
        
        <div className="w-full sm:w-40 h-24 bg-zinc-800 rounded-lg animate-pulse flex-shrink-0" />
        
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-zinc-800 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-zinc-800 rounded w-1/2 animate-pulse" />
          <div className="h-3 bg-zinc-800 rounded w-2/3 animate-pulse" />
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-zinc-800 rounded animate-pulse" />
            <div className="h-3 bg-zinc-800 rounded w-12 animate-pulse" />
          </div>
        </div>
        
        <div className="flex items-center justify-center sm:justify-end">
          <div className="w-10 h-10 bg-zinc-800 rounded-full animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

export const GridSkeleton = ({ count = 12 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
    {Array.from({ length: count }).map((_, i) => (
      <MediaCardSkeleton key={i} count={1} />
    ))}
  </div>
);

export const DetailsSkeleton = () => (
  <div className="min-h-screen bg-zinc-950">
    <div className="relative h-[40vh] sm:h-[50vh] bg-zinc-900 animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
    </div>

    <div className="container mx-auto px-4 py-8 -mt-32 relative z-10">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-shrink-0 w-full md:w-64 lg:w-80">
          <div className="aspect-[2/3] bg-zinc-800 rounded-xl animate-pulse" />
        </div>

        <div className="flex-1 space-y-4">
          <div className="h-10 bg-zinc-800 rounded w-3/4 animate-pulse" />
          <div className="h-6 bg-zinc-800 rounded w-1/2 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 bg-zinc-800 rounded w-full animate-pulse" />
            <div className="h-4 bg-zinc-800 rounded w-full animate-pulse" />
            <div className="h-4 bg-zinc-800 rounded w-2/3 animate-pulse" />
          </div>
          <div className="flex space-x-4">
            <div className="h-12 bg-zinc-800 rounded-lg w-32 animate-pulse" />
            <div className="h-12 bg-zinc-800 rounded-lg w-32 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default MediaCardSkeleton;