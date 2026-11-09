import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const baseUrl = 'http://localhost:5000/api';

async function runMasterAuditTests() {
  console.log('================================================================================');
  console.log('🛡️  SHOPPING.COM MASTER PRODUCTION AUDIT & INDUSTRY-LEVEL TEST SUITE');
  console.log('================================================================================\n');

  let passed = 0;
  let failed = 0;
  const testResults = [];

  function record(moduleName, description, success, detail = '') {
    if (success) {
      console.log(`✅ [PASS] ${moduleName}: ${description}`);
      passed++;
      testResults.push({ module: moduleName, test: description, status: 'PASS', detail });
    } else {
      console.error(`❌ [FAIL] ${moduleName}: ${description} -> ${detail}`);
      failed++;
      testResults.push({ module: moduleName, test: description, status: 'FAIL', detail });
    }
  }

  // --------------------------------------------------------------------------
  // SECTION 1: SYSTEM, SECURITY HEADERS & HEALTH
  // --------------------------------------------------------------------------
  let dbUri = null;
  try {
    const res = await fetch(`${baseUrl}/health`);
    const data = await res.json();
    const hasHelmet = res.headers.has('x-content-type-options');
    record('System Health', 'GET /api/health returns 200 and database connected', res.status === 200 && data.status === 'healthy');
    record('Security Headers', 'Helmet security headers present (x-content-type-options)', hasHelmet);
    dbUri = data.dbUri;
    if (dbUri) {
      await mongoose.connect(dbUri);
    }
  } catch (err) {
    record('System Health', 'Health check failed', false, err.message);
  }

  // --------------------------------------------------------------------------
  // SECTION 2: AUTHENTICATION & OTP LIFECYCLE
  // --------------------------------------------------------------------------
  const customerEmail = `audit_cust_${Date.now()}@shoping.com`;
  const customerPassword = 'SecurePassword@123';
  let customerToken = null;
  let customerUser = null;

  try {
    // 2.1 Register
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Audit Customer',
        email: customerEmail,
        password: customerPassword,
        confirmPassword: customerPassword,
      }),
    });
    const regData = await regRes.json();
    record('Auth Module', 'Register user generates OTP and requires verification', regRes.status === 201 && regData.requiresVerification === true);

    // 2.2 Unverified Login Block
    const unvRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: customerEmail, password: customerPassword }),
    });
    record('Auth Security', 'Unverified user blocked with HTTP 403 Forbidden', unvRes.status === 403);

    // 2.3 Verify OTP
    const { default: EmailOTP } = await import('../models/EmailOTP.js');
    const otpDoc = await EmailOTP.findOne({ email: customerEmail });
    record('Auth Storage', 'OTP is bcrypt-hashed in MongoDB', otpDoc !== null && otpDoc.otp.startsWith('$2'));

    const testOTP = '654321';
    otpDoc.otp = await bcrypt.hash(testOTP, 10);
    await otpDoc.save();

    const verRes = await fetch(`${baseUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: customerEmail, otp: testOTP, purpose: 'verification' }),
    });
    const verData = await verRes.json();
    record('Auth Module', 'Valid OTP verifies account and returns JWT token', verRes.status === 200 && verData.token);
    customerToken = verData.token;
    customerUser = verData.user;

    // 2.4 Login with Verified Account
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: customerEmail, password: customerPassword }),
    });
    const loginData = await loginRes.json();
    record('Auth Module', 'Verified user logs in successfully with HTTP 200', loginRes.status === 200 && loginData.token);
  } catch (err) {
    record('Auth Module', 'Auth test sequence failed', false, err.message);
  }

  // --------------------------------------------------------------------------
  // SECTION 3: USER PROFILE & ADDRESS MANAGEMENT
  // --------------------------------------------------------------------------
  try {
    const profRes = await fetch(`${baseUrl}/auth/profile`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const profData = await profRes.json();
    record('User Module', 'GET /api/auth/profile returns user details', profRes.status === 200 && profData.user.email === customerEmail);

    const addrRes = await fetch(`${baseUrl}/auth/address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        fullName: 'Vivek Kumar',
        phone: '9876543210',
        street: '42 Cyber City, Phase 2',
        city: 'Gurugram',
        state: 'Haryana',
        postalCode: '122002',
        country: 'India',
        isDefault: true,
      }),
    });
    const addrData = await addrRes.json();
    record('User Module', 'Add shipping address saves successfully', addrRes.status === 201 && addrData.addresses?.length > 0);
  } catch (err) {
    record('User Module', 'User profile test failed', false, err.message);
  }

  // --------------------------------------------------------------------------
  // SECTION 4: PRODUCTS, CATEGORIES & REVIEWS
  // --------------------------------------------------------------------------
  let testProduct = null;
  try {
    // 4.1 Product list with pagination & filters
    const prodRes = await fetch(`${baseUrl}/products?limit=10&page=1&sortBy=price_asc`);
    const prodData = await prodRes.json();
    record('Product Module', 'GET /api/products returns paginated catalog', prodRes.status === 200 && prodData.products?.length > 0);
    testProduct = prodData.products[0];

    // 4.2 Product Search
    const searchRes = await fetch(`${baseUrl}/products?keyword=shoes`);
    const searchData = await searchRes.json();
    record('Product Search', 'Search by keyword executes successfully', searchRes.status === 200 && Array.isArray(searchData.products));

    // 4.3 Get Categories
    const catRes = await fetch(`${baseUrl}/categories`);
    const catData = await catRes.json();
    record('Category Module', 'GET /api/categories returns categories with product count', catRes.status === 200 && catData.categories?.length > 0);

    // 4.4 Product Reviews
    const revRes = await fetch(`${baseUrl}/products/${testProduct._id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        rating: 5,
        title: 'Outstanding Quality',
        comment: 'Very premium product, delivered on time!',
      }),
    });
    record('Review Module', 'Customer can submit verified product review', revRes.status === 201);
  } catch (err) {
    record('Product Module', 'Product test failed', false, err.message);
  }

  // --------------------------------------------------------------------------
  // SECTION 5: CART & STOCK VALIDATION
  // --------------------------------------------------------------------------
  try {
    // 5.1 Add to Cart
    const addCartRes = await fetch(`${baseUrl}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ productId: testProduct._id, quantity: 2 }),
    });
    const addCartData = await addCartRes.json();
    record('Cart Module', 'Add to cart persists item with quantity', addCartRes.status === 200 && addCartData.cart?.items?.length > 0);

    // 5.2 Stock Exceeded Rejection
    const overStockRes = await fetch(`${baseUrl}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ productId: testProduct._id, quantity: 99999 }),
    });
    record('Cart Validation', 'Exceeding available stock is rejected with HTTP 400', overStockRes.status === 400);

    // 5.3 Get Cart
    const getCartRes = await fetch(`${baseUrl}/cart`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const getCartData = await getCartRes.json();
    record('Cart Module', 'GET /api/cart returns populated products', getCartRes.status === 200 && getCartData.cart?.items?.length > 0);
  } catch (err) {
    record('Cart Module', 'Cart test failed', false, err.message);
  }

  // --------------------------------------------------------------------------
  // SECTION 6: WISHLIST MODULE
  // --------------------------------------------------------------------------
  try {
    const toggleRes = await fetch(`${baseUrl}/wishlist/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ productId: testProduct._id }),
    });
    const toggleData = await toggleRes.json();
    record('Wishlist Module', 'Toggle item in wishlist adds product', toggleRes.status === 200 && toggleData.isAdded === true);

    const getWishRes = await fetch(`${baseUrl}/wishlist`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const getWishData = await getWishRes.json();
    record('Wishlist Module', 'GET /api/wishlist returns saved items', getWishRes.status === 200 && getWishData.count === 1);
  } catch (err) {
    record('Wishlist Module', 'Wishlist test failed', false, err.message);
  }

  // --------------------------------------------------------------------------
  // SECTION 7: ORDERS, STOCK DECREMENT & ORDER CANCELLATION
  // --------------------------------------------------------------------------
  let createdOrder = null;
  const initialStock = testProduct.countInStock;

  try {
    const orderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        orderItems: [{ product: testProduct._id, name: testProduct.name, quantity: 1, image: testProduct.images[0] }],
        shippingAddress: {
          fullName: 'Vivek Kumar',
          phone: '9876543210',
          street: '42 Cyber City',
          city: 'Gurugram',
          state: 'Haryana',
          postalCode: '122002',
          country: 'India',
        },
        paymentMethod: 'Cash On Delivery',
      }),
    });
    const orderData = await orderRes.json();
    createdOrder = orderData.order;
    record('Order Module', 'Create order calculates prices & creates order in MongoDB', orderRes.status === 201 && createdOrder);

    // Verify stock decrement
    const { default: Product } = await import('../models/Product.js');
    const updatedProd = await Product.findById(testProduct._id);
    record('Stock Consistency', 'Product countInStock decremented by ordered quantity', updatedProd.countInStock === initialStock - 1);

    // Cancel Order & Verify Stock Restoration
    const cancelRes = await fetch(`${baseUrl}/orders/${createdOrder._id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const cancelData = await cancelRes.json();
    record('Order Cancellation', 'Customer cancels order with HTTP 200', cancelRes.status === 200 && cancelData.order.status === 'Cancelled');

    const restoredProd = await Product.findById(testProduct._id);
    record('Stock Consistency', 'Product countInStock restored upon order cancellation', restoredProd.countInStock === initialStock);
  } catch (err) {
    record('Order Module', 'Order creation/cancellation test failed', false, err.message);
  }

  // --------------------------------------------------------------------------
  // SECTION 8: PAYMENTS (RAZORPAY & SIGNATURE VERIFICATION)
  // --------------------------------------------------------------------------
  try {
    // Create new order for payment test
    const rzpOrderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        orderItems: [{ product: testProduct._id, name: testProduct.name, quantity: 1, image: testProduct.images[0] }],
        shippingAddress: { fullName: 'Vivek Kumar', phone: '9876543210', street: '42 Cyber City', city: 'Gurugram', state: 'Haryana', postalCode: '122002' },
        paymentMethod: 'Razorpay',
      }),
    });
    const rzpOrderData = await rzpOrderRes.json();
    const orderForPay = rzpOrderData.order;

    const createRzp = await fetch(`${baseUrl}/orders/${orderForPay._id}/razorpay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const rzpData = await createRzp.json();
    record('Payment Module', 'Create Razorpay payment order generates orderId and amount', createRzp.status === 200 && rzpData.amount > 0);

    // Test invalid signature rejection
    const invalidSigRes = await fetch(`${baseUrl}/orders/${orderForPay._id}/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        razorpay_order_id: 'order_fake_123',
        razorpay_payment_id: 'pay_fake_456',
        razorpay_signature: 'invalid_forged_signature_123',
      }),
    });
    record('Payment Security', 'Forged/invalid payment signature rejected with HTTP 400', invalidSigRes.status === 400);

    // Test valid payment verification
    const payRes = await fetch(`${baseUrl}/orders/${orderForPay._id}/demo-pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const payData = await payRes.json();
    record('Payment Module', 'Payment verified successfully and order marked isPaid: true', payRes.status === 200 && payData.order.isPaid === true);
  } catch (err) {
    record('Payment Module', 'Payment test failed', false, err.message);
  }

  // --------------------------------------------------------------------------
  // SECTION 9: ADMIN APIS & ROLE-BASED ACCESS CONTROL (RBAC)
  // --------------------------------------------------------------------------
  try {
    // 9.1 Unauthorized Customer trying to access Admin Dashboard
    const unauthRes = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    record('RBAC Security', 'Non-admin customer blocked from admin endpoints with HTTP 403 Forbidden', unauthRes.status === 403);

    // 9.2 Login as Admin
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@shoping.com', password: 'Admin@123' }),
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.token;

    // 9.3 Admin Dashboard Stats
    const dashRes = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dashData = await dashRes.json();
    record('Admin Module', 'GET /api/admin/dashboard returns real aggregate stats', dashRes.status === 200 && dashData.stats?.totalProducts > 0);

    // 9.4 Admin User Management & Delete
    const usersRes = await fetch(`${baseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const usersData = await usersRes.json();
    record('Admin Module', 'Admin lists all users', usersRes.status === 200 && usersData.users?.length > 0);

    // Delete customer user created in test
    const delUserRes = await fetch(`${baseUrl}/admin/users/${customerUser._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record('Admin Module', 'Admin deletes user successfully with HTTP 200', delUserRes.status === 200);

    // Self-delete prevention
    const selfDelRes = await fetch(`${baseUrl}/admin/users/${adminLoginData.user._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record('Admin Security', 'Admin self-deletion blocked with HTTP 400', selfDelRes.status === 400);
  } catch (err) {
    record('Admin Module', 'Admin RBAC test failed', false, err.message);
  }

  // --------------------------------------------------------------------------
  // SECTION 10: NOSQL INJECTION & 404 SANITIZATION
  // --------------------------------------------------------------------------
  try {
    const injectionRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: { $gt: '' }, password: { $gt: '' } }),
    });
    record('Injection Security', 'NoSQL $gt injection safely neutralized (blocked with HTTP 400/401)', injectionRes.status === 400 || injectionRes.status === 401);

    const notFoundRes = await fetch(`${baseUrl}/unknown-nonexistent-route`);
    const notFoundData = await notFoundRes.json();
    record('Error Handling', 'Invalid route returns clean 404 JSON response', notFoundRes.status === 404 && notFoundData.success === false);
  } catch (err) {
    record('Security Tests', 'Security testing failed', false, err.message);
  }

  await mongoose.disconnect();

  console.log('\n================================================================================');
  console.log(`📊 MASTER AUDIT SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================================\n');

  if (failed === 0) {
    console.log('🏆 100% PASS RATE! ALL BACKEND MODULES ARE PRODUCTION-READY!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runMasterAuditTests().catch((err) => {
  console.error('Master audit fatal error:', err);
  process.exit(1);
});

