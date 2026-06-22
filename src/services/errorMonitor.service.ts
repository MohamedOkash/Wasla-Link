import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export type ErrorCategory = 'Runtime' | 'Firestore' | 'Dispatch' | 'GPS' | 'Checkout' | 'Authentication' | 'Unknown';
export type ErrorSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface ErrorLogData {
  category: ErrorCategory;
  message: string;
  stack?: string;
  userId?: string;
  role?: string;
  page?: string;
  severity: ErrorSeverity;
  metadata?: Record<string, any>;
}

class ErrorMonitorService {
  private collectionRef = collection(db, 'errorLogs');

  async logError(errorData: ErrorLogData): Promise<void> {
    try {
      await addDoc(this.collectionRef, {
        ...errorData,
        timestamp: serverTimestamp(),
      });
      // Also log to console for development
      console.error(`[${errorData.category}] ${errorData.message}`, errorData);
    } catch (e) {
      // Fallback if firestore fails
      console.error('Failed to log error to Firestore:', e);
      console.error('Original error:', errorData);
    }
  }

  logRuntimeError(error: Error, userId?: string, role?: string, metadata?: Record<string, any>) {
    this.logError({
      category: 'Runtime',
      message: error.message,
      stack: error.stack,
      userId,
      role,
      page: window.location.pathname,
      severity: 'High',
      metadata
    });
  }

  logFirestoreError(operation: string, error: any, userId?: string, metadata?: Record<string, any>) {
    this.logError({
      category: 'Firestore',
      message: `Firestore operation ${operation} failed: ${error?.message || 'Unknown'}`,
      stack: error?.stack,
      userId,
      severity: 'Critical',
      metadata
    });
  }
}

export const errorMonitor = new ErrorMonitorService();
