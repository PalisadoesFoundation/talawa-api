import crypto from 'crypto';

/**
 * Securely hashes email addresses using HMAC-SHA256.
 * 
 * SECURITY NOTICE:
 * - Requires HASH_PEPPER environment variable
 * - Used for storing emails in database
 * - Do not use for password hashing
 * 
 * @param email - The email address to hash
 * @returns The hashed email in hex format
 * @throws {Error} If email is invalid or HASH_PEPPER is missing
 */

export function hashEmail(email: string) : string  {
  if (!email || typeof email !== 'string') {
        throw new Error('Email parameter must be a non-empty string');
      }
    if(!process.env.HASH_PEPPER)
    {
        throw new Error('Missing HASH_PEPPER environment variable required for secure email hashing');
    }

    const hashedEmail = crypto
    .createHmac("sha256", process.env.HASH_PEPPER)
    .update(email.toLowerCase())
    .digest("hex");

    return hashedEmail;
}

export function compareHashedEmails(a: string, b: string): boolean {
    if (!a || !b || typeof a !== 'string' || typeof b !== 'string') {
      return false;
    }
    
    if (!/^[0-9a-f]+$/i.test(a) || !/^[0-9a-f]+$/i.test(b)) {
      return false;
    }
  
    try {
       return crypto.timingSafeEqual(
         Buffer.from(a, 'hex'),
         Buffer.from(b, 'hex')
       );
    } catch (error) {
      return false;
    }
   }