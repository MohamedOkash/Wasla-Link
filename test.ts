import { db } from './src/services/firebase';
import { orderService } from './src/services/orders/service';
import { doc, collection } from 'firebase/firestore';

async function testCheckout() {
  try {
    const orderData = {
      id: doc(collection(db, 'orders')).id,
      shopId: "store-123",
      shopName: "Test Store",
      customerId: "guest",
      customerName: "Test Customer",
      items: [{ id: "p1", name: "Product", price: 100, quantity: 1, imgUrl: "" }],
      subtotal: 100,
      deliveryFee: 10,
      discount: 0,
      pointsRedeemed: 0,
      pointsDiscount: 0,
      total: 110,
      paymentMethod: "cash_on_delivery",
      paymentReceipt: null,
      location: { name: "Test location", coords: null, isVerified: true },
      status: "new",
      createdAt: new Date().toISOString()
    };
    
    await orderService.placeOrder({
      orderData,
      pointsToRedeem: 0,
    });
    console.log("SUCCESS");
    process.exit(0);
  } catch (err) {
    console.error("ERROR:");
    console.error(err);
    process.exit(1);
  }
}

testCheckout();
