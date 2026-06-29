// [MOCKED_FOR_DEVELOPMENT]
// This service isolates remaining mocked logic that requires a backend sequence generator or SMS gateway.
export const mockService = {
  generateSku: () => `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
  generateBarcode: () => `622${Math.floor(100000000 + Math.random() * 900000000)}`,
  generateOrderId: () => `ord_${Math.floor(100000 + Math.random() * 900000)}`,
  generateOTP: () => Math.floor(100000 + Math.random() * 900000).toString(),
};
