import { BaseRepository } from '../shared/repository';
import { DocumentData } from 'firebase/firestore';

export class WalletRepository extends BaseRepository<DocumentData> {
  constructor() {
    super('wallets');
  }
}

export const walletRepository = new WalletRepository();
