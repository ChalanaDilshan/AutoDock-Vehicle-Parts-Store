import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../src/app.js';
import { env } from '../../../src/config/env.js';
import { Product } from '../../../src/modules/customer-experience/models/product.model.js';
import { Category } from '../../../src/modules/customer-experience/models/category.model.js';
import { Brand } from '../../../src/modules/customer-experience/models/brand.model.js';
import { Cart } from '../../../src/modules/customer-experience/models/cart.model.js';
import { Wishlist } from '../../../src/modules/customer-experience/models/wishlist.model.js';
import { User } from '../../../src/modules/identity/models/user.model.js';

describe('MOD-02 Multi-Vendor Cart & Wishlist Tests', () => {
  const app = createApp();
  const testDbUri = 'mongodb://localhost:27017/autodock_test_cart';

  let customerToken: string;
  let customerId: string;
  let seller1Id: string;
  let seller2Id: string;
  let product1Id: string;
  let product2Id: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(testDbUri);

    const customer = await User.create({
      email: 'buyer.cart@autodock.lk',
      passwordHash: 'hashed',
      firstName: 'Buyer',
      lastName: 'User',
      phone: '+94779998877',
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    customerId = customer._id.toString();
    customerToken = jwt.sign(
      { userId: customerId, email: customer.email, role: customer.role },
      env.JWT_ACCESS_SECRET
    );

    seller1Id = new mongoose.Types.ObjectId().toString();
    seller2Id = new mongoose.Types.ObjectId().toString();

    const cat = await Category.create({ name: 'Ignition', slug: 'ignition' });
    const brand = await Brand.create({ name: 'NGK', slug: 'ngk' });

    // Product 1 from Seller 1 (Stock: 5, Price: Rs. 2,000 / 200,000 cents)
    const p1 = await Product.create({
      sellerId: new mongoose.Types.ObjectId(seller1Id),
      title: 'NGK Iridium Spark Plug (Single)',
      sku: 'NGK-SP-01',
      partNumber: 'BKR6EIX',
      categoryId: cat._id,
      brandId: brand._id,
      condition: 'BRAND_NEW',
      description: 'Laser welded iridium center electrode plug.',
      priceInCents: 200000,
      stock: 5,
      status: 'ACTIVE',
      images: [{ url: 'https://cdn.autodock.lk/spark.jpg', isPrimary: true }],
    });
    product1Id = p1._id.toString();

    // Product 2 from Seller 2 (Stock: 10, Price: Rs. 6,500 / 650,000 cents)
    const p2 = await Product.create({
      sellerId: new mongoose.Types.ObjectId(seller2Id),
      title: 'Ignition Coil Pack OEM',
      sku: 'IC-O-02',
      partNumber: '90919-02240',
      categoryId: cat._id,
      brandId: brand._id,
      condition: 'BRAND_NEW',
      description: 'Direct ignition coil pack.',
      priceInCents: 650000,
      stock: 10,
      status: 'ACTIVE',
      images: [{ url: 'https://cdn.autodock.lk/coil.jpg', isPrimary: true }],
    });
    product2Id = p2._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Cart.deleteMany({});
    await Wishlist.deleteMany({});
  });

  it('TC-MOD02-013: Aggregates items from multiple sellers in one customer cart', async () => {
    // 1. Add Product 1 from Seller 1
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: product1Id, quantity: 2 });

    // 2. Add Product 2 from Seller 2
    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: product2Id, quantity: 1 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalItems).toBe(3);
    // Grand total: (2 * 200,000) + (1 * 650,000) = 1,050,000 cents (Rs. 10,500.00)
    expect(res.body.data.grandTotalInCents).toBe(1050000);
    expect(res.body.data.sellerGroups.length).toBe(2);
  });

  it('TC-MOD02-014: Rejects adding quantity exceeding available physical stock', async () => {
    // Product 1 has stock: 5. Attempting to add 6.
    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: product1Id, quantity: 6 });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INSUFFICIENT_STOCK');
  });

  it('TC-MOD02-015: Merges guest cart items into authenticated customer cart on login', async () => {
    const res = await request(app)
      .post('/api/v1/cart/merge')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        guestItems: [
          { productId: product1Id, quantity: 1 },
          { productId: product2Id, quantity: 2 },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.totalItems).toBe(3);
  });

  it('TC-MOD02-016: Adds item to wishlist, prevents duplicates, and moves item to cart', async () => {
    // 1. Add to wishlist
    const addWishRes = await request(app)
      .post('/api/v1/wishlist/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: product1Id });

    expect(addWishRes.status).toBe(201);
    expect(addWishRes.body.data.totalItems).toBe(1);

    // 2. Duplicate addition is idempotent
    const dupRes = await request(app)
      .post('/api/v1/wishlist/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: product1Id });

    expect(dupRes.status).toBe(201);
    expect(dupRes.body.data.totalItems).toBe(1);

    // 3. Move from wishlist to cart
    const moveRes = await request(app)
      .post(`/api/v1/wishlist/items/${product1Id}/move-to-cart`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(moveRes.status).toBe(200);
    expect(moveRes.body.code).toBe('MOVED_TO_CART');

    // Confirm wishlist is now empty
    const wishCheck = await request(app)
      .get('/api/v1/wishlist')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(wishCheck.body.data.totalItems).toBe(0);

    // Confirm item is in cart
    const cartCheck = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(cartCheck.body.data.totalItems).toBe(1);
  });
});
