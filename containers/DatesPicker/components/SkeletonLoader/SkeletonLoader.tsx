import React from "react";
import { SkeletonLoaderProps } from "../../../../types/availability";

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  // Check if we're on mobile to match DatePicker behavior
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div
      className={`absolute top-[55px] left-0 right-0 bottom-0 bg-white/90 backdrop-blur-sm rounded-lg z-10 ${isMobile ? "w-full" : "w-[648px]"}`}
    >
      <div className={`grid gap-8 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
        {/* First month - 42 squares */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 42 }).map((_, i) => (
            <div
              key={`month1-${i}`}
              className={`bg-gray-200 rounded animate-pulse ${isMobile ? "h-8 w-8" : "h-10 w-10"}`}
            />
          ))}
        </div>

        {/* Second month - only show on desktop */}
        {!isMobile && (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 42 }).map((_, i) => (
              <div key={`month2-${i}`} className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
