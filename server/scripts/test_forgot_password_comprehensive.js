import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import EmailOTP from '../models/EmailOTP.js';

const baseUrl = 'http://localhost:5000/api';

async function runTestSuite() {
  console.log('================================================================================');
  console.log('🔐 FORGOT PASSWORD & AUTHENTICATION COMPREHENSIVE TEST SUITE');
  console.log('================================================================================\n');

  // Step 0: Check backend health and connect directly to DB to inspect records
  const healthRes = await fetch(`${baseUrl}/health`);
  const health = await healthRes.json();
  console.log('Backend health:', health.status, '| Database:', health.database);
  if (!health.dbUri) throw new Error('Health check did not return dbUri');

  await mongoose.connect(health.dbUri);
  console.log('✅ Connected to MongoDB at:', health.dbUri);
  const dbName = mongoose.connection.name;
  console.log('MongoDB Database name:', dbName);

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections in database:', collections.map(c => c.name).join(', '));


  console.log('\n--------------------------------------------------------------------------------');
  console.log('TEST 1: Existing registered email -> Reset OTP sent');
  console.log('--------------------------------------------------------------------------------');
  // Clear any active cooldowns for customer@shoping.com to start fresh
  await EmailOTP.deleteMany({ email: 'customer@shoping.com' });

  const res1 = await fetch(`${baseUrl}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@shoping.com' }),
  });
  const data1 = await res1.json();
  console.log('Response status:', res1.status);
  console.log('Response payload:', data1);
  if (res1.status !== 200 || !data1.success) {
    throw new Error(`TEST 1 FAILED: Expected 200, got ${res1.status}`);
  }
  console.log('✅ TEST 1 PASSED: Reset OTP sent to registered email');

  console.log('\n--------------------------------------------------------------------------------');
  console.log('TEST 2: Existing email with UPPERCASE letters -> Correct lookup');
  console.log('--------------------------------------------------------------------------------');
  // Clear cooldown for test
  await EmailOTP.deleteMany({ email: 'customer@shoping.com' });

  const res2 = await fetch(`${baseUrl}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'CUSTOMER@SHOPING.COM' }),
  });
  const data2 = await res2.json();
  console.log('Response status:', res2.status);
  console.log('Response payload:', data2);
  if (res2.status !== 200 || !data2.success) {
    throw new Error(`TEST 2 FAILED: Expected 200, got ${res2.status}`);
  }
  console.log('✅ TEST 2 PASSED: Uppercase email correctly normalized and found');

  console.log('\n--------------------------------------------------------------------------------');
  console.log('TEST 3: Existing email with EXTRA SPACES -> Correct lookup');
  console.log('--------------------------------------------------------------------------------');
  // Clear cooldown for test
  await EmailOTP.deleteMany({ email: 'customer@shoping.com' });

  const res3 = await fetch(`${baseUrl}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '   customer@shoping.com   ' }),
  });
  const data3 = await res3.json();
  console.log('Response status:', res3.status);
  console.log('Response payload:', data3);
  if (res3.status !== 200 || !data3.success) {
    throw new Error(`TEST 3 FAILED: Expected 200, got ${res3.status}`);
  }
  console.log('✅ TEST 3 PASSED: Extra spaces trimmed and user found');

  console.log('\n--------------------------------------------------------------------------------');
  console.log('TEST 4: Unregistered email -> Appropriate error (404)');
  console.log('--------------------------------------------------------------------------------');
  const res4 = await fetch(`${baseUrl}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nonexistent.user.999@example.com' }),
  });
  const data4 = await res4.json();
  console.log('Response status:', res4.status);
  console.log('Response payload:', data4);
  if (res4.status !== 404 || data4.message !== 'No account registered with this email address') {
    throw new Error(`TEST 4 FAILED: Expected 404 with "No account registered with this email address", got ${res4.status}`);
  }
  console.log('✅ TEST 4 PASSED: Unregistered email properly returns 404 No account registered');

  console.log('\n--------------------------------------------------------------------------------');
  console.log('TEST 5: End-to-End Registration -> Forgot Password -> OTP Verification -> Reset -> Login');
  console.log('--------------------------------------------------------------------------------');
  const testEmail = `newuser_${Date.now()}@testshop.com`;
  const initialPassword = 'InitialPass@123';
  const newPassword = 'NewSecretPass@2026';

  console.log(`1. Registering new user: ${testEmail}`);
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Reset User',
      email: testEmail,
      password: initialPassword,
      confirmPassword: initialPassword,
      phone: '9876543210',
    }),
  });
  const regData = await regRes.json();
  console.log('Registration status:', regRes.status, '| Payload:', regData);
  if (regRes.status !== 201) throw new Error('Registration failed');

  // Verify that the user record was saved directly in the 'users' collection!
  const userInDb = await User.findOne({ email: testEmail });
  if (!userInDb) {
    throw new Error('FAILED: Registered user was not found in User (users collection)!');
  }
  console.log(`✅ Verified: User record created in MongoDB collection "${User.collection.name}":`, {
    _id: userInDb._id,
    name: userInDb.name,
    email: userInDb.email,
    isVerified: userInDb.isVerified,
  });

  console.log(`\n2. Requesting Forgot Password for newly registered user: ${testEmail}`);
  // Clear any cooldown for clean test
  await EmailOTP.deleteMany({ email: testEmail, purpose: 'password_reset' });

  const forgotRes = await fetch(`${baseUrl}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail }),
  });
  const forgotData = await forgotRes.json();
  console.log('Forgot password status:', forgotRes.status, '| Payload:', forgotData);
  if (forgotRes.status !== 200 || !forgotData.success) {
    throw new Error('Forgot password request failed for newly registered user');
  }
  console.log('✅ Verified: Forgot Password successfully found newly registered user in User collection!');

  // Check the generated OTP in MongoDB EmailOTP collection
  const otpDoc = await EmailOTP.findOne({ email: testEmail, purpose: 'password_reset' }).sort({ createdAt: -1 });
  if (!otpDoc) throw new Error('No OTP record created in EmailOTP collection');
  console.log('OTP record created in EmailOTP collection with hashed value:', otpDoc.otp.slice(0, 15) + '...');

  console.log('\n--------------------------------------------------------------------------------');
  console.log('TEST 6: Incorrect OTP -> Rejected (400)');
  console.log('--------------------------------------------------------------------------------');
  const badOtpRes = await fetch(`${baseUrl}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: '000000',
      newPassword,
      confirmPassword: newPassword,
    }),
  });
  const badOtpData = await badOtpRes.json();
  console.log('Incorrect OTP response status:', badOtpRes.status, '| Payload:', badOtpData);
  if (badOtpRes.status !== 400 || !badOtpData.message.includes('Incorrect code')) {
    throw new Error(`TEST 6 FAILED: Expected 400 Incorrect code, got ${badOtpRes.status}`);
  }
  console.log('✅ TEST 6 PASSED: Incorrect OTP properly rejected');

  console.log('\n--------------------------------------------------------------------------------');
  console.log('TEST 7: Expired OTP -> Rejected (400)');
  console.log('--------------------------------------------------------------------------------');
  // Temporarily set expiresAt to past
  await EmailOTP.updateOne(
    { _id: otpDoc._id },
    { $set: { expiresAt: new Date(Date.now() - 10000) } }
  );
  const expiredOtpRes = await fetch(`${baseUrl}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: '123456',
      newPassword,
      confirmPassword: newPassword,
    }),
  });
  const expiredOtpData = await expiredOtpRes.json();
  console.log('Expired OTP response status:', expiredOtpRes.status, '| Payload:', expiredOtpData);
  if (expiredOtpRes.status !== 400 || !expiredOtpData.message.includes('expired')) {
    throw new Error(`TEST 7 FAILED: Expected 400 expired code, got ${expiredOtpRes.status}`);
  }
  console.log('✅ TEST 7 PASSED: Expired OTP properly rejected');

  console.log('\n--------------------------------------------------------------------------------');
  console.log('TEST 8: Correct OTP -> Password Reset Successful');
  console.log('--------------------------------------------------------------------------------');
  // Set a known OTP and re-hash it for clean verification
  const knownOtp = '582914';
  const hashedKnownOtp = await bcrypt.hash(knownOtp, 10);
  await EmailOTP.updateOne(
    { _id: otpDoc._id },
    {
      $set: {
        otp: hashedKnownOtp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 0,
      },
    }
  );

  const resetSuccessRes = await fetch(`${baseUrl}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: knownOtp,
      newPassword,
      confirmPassword: newPassword,
    }),
  });
  const resetSuccessData = await resetSuccessRes.json();
  console.log('Reset response status:', resetSuccessRes.status, '| Payload:', resetSuccessData);
  if (resetSuccessRes.status !== 200 || !resetSuccessData.success) {
    throw new Error('Password reset failed with correct OTP');
  }

  // Check that used OTP was invalidated/deleted
  const remainingOtps = await EmailOTP.find({ email: testEmail, purpose: 'password_reset' });
  if (remainingOtps.length !== 0) {
    throw new Error('Used OTP was not deleted after successful reset');
  }
  console.log('✅ Used OTP invalidated and deleted from EmailOTP collection');
  console.log('✅ TEST 8 PASSED: Password reset successful with correct OTP');

  console.log('\n--------------------------------------------------------------------------------');
  console.log('TEST 9: Login with Old Password (MUST FAIL) & New Password (MUST SUCCEED)');
  console.log('--------------------------------------------------------------------------------');
  // Old password attempt
  const oldLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: initialPassword }),
  });
  console.log('Old password login status:', oldLoginRes.status, '(expected 401)');
  if (oldLoginRes.status !== 401) throw new Error('Old password was not invalidated!');

  // New password attempt
  const newLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: newPassword }),
  });
  const newLoginData = await newLoginRes.json();
  console.log('New password login status:', newLoginRes.status, '| Payload:', {
    success: newLoginData.success,
    hasToken: Boolean(newLoginData.token),
    user: newLoginData.user?.email,
  });
  if (newLoginRes.status !== 200 || !newLoginData.token) {
    throw new Error('New password login failed!');
  }
  console.log('✅ TEST 9 PASSED: Login with new password succeeded and issued auth token!');

  console.log('\n================================================================================');
  console.log('🎉 ALL FORGOT PASSWORD & AUTHENTICATION TESTS PASSED WITH 100% SUCCESS!');
  console.log('================================================================================\n');

  await mongoose.disconnect();
}

runTestSuite().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
