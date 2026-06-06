/**
 * Centralized logger service dengan rotation dan memory efficiency
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
  stack?: string;
}

interface LoggerConfig {
  level: LogLevel;
  dir: string;
  maxSizeMb: number;
  maxFiles: number;
}

class Logger {
  private config: LoggerConfig;
  private currentLogFile: string = '';
  private logBuffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly BUFFER_SIZE = 50;
  private readonly FLUSH_INTERVAL_MS = 5000;
  private levelMap = {
    [LogLevel.DEBUG]: 'DEBUG',
    [LogLevel.INFO]: 'INFO',
    [LogLevel.WARN]: 'WARN',
    [LogLevel.ERROR]: 'ERROR',
    [LogLevel.CRITICAL]: 'CRITICAL',
  };

  constructor(config: LoggerConfig) {
    this.config = config;
    this.initialize();
  }

  private async initialize() {
    try {
      await mkdir(this.config.dir, { recursive: true });
      this.currentLogFile = path.join(
        this.config.dir,
        `trading-bot-${new Date().toISOString().split('T')[0]}.log`
      );
      await this.checkAndRotateLogs();
      this.startFlushInterval();
    } catch (error) {
      console.error('Logger initialization failed:', error);
    }
  }

  private startFlushInterval() {
    if (this.flushInterval) clearInterval(this.flushInterval);
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL_MS);
  }

  private async checkAndRotateLogs() {
    try {
      const files = fs
        .readdirSync(this.config.dir)
        .filter((f) => f.startsWith('trading-bot-'))
        .sort()
        .reverse();

      if (files.length > this.config.maxFiles) {
        for (let i = this.config.maxFiles; i < files.length; i++) {
          fs.unlinkSync(path.join(this.config.dir, files[i]));
        }
      }

      if (fs.existsSync(this.currentLogFile)) {
        const stats = fs.statSync(this.currentLogFile);
        const sizeMb = stats.size / (1024 * 1024);

        if (sizeMb > this.config.maxSizeMb) {
          const timestamp = new Date().toISOString().replace(/:/g, '-');
          const rotatedName = `trading-bot-${timestamp}.log`;
          fs.renameSync(
            this.currentLogFile,
            path.join(this.config.dir, rotatedName)
          );
          this.currentLogFile = path.join(
            this.config.dir,
            `trading-bot-${new Date().toISOString().split('T')[0]}.log`
          );
        }
      }
    } catch (error) {
      console.error('Log rotation failed:', error);
    }
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    stack?: string
  ): LogEntry {
    return {
      timestamp: this.formatTimestamp(),
      level: this.levelMap[level],
      message,
      context,
      stack,
    };
  }

  private async writeToFile(entry: LogEntry) {
    try {
      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.currentLogFile, logLine);

      if (this.logBuffer.length % 10 === 0) {
        await this.checkAndRotateLogs();
      }
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  debug(message: string, context?: Record<string, any>) {
    if (this.config.level <= LogLevel.DEBUG) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  info(message: string, context?: Record<string, any>) {
    if (this.config.level <= LogLevel.INFO) {
      this.log(LogLevel.INFO, message, context);
    }
  }

  warn(message: string, context?: Record<string, any>) {
    if (this.config.level <= LogLevel.WARN) {
      this.log(LogLevel.WARN, message, context);
    }
  }

  error(message: string, error?: Error | Record<string, any>, context?: Record<string, any>) {
    if (this.config.level <= LogLevel.ERROR) {
      const stack = error instanceof Error ? error.stack : undefined;
      const ctx = error instanceof Error ? context : error;
      this.log(LogLevel.ERROR, message, ctx, stack);
    }
  }

  critical(message: string, error?: Error | Record<string, any>) {
    this.log(
      LogLevel.CRITICAL,
      message,
      error instanceof Error ? {} : error,
      error instanceof Error ? error.stack : undefined
    );
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    stack?: string
  ) {
    const entry = this.createLogEntry(level, message, context, stack);
    this.logBuffer.push(entry);

    // Console output
    const consoleMsg = `[${entry.timestamp}] ${entry.level}: ${message}`;
    if (level === LogLevel.ERROR || level === LogLevel.CRITICAL) {
      console.error(consoleMsg, entry.context || '');
    } else {
      console.log(consoleMsg);
    }

    // Auto-flush if buffer is full
    if (this.logBuffer.length >= this.BUFFER_SIZE) {
      this.flush();
    }
  }

  private flush() {
    if (this.logBuffer.length === 0) return;

    const entriesToWrite = this.logBuffer.splice(0, this.logBuffer.length);
    entriesToWrite.forEach((entry) => {
      this.writeToFile(entry);
    });
  }

  async shutdown() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

let loggerInstance: Logger | null = null;

export function initializeLogger(config: LoggerConfig): Logger {
  if (loggerInstance) return loggerInstance;
  loggerInstance = new Logger(config);
  return loggerInstance;
}

export function getLogger(): Logger {
  if (!loggerInstance) {
    throw new Error('Logger not initialized. Call initializeLogger first.');
  }
  return loggerInstance;
}

export async function shutdownLogger() {
  if (loggerInstance) {
    await loggerInstance.shutdown();
    loggerInstance = null;
  }
}
