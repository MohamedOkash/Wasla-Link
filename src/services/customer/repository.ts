import { BaseRepository } from '../shared/repository';
import { DocumentData } from 'firebase/firestore';

export class ReviewRepository extends BaseRepository<DocumentData> {
  constructor() {
    super('reviews');
  }
}

export const reviewRepository = new ReviewRepository();
