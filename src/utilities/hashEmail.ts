import crypto from 'crypto';

export function hashEmail(email: string) : string  {
    if(!process.env.HASH_PEPPER)
    {
      throw new Error('HASH_PEPPER environment variable is required for email hashing');
    }
    const HASH_PEPPER = process.env.HASH_PEPPER;

    const hashedEmail = crypto
    .createHmac("sha256", HASH_PEPPER)
    .update(email.toLowerCase())
    .digest("hex");

    return hashedEmail;
}