import { BaseRepository } from '../shared/repository';
import { DocumentData } from 'firebase/firestore';

export class StoreRepository extends BaseRepository<DocumentData> {
  constructor() {
    super('stores');
  }
}

export const storeRepository = new StoreRepository();
