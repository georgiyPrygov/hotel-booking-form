import React from "react";
import { DayPicker, DateRange } from "react-day-picker";
import { uk } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import { SkeletonLoader } from "../SkeletonLoader/SkeletonLoader";

interface DatePickerProps {
  selectedRange: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
  onMonthChange: (month: Date) => void;
  disabled: Date[];
  availableDates: Date[];
  occupiedDates: Date[];
  isLoading: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selectedRange,
  onSelect,
  onMonthChange,
  disabled,
  availableDates,
  occupiedDates,
  isLoading,
}) => {
  const ukrainianLabels = {
    labelNext: () => "Наступний місяць",
    labelPrevious: () => "Попередній місяць",
    labelDay: (day: Date) => `${day.getDate()}`,
    labelWeekday: (day: Date) => day.toLocaleDateString("uk-UA", { weekday: "short" }),
    labelMonthDropdown: () => "Обрати місяць",
    labelYearDropdown: () => "Обрати рік",
  };

  // Check if we're on mobile (you could also use a proper hook for this)
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div className="relative overflow-hidden">
      <DayPicker
        mode="range"
        numberOfMonths={isMobile ? 1 : 2}
        selected={selectedRange}
        onSelect={onSelect}
        onMonthChange={onMonthChange}
        disabled={disabled}
        fromDate={new Date()}
        fromMonth={new Date()}
        locale={uk}
        labels={ukrainianLabels}
        modifiers={{
          available: availableDates,
          occupied: occupiedDates,
        }}
        modifiersStyles={{
          available: { backgroundColor: "#fff", color: "#222222" },
          occupied: {
            backgroundColor: "#fff",
            color: "#b0b0b0",
            cursor: "not-allowed",
            textDecoration: "line-through",
          },
        }}
        className="mb-4"
      />

      <SkeletonLoader isLoading={isLoading} />
    </div>
  );
};
