import { DateRange } from "react-day-picker";
import { RoomPricePeriod, RoomStayPriceSummary } from "../../types/availability";
import { getRoomConfig } from "../../data/roomsConfig";

const parseDateOnly = (iso: string): Date => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const startOfLocalDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const isDateWithinInclusiveRange = (date: Date, start: string, end: string): boolean => {
  const day = startOfLocalDay(date).getTime();
  const startTime = startOfLocalDay(parseDateOnly(start)).getTime();
  const endTime = startOfLocalDay(parseDateOnly(end)).getTime();
  return day >= startTime && day <= endTime;
};

export const isDateWithinPricePeriod = (date: Date, period: RoomPricePeriod): boolean => {
  return isDateWithinInclusiveRange(date, period.start, period.end);
};

/** Stay nights: check-in through the day before checkout (checkout day is not charged). */
export const getStayNightDates = (checkIn: Date, checkOut?: Date): Date[] => {
  const nights: Date[] = [];
  const cursor = startOfLocalDay(checkIn);
  const end =
    checkOut && checkOut.getTime() !== checkIn.getTime()
      ? startOfLocalDay(checkOut)
      : startOfLocalDay(new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate() + 1));

  while (cursor.getTime() < end.getTime()) {
    nights.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return nights;
};

export const getRoomNightlyPrice = (roomNumber: number, date: Date): number | null => {
  const config = getRoomConfig(roomNumber);
  if (!config) return null;

  const period = config.pricePeriods?.find(p => isDateWithinPricePeriod(date, p));
  return period?.price ?? config.price;
};

export const getRoomStayPriceSummary = (
  roomNumber: number,
  dateRange: Pick<DateRange, "from" | "to">
): RoomStayPriceSummary | null => {
  if (!dateRange.from) return null;

  const nights = getStayNightDates(dateRange.from, dateRange.to);
  const nightlyPrices = nights
    .map(night => getRoomNightlyPrice(roomNumber, night))
    .filter((price): price is number => price !== null);

  if (nightlyPrices.length === 0) return null;

  const minNightly = Math.min(...nightlyPrices);
  const maxNightly = Math.max(...nightlyPrices);

  return {
    nightlyPrices,
    total: nightlyPrices.reduce((sum, p) => sum + p, 0),
    nights: nightlyPrices.length,
    perNightUniform: minNightly === maxNightly,
    minNightly,
    maxNightly,
  };
};

export const formatUahPrice = (price: number): string => {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    minimumFractionDigits: 0,
  }).format(price);
};

export const getRoomPriceDisplayLines = (
  roomNumber: number,
  dateRange: Pick<DateRange, "from" | "to">
): { primary: string; secondary?: string } | null => {
  const summary = getRoomStayPriceSummary(roomNumber, dateRange);
  if (!summary) return null;

  if (summary.nights === 1 || summary.perNightUniform) {
    return {
      primary: formatUahPrice(summary.minNightly),
      secondary: "/ ніч для 2х осіб",
    };
  }

  if (summary.nights > 1) {
    return {
      primary: formatUahPrice(summary.total),
      secondary: `за ${summary.nights} ночі (${formatUahPrice(summary.minNightly)} – ${formatUahPrice(summary.maxNightly)} / ніч)`,
    };
  }

  return {
    primary: `${formatUahPrice(summary.minNightly)} – ${formatUahPrice(summary.maxNightly)}`,
    secondary: "/ ніч",
  };
};
