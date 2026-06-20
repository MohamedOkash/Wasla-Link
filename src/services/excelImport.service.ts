import * as XLSX from 'xlsx';

export interface RawImportRow {
  name?: string;
  description?: string;
  category?: string;
  price?: string | number;
  costPrice?: string | number;
  sku?: string;
  barcode?: string;
  stock?: string | number;
  brand?: string;
  weight?: string;
  unit?: string;
}

export interface ImportResultRow {
  name: string;
  desc: string;
  cat: string;
  price: number;
  costPrice: number;
  sku: string;
  barcode: string;
  currentStock: number;
  productBrand: string;
  productWeight: string;
  unit: string;
  status: 'new' | 'update' | 'skip';
  errors: string[];
}

export interface ImportSummaryData {
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  errorsCount: number;
  rows: ImportResultRow[];
}

// Bilingual headers map
const HEADER_MAPS: Record<string, keyof RawImportRow> = {
  'الاسم': 'name',
  'name': 'name',
  'الوصف': 'description',
  'description': 'description',
  'التصنيف': 'category',
  'category': 'category',
  'السعر': 'price',
  'price': 'price',
  'التكلفة': 'costPrice',
  'costprice': 'costPrice',
  'purchaseprice': 'costPrice',
  'الكمية': 'stock',
  'stock': 'stock',
  'qty': 'stock',
  'quantity': 'stock',
  'sku': 'sku',
  'الرمز': 'sku',
  'الباركود': 'barcode',
  'barcode': 'barcode',
  'الماركة': 'brand',
  'brand': 'brand',
  'الوزن': 'weight',
  'weight': 'weight',
  'الوحدة': 'unit',
  'unit': 'unit'
};

class ExcelImportService {
  // Parse uploaded spreadsheet file
  parseFile(file: File): Promise<ImportSummaryData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error('File content is empty'));
            return;
          }

          const workbook = XLSX.read(data, { type: 'binary' });
          const rows: RawImportRow[] = [];

          // Parse multiple sheets if present
          workbook.SheetNames.forEach((sheetName) => {
            const sheet = workbook.Sheets[sheetName];
            const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
            
            json.forEach((item) => {
              const mappedRow: RawImportRow = {};
              Object.keys(item).forEach((key) => {
                const normalizedKey = key.trim().toLowerCase();
                const mappedKey = HEADER_MAPS[normalizedKey] || HEADER_MAPS[key.trim()];
                if (mappedKey) {
                  mappedRow[mappedKey] = item[key];
                }
              });
              rows.push(mappedRow);
            });
          });

          resolve(this.validateAndProcess(rows));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => {
        reject(err);
      };
      reader.readAsBinaryString(file);
    });
  }

  // Validate and map raw rows to inventory schemas
  private validateAndProcess(rawRows: RawImportRow[]): ImportSummaryData {
    const processedRows: ImportResultRow[] = [];
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errorsCount = 0;

    // Track unique constraints to detect internal duplicates in the sheet
    const seenNames = new Set<string>();
    const seenBarcodes = new Set<string>();
    const seenSKUs = new Set<string>();

    rawRows.forEach((raw, idx) => {
      const errors: string[] = [];
      const rowNum = idx + 1;

      const name = (raw.name || '').toString().trim();
      const desc = (raw.description || '').toString().trim();
      const cat = (raw.category || 'عام').toString().trim();
      const priceVal = parseFloat(raw.price?.toString() || '0');
      const costVal = parseFloat(raw.costPrice?.toString() || '0') || Math.round(priceVal * 0.7);
      const stockVal = parseInt(raw.stock?.toString() || '0', 10);
      const sku = (raw.sku || '').toString().trim() || `SKU-AUTO-${Math.floor(100000 + Math.random() * 900000)}`;
      const barcode = (raw.barcode || '').toString().trim() || `622${Math.floor(100000000 + Math.random() * 900000000)}`;
      const brand = (raw.brand || '').toString().trim();
      const weight = (raw.weight || '').toString().trim();
      const unit = (raw.unit || '').toString().trim();

      // Validations
      if (!name) {
        errors.push(`Row ${rowNum}: Name is required`);
      }
      if (isNaN(priceVal) || priceVal <= 0) {
        errors.push(`Row ${rowNum}: Price must be a positive number`);
      }

      // Check duplicates in uploaded sheet
      if (name && seenNames.has(name)) {
        errors.push(`Row ${rowNum}: Duplicate Product Name "${name}" in upload sheet`);
      }
      if (barcode && seenBarcodes.has(barcode)) {
        errors.push(`Row ${rowNum}: Duplicate Barcode "${barcode}" in upload sheet`);
      }
      if (sku && seenSKUs.has(sku)) {
        errors.push(`Row ${rowNum}: Duplicate SKU "${sku}" in upload sheet`);
      }

      if (name) seenNames.add(name);
      if (barcode) seenBarcodes.add(barcode);
      if (sku) seenSKUs.add(sku);

      // Determine import status
      let status: ImportResultRow['status'] = 'new';
      if (errors.length > 0) {
        status = 'skip';
        skipped++;
        errorsCount++;
      } else {
        // Query existing products in memory (will check duplicate overrides at UI commit stage)
        status = 'new'; 
      }

      processedRows.push({
        name,
        desc: desc || 'مستورد عبر إكسل',
        cat,
        price: priceVal,
        costPrice: costVal,
        sku,
        barcode,
        currentStock: stockVal,
        productBrand: brand,
        productWeight: weight,
        unit,
        status,
        errors
      });
    });

    // Count newly imported vs updated
    processedRows.forEach(row => {
      if (row.status !== 'skip') {
        // Assume default as new import unless matched at commit
        imported++;
      }
    });

    return {
      importedCount: imported,
      updatedCount: updated, // UI commit will adjust this
      skippedCount: skipped,
      errorsCount: errorsCount,
      rows: processedRows
    };
  }

  // Create template spreadsheet and download it
  downloadTemplate(isRTL = true) {
    const headers = isRTL 
      ? ['الاسم', 'الوصف', 'التصنيف', 'السعر', 'التكلفة', 'الكمية', 'SKU', 'الباركود', 'الماركة', 'الوزن', 'الوحدة']
      : ['name', 'description', 'category', 'price', 'costPrice', 'stock', 'sku', 'barcode', 'brand', 'weight', 'unit'];

    const sampleRow = isRTL 
      ? ['جهينة حليب كامل الدسم', 'حليب طبيعي معقم 1 لتر', 'ألبان وأجبان', 42, 30, 100, 'JOH-MILK-1L', '6221007011012', 'جهينة', '1', 'لتر']
      : ['Juhayna Full Cream Milk', 'Natural sterilized milk 1L', 'Dairy', 42, 30, 100, 'JOH-MILK-1L', '6221007011012', 'Juhayna', '1', 'Liter'];

    const data = [headers, sampleRow];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isRTL ? 'المنتجات' : 'Products');

    // Write file and trigger download
    XLSX.writeFile(wb, 'waslalink_products_template.xlsx');
  }
}

export const excelImportService = new ExcelImportService();
export default excelImportService;
