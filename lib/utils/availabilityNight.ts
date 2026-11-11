import { AvailabilityResponse, GuestInfo } from "../../types/availability";
import { getRoomConfig } from "../../data/roomsConfig";

type RoomRow = NonNullable<AvailabilityResponse["data"]>[number];

interface NightAvailabilityOptions {
  isMirador?: boolean;
  guestInfo?: GuestInfo;
}

const isRelevantRoom = (room: RoomRow, options?: NightAvailabilityOptions): boolean => {
  if (options?.isMirador && room.roomNumber !== 7) {
    return false;
  }

  const roomConfig = getRoomConfig(room.roomNumber);
  const guestInfo = options?.guestInfo;
  const canAccommodate =
    !guestInfo || !roomConfig || roomConfig.maxPersons >= guestInfo.adults + guestInfo.children;

  return canAccommodate;
};

export const isNightAvailableForBooking = (
  date: Date,
  data: AvailabilityResponse["data"] | undefined,
  options?: NightAvailabilityOptions
): boolean => {
  if (!data) return false;

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return data.some(
    room =>
      isRelevantRoom(room, options) &&
      room.year === year &&
      room.month === month &&
      room.availableDates.includes(day)
  );
};
