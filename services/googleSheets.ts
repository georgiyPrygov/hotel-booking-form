import { google } from "googleapis";
import logger, { logError } from "@/lib/logger/logger";

// Google Sheets API configuration
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

// Interface for sheet information
export interface SheetInfo {
  sheetId: number;
  title: string;
  index: number;
  gridProperties?: {
    rowCount: number;
    columnCount: number;
  };
}

// Interface for month tab information
export interface MonthTabInfo {
  sheetId: number;
  title: string;
  index: number;
  year: number;
  month: number;
  monthName: string;
  isCurrentMonth: boolean;
}

// Interface for API response
export interface SheetsApiResponse {
  success: boolean;
  data?: {
    sheets: SheetInfo[];
    monthTabs: MonthTabInfo[];
    totalSheets: number;
    totalMonthTabs: number;
  };
  error?: string;
}

// Interface for authentication options
export interface GoogleSheetsAuthOptions {
  apiKey: string; // API key for read-only access
}

// Cache interface for storing parsed tabs
interface TabCache {
  spreadsheetId: string;
  tabs: SheetInfo[];
  monthTabs: MonthTabInfo[];
  timestamp: number;
  expiresAt: number;
}

// In-memory cache (in production, consider using Redis or similar)
const tabCache = new Map<string, TabCache>();

// Cache duration: 24 hours in milliseconds
const CACHE_DURATION = 24 * 60 * 60 * 1000;

class GoogleSheetsService {
  private auth: any;
  private sheets: any;

  constructor() {
    // Initialize without auth - will be set when needed
  }

  /**
   * Initialize authentication with API key
   */
  private initializeAuth(authOptions: GoogleSheetsAuthOptions) {
    try {
      if (!authOptions.apiKey) {
        throw new Error("API key is required for Google Sheets authentication");
      }

      // Use API key authentication for read-only access
      this.auth = new google.auth.GoogleAuth({
        apiKey: authOptions.apiKey,
        scopes: SCOPES,
      });

      this.sheets = google.sheets({ version: "v4", auth: this.auth });
      logger.info("Google Sheets service initialized successfully with API key");
    } catch (error) {
      logError(error as Error, { context: "GoogleSheetsService.initializeAuth" });
      throw new Error("Failed to initialize Google Sheets authentication");
    }
  }

