import { app } from 'electron';
import path from 'path';
import fs from 'fs';

export const logsDir = path.join(app.getPath('userData'), 'logs');
export const logsFilePath = path.join(logsDir, 'errors.log');

export function ensureLogsDirectoryExists(): void {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

export interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  category: 'api' | 'parsing' | 'storage' | 'generation' | 'general';
  message: string;
  details?: unknown;
}

export function logError(entry: Omit<LogEntry, 'timestamp' | 'level'>): void {
  ensureLogsDirectoryExists();
  
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    ...entry,
  };

  const logLine = JSON.stringify(logEntry) + '\n';

  try {
    fs.appendFileSync(logsFilePath, logLine, 'utf8');
    console.error(`[LOG] ${logEntry.category.toUpperCase()}: ${logEntry.message}`, logEntry.details || '');
  } catch (err) {
    console.error('[LOGGER] Failed to write to log file:', err);
  }
}

export function logWarn(entry: Omit<LogEntry, 'timestamp' | 'level'>): void {
  ensureLogsDirectoryExists();
  
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'warn',
    ...entry,
  };

  const logLine = JSON.stringify(logEntry) + '\n';

  try {
    fs.appendFileSync(logsFilePath, logLine, 'utf8');
    console.warn(`[LOG] ${logEntry.category.toUpperCase()}: ${logEntry.message}`, logEntry.details || '');
  } catch (err) {
    console.error('[LOGGER] Failed to write to log file:', err);
  }
}

export function logInfo(entry: Omit<LogEntry, 'timestamp' | 'level'>): void {
  ensureLogsDirectoryExists();
  
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'info',
    ...entry,
  };

  const logLine = JSON.stringify(logEntry) + '\n';

  try {
    fs.appendFileSync(logsFilePath, logLine, 'utf8');
    console.log(`[LOG] ${logEntry.category.toUpperCase()}: ${logEntry.message}`, logEntry.details || '');
  } catch (err) {
    console.error('[LOGGER] Failed to write to log file:', err);
  }
}

export function getLogs(): string {
  try {
    if (fs.existsSync(logsFilePath)) {
      return fs.readFileSync(logsFilePath, 'utf8');
    }
    return 'No logs available.';
  } catch (err) {
    return `Failed to read logs: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export function clearLogs(): void {
  try {
    if (fs.existsSync(logsFilePath)) {
      fs.unlinkSync(logsFilePath);
    }
  } catch (err) {
    console.error('[LOGGER] Failed to clear logs:', err);
  }
}
