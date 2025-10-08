import React from "react";
import { getRoomConfig } from "../../../../data/roomsConfig";
import { ImageSlider } from "../ImageSlider/ImageSlider";

interface AvailableRoomProps {
  roomNumber: number;
  onBook: (roomNumber: number, roomName: string) => void;
}

export const AvailableRoom: React.FC<AvailableRoomProps> = ({ roomNumber, onBook }) => {
  const roomConfig = getRoomConfig(roomNumber);

  if (!roomConfig) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Інформація про номер {roomNumber} відсутня</p>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency: "UAH",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Horizontal Layout: Image + Content */}
      <div className="flex flex-col sm:flex-row">
        {/* Image Section */}
        <div className="relative sm:w-1/3 lg:w-2/5">
          <div className="h-48 sm:h-full min-h-[200px]">
            <ImageSlider images={roomConfig.images} roomName={roomConfig.name} />
          </div>

          {/* Room Number Badge */}
          <div className="absolute top-6 left-3 sm:top-3 sm:left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-gray-700">
            Номер {roomConfig.roomNumber}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-4 sm:p-6">
          {/* Room Name */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{roomConfig.name}</h3>

          {/* Room Description */}
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">{roomConfig.description}</p>

          {/* Room Details */}
          <div className="flex items-center justify-between mb-4">
            {/* Price */}
            <div className="text-right flex items-center gap-2">
              <div className="text-lg font-bold">{formatPrice(roomConfig.price)}</div>
              <div className="text-lg text-gray-500">/ ніч для 2х осіб</div>
            </div>
          </div>

          {/* Book Button */}
          <button
            onClick={() => onBook(roomNumber, roomConfig.name)}
            className="w-full text-white font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer"
            style={{
              backgroundColor: "var(--color-blue-400)",
              borderColor: "var(--color-blue-400)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "var(--color-blue-500)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "var(--color-blue-400)";
            }}
          >
            Забронювати
          </button>
        </div>
      </div>
    </div>
  );
};
