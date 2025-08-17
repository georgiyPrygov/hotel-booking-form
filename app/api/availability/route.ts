import { NextRequest, NextResponse } from "next/server";
import { GoogleSheetsAuthOptions, googleSheetsService } from "@/services/googleSheets";

// Helper to get all dates in a month as occupied
function getAllDatesAsOccupied(year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const occupiedDates: number[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    occupiedDates.push(day);
  }
  return occupiedDates;
}

// Helper to find tab by date - OPTIMIZED VERSION
async function findTabForDate(
  year: number,
  month: number,
  spreadsheetId: string,
  authOptions: GoogleSheetsAuthOptions
) {
  return await googleSheetsService.findTabByDate(spreadsheetId, year, month, authOptions);
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  try {
    const dateStr = url.searchParams.get("date");
    if (!dateStr) {
      return NextResponse.json(
        { success: false, error: "Missing required parameter: date (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid date format. Use YYYY-MM-DD.",
        },
        { status: 400 }
      );
    }

    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth() + 1;

    // Calculate next month
    const nextMonthDate = new Date(currentYear, currentMonth, 1); // First day of next month
    const nextYear = nextMonthDate.getFullYear();
    const nextMonth = nextMonthDate.getMonth() + 1;

    const spreadsheetId = process.env.BOOKING_SHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: "BOOKING_SHEET_ID is not configured in environment" },
        { status: 500 }
      );
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Google API key not configured",
        },
        { status: 500 }
      );
    }

    const authOptions: GoogleSheetsAuthOptions = { apiKey };

    // Make parallel requests for both months
    const [currentMonthResult, nextMonthResult] = await Promise.all([
      // Current month request
      (async () => {
        try {
          const tabTitle = await findTabForDate(currentYear, currentMonth, spreadsheetId, authOptions);
          if (tabTitle) {
            const roomData = await googleSheetsService.getRoomAvailabilityOptimized(
              spreadsheetId,
              tabTitle,
              authOptions
            );
            return {
              success: true,
              data: roomData.map(room => ({
                ...room,
                year: currentYear,
                month: currentMonth,
                tabTitle,
              })),
              tabTitle,
              tabFound: true,
            };
          } else {
            // No tab found - create occupied data
            const occupiedDates = getAllDatesAsOccupied(currentYear, currentMonth);
            const roomData = [];
            for (let roomNumber = 1; roomNumber <= 6; roomNumber++) {
              roomData.push({
                roomNumber,
                roomName: `Кімната ${roomNumber}`,
                availableDates: [],
                occupiedDates,
                year: currentYear,
                month: currentMonth,
                tabTitle: null,
              });
            }
            return {
              success: true,
              data: roomData,
              tabTitle: null,
              tabFound: false,
            };
          }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            tabTitle: null,
            tabFound: false,
          };
        }
      })(),

      // Next month request
      (async () => {
        try {
          const tabTitle = await findTabForDate(nextYear, nextMonth, spreadsheetId, authOptions);
          if (tabTitle) {
            const roomData = await googleSheetsService.getRoomAvailabilityOptimized(
              spreadsheetId,
              tabTitle,
              authOptions
            );
            return {
              success: true,
              data: roomData.map(room => ({
                ...room,
                year: nextYear,
                month: nextMonth,
                tabTitle,
              })),
              tabTitle,
              tabFound: true,
            };
          } else {
            // No tab found - create occupied data
            const occupiedDates = getAllDatesAsOccupied(nextYear, nextMonth);
            const roomData = [];
            for (let roomNumber = 1; roomNumber <= 6; roomNumber++) {
              roomData.push({
                roomNumber,
                roomName: `Кімната ${roomNumber}`,
                availableDates: [],
                occupiedDates,
                year: nextYear,
                month: nextMonth,
                tabTitle: null,
              });
            }
            return {
              success: true,
              data: roomData,
              tabTitle: null,
              tabFound: false,
            };
          }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            tabTitle: null,
            tabFound: false,
          };
        }
      })(),
    ]);

    // Check if both requests were successful
    if (!currentMonthResult.success || !nextMonthResult.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            `Failed to fetch data: ${currentMonthResult.success ? "" : "Current month error: " + currentMonthResult.error} ${nextMonthResult.success ? "" : "Next month error: " + nextMonthResult.error}`.trim(),
        },
        { status: 500 }
      );
    }

    // Combine results
    const combinedData = [...(currentMonthResult.data || []), ...(nextMonthResult.data || [])];

    return NextResponse.json({
      success: true,
      data: combinedData,
      meta: {
        spreadsheetId,
        currentMonth: {
          year: currentYear,
          month: currentMonth,
          tabTitle: currentMonthResult.tabTitle,
          tabFound: currentMonthResult.tabFound,
        },
        nextMonth: {
          year: nextYear,
          month: nextMonth,
          tabTitle: nextMonthResult.tabTitle,
          tabFound: nextMonthResult.tabFound,
        },
        requestedDate: dateStr,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" ? (error as Error).message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
