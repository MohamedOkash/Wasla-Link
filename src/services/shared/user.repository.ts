import { BaseRepository } from './repository';
import { DocumentData } from 'firebase/firestore';

export class UserRepository extends BaseRepository<DocumentData> {
  constructor() {
    super('users');
  }
}

export const userRepository = new UserRepository();
