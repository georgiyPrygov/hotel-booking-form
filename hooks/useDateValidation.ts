import { DateRange } from "react-day-picker";
import { AvailabilityResponse, GuestInfo, StayDate } from "../types/availability";
import { isNightAvailableForBooking } from "../lib/utils/availabilityNight";

export const useDateValidation = (
  monthlyAvailability: AvailabilityResponse | null,
  currentMonth: Date,
  selectedRange: DateRange | undefined,
  getCompletelyOccupiedDates: () => Date[],
  isMirador?: boolean,
  guestInfo?: GuestInfo
) => {
  const availabilityOptions = { isMirador, guestInfo };
  // Helper function to check if a date is before today
  const startOfDay = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const isDateBeforeToday = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate.getTime() < today.getTime();
  };
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

    for (const stayDate of stayDates) {
      const night = new Date(stayDate.year, stayDate.month - 1, stayDate.day);
      if (!isNightAvailableForBooking(night, monthlyAvailability.data, availabilityOptions)) {
        return false;
      }
    }

    return true;
  };

  /**
   * Walk consecutive bookable nights from check-in; each allows checkout on the following morning.
   * A checkout day may be "occupied" (no new check-in that night) — that is fine.
   */
  const getAllowedCheckoutDates = (startDate: Date): Date[] => {
    if (!monthlyAvailability?.data) return [];

    const allowed: Date[] = [];
    const cursor = startOfDay(startDate);
    const maxScanDays = 800;

    for (let i = 0; i < maxScanDays; i++) {
      if (!isNightAvailableForBooking(cursor, monthlyAvailability.data, availabilityOptions)) {
        break;
      }

      const checkout = new Date(cursor);
      checkout.setDate(checkout.getDate() + 1);
      allowed.push(startOfDay(checkout));

      cursor.setDate(cursor.getDate() + 1);
    }

    return allowed;
  };

  const findFirstAllowedCheckoutDate = (startDate: Date): Date | null => {
    const allowed = getAllowedCheckoutDates(startDate);
    return allowed.length > 0 ? allowed[allowed.length - 1] : null;
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

      const allowedCheckoutDates = getAllowedCheckoutDates(selectedRange.from);
      const lastAllowedCheckout = allowedCheckoutDates[allowedCheckoutDates.length - 1];

      const viewMonthIndex = year * 12 + month;
      const startMonthIndex = selectedYear * 12 + selectedMonth;

      // Handle the month that contains check-in
      if (selectedMonth === month && selectedYear === year) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // 1. Disable all dates before the start date
        for (let day = 1; day < selectedDay; day++) {
          disabledDates.push(new Date(year, month, day));
        }

        // 2. Disable the same day (can't checkout on check-in day)
        disabledDates.push(new Date(year, month, selectedDay));

        if (lastAllowedCheckout) {
          const checkoutDay = lastAllowedCheckout.getDate();
          const checkoutMonth = lastAllowedCheckout.getMonth();
          const checkoutYear = lastAllowedCheckout.getFullYear();

          if (checkoutMonth === month && checkoutYear === year) {
            for (let day = checkoutDay + 1; day <= daysInMonth; day++) {
              disabledDates.push(new Date(year, month, day));
            }
          }
        }
      } else if (viewMonthIndex < startMonthIndex) {
        // Entire visible month is before check-in (e.g. two-month desktop: left panel before start)
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          disabledDates.push(new Date(year, month, day));
        }
      } else if (viewMonthIndex > startMonthIndex) {
        // Visible month is after check-in — typical on mobile after advancing from the check-in month.
        // Do not blanket-disable; only trim after the first allowed checkout in this month.
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        if (lastAllowedCheckout) {
          const checkoutDay = lastAllowedCheckout.getDate();
          const checkoutMonth = lastAllowedCheckout.getMonth();
          const checkoutYear = lastAllowedCheckout.getFullYear();

          if (checkoutMonth === month && checkoutYear === year) {
            for (let day = checkoutDay + 1; day <= daysInMonth; day++) {
              disabledDates.push(new Date(year, month, day));
            }
          }
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
          if (lastAllowedCheckout) {
            const checkoutMonth = lastAllowedCheckout.getMonth();
            const checkoutYear = lastAllowedCheckout.getFullYear();

            if (checkoutMonth === nextMonth && checkoutYear === nextYear) {
              const checkoutDay = lastAllowedCheckout.getDate();
              for (let day = checkoutDay + 1; day <= nextMonthDays; day++) {
                disabledDates.push(new Date(nextYear, nextMonth, day));
              }
            } else if (checkoutMonth === month && checkoutYear === year) {
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
          if (lastAllowedCheckout) {
            const checkoutDay = lastAllowedCheckout.getDate();
            const checkoutMonth = lastAllowedCheckout.getMonth();
            const checkoutYear = lastAllowedCheckout.getFullYear();

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

  // Get all dates that should be disabled (past dates + occupied + smart disabled)
  const getAllDisabledDates = (): Date[] => {
    const completelyOccupied = getCompletelyOccupiedDates();
    const smartDisabled = getSmartDisabledDates();

    // Get past dates (before today) - simplified approach
    const pastDates: Date[] = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Add all past dates for current month
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const date = new Date(year, month, day);
      if (isDateBeforeToday(date)) {
        pastDates.push(date);
      }
    }

    // Add all past dates for next month (if showing 2 months)
    const nextYear = year;
    const nextMonth = month + 1;
    if (nextMonth <= 11) {
      const daysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
      for (let day = 1; day <= daysInNextMonth; day++) {
        const date = new Date(nextYear, nextMonth, day);
        if (isDateBeforeToday(date)) {
          pastDates.push(date);
        }
      }
    }

    // If we're in range selection mode, exclude start date and next day from disabled dates
    if (selectedRange?.from && !selectedRange.to) {
      const startDate = selectedRange.from;
      const allowedCheckoutTimes = new Set(
        getAllowedCheckoutDates(startDate).map(date => startOfDay(date).getTime())
      );
      const startTime = startOfDay(startDate).getTime();

      // Keep only dates that must stay disabled; drop any date that is check-in or a valid checkout
      return [...pastDates, ...completelyOccupied, ...smartDisabled].filter(date => {
        const dateTime = startOfDay(date).getTime();
        if (dateTime === startTime) return false;
        if (allowedCheckoutTimes.has(dateTime)) return false;
        return true;
      });
    }

    return [...pastDates, ...completelyOccupied, ...smartDisabled];
  };

  return {
    isRangeValid,
    getAllowedCheckoutDates,
    findFirstAllowedCheckoutDate,
    getSmartDisabledDates,
    getAllDisabledDates,
  };
};