  /**
   * Get cached tabs or fetch and cache them
   */
  private async getCachedTabs(
    spreadsheetId: string,
    authOptions: GoogleSheetsAuthOptions
  ): Promise<{
    tabs: SheetInfo[];
    monthTabs: MonthTabInfo[];
  }> {
    const cacheKey = `${spreadsheetId}_${authOptions.apiKey.slice(0, 8)}`; // Use part of API key for cache key
    const now = Date.now();

    // Check if we have valid cached data
    const cached = tabCache.get(cacheKey);
    if (cached && cached.expiresAt > now && cached.spreadsheetId === spreadsheetId) {
      logger.info("Using cached tabs data", {
        spreadsheetId,
        cachedTabs: cached.tabs.length,
        cachedMonthTabs: cached.monthTabs.length,
        cacheAge: `${Math.round((now - cached.timestamp) / 1000 / 60)} minutes`,
      });
      return {
        tabs: cached.tabs,
        monthTabs: cached.monthTabs,
      };
    }

    // Fetch fresh data
    logger.info("Fetching fresh tabs data", { spreadsheetId });
    this.initializeAuth(authOptions);

    const response = await this.sheets.spreadsheets.get({
      spreadsheetId,
      includeGridData: false, // We only need metadata
    });

    const rawSheets = response.data.sheets || [];
    const tabs: SheetInfo[] = rawSheets.map((sheet: any) => ({
      sheetId: sheet.properties?.sheetId || 0,
      title: sheet.properties?.title || "",
      index: sheet.properties?.index || 0,
      gridProperties: sheet.properties?.gridProperties
        ? {
            rowCount: sheet.properties.gridProperties.rowCount || 0,
            columnCount: sheet.properties.gridProperties.columnCount || 0,
          }
        : undefined,
    }));

    const monthTabs = this.extractMonthTabs(tabs);

    // Cache the data
    const cacheData: TabCache = {
      spreadsheetId,
      tabs,
      monthTabs,
      timestamp: now,
      expiresAt: now + CACHE_DURATION,
    };

    tabCache.set(cacheKey, cacheData);

    // Clean up old cache entries (keep only last 10 entries)
    if (tabCache.size > 10) {
      const entries = Array.from(tabCache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      const toDelete = entries.slice(10);
      toDelete.forEach(([key]) => tabCache.delete(key));
    }

    logger.info("Cached fresh tabs data", {
      spreadsheetId,
      totalTabs: tabs.length,
      monthTabs: monthTabs.length,
      cacheExpiresAt: new Date(cacheData.expiresAt).toISOString(),
    });

    return { tabs, monthTabs };
  }

  /**
   * Clear cache for a specific spreadsheet (useful for testing or manual refresh)
   */
  static clearCache(spreadsheetId?: string): void {
    if (spreadsheetId) {
      // Clear specific spreadsheet cache
      const keysToDelete = Array.from(tabCache.keys()).filter(key => key.startsWith(spreadsheetId));
      keysToDelete.forEach(key => tabCache.delete(key));
      logger.info("Cleared cache for specific spreadsheet", { spreadsheetId });
    } else {
      // Clear all cache
      tabCache.clear();
      logger.info("Cleared all tabs cache");
    }
  }

  /**
   * Get cache statistics (useful for monitoring)
   */
  static getCacheStats(): {
    size: number;
    entries: Array<{ spreadsheetId: string; age: number; expiresIn: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(tabCache.entries()).map(([key, data]) => ({
      spreadsheetId: data.spreadsheetId,
      age: Math.round((now - data.timestamp) / 1000 / 60), // minutes
      expiresIn: Math.round((data.expiresAt - now) / 1000 / 60), // minutes
    }));

    return {
      size: tabCache.size,
      entries,
    };
  }

  /**
   * Get all sheets and tabs from a Google Spreadsheet (now uses cache)
   */
  async getSheetsInfo(spreadsheetId: string, authOptions: GoogleSheetsAuthOptions): Promise<SheetsApiResponse> {
    const startTime = Date.now();

    try {
      logger.info("Getting sheets information (with cache)", { spreadsheetId });

      // Use cached tabs or fetch fresh data
      const { tabs: sheets, monthTabs } = await this.getCachedTabs(spreadsheetId, authOptions);

      const duration = Date.now() - startTime;
      logger.info("Successfully retrieved sheets information", {
        spreadsheetId,
        totalSheets: sheets.length,
        totalMonthTabs: monthTabs.length,
        duration: `${duration}ms`,
        cacheUsed: duration < 100, // If response time is very fast, likely from cache
      });

      return {
        success: true,
        data: {
          sheets,
          monthTabs,
          totalSheets: sheets.length,
          totalMonthTabs: monthTabs.length,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(error as Error, {
        context: "GoogleSheetsService.getSheetsInfo",
        spreadsheetId,
        duration: `${duration}ms`,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Get month tabs for a specific year
   */
  async getMonthTabs(
    spreadsheetId: string,
    year: number,
    authOptions: GoogleSheetsAuthOptions
  ): Promise<SheetsApiResponse> {
    try {
      const allSheets = await this.getSheetsInfo(spreadsheetId, authOptions);

      if (!allSheets.success || !allSheets.data) {
        return allSheets;
      }

      const yearMonthTabs = allSheets.data.monthTabs.filter(tab => tab.year === year);

      logger.info("Filtered month tabs by year", {
        spreadsheetId,
        year,
        monthTabsCount: yearMonthTabs.length,
      });

      return {
        success: true,
        data: {
          sheets: allSheets.data.sheets,
          monthTabs: yearMonthTabs,
          totalSheets: allSheets.data.totalSheets,
          totalMonthTabs: yearMonthTabs.length,
        },
      };
    } catch (error) {
      logError(error as Error, {
        context: "GoogleSheetsService.getMonthTabs",
        spreadsheetId,
        year,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Optimized method to find a specific tab using cached data
   */
  async findTabByDate(
    spreadsheetId: string,
    year: number,
    month: number,
    authOptions: GoogleSheetsAuthOptions
  ): Promise<string | null> {
    // Ukrainian month names mapping
    const ukrainianMonths = [
      "січень",
      "лютий",
      "березень",
      "квітень",
      "травень",
      "червень",
      "липень",
      "серпень",
      "вересень",
      "жовтень",
      "листопад",
      "грудень",
    ];

    const ukrMonth = ukrainianMonths[month - 1];
    const tabSearch = `${ukrMonth} ${year}`;

    // Use cached tabs instead of making a new API call
    const { tabs: sheets } = await this.getCachedTabs(spreadsheetId, authOptions);

    // Find the tab with case-insensitive, trimmed comparison
    const tab = sheets.find((sheet: SheetInfo) => {
      if (!sheet.title) return false;

      const normalizedTitle = sheet.title.toLowerCase().trim();
      const normalizedSearch = tabSearch.toLowerCase().trim();

      return normalizedTitle.includes(normalizedSearch);
    });

    return tab?.title || null;
  }

  /**
   * Extract month tabs from sheets and parse their information
   */
  private extractMonthTabs(sheets: SheetInfo[]): MonthTabInfo[] {
    const monthTabs: MonthTabInfo[] = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Ukrainian month names mapping
    const ukrainianMonths: { [key: string]: number } = {
      січень: 1,
      лютий: 2,
      березень: 3,
      квітень: 4,
      травень: 5,
      червень: 6,
      липень: 7,
      серпень: 8,
      вересень: 9,
      жовтень: 10,
      листопад: 11,
      грудень: 12,
    };

    // English month names mapping
    const englishMonths: { [key: string]: number } = {
      january: 1,
      february: 2,
      march: 3,
      april: 4,
      may: 5,
      june: 6,
      july: 7,
      august: 8,
      september: 9,
      october: 10,
      november: 11,
      december: 12,
    };

    for (const sheet of sheets) {
      // Skip sheets without titles
      if (!sheet.title || typeof sheet.title !== "string") {
        logger.debug("Skipping sheet without valid title", {
          sheetId: sheet.sheetId,
          title: sheet.title,
        });
        continue;
      }

      const title = sheet.title.toLowerCase().trim();

      // Skip empty titles after trimming
      if (!title) {
        logger.debug("Skipping sheet with empty title", { sheetId: sheet.sheetId });
        continue;
      }

      // Try to parse different formats
      let year: number | null = null;
      let month: number | null = null;
      let monthName = "";

      // Format 1: "Лютий 2025" (Ukrainian)
      const ukrainianMatch = title.match(/^([а-яіїє]+)\s+(\d{4})$/);
      if (ukrainianMatch) {
        const [, monthStr, yearStr] = ukrainianMatch;
        month = ukrainianMonths[monthStr];
        year = parseInt(yearStr);
        monthName = monthStr;
      }

      // Format 2: "2025-02" (ISO format)
      const isoMatch = title.match(/^(\d{4})-(\d{1,2})$/);
      if (isoMatch) {
        const [, yearStr, monthStr] = isoMatch;
        year = parseInt(yearStr);
        month = parseInt(monthStr);
        monthName = this.getMonthName(month);
      }

      // Format 3: "2025-02-Лютий" (ISO + Ukrainian)
      const isoUkrainianMatch = title.match(/^(\d{4})-(\d{1,2})-([а-яіїє]+)$/);
      if (isoUkrainianMatch) {
        const [, yearStr, monthStr, monthNameStr] = isoUkrainianMatch;
        year = parseInt(yearStr);
        month = parseInt(monthStr);
        monthName = monthNameStr;
      }

      // Format 4: "February 2025" (English)
      const englishMatch = title.match(/^([a-z]+)\s+(\d{4})$/);
      if (englishMatch) {
        const [, monthStr, yearStr] = englishMatch;
        month = englishMonths[monthStr];
        year = parseInt(yearStr);
        monthName = monthStr;
      }

      if (year && month && month >= 1 && month <= 12) {
        const isCurrentMonth = year === currentYear && month === currentMonth;

        monthTabs.push({
          sheetId: sheet.sheetId,
          title: sheet.title,
          index: sheet.index,
          year,
          month,
          monthName,
          isCurrentMonth,
        });
      }
    }

    // Sort by year and month
    monthTabs.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    logger.debug("Extracted month tabs", {
      totalMonthTabs: monthTabs.length,
      tabs: monthTabs.map(tab => `${tab.title} (${tab.year}-${tab.month})`),
    });

    return monthTabs;
  }

  /**
   * Get month name by number
   */
  private getMonthName(month: number): string {
    const monthNames = [
      "січень",
      "лютий",
      "березень",
      "квітень",
      "травень",
      "червень",
      "липень",
      "серпень",
      "вересень",
      "жовтень",
      "листопад",
      "грудень",
    ];
    return monthNames[month - 1] || "";
  }

  /**
   * Validate spreadsheet ID format
   */
  static validateSpreadsheetId(spreadsheetId: string): boolean {
    // Google Sheets ID format: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
    const spreadsheetIdPattern = /^[a-zA-Z0-9-_]+$/;
    return spreadsheetIdPattern.test(spreadsheetId) && spreadsheetId.length > 20;
  }

  /**
   * Get room availability for a given month tab
   * Returns: Array<{ roomName: string, emptyDates: number[] }>
   */
  async getRoomAvailability(
    spreadsheetId: string,
    tabTitle: string,
    authOptions: GoogleSheetsAuthOptions
  ): Promise<{ roomName: string; emptyDates: number[] }[] | null> {
    this.initializeAuth(authOptions);

    // Fetch the sheet metadata to get the sheetId
    const metaRes = await this.sheets.spreadsheets.get({
      spreadsheetId,
      includeGridData: false,
    });
    const sheet = (metaRes.data.sheets || []).find(
      (s: any) => s.properties && s.properties.title.trim() === tabTitle.trim()
    );
    if (!sheet) return null;
    const sheetId = sheet.properties.sheetId;

    // Determine the range (A4:AF11 for 31 days, adjust for other months)
    // We'll use the gridProperties.columnCount to determine the last column
    const colCount = sheet.properties.gridProperties?.columnCount || 32;
    // AF = 32nd column, but we want up to the last day (e.g., 29, 30, 31, or 32)
    // We'll cap at AF (32) for safety
    const lastCol = Math.min(colCount, 32);
    const colLetter = String.fromCharCode("A".charCodeAt(0) + lastCol - 1); // e.g., AF
    const range = `${tabTitle}!A4:${colLetter}11`;

    // Fetch grid data for the range
    const res = await this.sheets.spreadsheets.get({
      spreadsheetId,
      ranges: [range],
      includeGridData: true,
    });
    const grid = res.data.sheets?.[0]?.data?.[0]?.rowData;
    if (!grid) return null;

    // Room rows: 0-2 (A4:A6), 4-7 (A8:A11)
    const roomRows = [0, 1, 2, 4, 5, 6, 7];
    const result: { roomName: string; emptyDates: number[] }[] = [];

    for (const rowIdx of roomRows) {
      const row = grid[rowIdx];
      if (!row || !row.values || !row.values[0] || !row.values[0].formattedValue) continue;
      const roomName = row.values[0].formattedValue;
      const emptyDates: number[] = [];
      // Check columns 1 to lastCol-1 (B to last day)
      for (let col = 1; col < lastCol; col++) {
        const cell = row.values[col];
        // If cell is missing or has white background
        const bg = cell?.effectiveFormat?.backgroundColor;
        const isWhite = !bg || ((bg.red ?? 1) === 1 && (bg.green ?? 1) === 1 && (bg.blue ?? 1) === 1);
        if (isWhite) {
          emptyDates.push(col); // 1-based: B=1, C=2, ...
        }
      }
      result.push({ roomName, emptyDates });
    }
    return result;
  }

  /**
   * Get cell backgrounds for a given tab and range
   * Returns: [{ cell: true/false }, ...] where true = white, false = colored
   */
  async getTabCellBackgrounds(
    spreadsheetId: string,
    tabTitle: string,
    range: string,
    authOptions: GoogleSheetsAuthOptions
  ): Promise<{ [cell: string]: boolean }[]> {
    this.initializeAuth(authOptions);
    const res = await this.sheets.spreadsheets.get({
      spreadsheetId,
      ranges: [`${tabTitle}!${range}`],
      includeGridData: true,
    });
    const grid = res.data.sheets?.[0]?.data?.[0]?.rowData;
    if (!grid) return [];

    // Parse range like B4:AC6
    const match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
    if (!match) return [];
    const [, startCol, startRow, endCol, endRow] = match;
    const colToIdx = (col: string) => col.split("").reduce((acc, c) => acc * 26 + (c.charCodeAt(0) - 64), 0) - 1;
    const startColIdx = colToIdx(startCol);
    const endColIdx = colToIdx(endCol);
    const startRowIdx = parseInt(startRow, 10) - 1;
    const endRowIdx = parseInt(endRow, 10) - 1;

    const result: { [cell: string]: boolean }[] = [];
    for (let r = startRowIdx; r <= endRowIdx; r++) {
      const row = grid[r - startRowIdx];
      if (!row || !row.values) continue;
      for (let c = startColIdx; c <= endColIdx; c++) {
        const cell = row.values[c - startColIdx];
        const colLetter = String.fromCharCode(
          ...Array.from(
            { length: (c + 1).toString(26).length },
            (_, i) => (Math.floor(c / Math.pow(26, (c + 1).toString(26).length - i - 1)) % 26) + 65
          )
        );
        const cellName = `${colLetter}${r + 1}`;
        const bg = cell?.effectiveFormat?.backgroundColor;
        const isWhite = !bg || ((bg.red ?? 1) === 1 && (bg.green ?? 1) === 1 && (bg.blue ?? 1) === 1);
        result.push({ [cellName]: isWhite });
      }
    }
    return result;
  }

  /**
   * Get room availability with room names and dates
   * Returns: [{ roomNumber: number, roomName: string, availableDates: number[], occupiedDates: number[] }]
   */
  async getRoomAvailabilityWithNames(
    spreadsheetId: string,
    tabTitle: string,
    authOptions: GoogleSheetsAuthOptions
  ): Promise<{ roomNumber: number; roomName: string; availableDates: number[]; occupiedDates: number[] }[]> {
    this.initializeAuth(authOptions);

    // Extract year and month from tab title to calculate days in month
    const { year, month } = this.parseTabTitle(tabTitle);
    const daysInMonth = new Date(year, month, 0).getDate(); // Get number of days in the month

    // Calculate column range: A (room names) + B to ? (dates)
    // B=1st day, C=2nd day, etc.
    const lastColumnIndex = daysInMonth + 1; // +1 because A=0, B=1, C=2, etc.
    const lastColumnLetter = this.getColumnLetter(lastColumnIndex);

    // Get room names from both ranges: A4:A6 and A8:A10
    const roomNamesRange1 = `${tabTitle}!A4:A6`;
    const roomNamesRange2 = `${tabTitle}!A8:A10`;
    const cellBackgroundsRange1 = `${tabTitle}!B4:${lastColumnLetter}6`;
    const cellBackgroundsRange2 = `${tabTitle}!B8:${lastColumnLetter}10`;

    // Fetch room names from both ranges
    const [roomNamesRes1, roomNamesRes2, cellBackgroundsRes1, cellBackgroundsRes2] = await Promise.all([
      this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: roomNamesRange1,
      }),
      this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: roomNamesRange2,
      }),
      this.sheets.spreadsheets.get({
        spreadsheetId,
        ranges: [cellBackgroundsRange1],
        includeGridData: true,
      }),
      this.sheets.spreadsheets.get({
        spreadsheetId,
        ranges: [cellBackgroundsRange2],
        includeGridData: true,
      }),
    ]);

    const roomNames1 = roomNamesRes1.data.values || [];
    const roomNames2 = roomNamesRes2.data.values || [];
    const grid1 = cellBackgroundsRes1.data.sheets?.[0]?.data?.[0]?.rowData;
    const grid2 = cellBackgroundsRes2.data.sheets?.[0]?.data?.[0]?.rowData;

    const result: { roomNumber: number; roomName: string; availableDates: number[]; occupiedDates: number[] }[] = [];

    // Helper function to check if background is white
    const isWhiteBackground = (backgroundColor: any): boolean => {
      if (!backgroundColor) return true; // No background color = white

      const r = backgroundColor.red ?? 0;
      const g = backgroundColor.green ?? 0;
      const b = backgroundColor.blue ?? 0;

      // Check if all components are 1 (white) or all are 0 (also treated as white/default)
      return (r === 1 && g === 1 && b === 1) || (r === 0 && g === 0 && b === 0);
    };

    // Helper function to process room data
    const processRoomData = (roomNames: any[][], grid: any[], startRoomNumber: number) => {
      if (!grid) return;

      for (let roomIndex = 0; roomIndex < Math.min(roomNames.length, 3); roomIndex++) {
        const roomName = roomNames[roomIndex]?.[0] || `Room ${startRoomNumber + roomIndex}`;
        const roomNumber = startRoomNumber + roomIndex;
        const availableDates: number[] = [];
        const occupiedDates: number[] = [];

        const row = grid[roomIndex];
        if (row && row.values) {
          // Check each column up to the number of days in the month
          for (let colIndex = 0; colIndex < Math.min(row.values.length, daysInMonth); colIndex++) {
            const cell = row.values[colIndex];
            const date = colIndex + 1; // B=1, C=2, D=3, etc.

            // Check background color using effectiveFormat first, then userEnteredFormat
            const effectiveBg = cell?.effectiveFormat?.backgroundColor;
            const userBg = cell?.userEnteredFormat?.backgroundColor;
            const backgroundColor = effectiveBg || userBg;

            if (isWhiteBackground(backgroundColor)) {
              availableDates.push(date);
            } else {
              occupiedDates.push(date);
            }
          }
        }

        result.push({
          roomNumber,
          roomName,
          availableDates: availableDates.sort((a, b) => a - b),
          occupiedDates: occupiedDates.sort((a, b) => a - b),
        });
      }
    };

    // Process first set of rooms (A4:A6) - room numbers 1-3
    processRoomData(roomNames1, grid1, 1);

    // Process second set of rooms (A8:A10) - room numbers 4-6
    processRoomData(roomNames2, grid2, 4);

    return result;
  }

  /**
   * Optimized method to get room availability in a single API call
   * This replaces the multiple separate calls in getRoomAvailabilityWithNames
   */
  async getRoomAvailabilityOptimized(
    spreadsheetId: string,
    tabTitle: string,
    authOptions: GoogleSheetsAuthOptions
  ): Promise<{ roomNumber: number; roomName: string; availableDates: number[]; occupiedDates: number[] }[]> {
    this.initializeAuth(authOptions);

    // Extract year and month from tab title to calculate days in month
    const { year, month } = this.parseTabTitle(tabTitle);
    const daysInMonth = new Date(year, month, 0).getDate();

    // Calculate column range: A (room names) + B to ? (dates)
    const lastColumnIndex = daysInMonth + 1;
    const lastColumnLetter = this.getColumnLetter(lastColumnIndex);

    // Single range that includes everything we need: A4:AC10
    const combinedRange = `${tabTitle}!A4:${lastColumnLetter}10`;

    // Single API call to get all data
    const response = await this.sheets.spreadsheets.get({
      spreadsheetId,
      ranges: [combinedRange],
      includeGridData: true,
    });

    const grid = response.data.sheets?.[0]?.data?.[0]?.rowData;
    if (!grid) return [];

    const result: { roomNumber: number; roomName: string; availableDates: number[]; occupiedDates: number[] }[] = [];

    // Helper function to check if background is white
    const isWhiteBackground = (backgroundColor: any): boolean => {
      if (!backgroundColor) return true;
      const r = backgroundColor.red ?? 0;
      const g = backgroundColor.green ?? 0;
      const b = backgroundColor.blue ?? 0;
      return (r === 1 && g === 1 && b === 1) || (r === 0 && g === 0 && b === 0);
    };

    // Process all 6 rooms in one loop
    for (let roomIndex = 0; roomIndex < 6; roomIndex++) {
      const row = grid[roomIndex];
      if (!row || !row.values || !row.values[0] || !row.values[0].formattedValue) continue;

      const roomName = row.values[0].formattedValue;
      const roomNumber = roomIndex + 1;
      const availableDates: number[] = [];
      const occupiedDates: number[] = [];

      // Check each column up to the number of days in the month
      for (let colIndex = 1; colIndex < Math.min(row.values.length, daysInMonth + 1); colIndex++) {
        const cell = row.values[colIndex];
        const date = colIndex; // B=1, C=2, D=3, etc.

        // Check background color using effectiveFormat first, then userEnteredFormat
        const effectiveBg = cell?.effectiveFormat?.backgroundColor;
        const userBg = cell?.userEnteredFormat?.backgroundColor;
        const backgroundColor = effectiveBg || userBg;

        if (isWhiteBackground(backgroundColor)) {
          availableDates.push(date);
        } else {
          occupiedDates.push(date);
        }
      }

      result.push({
        roomNumber,
        roomName,
        availableDates: availableDates.sort((a, b) => a - b),
        occupiedDates: occupiedDates.sort((a, b) => a - b),
      });
    }

    return result;
  }

  /**
   * Helper function to parse tab title and extract year/month
   */
  private parseTabTitle(tabTitle: string): { year: number; month: number } {
    const title = tabTitle.toLowerCase().trim();

    // Ukrainian month names mapping
    const ukrainianMonths: { [key: string]: number } = {
      січень: 1,
      лютий: 2,
      березень: 3,
      квітень: 4,
      травень: 5,
      червень: 6,
      липень: 7,
      серпень: 8,
      вересень: 9,
      жовтень: 10,
      листопад: 11,
      грудень: 12,
    };

    // English month names mapping
    const englishMonths: { [key: string]: number } = {
      january: 1,
      february: 2,
      march: 3,
      april: 4,
      may: 5,
      june: 6,
      july: 7,
      august: 8,
      september: 9,
      october: 10,
      november: 11,
      december: 12,
    };

    // Format 1: "Лютий 2025" (Ukrainian)
    const ukrainianMatch = title.match(/^([а-яіїє]+)\s+(\d{4})$/);
    if (ukrainianMatch) {
      const [, monthStr, yearStr] = ukrainianMatch;
      const month = ukrainianMonths[monthStr];
      const year = parseInt(yearStr);
      if (month && year) return { year, month };
    }

    // Format 2: "2025-02" (ISO format)
    const isoMatch = title.match(/^(\d{4})-(\d{1,2})$/);
    if (isoMatch) {
      const [, yearStr, monthStr] = isoMatch;
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);
      return { year, month };
    }

    // Format 3: "2025-02-Лютий" (ISO + Ukrainian)
    const isoUkrainianMatch = title.match(/^(\d{4})-(\d{1,2})-([а-яіїє]+)$/);
    if (isoUkrainianMatch) {
      const [, yearStr, monthStr] = isoUkrainianMatch;
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);
      return { year, month };
    }

    // Format 4: "February 2025" (English)
    const englishMatch = title.match(/^([a-z]+)\s+(\d{4})$/);
    if (englishMatch) {
      const [, monthStr, yearStr] = englishMatch;
      const month = englishMonths[monthStr];
      const year = parseInt(yearStr);
      if (month && year) return { year, month };
    }

    // Default fallback
    return { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
  }

  /**
   * Helper function to get column letter from index (0=A, 1=B, etc.)
   */
  private getColumnLetter(index: number): string {
    let letter = "";
    let temp = index;
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  }
}

// Export singleton instance
export const googleSheetsService = new GoogleSheetsService();
export default googleSheetsService;
