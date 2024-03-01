/**
 * The function `isValidEmail` checks if a given email address is valid according to a specific pattern.
 * @param email - The `email` parameter is a string that represents an email address.
 * @returns a boolean value. It returns true if the email passed as an argument matches the specified
 * pattern, and false otherwise.
 */
export function isValidEmail(email: string): boolean {
  const pattern = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  const match = email.match(pattern);
  return match !== null && match[0] === email;
}
