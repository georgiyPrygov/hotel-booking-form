import { MinimumStayPeriod } from "../types/availability";

/**
 * Minimum stay rules for special date ranges.
 * Applies only to charged nights that fall inside [start, end] (inclusive).
 * Nights outside this window (e.g. 29.12 or the night of 03.01) use regular pricing and do not count toward the minimum.
 */
export const minimumStayPeriods: MinimumStayPeriod[] = [
  {
    start: "2026-12-30",
    end: "2027-01-02",
    minNights: 3,
    message:
      "На новорічні дати (30.12.2026 – 02.01.2027) мінімальний термін бронювання — 3 ночі. Будь ласка, оберіть довший період.",
  },
];
