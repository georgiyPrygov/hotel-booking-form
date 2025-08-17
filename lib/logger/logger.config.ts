export interface LoggerConfig {
  level: string;
  prettyPrint: boolean;
  redactSensitiveData: boolean;
  enableRequestLogging: boolean;
  enableErrorLogging: boolean;
  enablePerformanceLogging: boolean;
}

// Environment-based configuration
const getLoggerConfig = (): LoggerConfig => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isProduction = process.env.NODE_ENV === "production";
  const isTest = process.env.NODE_ENV === "test";

  // Base configuration
  const baseConfig: LoggerConfig = {
    level: process.env.LOG_LEVEL || "info",
    prettyPrint: false,
    redactSensitiveData: isProduction,
    enableRequestLogging: !isTest,
    enableErrorLogging: true,
    enablePerformanceLogging: isProduction,
  };

  // Environment-specific overrides
  if (isDevelopment) {
    return {
      ...baseConfig,
      level: "debug",
      prettyPrint: false,
      redactSensitiveData: false,
      enableRequestLogging: true,
      enablePerformanceLogging: false,
    };
  }

  if (isProduction) {
    return {
      ...baseConfig,
      level: "info",
      prettyPrint: false,
      redactSensitiveData: true,
      enableRequestLogging: true,
      enablePerformanceLogging: true,
    };
  }

  if (isTest) {
    return {
      ...baseConfig,
      level: "error",
      prettyPrint: false,
      redactSensitiveData: false,
      enableRequestLogging: false,
      enableErrorLogging: true,
      enablePerformanceLogging: false,
    };
  }

  return baseConfig;
};

// Validate log level
const validateLogLevel = (level: string): boolean => {
  const validLevels = ["fatal", "error", "warn", "info", "debug", "trace"];
  return validLevels.includes(level);
};

// Get validated configuration
export const loggerConfig = (): LoggerConfig => {
  const config = getLoggerConfig();

  if (!validateLogLevel(config.level)) {
    console.warn(`Invalid log level: ${config.level}. Defaulting to 'info'`);
    config.level = "info";
  }

  return config;
};

// Export configuration for direct use
export default loggerConfig();
