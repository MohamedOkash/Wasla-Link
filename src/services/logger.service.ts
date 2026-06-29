import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { ENV } from '../config/environment';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export type LogCategory = 
  | 'Authentication' 
  | 'Orders' 
  | 'Payments' 
  | 'Wallet' 
  | 'Dispatch' 
  | 'Tracking' 
  | 'System' 
  | 'Performance';

export interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  metadata?: Record<string, any>;
  userId?: string;
}

class LoggerService {
  private collectionRef = collection(db, 'systemLogs');

  private formatConsole(entry: LogEntry) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${entry.level}] [${entry.category}]`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.metadata || '');
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.metadata || '');
        break;
      case LogLevel.WARNING:
        console.warn(prefix, entry.message, entry.metadata || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(prefix, entry.message, entry.metadata || '');
        break;
    }
  }

  private async persistToFirestore(entry: LogEntry) {
    // Only persist WARNING and above in production to save writes
    if (
      (entry.level === LogLevel.WARNING || entry.level === LogLevel.ERROR || entry.level === LogLevel.CRITICAL) 
      && ENV.IS_PROD
    ) {
      try {
        await addDoc(this.collectionRef, {
          ...entry,
          timestamp: serverTimestamp(),
          userAgent: navigator.userAgent
        });
      } catch (err) {
        console.error('Failed to persist log to Firestore', err);
      }
    }
  }

  public log(entry: LogEntry) {
    if (ENV.IS_DEV || entry.level !== LogLevel.DEBUG) {
      this.formatConsole(entry);
    }
    this.persistToFirestore(entry);
  }

  public debug(category: LogCategory, message: string, metadata?: Record<string, any>) {
    this.log({ level: LogLevel.DEBUG, category, message, metadata });
  }

  public info(category: LogCategory, message: string, metadata?: Record<string, any>) {
    this.log({ level: LogLevel.INFO, category, message, metadata });
  }

  public warn(category: LogCategory, message: string, metadata?: Record<string, any>) {
    this.log({ level: LogLevel.WARNING, category, message, metadata });
  }

  public error(category: LogCategory, message: string, metadata?: Record<string, any>) {
    this.log({ level: LogLevel.ERROR, category, message, metadata });
  }

  public critical(category: LogCategory, message: string, metadata?: Record<string, any>) {
    this.log({ level: LogLevel.CRITICAL, category, message, metadata });
  }
}

export const logger = new LoggerService();
