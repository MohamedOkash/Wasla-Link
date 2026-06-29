# Firestore Security Rules Plan

This document outlines the security rules configuration (`firestore.rules`) required to protect and isolate Wasla Link's multi-role data structures on Firebase.

---

## 1. Helper Functions
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Auth Helpers
    function signedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return signedIn() && request.auth.uid == userId;
    }
    
    // Role Checks (Fetches from users collection)
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function hasRole(role) {
      return signedIn() && getUserData().role == role;
    }

    function isAdmin() {
      return hasRole('admin');
    }
    
    function isVendor() {
      return hasRole('vendor');
    }
    
    function isDriver() {
      return hasRole('driver');
    }
  }
}
```

---

## 2. Rules Definition by Collection

### 1. `users` Rules
* Users can read/write their own profile.
* Admins can read/write all profiles.
* Other authenticated users can read basic vendor profiles (for store descriptions).
```javascript
    match /users/{userId} {
      allow create: if signedIn();
      allow read: if isOwner(userId) || isAdmin() || (signedIn() && resource.data.role == 'vendor');
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }
```

### 2. `stores` Rules
* Anyone can read approved stores.
* Vendors can create/update their own store.
* Admins have full access.
```javascript
    match /stores/{storeId} {
      allow read: if resource.data.status == 'approved' || isAdmin() || (signedIn() && resource.data.vendorId == request.auth.uid);
      allow create: if isVendor() && request.resource.data.vendorId == request.auth.uid;
      allow update: if isAdmin() || (isVendor() && resource.data.vendorId == request.auth.uid);
      allow delete: if isAdmin();
    }
```

### 3. `products` Rules
* Anyone can read non-archived products.
* Vendors can write (create, update, delete) products belonging to their store.
* Admins have full access.
```javascript
    match /products/{productId} {
      allow read: if resource.data.availabilityStatus != 'archived' || isAdmin() || (signedIn() && get(/databases/$(database)/documents/stores/$(resource.data.storeId)).data.vendorId == request.auth.uid);
      allow create: if isVendor() && get(/databases/$(database)/documents/stores/$(request.resource.data.storeId)).data.vendorId == request.auth.uid;
      allow update: if isAdmin() || (isVendor() && get(/databases/$(database)/documents/stores/$(resource.data.storeId)).data.vendorId == request.auth.uid);
      allow delete: if isAdmin() || (isVendor() && get(/databases/$(database)/documents/stores/$(resource.data.storeId)).data.vendorId == request.auth.uid);
    }
```

### 4. `orders` Rules
* Customers can read/create their own orders.
* Vendors can read/update orders belonging to their store.
* Drivers can read available orders, or read/update orders assigned to them.
* Admins have full access.
```javascript
    match /orders/{orderId} {
      allow create: if signedIn() && request.resource.data.customerId == request.auth.uid;
      allow read: if isAdmin() 
                  || (signedIn() && resource.data.customerId == request.auth.uid)
                  || (signedIn() && get(/databases/$(database)/documents/stores/$(resource.data.shopId)).data.vendorId == request.auth.uid)
                  || (isDriver() && (resource.data.status == 'new' || resource.data.driverId == request.auth.uid));
      allow update: if isAdmin()
                  || (signedIn() && resource.data.customerId == request.auth.uid && request.resource.data.status == 'cancelled')
                  || (signedIn() && get(/databases/$(database)/documents/stores/$(resource.data.shopId)).data.vendorId == request.auth.uid)
                  || (isDriver() && (resource.data.status == 'new' || resource.data.driverId == request.auth.uid));
      allow delete: if isAdmin();
    }
```

### 5. `coupons` Rules
* Authenticated users can read/validate active coupons.
* Only admins can write (create, update, delete) coupons.
```javascript
    match /coupons/{couponId} {
      allow read: if signedIn() && resource.data.isActive == true;
      allow write: if isAdmin();
    }
```

### 6. `returns` Rules
* Customers can read/create returns for their orders.
* Vendors can read/modify return requests for their store.
* Only admins can delete.
```javascript
    match /returns/{returnId} {
      allow create: if signedIn() && request.resource.data.customerId == request.auth.uid;
      allow read: if isAdmin() 
                  || (signedIn() && resource.data.customerId == request.auth.uid)
                  || (signedIn() && get(/databases/$(database)/documents/stores/$(resource.data.storeId)).data.vendorId == request.auth.uid);
      allow update: if isAdmin() 
                  || (signedIn() && get(/databases/$(database)/documents/stores/$(resource.data.storeId)).data.vendorId == request.auth.uid);
      allow delete: if isAdmin();
    }
```

### 7. `transactions` Rules
* Users can read transactions associated with their ID (vendor payouts, driver earnings).
* System/Admin only writes.
```javascript
    match /transactions/{transactionId} {
      allow read: if isAdmin() || (signedIn() && resource.data.userId == request.auth.uid);
      allow write: if isAdmin();
    }
```
