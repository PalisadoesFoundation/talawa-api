/**
 * Checks if a given string is less than a specified maximum length.
 *
 * @param str - The string to check.
 * @param maxLength - The maximum allowed length of the string.
 * @returns An object containing a boolean indicating if the string is less than the maximum length.
 */
export function isValidString(
  str: string,
  maxLength: number,
): { isLessThanMaxLength: boolean } {
  const isLessThanMaxLength: boolean = str.length < maxLength;
  return {
    isLessThanMaxLength,
  };
}
