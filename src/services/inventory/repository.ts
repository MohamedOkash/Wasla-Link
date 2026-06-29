import { BaseRepository } from '../shared/repository';
import { DocumentData } from 'firebase/firestore';

export class ProductRepository extends BaseRepository<DocumentData> {
  constructor() {
    super('products');
  }
}

export const productRepository = new ProductRepository();
