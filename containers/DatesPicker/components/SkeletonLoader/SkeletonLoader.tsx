import React from "react";
import { SkeletonLoaderProps } from "../../../../types/availability";

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="w-[648px] absolute top-[55px] left-0 right-0 bottom-0 bg-white/90 backdrop-blur-sm rounded-lg z-10">
      <div className="grid grid-cols-2 gap-8">
        {/* First month - 42 squares */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={`month1-${i}`} className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>

        {/* Second month - 42 squares */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={`month2-${i}`} className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
};
