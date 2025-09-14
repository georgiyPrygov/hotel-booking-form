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
  onRangeSelect?: (range: DateRange | undefined) => void;
}

export const DatesPicker: React.FC<DatesPickerProps> = ({ className, onRangeSelect }) => {
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    // Initialize to the first day of current month
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Custom hooks for data and validation
  const { monthlyAvailability, monthlyLoading, getAvailableDates, getCompletelyOccupiedDates, getRoomsForDateRange } =
    useAvailability(currentMonth);

  const { isRangeValid, getAllDisabledDates } = useDateValidation(
    monthlyAvailability,
    currentMonth,
    selectedRange,
    getCompletelyOccupiedDates
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

    // In range picking mode, add next day as available even if normally occupied
    if (selectedRange?.from && !selectedRange.to) {
      const nextDay = new Date(selectedRange.from);
      nextDay.setDate(nextDay.getDate() + 1);

      // Add next day to available dates if not already there
      const nextDayExists = normalAvailable.some(date => date.getTime() === nextDay.getTime());
      if (!nextDayExists) {
        return [...normalAvailable, nextDay];
      }
    }

    return normalAvailable;
  };

  // Handle date range selection with validation
  const handleRangeSelect = (range: DateRange | undefined) => {
    if (!range) {
      setSelectedRange(undefined);
      onRangeSelect?.(undefined);
      return;
    }

    // If we already have a complete range (both from and to), reset completely on any click
    if (selectedRange?.from && selectedRange?.to) {
      setSelectedRange(undefined);
      onRangeSelect?.(undefined);
      return;
    }

    // If from and to are the same date, this is likely a first click or reset
    if (range.from && range.to && range.from.getTime() === range.to.getTime()) {
      const newRange = { from: range.from, to: undefined };
      setSelectedRange(newRange);
      onRangeSelect?.(newRange);
      return;
    }

    // If only from date is set, this is the start of range selection
    if (range.from && !range.to) {
      setSelectedRange(range);
      onRangeSelect?.(range);
      return;
    }

    // If both from and to are set and different
    if (range.from && range.to) {
      const daysDiff = Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24));

      // Ensure minimum 1 night stay
      if (daysDiff < 1) {
        return;
      }

      // Check if this is a valid checkout on an occupied date
      // We need to validate the stay period (excluding checkout date)
      const stayEndDate = new Date(range.to);
      stayEndDate.setDate(stayEndDate.getDate() - 1); // Last night of stay

      // Only validate the stay period, not the checkout date
      if (daysDiff > 1 && !isRangeValid(range.from, stayEndDate)) {
        return;
      }

      setSelectedRange(range);
      onRangeSelect?.(range);
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
      />
      <AvailableRooms selectedRange={selectedRange} availableRooms={availableRooms} isLoading={monthlyLoading} />
    </div>
  );
};
