# Firestore Collections Architecture Plan

This document outlines the Firestore Collections and Document schemas designed to transition the local `AppContext` state and service layer of SOUQ EL BALAD to Firebase.

---

## 1. `users` Collection
* **Document ID**: `${userId}` (maps to Firebase Auth UID)
```json
{
  "uid": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "role": "customer | vendor | driver | admin",
  "createdAt": "timestamp",
  "savedAddresses": [
    {
      "id": "string",
      "label": "string",
      "governorate": "string",
      "center": "string",
      "village": "string",
      "street": "string",
      "building": "string",
      "floor": "string",
      "apartment": "string",
      "landmark": "string",
      "notes": "string",
      "isDefault": "boolean"
    }
  ],
  "followedStores": ["string (storeId)"],
  "favoriteProducts": ["string (productId)"],
  "favoriteStores": ["string (storeId)"]
}
```

---

## 2. `stores` Collection
* **Document ID**: `${storeId}`
```json
{
  "id": "string",
  "vendorId": "string (userId)",
  "catId": "string",
  "name": "string",
  "logoUrl": "string",
  "coverUrl": "string",
  "rating": "number",
  "isOpen": "boolean",
  "isTemporarilyClosed": "boolean",
  "holidayMode": "boolean",
  "openingHours": "string (HH:MM)",
  "closingHours": "string (HH:MM)",
  "workingDays": ["number"],
  "fridaySchedule": {
    "isOpen": "boolean",
    "openTime": "string (HH:MM)",
    "closeTime": "string (HH:MM)"
  },
  "breakTimes": [
    {
      "start": "string (HH:MM)",
      "end": "string (HH:MM)"
    }
  ],
  "coveredVillages": ["string"],
  "deliveryFees": {
    "villageName": "number"
  },
  "etas": {
    "villageName": "string"
  },
  "minOrder": "number",
  "fee": "number",
  "time": "number",
  "paymentInfo": {
    "vodafone": "string",
    "instapay": "string"
  },
  "status": "pending | approved | rejected | suspended",
  "followersCount": "number"
}
```

---

## 3. `products` Collection
* **Document ID**: `${productId}`
```json
{
  "id": "string",
  "storeId": "string (storeId)",
  "cat": "string (subcategory name)",
  "name": "string",
  "desc": "string",
  "price": "number",
  "oldPrice": "number | null",
  "isOffer": "boolean",
  "isBestSeller": "boolean",
  "imageUrl": "string",
  "productBrand": "string",
  "productWeight": "string",
  "unit": "string",
  "sku": "string",
  "barcode": "string",
  "costPrice": "number",
  "currentStock": "number",
  "reservedStock": "number",
  "lowStockThreshold": "number",
  "availabilityStatus": "in_stock | low_stock | out_of_stock | archived",
  "salesCount": "number",
  "viewsCount": "number",
  "favoritesCount": "number"
}
```

---

## 4. `orders` Collection
* **Document ID**: `${orderId}`
```json
{
  "id": "string",
  "shopId": "string (storeId)",
  "shopName": "string",
  "customerId": "string (userId)",
  "customerName": "string",
  "driverId": "string (userId) | null",
  "items": [
    {
      "id": "string",
      "name": "string",
      "price": "number",
      "quantity": "number",
      "imgUrl": "string"
    }
  ],
  "subtotal": "number",
  "deliveryFee": "number",
  "discount": "number",
  "total": "number",
  "paymentMethod": "cash | vodafone | instapay",
  "paymentReceipt": "string (storage url) | null",
  "location": {
    "name": "string",
    "isVerified": "boolean"
  },
  "status": "new | pendingVerification | accepted | preparing | driverAssigned | pickedUp | delivered | cancelled",
  "otp": "string (4-digits)",
  "createdAt": "timestamp"
}
```

---

## 5. `coupons` Collection
* **Document ID**: `${couponId}`
```json
{
  "id": "string",
  "code": "string",
  "discountType": "percentage | fixed",
  "discountValue": "number",
  "minOrder": "number",
  "maxDiscount": "number | null",
  "startDate": "timestamp",
  "endDate": "timestamp",
  "usageLimit": "number | null",
  "usedCount": "number",
  "isActive": "boolean"
}
```

---

## 6. `returns` Collection
* **Document ID**: `${returnId}`
```json
{
  "id": "string",
  "orderId": "string (orderId)",
  "storeId": "string (storeId)",
  "customerId": "string (userId)",
  "items": [
    {
      "productId": "string",
      "quantity": "number",
      "price": "number"
    }
  ],
  "refundAmount": "number",
  "status": "pending | approved | rejected",
  "reason": "string",
  "requestType": "refund | replacement",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "timeline": [
    {
      "status": "string",
      "label": "string",
      "timestamp": "string (ISO)"
    }
  ]
}
```

---

## 7. `transactions` Collection
* **Document ID**: `${transactionId}`
```json
{
  "id": "string",
  "userId": "string (userId)",
  "type": "commission | orderPayment | withdrawal | refund",
  "amount": "number",
  "status": "pending | settled | cancelled",
  "referenceId": "string (orderId | returnId | withdrawalId)",
  "description": "string",
  "createdAt": "timestamp"
}
```
