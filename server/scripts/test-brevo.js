import { runBrevoDiagnostic } from '../utils/brevoDiagnostic.js';

const targetEmail = process.argv[2] || process.env.BREVO_SENDER_EMAIL || 'vivek8986kumarr@gmail.com';

console.log('\n================================================================================');
console.log('🔍 BREVO TRANSACTIONAL EMAIL INTEGRATION DIAGNOSTIC');
console.log(`Target Test Recipient: ${targetEmail}`);
console.log('================================================================================\n');

try {
  const result = await runBrevoDiagnostic(targetEmail);
  console.log(JSON.stringify(result, null, 2));

  console.log('\n--------------------------------------------------------------------------------');
  if (result.overallSuccess) {
    console.log('🎉 DIAGNOSTIC PASSED: Brevo transactional email system is fully functional!');
    if (result.step6_transactionalSubmission?.messageId) {
      console.log(`📨 Message ID: ${result.step6_transactionalSubmission.messageId}`);
      console.log(`📬 Real email dispatched to: ${targetEmail}`);
    }
  } else {
    console.error('❌ DIAGNOSTIC FAILED: Delivery issue detected.');
    console.error(`Error: ${result.errorMessage}`);
    if (result.actionableAdvice) {
      console.log(`💡 Solution: ${result.actionableAdvice}`);
    }
  }
  console.log('================================================================================\n');
} catch (err) {
  console.error('Unexpected error running diagnostic:', err);
}

