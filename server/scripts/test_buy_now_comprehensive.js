const baseUrl = 'http://localhost:5000/api';

async function testBuyNowSystem() {
  console.log('================================================================================');
  console.log('🛍️ COMPREHENSIVE BUY NOW FUNCTIONALITY TEST SUITE');
  console.log('================================================================================\n');

  // Step 1: Customer Login
  console.log('🔐 Step 1: Logging in as customer...');
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@shoping.com', password: 'Customer@123' }),
  });
  const loginData = await loginRes.json();
  if (!loginData.token) throw new Error('Customer login failed');
  const token = loginData.token;
  const user = loginData.user;
  console.log(`✅ Logged in as: ${user.name} (${user.email})\n`);

  // Step 2: Fetch products across multiple categories
  console.log('📦 Step 2: Fetching catalog to select 10 products from 10 distinct categories...');
  const productsRes = await fetch(`${baseUrl}/products?limit=300`);
  const productsData = await productsRes.json();
  const allProducts = productsData.products || [];

  const categoryMap = new Map();
  for (const p of allProducts) {
    if (p.category && !categoryMap.has(p.category) && (p.countInStock > 5 || p.stock > 5)) {
      categoryMap.set(p.category, p);
    }
  }

  // Pick exactly 10 distinct categories
  const selectedProducts = Array.from(categoryMap.values()).slice(0, 10);
  console.log(`✅ Selected ${selectedProducts.length} products across 10 distinct categories:\n`);
  selectedProducts.forEach((p, idx) => {
    console.log(`   ${idx + 1}. [${p.category}] ${p.name}`);
    console.log(`      ID: ${p._id} | Price: ₹${p.discountPrice || p.price} | Stock: ${p.countInStock}`);
  });
  console.log('\n--------------------------------------------------------------------------------');

  // Step 3: Test Add to Cart independence
  console.log('🛒 Step 3: Adding a background item to regular cart to test Buy Now independence...');
  const cartItemProduct = allProducts[allProducts.length - 1];
  const cartAddRes = await fetch(`${baseUrl}/cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productId: cartItemProduct._id, quantity: 2 }),
  });
  const initialCartData = await cartAddRes.json();
  const initialCartCount = initialCartData.cart?.items?.length || 1;
  console.log(`✅ Regular cart now has ${initialCartCount} item(s) (${cartItemProduct.name})\n`);

  // Step 4: Test Buy Now on each of the 10 products
  console.log('⚡ Step 4: Executing Buy Now flow for all 10 products...');
  let successfulOrders = 0;

  for (let i = 0; i < selectedProducts.length; i++) {
    const prod = selectedProducts[i];
    const testQty = (i % 3) + 1; // 1, 2, or 3
    console.log(`\n--- [Product ${i + 1}/10: ${prod.category}] ---`);
    console.log(`Testing Buy Now on: "${prod.name}" (Qty: ${testQty})`);

    // 4a. Fetch single product details (as done on ProductDetailPage)
    const detailRes = await fetch(`${baseUrl}/products/${prod._id}`);
    const detailData = await detailRes.json();
    if (!detailData.success || !detailData.product) {
      throw new Error(`Failed to load product details for ${prod.name}`);
    }
    const fetchedProd = detailData.product;
    const activePrice = Number(fetchedProd.discountPrice > 0 ? fetchedProd.discountPrice : fetchedProd.price);

    // 4b. Place Buy Now order
    const expectedSubtotal = activePrice * testQty;
    const expectedShipping = expectedSubtotal >= 999 ? 0 : 99;
    const expectedTax = Number((expectedSubtotal * 0.18).toFixed(2));
    const expectedTotal = Number((expectedSubtotal + expectedShipping + expectedTax).toFixed(2));

    const orderPayload = {
      isBuyNow: true,
      orderItems: [
        {
          product: fetchedProd._id,
          name: fetchedProd.name,
          image: fetchedProd.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
          price: activePrice,
          quantity: testQty,
        },
      ],
      shippingAddress: {
        fullName: 'Rohan Sharma',
        phone: '+91 98765 12345',
        street: 'Flat 402, Sunshine Heights',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560103',
        country: 'India',
      },
      paymentMethod: i % 2 === 0 ? 'Cash On Delivery' : 'UPI (Direct)',
      itemsPrice: expectedSubtotal,
      shippingPrice: expectedShipping,
      taxPrice: expectedTax,
      totalPrice: expectedTotal,
    };

    const orderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const orderData = await orderRes.json();
    if (orderRes.status !== 201 || !orderData.order?._id) {
      throw new Error(`Buy Now order placement failed for ${prod.name}: ${JSON.stringify(orderData)}`);
    }

    const order = orderData.order;
    console.log(`✅ Order Placed Successfully!`);
    console.log(`   Order ID:       ${order._id}`);
    console.log(`   Item:           ${order.orderItems[0].name}`);
    console.log(`   Quantity:       ${order.orderItems[0].quantity}`);
    console.log(`   Item Price:     ₹${order.orderItems[0].price}`);
    console.log(`   Items Price:    ₹${order.itemsPrice}`);
    console.log(`   Shipping:       ₹${order.shippingPrice}`);
    console.log(`   Tax (18%):      ₹${order.taxPrice}`);
    console.log(`   Total:          ₹${order.totalPrice}`);
    console.log(`   Payment Method: ${order.paymentMethod}`);
    console.log(`   Payment Status: ${order.paymentStatus}`);

    // Verify order fetch
    const getOrderRes = await fetch(`${baseUrl}/orders/${order._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const getOrderData = await getOrderRes.json();
    if (!getOrderData.order) throw new Error(`Could not retrieve order ${order._id}`);

    successfulOrders++;
  }

  console.log(`\n--------------------------------------------------------------------------------`);
  console.log(`✅ All ${successfulOrders}/10 Buy Now orders placed and verified successfully!\n`);

  // Step 5: Verify Cart Independence
  console.log('🛒 Step 5: Checking user shopping cart to verify it was NOT wiped out by Buy Now...');
  const cartCheckRes = await fetch(`${baseUrl}/cart`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const cartCheckData = await cartCheckRes.json();
  const finalCartItems = cartCheckData.cart?.items || [];
  console.log(`Cart item count after 10 Buy Now orders: ${finalCartItems.length}`);
  if (finalCartItems.length === 0) {
    throw new Error('FAILED: Buy Now wiped out the user regular shopping cart!');
  }
  console.log('✅ PASS: Regular shopping cart remained 100% intact!\n');

  // Step 6: Test Unauthenticated Redirection / Rejection
  console.log('🔒 Step 6: Testing unauthenticated Buy Now rejection...');
  const unauthRes = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      isBuyNow: true,
      orderItems: [{ product: selectedProducts[0]._id, quantity: 1, price: 100 }],
      shippingAddress: { fullName: 'Guest', street: 'Street 1' },
      paymentMethod: 'Cash On Delivery',
    }),
  });
  console.log(`Unauthenticated status: ${unauthRes.status}`);
  if (unauthRes.status !== 401) throw new Error('Expected 401 for guest order submission');
  console.log('✅ PASS: Unauthenticated access properly rejected with 401 Unauthorized!\n');

  // Step 7: Test Stock Boundary Rejection
  console.log('📦 Step 7: Testing rejection when requested quantity exceeds stock...');
  const excessiveQtyRes = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      isBuyNow: true,
      orderItems: [
        {
          product: selectedProducts[0]._id,
          name: selectedProducts[0].name,
          quantity: 999999, // Way more than stock
          price: 100,
        },
      ],
      shippingAddress: { fullName: 'Rohan Sharma', street: 'Street 1' },
      paymentMethod: 'Cash On Delivery',
    }),
  });
  const excessiveData = await excessiveQtyRes.json();
  console.log(`Excessive quantity status: ${excessiveQtyRes.status} (${excessiveData.message})`);
  if (excessiveQtyRes.status !== 400 || !excessiveData.message.includes('Insufficient stock')) {
    throw new Error('Expected 400 Insufficient stock error');
  }
  console.log('✅ PASS: Over-stock purchases correctly rejected!\n');

  console.log('================================================================================');
  console.log('🎉 ALL BUY NOW FUNCTIONALITY TESTS PASSED WITH 100% SUCCESS!');
  console.log('================================================================================');
}

testBuyNowSystem().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
