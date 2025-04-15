/**
 * Simple plaintext password comparison
 */
export function comparePassword(plainPassword: string, storedPassword: string): boolean {
  return plainPassword === storedPassword;
}
