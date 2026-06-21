import { BusinessHours, StoreCoverage } from '../types/delivery.types';

class DeliveryService {
  /**
   * Checks if a village is covered by the store's delivery zones.
   */
  validateCoverage(storeCoverage: StoreCoverage, village: string): boolean {
    if (!storeCoverage || !storeCoverage.coveredVillages) return true; // fallback
    return storeCoverage.coveredVillages.includes(village);
  }

  /**
   * Computes the delivery fee for a specific village, falling back to base fee.
   */
  getDeliveryFee(storeCoverage: StoreCoverage, village: string, baseFee: number): number {
    if (!storeCoverage || !storeCoverage.deliveryFees) return baseFee;
    const fee = storeCoverage.deliveryFees[village];
    return fee !== undefined ? fee : baseFee;
  }

  /**
   * Gets the estimated delivery time for a specific village.
   */
  getDeliveryETA(storeCoverage: StoreCoverage, village: string, baseETA: string): string {
    if (!storeCoverage || !storeCoverage.etas) return baseETA;
    const eta = storeCoverage.etas[village];
    return eta !== undefined ? eta : baseETA;
  }

  /**
   * Determines current store open/closed status based on schedule and breaks.
   */
  checkStoreOpenStatus(
    hours: BusinessHours,
    currentDate = new Date()
  ): { status: 'open' | 'closing_soon' | 'closed'; label: string; nextOpening?: string } {
    if (hours.holidayMode) {
      return { status: 'closed', label: 'مغلق (عطلة رسمية)' };
    }
    if (hours.temporaryClosure) {
      return { status: 'closed', label: 'مغلق مؤقتاً' };
    }

    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
    const currentHour = currentDate.getHours();
    const currentMin = currentDate.getMinutes();
    const currentMinutes = currentHour * 60 + currentMin;

    let openTimeStr = hours.openingHours;
    let closeTimeStr = hours.closingHours;

    // Friday Schedule
    if (dayOfWeek === 5) {
      if (!hours.fridaySchedule.isOpen) {
        return { status: 'closed', label: 'مغلق اليوم (الجمعة عطلة)' };
      }
      openTimeStr = hours.fridaySchedule.openTime;
      closeTimeStr = hours.fridaySchedule.closeTime;
    }

    const [openH, openM] = (openTimeStr || '00:00').split(':').map(Number);
    const [closeH, closeM] = (closeTimeStr || '23:59').split(':').map(Number);

    const openMin = openH * 60 + openM;
    let closeMin = closeH * 60 + closeM;

    // Handle overnight shifts (e.g. 08:00 to 02:00)
    if (closeMin < openMin) {
      closeMin += 1440;
    }

    const testMinutes = currentMinutes < openMin && closeMin > 1440 
      ? currentMinutes + 1440 
      : currentMinutes;

    // Check opening hours range
    if (testMinutes < openMin || testMinutes >= closeMin) {
      return { 
        status: 'closed', 
        label: 'مغلق حالياً', 
        nextOpening: `يفتح غداً في ${openTimeStr}` 
      };
    }

    // Check break times
    if (hours.breakTimes && hours.breakTimes.length > 0) {
      for (const brk of hours.breakTimes) {
        const [startH, startM] = (brk.start || '00:00').split(':').map(Number);
        const [endH, endM] = (brk.end || '00:00').split(':').map(Number);
        const startMin = startH * 60 + startM;
        const endMin = endH * 60 + endM;

        if (currentMinutes >= startMin && currentMinutes < endMin) {
          return { 
            status: 'closed', 
            label: 'مغلق لفترة راحة مؤقتة', 
            nextOpening: `يفتح بعد الاستراحة في ${brk.end}` 
          };
        }
      }
    }

    // Check closing soon (less than 60 mins remaining)
    const minutesLeft = closeMin - testMinutes;
    if (minutesLeft > 0 && minutesLeft <= 60) {
      return { 
        status: 'closing_soon', 
        label: `يغلق قريباً (خلال ${minutesLeft} دقيقة)` 
      };
    }

    return { status: 'open', label: 'مفتوح الآن' };
  }
}

export const deliveryService = new DeliveryService();
export default deliveryService;
