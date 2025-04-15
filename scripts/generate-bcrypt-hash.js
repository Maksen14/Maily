const bcrypt = require('bcrypt');

async function generateHash() {
  // Use the password you want to hash
  const password = "maksen26"; // Replace with your desired password
  
  try {
    // Generate a hash with 10 salt rounds
    const hash = await bcrypt.hash(password, 10);
    console.log("\nBcrypt hash for your password:");
    console.log(hash);
    console.log("\nAdd this to your .env.local file as:");
    console.log("HASHED_PASSWORD=" + hash + "\n");
  } catch (error) {
    console.error("Error generating hash:", error);
  }
}

generateHash(); 