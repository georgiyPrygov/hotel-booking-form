import { NextRequest, NextResponse } from "next/server";
import { googleSheetsService } from "@/services/googleSheets";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    const spreadsheetId = url.searchParams.get("spreadsheetId");

    switch (action) {
      case "stats":
        const stats = googleSheetsService.getCacheStats();
        return NextResponse.json({
          success: true,
          data: stats,
        });

      case "clear":
        if (spreadsheetId) {
          googleSheetsService.clearCache(spreadsheetId);
          return NextResponse.json({
            success: true,
            message: `Cache cleared for spreadsheet: ${spreadsheetId}`,
          });
        } else {
          googleSheetsService.clearCache();
          return NextResponse.json({
            success: true,
            message: "All cache cleared",
          });
        }

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid action. Use 'stats' or 'clear'",
            availableActions: {
              stats: "GET /api/cache?action=stats - Get cache statistics",
              clear: "GET /api/cache?action=clear - Clear all cache",
              clearSpecific: "GET /api/cache?action=clear&spreadsheetId=ID - Clear specific spreadsheet cache",
            },
          },
          { status: 400 }
        );
    }
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
