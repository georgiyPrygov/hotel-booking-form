import { DateRange } from "react-day-picker";
import { minimumStayPeriods } from "@/data/stayRulesConfig";
import { MinimumStayViolation } from "@/types/availability";
import { getStayNightDates, isDateWithinInclusiveRange } from "./roomPricing";

export const isStayRangeComplete = (dateRange: Pick<DateRange, "from" | "to">): boolean => {
  if (!dateRange.from || !dateRange.to) return false;
  return dateRange.to.getTime() !== dateRange.from.getTime();
};

export const countStayNightsWithinPeriod = (
  checkIn: Date,
  checkOut: Date,
  periodStart: string,
  periodEnd: string
): number => {
  return getStayNightDates(checkIn, checkOut).filter(night =>
    isDateWithinInclusiveRange(night, periodStart, periodEnd)
  ).length;
};

export const getMinimumStayViolation = (
  dateRange: Pick<DateRange, "from" | "to">
): MinimumStayViolation | null => {
  if (!isStayRangeComplete(dateRange) || !dateRange.from || !dateRange.to) {
    return null;
  }

  for (const period of minimumStayPeriods) {
    const nightsInPeriod = countStayNightsWithinPeriod(
      dateRange.from,
      dateRange.to,
      period.start,
      period.end
    );

    if (nightsInPeriod > 0 && nightsInPeriod < period.minNights) {
      return { period, nightsInPeriod };
    }
  }

  return null;
};
