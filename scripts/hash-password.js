// Simple script to generate a hashed password for .env file
const crypto = require('crypto');

// This should be the same hashing function used in your auth code
function hashPassword(password) {
  return crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
}

// Get password from command line argument
const password = process.argv[2];

if (!password) {
  console.error('Please provide a password as an argument:');
  console.error('node hash-password.js yourpassword');
  process.exit(1);
}

const hashedPassword = hashPassword(password);

console.log('\nHashed password for .env:');
console.log('EMAIL_APP_PASSWORD_HASH=' + hashedPassword);
console.log('\nAdd this to your .env.local file and remove the plaintext EMAIL_APP_PASSWORD line.\n'); 