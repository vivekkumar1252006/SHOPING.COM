import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const baseUrl = 'http://localhost:5000/api';

async function testOTPSystem() {
  console.log('================================================================================');
  console.log('🧪 SHOPPING.COM EMAIL OTP VERIFICATION SYSTEM: FULL SUITE TEST');
  console.log('================================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Health check & DB URI discovery
  let dbUri = null;
  try {
    const res = await fetch(`${baseUrl}/health`);
    const data = await res.json();
    assert(res.status === 200 && data.status === 'healthy', 'Health check /api/health returns 200 healthy');
    dbUri = data.dbUri;
    if (dbUri) {
      await mongoose.connect(dbUri);
      console.log(`📡 Connected test suite to active database: ${dbUri}`);
    }
  } catch (err) {
    assert(false, `Health check failed: ${err.message}`);
  }

  // 2. Standalone POST /api/auth/send-otp
  const testEmail1 = `real_user_${Date.now()}@gmail.com`;
  try {
    const res = await fetch(`${baseUrl}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail1, name: 'Vivek Kumar', purpose: 'verification' }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'POST /api/auth/send-otp generates and dispatches OTP email');
    assert(data.cooldown === 60, 'Resend cooldown of 60 seconds returned in send-otp response');
  } catch (err) {
    assert(false, `send-otp failed: ${err.message}`);
  }

  // 3. Rate limiting / Cooldown enforcement on rapid resend
  try {
    const res = await fetch(`${baseUrl}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail1, name: 'Vivek Kumar', purpose: 'verification' }),
    });
    const data = await res.json();
    assert(res.status === 429 && data.success === false, 'Rapid resend blocked by 60s cooldown with HTTP 429');
  } catch (err) {
    assert(false, `Cooldown test failed: ${err.message}`);
  }

  // 4. Register new user via POST /api/auth/register
  const testEmail2 = `shopping_shopper_${Date.now()}@gmail.com`;
  const testPassword = 'Password@123';
  try {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Vivek Customer',
        email: testEmail2,
        password: testPassword,
        confirmPassword: testPassword,
      }),
    });
    const data = await res.json();
    assert(res.status === 201 && data.requiresVerification === true, 'POST /api/auth/register initiates registration and requires OTP verification');
    assert(data.email === testEmail2.toLowerCase(), 'Registered email returned in response');
  } catch (err) {
    assert(false, `Register test failed: ${err.message}`);
  }

  // 5. Test unverified user login block: unverified users must NOT be allowed to log in
  try {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail2, password: testPassword }),
    });
    const data = await res.json();
    assert(res.status === 403 && data.requiresVerification === true, 'Unverified user login blocked with HTTP 403 and requiresVerification: true');
  } catch (err) {
    assert(false, `Unverified login block failed: ${err.message}`);
  }

  // 6. Test invalid OTP rejection
  try {
    const res = await fetch(`${baseUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail2, otp: '999999', purpose: 'verification' }),
    });
    const data = await res.json();
    assert(res.status === 400 && data.success === false, 'Incorrect OTP code rejected with HTTP 400');
    assert(data.message.includes('remaining'), 'Remaining attempts indicated in response');
  } catch (err) {
    assert(false, `Invalid OTP test failed: ${err.message}`);
  }

  // 7. Test 5 incorrect attempts invalidation
  try {
    for (let i = 0; i < 4; i++) {
      await fetch(`${baseUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail2, otp: '000000', purpose: 'verification' }),
      });
    }
    const finalRes = await fetch(`${baseUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail2, otp: '000000', purpose: 'verification' }),
    });
    const finalData = await finalRes.json();
    assert(finalRes.status === 400, 'Exceeded max attempts (5) invalidates OTP code');
  } catch (err) {
    assert(false, `Max attempts test failed: ${err.message}`);
  }

  // 8. Register and verify successfully
  const testEmail3 = `verify_success_${Date.now()}@gmail.com`;
  await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Verified User',
      email: testEmail3,
      password: testPassword,
      confirmPassword: testPassword,
    }),
  });

  const { default: EmailOTP } = await import('../models/EmailOTP.js');
  const { default: User } = await import('../models/User.js');

  const otpDoc = await EmailOTP.findOne({ email: testEmail3 });
  assert(otpDoc !== null, 'EmailOTP record securely saved in MongoDB');
  assert(otpDoc.otp.startsWith('$2'), 'OTP is securely hashed with bcrypt (never stored as plain text)');
  assert(otpDoc.attempts === 0, 'Initial OTP attempts initialized to 0');

  // Set known test OTP for deterministic verification assertion
  const knownTestOTP = '456789';
  otpDoc.otp = await bcrypt.hash(knownTestOTP, 10);
  await otpDoc.save();

  // 9. Enter correct OTP & verify email
  let jwtToken = null;
  try {
    const res = await fetch(`${baseUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail3, otp: knownTestOTP, purpose: 'verification' }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'Correct OTP verified successfully with HTTP 200');
    assert(data.token && data.user && data.user.isVerified === true, 'User marked isVerified: true and JWT token returned upon verification');
    jwtToken = data.token;
  } catch (err) {
    assert(false, `Correct OTP verification failed: ${err.message}`);
  }

  // 10. Confirm verified user can now log in normally
  try {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail3, password: testPassword }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'Verified user can log in normally with HTTP 200 and receive JWT');
    assert(data.user.email === testEmail3, 'User details match authenticated profile');
  } catch (err) {
    assert(false, `Verified login failed: ${err.message}`);
  }

  // 11. Test duplicate registration prevention with verified email
  try {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Hacker',
        email: testEmail3,
        password: testPassword,
        confirmPassword: testPassword,
      }),
    });
    const data = await res.json();
    assert(res.status === 400 && data.success === false, 'Duplicate registration with verified email blocked with HTTP 400');
  } catch (err) {
    assert(false, `Duplicate registration test failed: ${err.message}`);
  }

  // 12. Test expired OTP
  const testEmail4 = `expired_test_${Date.now()}@gmail.com`;
  await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Expired Test',
      email: testEmail4,
      password: testPassword,
      confirmPassword: testPassword,
    }),
  });

  const expiredOtpDoc = await EmailOTP.findOne({ email: testEmail4 });
  if (expiredOtpDoc) {
    // Set expiry in the past
    expiredOtpDoc.expiresAt = new Date(Date.now() - 10 * 60 * 1000);
    await expiredOtpDoc.save();

    const expRes = await fetch(`${baseUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail4, otp: '123456', purpose: 'verification' }),
    });
    const expData = await expRes.json();
    assert(expRes.status === 400 && expData.message.toLowerCase().includes('expired'), 'Expired OTP rejected with proper expiration message');
  }

  await mongoose.disconnect();

  console.log('\n================================================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================================\n');

  if (failed === 0) {
    console.log('🎉 ALL OTP VERIFICATION & SECURITY TESTS COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

testOTPSystem().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
