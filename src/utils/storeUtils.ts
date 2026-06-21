import { Store } from '../types/store.types';

export interface StoreStatus {
  label: string;
  color: string;
  status: 'open' | 'closed' | 'closing_soon';
}

export const getStoreStatus = (shop: Store, isRTL: boolean): StoreStatus => {
  if (shop.isTemporarilyClosed) {
    return { 
      label: isRTL ? 'مغلق مؤقتاً' : 'Temporarily Closed', 
      color: 'bg-red-500/15 text-red-500 border border-red-500/20', 
      status: 'closed' 
    };
  }

  // Admin/Vendor manual override. Explicit false means closed. Otherwise true (or undefined) is open.
  if (shop.isOpen === false) {
    return { 
      label: isRTL ? 'مغلق حالياً' : 'Closed Now', 
      color: 'bg-red-500/15 text-red-500 border border-red-500/20', 
      status: 'closed' 
    };
  }

  if (!shop.openingHours || !shop.closingHours) {
    // If no schedule exists, default to OPEN unless explicitly closed above
    return { 
      label: isRTL ? 'مفتوح الآن' : 'Open Now', 
      color: 'bg-green-500/15 text-green-500 border border-green-500/20', 
      status: 'open' 
    };
  }

  // Get current time in Cairo timezone
  const cairoTimeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Cairo',
    hour12: false,
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short'
  }).format(new Date());

  // cairoTimeStr looks like: "Mon, 14:30"
  const [weekdayStr, timeStr] = cairoTimeStr.split(', ');
  const [currentHour, currentMin] = timeStr.split(':').map(Number);
  
  // Map weekday string to JS Date getDay() index (0=Sun, 1=Mon...)
  const daysMap: Record<string, number> = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
  const currentDay = daysMap[weekdayStr] ?? new Date().getDay();

  if (shop.workingDays && shop.workingDays.length > 0 && !shop.workingDays.includes(currentDay)) {
    return { 
      label: isRTL ? 'مغلق (عطلة)' : 'Closed (Holiday)', 
      color: 'bg-red-500/15 text-red-500 border border-red-500/20', 
      status: 'closed' 
    };
  }

  const currentTimeVal = currentHour * 60 + currentMin;

  const [opHour, opMin] = (shop.openingHours || '00:00').split(':').map(Number);
  const [clHour, clMin] = (shop.closingHours || '23:59').split(':').map(Number);

  const openTimeVal = opHour * 60 + opMin;
  const closeTimeVal = clHour * 60 + clMin;

  let isStoreOpen = false;
  if (closeTimeVal < openTimeVal) {
    isStoreOpen = currentTimeVal >= openTimeVal || currentTimeVal < closeTimeVal;
  } else {
    isStoreOpen = currentTimeVal >= openTimeVal && currentTimeVal < closeTimeVal;
  }

  if (!isStoreOpen) {
    const formattedOpenTime = `${opHour % 12 || 12}:${opMin.toString().padStart(2, '0')} ${opHour >= 12 ? (isRTL ? 'م' : 'PM') : (isRTL ? 'ص' : 'AM')}`;
    return { 
      label: isRTL ? `يفتح ${formattedOpenTime}` : `Opens ${formattedOpenTime}`, 
      color: 'bg-red-500/15 text-red-500 border border-red-500/20', 
      status: 'closed' 
    };
  }

  let minsToClose = 0;
  if (closeTimeVal < openTimeVal) {
    minsToClose = currentTimeVal >= openTimeVal ? (1440 - currentTimeVal) + closeTimeVal : closeTimeVal - currentTimeVal;
  } else {
    minsToClose = closeTimeVal - currentTimeVal;
  }

  if (minsToClose > 0 && minsToClose <= 60) {
    const formattedCloseTime = `${clHour % 12 || 12}:${clMin.toString().padStart(2, '0')} ${clHour >= 12 ? (isRTL ? 'م' : 'PM') : (isRTL ? 'ص' : 'AM')}`;
    return { 
      label: isRTL ? `يغلق ${formattedCloseTime}` : `Closes ${formattedCloseTime}`, 
      color: 'bg-amber-500/15 text-amber-500 border border-amber-500/20', 
      status: 'closing_soon' 
    };
  }

  return { 
    label: isRTL ? 'مفتوح الآن' : 'Open', 
    color: 'bg-green-500/15 text-green-500 border border-green-500/20', 
    status: 'open' 
  };
};
