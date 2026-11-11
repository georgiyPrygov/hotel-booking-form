"use client";

import React, { useState } from "react";
import { DateRange } from "react-day-picker";
import { useAvailability } from "../../hooks/useAvailability";
import { useDateValidation } from "../../hooks/useDateValidation";
import { DatePicker } from "./components/DatePicker/DatePicker";
import { AvailableRooms } from "./components/AvailableRooms/AvailableRooms";
import styles from "./DatesPicker.module.scss";

interface DatesPickerProps {
  className?: string;
  isMirador?: boolean;
}

export const DatesPicker: React.FC<DatesPickerProps> = ({ className, isMirador = false }) => {
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    // Initialize to the first day of current month
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Custom hooks for data and validation
  const { monthlyAvailability, monthlyLoading, getAvailableDates, getCompletelyOccupiedDates, getRoomsForDateRange } =
    useAvailability(currentMonth, undefined, isMirador);

  const { isRangeValid, getAllowedCheckoutDates, getAllDisabledDates } = useDateValidation(
    monthlyAvailability,
    currentMonth,
    selectedRange,
    getCompletelyOccupiedDates,
    isMirador
  );

  // Handle month change in date picker
  const handleMonthChange = (newMonth: Date) => {
    // Ensure we always work with the first day of the month
    const year = newMonth.getFullYear();
    const month = newMonth.getMonth();
    const firstOfNewMonth = new Date(year, month, 1);

    setCurrentMonth(firstOfNewMonth);
    // fetchMonthlyAvailability is automatically called by useAvailability hook when currentMonth changes
  };

  // Get available dates with special handling for range picking mode
  const getAvailableDatesForPicker = (): Date[] => {
    const normalAvailable = getAvailableDates();

    if (selectedRange?.from && !selectedRange.to) {
      const checkoutCandidates = getAllowedCheckoutDates(selectedRange.from);
      const merged = [...normalAvailable];
      for (const checkout of checkoutCandidates) {
        if (!merged.some(date => date.getTime() === checkout.getTime())) {
          merged.push(checkout);
        }
      }
      return merged;
    }

    return normalAvailable;
  };

  // Handle date range selection with validation
  const handleRangeSelect = (range: DateRange | undefined) => {
    if (!range) {
      setSelectedRange(undefined);

      return;
    }

    // If we already have a complete range (both from and to), reset completely on any click
    if (selectedRange?.from && selectedRange?.to) {
      setSelectedRange(undefined);

      return;
    }

    // If from and to are the same date, this is likely a first click or reset
    if (range.from && range.to && range.from.getTime() === range.to.getTime()) {
      const newRange = { from: range.from, to: undefined };
      setSelectedRange(newRange);

      return;
    }

    // If only from date is set, this is the start of range selection
    if (range.from && !range.to) {
      setSelectedRange(range);

      return;
    }

    // If both from and to are set and different
    if (range.from && range.to) {
      const daysDiff = Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24));

      // Ensure minimum 1 night stay
      if (daysDiff < 1) {
        return;
      }

      if (!isRangeValid(range.from, range.to)) {
        return;
      }

      setSelectedRange(range);
    }
  };

  const availableDates = getAvailableDatesForPicker();
  const completelyOccupiedDates = getCompletelyOccupiedDates();
  const disabledDates = getAllDisabledDates();
  const availableRooms = getRoomsForDateRange(selectedRange);

  return (
    <div className={`${styles.datePicker} ${className || ""}`}>
      <DatePicker
        selectedRange={selectedRange}
        onSelect={handleRangeSelect}
        onMonthChange={handleMonthChange}
        disabled={disabledDates}
        availableDates={availableDates}
        occupiedDates={completelyOccupiedDates}
        isLoading={monthlyLoading}
        isMirador={isMirador}
      />
      <AvailableRooms
        selectedRange={selectedRange}
        availableRooms={availableRooms}
        isLoading={monthlyLoading}
        isMirador={isMirador}
      />
    </div>
  );
};
