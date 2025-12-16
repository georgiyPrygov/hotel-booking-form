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
  isMirador?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selectedRange,
  onSelect,
  onMonthChange,
  disabled,
  availableDates,
  occupiedDates,
  isLoading,
  isMirador = false,
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
  const [isMobile, setIsMobile] = React.useState(false);

  // Track today's date to ensure it's always current
  const [today, setToday] = React.useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add resize listener
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Update today date periodically to ensure it's always current
  // This is especially important for production where the component might be mounted
  // before midnight and then cross midnight
  React.useEffect(() => {
    const updateToday = () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      setToday(prevToday => {
        // Only update if the date actually changed
        if (prevToday.getTime() !== now.getTime()) {
          return now;
        }
        return prevToday;
      });
    };

    // Update immediately
    updateToday();

    // Update every minute to catch date changes (e.g., crossing midnight)
    const interval = setInterval(updateToday, 60000);

    return () => clearInterval(interval);
  }, []);

  // Create a function to ensure past dates are disabled
  // This function is called by react-day-picker for each date it renders
  const pastDateDisabled = React.useCallback(
    (date: Date) => {
      // Always use the current today state, not a stale value
      const compareDate = new Date(date);
      compareDate.setHours(0, 0, 0, 0);
      return compareDate.getTime() < today.getTime();
    },
    [today]
  );

  // Combine our past date function with the existing disabled array
  // react-day-picker supports both functions and Date arrays in the disabled prop
  const disabledDates = React.useMemo(() => {
    // Return both the function and the array - react-day-picker will apply both
    return [pastDateDisabled, ...disabled];
  }, [disabled, pastDateDisabled]);

  return (
    <div className="relative overflow-hidden">
      <DayPicker
        mode="range"
        numberOfMonths={isMobile ? 1 : 2}
        selected={selectedRange}
        onSelect={onSelect}
        onMonthChange={onMonthChange}
        disabled={disabledDates}
        fromDate={today}
        fromMonth={today}
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

      <SkeletonLoader isLoading={isLoading} isMirador={isMirador} />
    </div>
  );
};
