export function isValidString(str: string, maxLength: number) {
  const pattern = /[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;
  const isFollowingPattern: boolean = pattern.test(str) && str.length !== 0;
  const isLessThanMaxLength: boolean = str.length <= maxLength;
  return {
    isFollowingPattern,
    isLessThanMaxLength,
  };
}
