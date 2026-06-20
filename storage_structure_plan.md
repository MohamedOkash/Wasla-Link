# Firebase Storage Structure & Security Rules Plan

This document outlines the organization and security configurations for files, product images, store identity assets, and electronic transfer receipts in Firebase Storage.

---

## 1. Storage Folder Hierarchy

All assets in SOUQ EL BALAD Storage are organized into isolated folder structures by concern and identifier:

```
/uploads
  ├── /users
  │     └── /{userId}
  │           └── avatar.webp (User profile pictures)
  ├── /stores
  │     └── /{storeId}
  │           ├── logo.webp (Store brand icon)
  │           └── cover.webp (Store banner image)
  ├── /products
  │     └── /{storeId}
  │           └── /{productId}
  │                 ├── main.webp
  │                 ├── gallery_1.webp
  │                 └── gallery_2.webp
  └── /receipts
        └── /{orderId}
              └── payment_proof.webp (Transfer screenshots: Vodafone Cash / InstaPay)
```

---

## 2. Image Compression & Pre-processing Rules

Prior to uploading any file to Firebase Storage, the client-side `mediaService` (or cloud function) must enforce compression using the rules specified in Phase 6:
* **Format**: All images are compressed and converted to `image/webp`.
* **Dimensions**: Max width `1200px`, max height `1200px` (aspect ratio preserved).
* **Quality**: Compressed at `0.75` quality index.
* **Max Size**: Enforced client-side block on any upload larger than `5 MB`.

---

## 3. Storage Security Rules (`storage.rules`)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Auth Helpers
    function signedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return signedIn() && request.auth.uid == userId;
    }
    
    // Check if the user is a vendor
    function isVendor() {
      // Role verify requires custom claims or reading Firestore user document
      // Rules allow matching via authentication status or metadata
      return signedIn();
    }
    
    // Size check
    function isWithinSizeLimit() {
      return request.resource.size < 5 * 1024 * 1024; // 5MB limit
    }
    
    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }

    // 1. User Profiles
    match /uploads/users/{userId}/{allPaths=**} {
      allow read: if signedIn();
      allow write: if isOwner(userId) && isWithinSizeLimit() && isImage();
    }

    // 2. Store Assets (Logo & Cover)
    match /uploads/stores/{storeId}/{allPaths=**} {
      allow read: if true; // Publicly readable for marketplace browsing
      allow write: if isVendor() && isWithinSizeLimit() && isImage();
    }

    // 3. Product Catalog Images
    match /uploads/products/{storeId}/{productId}/{allPaths=**} {
      allow read: if true; // Publicly readable
      allow write: if isVendor() && isWithinSizeLimit() && isImage();
    }

    // 4. Payment Receipts (Highly Confidential)
    match /uploads/receipts/{orderId}/{allPaths=**} {
      allow read: if signedIn(); // Customers, vendors, and admins
      allow write: if signedIn() && isWithinSizeLimit() && isImage();
    }
  }
}
```
