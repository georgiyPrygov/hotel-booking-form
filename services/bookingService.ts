interface BookingData {
  startDate: string;
  endDate: string;
  name: string;
  phone: string;
  adults: number;
  children: number;
  pets: number;
  roomName?: string;
  roomNumber?: number;
  isMirador?: boolean;
}

interface BookingResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    bookingId?: string;
    guestName: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    guests: {
      adults: number;
      children: number;
      pets: number;
      total: number;
    };
  };
}

export class BookingService {
  private static readonly API_ENDPOINT = "/api/booking";

  /**
   * Submit a booking request to the API
   */
  static async submitBooking(bookingData: BookingData): Promise<BookingResponse> {
    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      const result: BookingResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      return result;
    } catch (error) {
      // Handle network errors or API errors
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Format form data for API submission
   */
  static formatBookingData(
    formData: {
      name: string;
      phone: string;
      adults: number;
      children: number;
      dogs: number;
    },
    dateRange: {
      from: Date;
      to: Date;
    },
    roomInfo: {
      roomName: string;
      roomNumber: number;
    },
    isMirador: boolean = false
  ): BookingData {
    // Use timezone-safe date formatting to avoid UTC conversion issues
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return {
      startDate: formatDate(dateRange.from),
      endDate: formatDate(dateRange.to),
      name: formData.name,
      phone: formData.phone,
      adults: formData.adults,
      children: formData.children,
      pets: formData.dogs, // Map dogs to pets for API
      roomName: roomInfo.roomName,
      roomNumber: roomInfo.roomNumber,
      isMirador,
    };
  }

  /**
   * Handle booking submission with user feedback
   */
  static async handleBookingSubmission(
    formData: {
      name: string;
      phone: string;
      adults: number;
      children: number;
      dogs: number;
    },
    dateRange: {
      from: Date;
      to: Date;
    },
    roomInfo: {
      roomName: string;
      roomNumber: number;
    },
    isMirador: boolean = false
  ): Promise<BookingResponse> {
    // Format the booking data
    const bookingData = this.formatBookingData(formData, dateRange, roomInfo, isMirador);

    // Submit the booking
    const result = await this.submitBooking(bookingData);

    return result;
  }
}
