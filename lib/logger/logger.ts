import pino from "pino";

// Environment-based configuration
const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

// Log level configuration
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info");

// Base configuration
const baseConfig = {
  level: logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label: string) => {
      return { level: label };
    },
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
};

// Development configuration (simple JSON output for Next.js compatibility)
const developmentConfig = {
  ...baseConfig,
  // Use simple JSON output instead of pretty printing to avoid worker thread issues
  transport: undefined,
};

// Production configuration (JSON output)
const productionConfig = {
  ...baseConfig,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers['x-api-key']",
      "password",
      "token",
      "secret",
    ],
    remove: true,
  },
};

// Create logger instance
const logger = pino(isDevelopment ? developmentConfig : productionConfig);

// Export logger instance
export default logger;

// Export log levels for convenience
export const logLevels = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
} as const;

// Export typed logger methods
export type Logger = typeof logger;

// Helper functions for common logging patterns
export const createChildLogger = (context: Record<string, any>) => {
  return logger.child(context);
};

// Request logger helper
export const createRequestLogger = (req: any, res: any) => {
  return logger.child({
    req: {
      id: req.id,
      method: req.method,
      url: req.url,
      headers: req.headers,
    },
    res: {
      statusCode: res.statusCode,
    },
  });
};

// Error logger helper
export const logError = (error: Error, context?: Record<string, any>) => {
  const errorLogger = context ? logger.child(context) : logger;
  errorLogger.error({ err: error }, error.message);
};

// API logger helper
export const logApiRequest = (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  context?: Record<string, any>
) => {
  const apiLogger = context ? logger.child(context) : logger;
  apiLogger.info({
    type: "api_request",
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
  });
};

// Booking form logger helper
export const logBookingEvent = (event: string, bookingData: any, context?: Record<string, any>) => {
  const bookingLogger = context ? logger.child(context) : logger;
  bookingLogger.info({
    type: "booking_event",
    event,
    bookingData,
  });
};
