import { DateRange } from "react-day-picker";
import { AvailabilityResponse, StayDate } from "../types/availability";

export const useDateValidation = (
  monthlyAvailability: AvailabilityResponse | null,
  currentMonth: Date,
  selectedRange: DateRange | undefined,
  getCompletelyOccupiedDates: () => Date[]
) => {
  // Check if a date range contains any occupied dates (checkout logic)
  const isRangeValid = (startDate: Date, endDate: Date): boolean => {
    if (!monthlyAvailability?.data) return false;

    // Create a list of all dates in the stay period (excluding checkout day)
    const stayDates: StayDate[] = [];

    // eslint-disable-next-line prefer-const
    let currentDate = new Date(startDate);
    const endDateTime = endDate.getTime();

    while (currentDate.getTime() < endDateTime) {
      stayDates.push({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1, // Convert to 1-based
        day: currentDate.getDate(),
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Check each stay date to ensure at least one room is available
    for (const stayDate of stayDates) {
      const hasAvailableRoom = monthlyAvailability.data.some(
        room =>
          room.year === stayDate.year && room.month === stayDate.month && room.availableDates.includes(stayDate.day)
      );

      if (!hasAvailableRoom) {
        return false; // Found an occupied day in the stay period
      }
    }

    return true;
  };

  // Find the first disabled date that should be allowed as checkout
  const findFirstAllowedCheckoutDate = (startDate: Date): Date | null => {
    if (!monthlyAvailability?.data) return null;

    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const startDay = startDate.getDate();

    // Check current month first
    const daysInCurrentMonth = new Date(startYear, startMonth + 1, 0).getDate();

    // Look for the first occupied date after a sequence of available dates
    for (let day = startDay + 1; day <= daysInCurrentMonth; day++) {
      const currentDate = new Date(startYear, startMonth, day);
      const currentYear = currentDate.getFullYear();
      const currentMonthNum = currentDate.getMonth() + 1;
      const currentDay = currentDate.getDate();

      // Check if this date is completely occupied (no rooms available)
      const hasAvailableRoom = monthlyAvailability.data.some(
        room => room.year === currentYear && room.month === currentMonthNum && room.availableDates.includes(currentDay)
      );

      if (!hasAvailableRoom) {
        // This is the first occupied date - allow it as checkout
        return currentDate;
      }
    }

    // Check next month if current month didn't have an occupied date
    if (startMonth < 11) {
      // Valid next month
      const nextYear = startYear;
      const nextMonth = startMonth + 1;
      const daysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();

      for (let day = 1; day <= daysInNextMonth; day++) {
        const currentDate = new Date(nextYear, nextMonth, day);
        const currentYear = currentDate.getFullYear();
        const currentMonthNum = currentDate.getMonth() + 1;
        const currentDay = currentDate.getDate();

        // Check if this date is completely occupied (no rooms available)
        const hasAvailableRoom = monthlyAvailability.data.some(
          room =>
            room.year === currentYear && room.month === currentMonthNum && room.availableDates.includes(currentDay)
        );

        if (!hasAvailableRoom) {
          // This is the first occupied date - allow it as checkout
          return currentDate;
        }
      }
    }

    return null;
  };

  // Get dates that should be disabled for smart range validation only
  const getSmartDisabledDates = (): Date[] => {
    if (!monthlyAvailability?.data || !currentMonth) return [];

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const disabledDates: Date[] = [];

    // If we have a selected start date, apply range picking mode logic
    if (selectedRange?.from && !selectedRange.to) {
      const selectedDay = selectedRange.from.getDate();
      const selectedMonth = selectedRange.from.getMonth();
      const selectedYear = selectedRange.from.getFullYear();

      // Find the first allowed checkout date
      const allowedCheckoutDate = findFirstAllowedCheckoutDate(selectedRange.from);

      // Handle current month
      if (selectedMonth === month && selectedYear === year) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // 1. Disable all dates before the start date
        for (let day = 1; day < selectedDay; day++) {
          disabledDates.push(new Date(year, month, day));
        }

        // 2. Disable the same day (can't checkout on check-in day)
        disabledDates.push(new Date(year, month, selectedDay));

        // 3. If we have an allowed checkout date, disable everything after it
        if (allowedCheckoutDate) {
          const checkoutDay = allowedCheckoutDate.getDate();
          const checkoutMonth = allowedCheckoutDate.getMonth();
          const checkoutYear = allowedCheckoutDate.getFullYear();

          // If checkout date is in current month, disable all dates after it
          if (checkoutMonth === month && checkoutYear === year) {
            for (let day = checkoutDay + 1; day <= daysInMonth; day++) {
              disabledDates.push(new Date(year, month, day));
            }
          }
        }
      } else {
        // If start date is not in current month, disable all of current month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          disabledDates.push(new Date(year, month, day));
        }
      }

      // Handle next month if showing 2 months
      const nextYear = year;
      const nextMonth = month + 1;
      if (nextMonth <= 11) {
        // Valid next month
        const nextMonthDays = new Date(nextYear, nextMonth + 1, 0).getDate();

        // If start date is in current month, check next month for availability
        if (selectedMonth === month && selectedYear === year) {
          // If checkout date is in next month, disable everything after it
          if (allowedCheckoutDate) {
            const checkoutMonth = allowedCheckoutDate.getMonth();
            const checkoutYear = allowedCheckoutDate.getFullYear();

            if (checkoutMonth === nextMonth && checkoutYear === nextYear) {
              const checkoutDay = allowedCheckoutDate.getDate();
              for (let day = checkoutDay + 1; day <= nextMonthDays; day++) {
                disabledDates.push(new Date(nextYear, nextMonth, day));
              }
            } else if (checkoutMonth === month && checkoutYear === year) {
              // Checkout is in current month, disable all of next month
              for (let day = 1; day <= nextMonthDays; day++) {
                disabledDates.push(new Date(nextYear, nextMonth, day));
              }
            }
          }
        } else if (selectedMonth === nextMonth && selectedYear === nextYear) {
          // Start date is in next month
          // 1. Disable all dates before the start date
          for (let day = 1; day < selectedDay; day++) {
            disabledDates.push(new Date(nextYear, nextMonth, day));
          }

          // 2. Disable the same day (can't checkout on check-in day)
          disabledDates.push(new Date(nextYear, nextMonth, selectedDay));

          // 3. If we have an allowed checkout date in next month, disable everything after it
          if (allowedCheckoutDate) {
            const checkoutDay = allowedCheckoutDate.getDate();
            const checkoutMonth = allowedCheckoutDate.getMonth();
            const checkoutYear = allowedCheckoutDate.getFullYear();

            if (checkoutMonth === nextMonth && checkoutYear === nextYear) {
              for (let day = checkoutDay + 1; day <= nextMonthDays; day++) {
                disabledDates.push(new Date(nextYear, nextMonth, day));
              }
            }
          }
        } else {
          // Start date is not in either month, disable all of next month
          for (let day = 1; day <= nextMonthDays; day++) {
            disabledDates.push(new Date(nextYear, nextMonth, day));
          }
        }
      }
    }

    return disabledDates;
  };

  // Get all dates that should be disabled (occupied + smart disabled)
  const getAllDisabledDates = (): Date[] => {
    const completelyOccupied = getCompletelyOccupiedDates();
    const smartDisabled = getSmartDisabledDates();

    // If we're in range selection mode, exclude start date and next day from disabled dates
    if (selectedRange?.from && !selectedRange.to) {
      const startDate = selectedRange.from;
      const nextDay = new Date(selectedRange.from);
      nextDay.setDate(nextDay.getDate() + 1);

      // Find the first disabled/occupied date after start date that should be allowed as checkout
      const allowedCheckoutDate = findFirstAllowedCheckoutDate(startDate);

      // Remove start date, next day, and first allowed checkout date from disabled dates
      return [...completelyOccupied, ...smartDisabled].filter(date => {
        const dateTime = date.getTime();
        return (
          dateTime !== startDate.getTime() &&
          dateTime !== nextDay.getTime() &&
          (allowedCheckoutDate ? dateTime !== allowedCheckoutDate.getTime() : true)
        );
      });
    }

    return [...completelyOccupied, ...smartDisabled];
  };

  return {
    isRangeValid,
    findFirstAllowedCheckoutDate,
    getSmartDisabledDates,
    getAllDisabledDates,
  };
};
