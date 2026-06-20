/**
 * Placeholder Service
 * Generates premium SVGs with brand colors, product type labels, and icons
 * for high-performance lazy fallbacks.
 */

export class PlaceholderService {
  private getIconPath(type: string): string {
    switch (type.toLowerCase()) {
      case 'milk':
      case 'dairy':
      case 'cheese':
      case 'yogurt':
        // Milk carton outline
        return '<path d="M70 110 L100 80 L130 110 L130 200 L70 200 Z" fill="none" stroke="white" stroke-width="6" stroke-linejoin="round"/><path d="M70 140 H130" stroke="white" stroke-width="4"/>';
      case 'rice':
      case 'pasta':
      case 'grains':
        // Rice/Sack outline
        return '<path d="M75 100 Q100 80 125 100 Q135 150 125 200 Q100 210 75 200 Q65 150 75 100 Z" fill="none" stroke="white" stroke-width="6" stroke-linejoin="round"/><path d="M90 130 H110 M85 160 H115" stroke="white" stroke-width="4"/>';
      case 'oil':
      case 'ghee':
        // Oil bottle
        return '<path d="M90 80 H110 V100 L125 120 V190 Q125 200 115 200 H85 Q75 200 75 190 V120 L90 100 Z" fill="none" stroke="white" stroke-width="6" stroke-linejoin="round"/><circle cx="100" cy="155" r="15" fill="none" stroke="white" stroke-width="4"/>';
      case 'chocolate':
      case 'snacks':
      case 'biscuits':
        // Chocolate bar
        return '<rect x="75" y="90" width="50" height="110" rx="6" fill="none" stroke="white" stroke-width="6"/><path d="M75 125 H125 M75 160 H125 M100 90 V200" stroke="white" stroke-width="4"/>';
      case 'mobile':
      case 'phone':
        // Mobile phone
        return '<rect x="75" y="80" width="50" height="120" rx="8" fill="none" stroke="white" stroke-width="6"/><circle cx="100" cy="180" r="6" fill="white"/>';
      case 'laptop':
      case 'computer':
        // Laptop
        return '<path d="M60 160 H140 V170 H60 Z M70 100 H130 V160 H70 Z" fill="none" stroke="white" stroke-width="6" stroke-linejoin="round"/>';
      case 'pharmacy':
      case 'medicine':
      case 'medical':
        // Pill or cross
        return '<path d="M90 140 H110 M100 130 V150" stroke="white" stroke-width="8" stroke-linecap="round"/><circle cx="100" cy="140" r="40" fill="none" stroke="white" stroke-width="6"/>';
      case 'bakery':
      case 'bread':
        // Bread loaf
        return '<path d="M70 150 Q100 120 130 150 Q135 170 130 190 H70 Q65 170 70 150 Z" fill="none" stroke="white" stroke-width="6"/><path d="M85 145 L95 165 M100 142 L110 162 M115 145 L125 165" stroke="white" stroke-width="4" stroke-linecap="round"/>';
      case 'library':
      case 'book':
      case 'books':
        // Book
        return '<path d="M80 90 H125 V190 H80 Z M80 180 H120" fill="none" stroke="white" stroke-width="6" stroke-linejoin="round"/><path d="M95 115 H115 M95 140 H115" stroke="white" stroke-width="4"/>';
      case 'electrical':
      case 'appliances':
      case 'electricity':
        // Lightbulb
        return '<circle cx="100" cy="120" r="25" fill="none" stroke="white" stroke-width="6"/><path d="M90 142 H110 M93 152 H107 M96 162 H104 M100 145 V172" stroke="white" stroke-width="4"/>';
      case 'houseware':
      case 'home':
        // Plate & Fork/Knife
        return '<circle cx="100" cy="140" r="30" fill="none" stroke="white" stroke-width="6"/><path d="M60 120 V160 M140 120 V160" stroke="white" stroke-width="4"/>';
      default:
        // Default box/package
        return '<rect x="75" y="95" width="50" height="50" fill="none" stroke="white" stroke-width="6"/><path d="M75 95 L100 120 L125 95 M100 120 V145" stroke="white" stroke-width="4"/>';
    }
  }

