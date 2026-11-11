export interface AvailabilityResponse {
  success: boolean;
  data?: {
    roomNumber: number;
    roomName: string;
    availableDates: number[];
    occupiedDates: number[];
    year: number;
    month: number;
    tabTitle: string | null;
  }[];
  error?: string;
  metadata?: {
    currentMonthTab?: MonthTabInfo | null;
    nextMonthTab?: MonthTabInfo | null;
    totalRooms?: number;
  };
}

export interface RoomInfo {
  roomNumber: number;
  roomName: string;
}

/** Inclusive calendar dates (YYYY-MM-DD) for which `price` applies to each stay night. */
export interface RoomPricePeriod {
  start: string;
  end: string;
  price: number;
}

/** Shared seasonal pricing for multiple rooms — merged into each room's `pricePeriods`. */
export interface SharedRoomPricePeriod {
  start: string;
  end: string;
  prices: Partial<Record<number, number>>;
}

/**
 * If a stay includes any charged night in [start, end], at least `minNights` of those nights are required.
 */
export interface MinimumStayPeriod {
  start: string;
  end: string;
  minNights: number;
  message: string;
}

export interface MinimumStayViolation {
  period: MinimumStayPeriod;
  nightsInPeriod: number;
}

export interface RoomConfig {
  roomNumber: number;
  roomName: string;
  name: string;
  description: string;
  maxPersons: number;
  /** Default nightly price when no `pricePeriods` entry matches. */
  price: number;
  /** Date-specific nightly prices; if several periods match a date, the latest in config wins. */
  pricePeriods?: RoomPricePeriod[];
  images: string[];
}

export interface StayNightPriceLine {
  date: Date;
  price: number;
}

export interface RoomStayPriceSummary {
  nightlyPrices: number[];
  nightlyBreakdown: StayNightPriceLine[];
  total: number;
  nights: number;
  perNightUniform: boolean;
  minNightly: number;
  maxNightly: number;
}

export interface RoomPriceDisplay {
  primary: string;
  secondary?: string;
  /** Shown when nightly rates differ across the stay */
  nightlyLines?: { label: string; price: string }[];
}

export interface MonthTabInfo {
  sheetId: number;
  title: string;
  index: number;
  year: number;
  month: number;
  monthName: string;
  isCurrentMonth: boolean;
}

export interface StayDate {
  year: number;
  month: number;
  day: number;
}

export interface SkeletonLoaderProps {
  isLoading: boolean;
  isMirador?: boolean;
}

export interface AvailableRoomsProps {
  selectedRange: import("react-day-picker").DateRange | undefined;
  availableRooms: RoomInfo[];
  isLoading?: boolean;
  isMirador?: boolean;
}

export interface ImageSliderProps {
  images: string[];
  roomName: string;
}

export interface GuestInfo {
  adults: number;
  children: number;
}

export interface DateRange {
  from: Date;
  to?: Date;
}

export interface DatesPickerProps {
  className?: string;
  isMirador?: boolean;
  onGuestsSubmit?: (guests: GuestInfo) => void;
}
