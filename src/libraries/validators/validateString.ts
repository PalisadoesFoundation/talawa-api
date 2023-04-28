export function isValidString(
  str: string,
  maxLength: number
): { isLessThanMaxLength: boolean } {
  const isLessThanMaxLength: boolean = str.length < maxLength;
  return {
    isLessThanMaxLength,
  };
}
