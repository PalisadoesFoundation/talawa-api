/**
 * Checks if the extension of an encoded image URL is valid (png, jpg, jpeg).
 * @param encodedUrl - Encoded URL of the image.
 * @returns `true` if the extension is valid, otherwise `false`.
 */
export const encodedImageExtentionCheck = (encodedUrl: string): boolean => {
  // Extract the extension from the encodedUrl
  const extension = encodedUrl.substring(
    "data:".length,
    encodedUrl.indexOf(";base64"),
  );

  console.log(extension);

  const isValidImage =
    extension === "image/png" ||
    extension === "image/jpg" ||
    extension === "image/jpeg";

  if (isValidImage) {
    return true;
  }

  return false;
};
