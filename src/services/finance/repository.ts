import { BaseRepository } from '../shared/repository';
import { DocumentData } from 'firebase/firestore';

export class SettlementRepository extends BaseRepository<DocumentData> {
  constructor() {
    super('settlementRequests');
  }
}

export const settlementRepository = new SettlementRepository();
