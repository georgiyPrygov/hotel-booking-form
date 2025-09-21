import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { AvailabilityResponse, RoomInfo, StayDate, GuestInfo } from "../types/availability";
import { getRoomConfig } from "../data/roomsConfig";

export const useAvailability = (currentMonth: Date, guestInfo?: GuestInfo, isMirador?: boolean) => {
  const [monthlyAvailability, setMonthlyAvailability] = useState<AvailabilityResponse | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(true);

  const fetchMonthlyAvailability = async (date: Date) => {
    setMonthlyLoading(true);
    try {
      // Ensure we always get the first day of the intended month
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstOfMonth = new Date(year, month, 2);

      const iso = firstOfMonth.toISOString().slice(0, 10);

      const response = await fetch(`/api/availability?date=${iso}`);
      const data: AvailabilityResponse = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch monthly availability");
      }

      setMonthlyAvailability(data);
    } catch (err) {
      console.error("Error fetching monthly availability:", err);
      setMonthlyAvailability(null);
    } finally {
      setMonthlyLoading(false);
    }
  };

  // Get dates that have at least one room available for a specific month
  // A date is only available if it has at least one room that can accommodate ALL selected guests
  const getAvailableDatesForMonth = (year: number, month: number): Date[] => {
    if (!monthlyAvailability?.data) return [];

    const availableDatesSet = new Set<number>();

    // Filter rooms for the specific month and collect available dates
    monthlyAvailability.data
      .filter(room => room.year === year && room.month === month)
      .forEach(room => {
        // If isMirador flag is set, only consider room 7 (Mirador cottage)
        if (isMirador && room.roomNumber !== 7) {
          return;
        }

        // Check if room can accommodate the required guests
        // Only rooms that can fit ALL selected guests are considered available
        const roomConfig = getRoomConfig(room.roomNumber);
        const canAccommodate =
          !guestInfo || !roomConfig || roomConfig.maxPersons >= guestInfo.adults + guestInfo.children;

        if (canAccommodate) {
          room.availableDates.forEach(day => {
            availableDatesSet.add(day);
          });
        }
      });

    return Array.from(availableDatesSet).map(day => new Date(year, month - 1, day));
  };

  // Get dates that have NO rooms available for a specific month
  const getCompletelyOccupiedDatesForMonth = (year: number, month: number): Date[] => {
    if (!monthlyAvailability?.data) return [];

    const daysInMonth = new Date(year, month, 0).getDate();
    const availableDatesSet = new Set<number>();

    // Get all dates that have at least one room available for this month
    monthlyAvailability.data
      .filter(room => room.year === year && room.month === month)
      .forEach(room => {
        // If isMirador flag is set, only consider room 7 (Mirador cottage)
        if (isMirador && room.roomNumber !== 7) {
          return;
        }

        room.availableDates.forEach(day => {
          availableDatesSet.add(day);
        });
      });

    // Return dates that are NOT in the available set (completely occupied)
    const completelyOccupied: Date[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      if (!availableDatesSet.has(day)) {
        completelyOccupied.push(new Date(year, month - 1, day));
      }
    }

    return completelyOccupied;
  };

  // Get all available dates across both months
  const getAvailableDates = (): Date[] => {
    if (!monthlyAvailability?.data || !currentMonth) return [];

    const currentYear = currentMonth.getFullYear();
    const currentMonthNum = currentMonth.getMonth() + 1;
    const nextMonthDate = new Date(currentYear, currentMonthNum, 1);
    const nextYear = nextMonthDate.getFullYear();
    const nextMonthNum = nextMonthDate.getMonth() + 1;

    return [
      ...getAvailableDatesForMonth(currentYear, currentMonthNum),
      ...getAvailableDatesForMonth(nextYear, nextMonthNum),
    ];
  };

  // Get all completely occupied dates across both months
  const getCompletelyOccupiedDates = (): Date[] => {
    if (!monthlyAvailability?.data || !currentMonth) return [];

    const currentYear = currentMonth.getFullYear();
    const currentMonthNum = currentMonth.getMonth() + 1;
    const nextMonthDate = new Date(currentYear, currentMonthNum, 1);
    const nextYear = nextMonthDate.getFullYear();
    const nextMonthNum = nextMonthDate.getMonth() + 1;

    return [
      ...getCompletelyOccupiedDatesForMonth(currentYear, currentMonthNum),
      ...getCompletelyOccupiedDatesForMonth(nextYear, nextMonthNum),
    ];
  };

  // Get rooms available for a specific date range
  const getRoomsForDateRange = (range: DateRange | undefined): RoomInfo[] => {
    if (!monthlyAvailability?.data || !range?.from) return [];

    // Create a list of all dates in the stay period (excluding checkout day)
    const stayDates: StayDate[] = [];

    // eslint-disable-next-line prefer-const
    let currentDate = new Date(range.from);
    const endDateTime = range.to ? range.to.getTime() : new Date(range.from.getTime() + 24 * 60 * 60 * 1000).getTime();

    while (currentDate.getTime() < endDateTime) {
      stayDates.push({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1, // Convert to 1-based
        day: currentDate.getDate(),
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get all available rooms (we need to check all rooms across all months)
    const allRooms = new Map<number, RoomInfo>();

    // Collect unique rooms from all months
    monthlyAvailability.data.forEach(room => {
      // If isMirador flag is set, only include room 7 (Mirador cottage)
      if (isMirador && room.roomNumber !== 7) {
        return;
      }
      // If isMirador flag is not set, include ALL rooms (including Mirador)
      // No filtering for regular widget - show all rooms

      allRooms.set(room.roomNumber, {
        roomNumber: room.roomNumber,
        roomName: room.roomName,
      });
    });

    // Check which rooms are available for ALL stay dates
    const availableRooms: RoomInfo[] = [];

    for (const [roomNumber, roomInfo] of allRooms) {
      let roomAvailableForAllDates = true;

      // Check if this room is available for every stay date
      for (const stayDate of stayDates) {
        const roomDataForDate = monthlyAvailability.data.find(
          room => room.roomNumber === roomNumber && room.year === stayDate.year && room.month === stayDate.month
        );

        // If no data for this month/year or room not available on this date
        if (!roomDataForDate || !roomDataForDate.availableDates.includes(stayDate.day)) {
          roomAvailableForAllDates = false;
          break;
        }
      }

      // Check if room can accommodate the required guests
      const roomConfig = getRoomConfig(roomNumber);
      const canAccommodate =
        !guestInfo || !roomConfig || roomConfig.maxPersons >= guestInfo.adults + guestInfo.children;

      if (roomAvailableForAllDates && canAccommodate) {
        availableRooms.push(roomInfo);
      }
    }

    return availableRooms;
  };

  // Fetch monthly availability when hook is used
  useEffect(() => {
    fetchMonthlyAvailability(currentMonth);
  }, [currentMonth]);

  return {
    monthlyAvailability,
    monthlyLoading,
    fetchMonthlyAvailability,
    getAvailableDates,
    getCompletelyOccupiedDates,
    getRoomsForDateRange,
  };
};
