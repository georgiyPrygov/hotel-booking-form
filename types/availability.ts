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

export interface RoomConfig {
  roomNumber: number;
  roomName: string;
  name: string;
  description: string;
  maxPersons: number;
  price: number;
  images: string[];
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
}

export interface AvailableRoomsProps {
  selectedRange: import("react-day-picker").DateRange | undefined;
  availableRooms: RoomInfo[];
  isLoading?: boolean;
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
  onRangeSelect?: (range: DateRange | undefined) => void;
  onGuestsSubmit?: (guests: GuestInfo) => void;
}
