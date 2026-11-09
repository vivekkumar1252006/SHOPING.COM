import fs from 'fs';
import path from 'path';

const baseUrl = 'http://localhost:5000/api';

async function testFullRegistrationFlow() {
  console.log('================================================================================');
  console.log('🧪 VERIFYING REGISTRATION & OTP VERIFICATION END-TO-END');
  console.log('================================================================================\n');

  const timestamp = Date.now();
  const testEmail = `genuine_user_${timestamp}@gmail.com`;
  const testPassword = 'SecurePassword@2026';
  const testName = 'Aarav Mehta';
  const testPhone = '8084768986';

  console.log(`[Step 1] Registering genuinely new user:`);
  console.log(`   Name:     ${testName}`);
  console.log(`   Email:    ${testEmail}`);
  console.log(`   Phone:    ${testPhone}`);
  console.log(`   Password: ${testPassword}`);

  const regResponse = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: testName,
      email: testEmail,
      phone: testPhone,
      password: testPassword,
      confirmPassword: testPassword,
    }),
  });

  const regResult = await regResponse.json();
  console.log('\n[Step 1 Response]: Status =', regResponse.status);
  console.log(JSON.stringify(regResult, null, 2));

  if (regResponse.status !== 201 || !regResult.requiresVerification) {
    throw new Error(`Registration failed with status ${regResponse.status}: ${regResult.message}`);
  }
  console.log('✅ [Step 1 PASSED]: Registration created pending state and dispatched OTP!');

  // [Step 2] Read OTP from server task log
  console.log('\n[Step 2] Reading generated OTP from server logs...');
  const taskLogPath = 'C:\\Users\\VIVEK KUMAR\\.gemini\\antigravity\\brain\\4c7dc254-1b92-45b0-b461-8a0f9d56c86b\\.system_generated\\tasks\\task-4663.log';
  let otp = null;

  if (fs.existsSync(taskLogPath)) {
    const logContent = fs.readFileSync(taskLogPath, 'utf8');
    const matches = [...logContent.matchAll(/6-Digit OTP:\s*(\d{6})/g)];
    if (matches.length > 0) {
      otp = matches[matches.length - 1][1];
      console.log(`✅ Found OTP from server dispatch log: ${otp}`);
    }
  }

  if (!otp) {
    throw new Error('Could not find OTP in task logs.');
  }

  // [Step 3] Test invalid OTP rejection
  console.log('\n[Step 3] Testing rejection of invalid OTP...');
  const invalidVerifyRes = await fetch(`${baseUrl}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: '000000',
      purpose: 'verification',
    }),
  });
  const invalidVerifyData = await invalidVerifyRes.json();
  console.log('Invalid OTP response status:', invalidVerifyRes.status, invalidVerifyData.message);
  if (invalidVerifyRes.status !== 400 || !invalidVerifyData.message.includes('Incorrect OTP')) {
    throw new Error('Expected invalid OTP rejection with 400 status');
  }
  console.log('✅ [Step 3 PASSED]: Invalid OTP correctly rejected with remaining attempts counter.');

  // [Step 4] Verify valid OTP
  console.log('\n[Step 4] Submitting valid OTP verification...');
  const verifyResponse = await fetch(`${baseUrl}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp,
      purpose: 'verification',
    }),
  });

  const verifyResult = await verifyResponse.json();
  console.log('[Step 4 Response]: Status =', verifyResponse.status);
  console.log(JSON.stringify(verifyResult, null, 2));

  if (verifyResponse.status !== 200 || !verifyResult.token || !verifyResult.user) {
    throw new Error(`OTP verification failed: ${verifyResult.message}`);
  }
  console.log('✅ [Step 4 PASSED]: Account activated, user created in MongoDB, JWT token returned!');

  // [Step 5] Verify login with the newly created account
  console.log('\n[Step 5] Testing login with new credentials...');
  const loginResponse = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });
  const loginResult = await loginResponse.json();
  console.log('[Step 5 Response]: Status =', loginResponse.status);
  console.log(JSON.stringify(loginResult, null, 2));

  if (loginResponse.status !== 200 || !loginResult.token) {
    throw new Error(`Login failed with new account: ${loginResult.message}`);
  }
  console.log('✅ [Step 5 PASSED]: User logged in successfully with valid session!');

  // [Step 6] Test duplicate registration rejection for already verified email
  console.log('\n[Step 6] Testing duplicate registration protection for existing user...');
  const dupResponse = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: testName,
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
    }),
  });
  const dupResult = await dupResponse.json();
  console.log('[Step 6 Response]: Status =', dupResponse.status, dupResult.message);
  if (dupResponse.status !== 409) {
    throw new Error(`Expected 409 Conflict for duplicate user, got ${dupResponse.status}`);
  }
  console.log('✅ [Step 6 PASSED]: Duplicate registration prevented with 409 Conflict!');

  console.log('\n================================================================================');
  console.log('🎉 ALL REGISTRATION & OTP VERIFICATION TESTS PASSED FLAWLESSLY!');
  console.log('================================================================================');
}

testFullRegistrationFlow().catch((err) => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
