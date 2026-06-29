import { BaseRepository } from '../shared/repository';
import { DocumentData } from 'firebase/firestore';

export class CampaignRepository extends BaseRepository<DocumentData> {
  constructor() {
    super('campaigns');
  }
}

export const campaignRepository = new CampaignRepository();
