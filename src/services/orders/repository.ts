import { BaseRepository } from '../shared/repository';
import { DocumentData } from 'firebase/firestore';

export class OrderRepository extends BaseRepository<DocumentData> {
  constructor() {
    super('orders');
  }
}

export const orderRepository = new OrderRepository();
