"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import Image from "next/image";
import { ImageSliderProps } from "../../../../types/availability";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Function to generate safe CSS class names
const generateSafeClassName = (roomName: string): string => {
  return roomName
    .replace(/[№#]/g, "num") // Replace № and # with "num"
    .replace(/[^\w\s-]/g, "") // Remove all special characters except word chars, spaces, and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .toLowerCase() // Convert to lowercase
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
    .replace(/-+/g, "-"); // Replace multiple hyphens with single hyphen
};

export const ImageSlider: React.FC<ImageSliderProps> = ({ images, roomName }) => {
  // Generate safe class name for navigation buttons
  const safeClassName = generateSafeClassName(roomName);

  // If no images, show placeholder
  if (!images || images.length === 0) {
    return (
      <div className="w-full h-full bg-gray-200 rounded-l-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">🏨</div>
          <div className="text-sm">Фото номера відсутні</div>
        </div>
      </div>
    );
  }

  // Single image - no slider needed
  if (images.length === 1) {
    return (
      <div className="w-full h-full relative rounded-l-lg overflow-hidden">
        <Image
          src={images[0]}
          alt={roomName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
    );
  }

  // Multiple images - use Swiper
  return (
    <div className="w-full h-full relative rounded-l-lg overflow-hidden">
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={{
          nextEl: `.swiper-button-next-${safeClassName}`,
          prevEl: `.swiper-button-prev-${safeClassName}`,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        loop={images.length > 2}
        className="w-full h-full"
      >
        {images.map((image: string, index: number) => (
          <SwiperSlide key={index}>
            <div className="relative w-full h-full">
              <Image
                src={image}
                alt={`${roomName} - фото ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={index === 0} // Prioritize first image
              />
            </div>
          </SwiperSlide>
        ))}

        {/* Custom navigation buttons */}
        <div
          className={`swiper-button-prev-${safeClassName} absolute left-2 top-1/2 -translate-y-1/2 z-[5] w-8 h-8 bg-white/80 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/90 transition-colors shadow-sm`}
        >
          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </div>

        <div
          className={`swiper-button-next-${safeClassName} absolute right-2 top-1/2 -translate-y-1/2 z-[5] w-8 h-8 bg-white/80 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/90 transition-colors shadow-sm`}
        >
          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Swiper>
    </div>
  );
};
