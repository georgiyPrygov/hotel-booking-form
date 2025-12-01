import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { AvailableRoomsProps, RoomInfo } from "../../../../types/availability";
import { AvailableRoom } from "../AvailableRoom/AvailableRoom";
import { BookingForm } from "../BookingForm/BookingForm";
import { SuccessPage } from "../SuccessPage/SuccessPage";

interface BookingState {
  isBooking: boolean;
  isSuccess: boolean;
  roomNumber: number | null;
  roomName: string;
}

export const AvailableRooms: React.FC<AvailableRoomsProps> = ({
  selectedRange,
  availableRooms,
  isLoading,
  isMirador = false,
}) => {
  const [bookingState, setBookingState] = useState<BookingState>({
    isBooking: false,
    isSuccess: false,
    roomNumber: null,
    roomName: "",
  });

  // Reset booking state when selectedRange changes
  useEffect(() => {
    if (bookingState.isBooking || bookingState.isSuccess) {
      setBookingState({
        isBooking: false,
        isSuccess: false,
        roomNumber: null,
        roomName: "",
      });
    }
  }, [selectedRange]);

  if (!selectedRange?.from) return null;

  const formatDateRange = () => {
    // We already checked for selectedRange?.from at the component level
    const from = selectedRange.from!;

    if (selectedRange.to && selectedRange.to.getTime() !== from.getTime()) {
      return (
        <>
          Заїзд: {format(from, "d MMM", { locale: uk })} → Виїзд:{" "}
          {format(selectedRange.to, "d MMM yyyy", { locale: uk })}
        </>
      );
    } else {
      return format(from, "EEEE, d MMMM yyyy", { locale: uk }) + " (1 ніч)";
    }
  };

  const getNightsCount = () => {
    const from = selectedRange.from!;
    if (selectedRange.to && selectedRange.to.getTime() !== from.getTime()) {
      return Math.ceil((selectedRange.to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    }
    return 1;
  };

  const getRoomsText = (count: number) => {
    if (isMirador) {
      return "коттедж вільний на";
    }
    if (count === 1) return "номер доступний на";
    if (count >= 2 && count <= 4) return "номери доступні на";
    return "номерів доступні на";
  };

  const nights = getNightsCount();
  const nightsText = nights === 1 ? "ніч" : nights < 5 ? "ночі" : "ночей";

  const handleBookRoom = (roomNumber: number, roomName: string) => {
    setBookingState({
      isBooking: true,
      isSuccess: false,
      roomNumber,
      roomName,
    });
  };

  const handleBookingSubmit = () => {
    // Show success page after successful submission
    setBookingState({
      isBooking: false,
      isSuccess: true,
      roomNumber: null,
      roomName: "",
    });
  };

  const handleBookingCancel = () => {
    setBookingState({
      isBooking: false,
      isSuccess: false,
      roomNumber: null,
      roomName: "",
    });
  };

  const handleBackToRooms = () => {
    setBookingState({
      isBooking: false,
      isSuccess: false,
      roomNumber: null,
      roomName: "",
    });
  };

  // If success page should be shown
  if (bookingState.isSuccess) {
    return (
      <div className="mt-6">
        <SuccessPage onBackToRooms={handleBackToRooms} />
      </div>
    );
  }

  // If booking form is active, show it instead of the room list
  if (bookingState.isBooking && selectedRange) {
    return (
      <div className="mt-6">
        <BookingForm
          roomName={bookingState.roomName}
          roomNumber={bookingState.roomNumber!}
          selectedRange={selectedRange}
          onSubmit={handleBookingSubmit}
          onCancel={handleBookingCancel}
          isMirador={isMirador}
        />
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Header Section */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2 text-gray-900">
          {isMirador ? "Коттедж Mirador на" : "Доступні номери на"} {formatDateRange()}
        </h3>

        {isLoading ? (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>{isMirador ? "Перевірка доступності коттеджу..." : "Завантаження доступних номерів..."}</span>
          </div>
        ) : availableRooms.length > 0 ? (
          <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg inline-block">
            {isMirador
              ? `Коттедж вільний на ${nights} ${nightsText}`
              : `${availableRooms.length} ${getRoomsText(availableRooms.length)} ${nights} ${nightsText}`}
          </div>
        ) : (
          <div className="text-red-600 bg-red-50 px-3 py-2 rounded-lg inline-block text-sm">
            {isMirador
              ? nights > 1
                ? "Коттедж зайнятий на весь період перебування"
                : "Коттедж зайнятий на цю дату"
              : nights > 1
                ? "Немає доступних номерів на весь період перебування"
                : "Немає доступних номерів на цю дату"}
          </div>
        )}
      </div>

      {/* Available Rooms Grid */}
      {!isLoading && availableRooms.length > 0 && (
        <div className="space-y-4">
          {availableRooms.map((room: RoomInfo) => (
            <AvailableRoom key={room.roomNumber} roomNumber={room.roomNumber} onBook={handleBookRoom} />
          ))}
        </div>
      )}
    </div>
  );
};