  getPlaceholder(category: string, labelAr = 'سوق البلد', labelEn = 'SOUQ EL BALAD'): string {
    const icon = this.getIconPath(category);
    const bgGradientStart = '#FF7A00'; // Wasla Orange
    const bgGradientEnd = '#FF9E46';

    const svg = `<svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgGradientStart}" />
          <stop offset="100%" stop-color="${bgGradientEnd}" />
        </linearGradient>
      </defs>
      <rect width="300" height="300" rx="20" fill="url(#bgGrad)"/>
      <!-- Premium decorative background circles -->
      <circle cx="260" cy="40" r="80" fill="white" fill-opacity="0.05"/>
      <circle cx="40" cy="260" r="100" fill="white" fill-opacity="0.05"/>
      
      <!-- Icon Render -->
      <g transform="translate(50, 10)">
        ${icon}
      </g>

      <!-- Clean Typography -->
      <text x="150" y="225" fill="white" font-family="'Cairo', system-ui" font-weight="bold" font-size="18" text-anchor="middle">${labelAr}</text>
      <text x="150" y="255" fill="white" fill-opacity="0.8" font-family="'Outfit', system-ui" font-weight="600" font-size="14" text-anchor="middle" letter-spacing="1">${labelEn}</text>
    </svg>`;

    // Base64 encode the SVG to prevent formatting issues in image tags
    const base64Svg = typeof btoa !== 'undefined' 
      ? btoa(unescape(encodeURIComponent(svg))) 
      : Buffer.from(svg).toString('base64');
      
    return `data:image/svg+xml;base64,${base64Svg}`;
  }

  // Resolves a category string to the closest placeholder match
  getPlaceholderForCategory(categoryName: string): string {
    const cat = (categoryName || '').toLowerCase();
    
    if (cat.includes('لبن') || cat.includes('جبن') || cat.includes('البان') || cat.includes('dairy') || cat.includes('milk') || cat.includes('yogurt') || cat.includes('cheese')) {
      return this.getPlaceholder('milk', 'منتجات ألبان', 'Dairy & Milk');
    }
    if (cat.includes('أرز') || cat.includes('مكرونة') || cat.includes('دقيق') || cat.includes('rice') || cat.includes('pasta') || cat.includes('flour') || cat.includes('grains')) {
      return this.getPlaceholder('rice', 'أرز ومكرونة ودقيق', 'Rice & Pasta');
    }
    if (cat.includes('زيت') || cat.includes('سمن') || cat.includes('oil') || cat.includes('ghee')) {
      return this.getPlaceholder('oil', 'زيوت وسمن', 'Oils & Ghee');
    }
    if (cat.includes('شوكولاتة') || cat.includes('بسكويت') || cat.includes('شيبس') || cat.includes('chocolate') || cat.includes('snacks') || cat.includes('chips') || cat.includes('biscuits')) {
      return this.getPlaceholder('chocolate', 'حلويات وتسالي', 'Snacks & Chocolate');
    }
    if (cat.includes('موبايل') || cat.includes('هاتف') || cat.includes('mobile') || cat.includes('phone')) {
      return this.getPlaceholder('mobile', 'موبايلات وهواتف', 'Mobile Phones');
    }
    if (cat.includes('لاب') || cat.includes('كمبيوتر') || cat.includes('laptop') || cat.includes('computer')) {
      return this.getPlaceholder('laptop', 'أجهزة كمبيوتر ولاب توب', 'Computers & Laptops');
    }
    if (cat.includes('صيدلية') || cat.includes('دواء') || cat.includes('علاج') || cat.includes('pharmacy') || cat.includes('medicine') || cat.includes('health')) {
      return this.getPlaceholder('pharmacy', 'رعاية صحية وصيدلية', 'Pharmacy & Health');
    }
    if (cat.includes('مخبز') || cat.includes('خبز') || cat.includes('bakery') || cat.includes('bread') || cat.includes('sweets')) {
      return this.getPlaceholder('bakery', 'مخبوزات وحلويات', 'Bakery & Bread');
    }
    if (cat.includes('مكتبة') || cat.includes('كتاب') || cat.includes('library') || cat.includes('book') || cat.includes('stationery')) {
      return this.getPlaceholder('library', 'أدوات مكتبية ومكتبة', 'Library & Stationery');
    }
    if (cat.includes('كهرب') || cat.includes('أجهزة') || cat.includes('electrical') || cat.includes('electricity') || cat.includes('power')) {
      return this.getPlaceholder('electrical', 'أجهزة كهربائية', 'Electrical Appliances');
    }
    if (cat.includes('منزل') || cat.includes('مطبخ') || cat.includes('houseware') || cat.includes('home') || cat.includes('kitchen')) {
      return this.getPlaceholder('houseware', 'أدوات منزلية', 'Houseware & Home');
    }
    
    // Default fallback
    return this.getPlaceholder('default', 'منتج سوق البلد', 'SOUQ EL BALAD Product');
  }
}

export const placeholderService = new PlaceholderService();
export default placeholderService;
