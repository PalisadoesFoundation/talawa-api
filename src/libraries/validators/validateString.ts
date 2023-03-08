export function isValidString(str: string, maxLength: number) {
  const isLessThanMaxLength: boolean = str.length < maxLength;
  return {
    isLessThanMaxLength,
  };
}
