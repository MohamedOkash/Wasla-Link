import { db } from './firebase';
import { writeBatch, runTransaction, Transaction, WriteBatch } from 'firebase/firestore';

export class TransactionEngine {
  /**
   * Executes a safe atomic batch write.
   * Use this instead of raw writeBatch in UI.
   */
  async executeBatch(operations: (batch: WriteBatch) => void): Promise<void> {
    const batch = writeBatch(db);
    operations(batch);
    await batch.commit();
  }

  /**
   * Executes a read-write transaction safely.
   */
  async executeTransaction<T>(updateFunction: (transaction: Transaction) => Promise<T>): Promise<T> {
    return await runTransaction(db, updateFunction);
  }
}

export const transactionEngine = new TransactionEngine();
