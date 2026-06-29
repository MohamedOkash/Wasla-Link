import { BaseRepository } from '../shared/repository';
import { DocumentData } from 'firebase/firestore';

export class DriverRepository extends BaseRepository<DocumentData> {
  constructor() {
    super('drivers');
  }
}

export const driverRepository = new DriverRepository();
