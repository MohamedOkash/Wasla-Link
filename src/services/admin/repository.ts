import { BaseRepository } from '../shared/repository';

export const categoryRepository = new BaseRepository<any>('categories');
export const subCategoryRepository = new BaseRepository<any>('subcategories');
export const bannerRepository = new BaseRepository<any>('banners');
export const platformSettingsRepository = new BaseRepository<any>('platformSettings');
export const brandRepository = new BaseRepository<any>('brands');
export const productTemplateRepository = new BaseRepository<any>('productTemplates');

export const reviewRepository = new BaseRepository<any>('reviews');
export const settlementRepository = new BaseRepository<any>('settlementRequests');
export const campaignRepository = new BaseRepository<any>('campaigns');
export const notificationRepository = new BaseRepository<any>('notifications');
export const returnRequestRepository = new BaseRepository<any>('returnRequests');
