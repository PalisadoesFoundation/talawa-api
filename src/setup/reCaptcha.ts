/**
 * The function validates whether a given string matches the pattern of a reCAPTCHA token.
 * @param string - The `string` parameter represents the input string that needs to be
 * validated. In this case, it is expected to be a string containing a Recaptcha response token.
 * @returns a boolean value.
 */
export function validateRecaptcha(string: string): boolean {
  const pattern = /^[a-zA-Z0-9_-]{40}$/;
  return pattern.test(string);
}
