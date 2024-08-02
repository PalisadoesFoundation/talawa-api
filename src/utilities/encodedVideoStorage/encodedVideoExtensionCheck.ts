/**
 * Checks if the provided base64 encoded URL represents a video with the "mp4" extension.
 * @param encodedUrl - The base64 encoded URL of the video.
 * @returns `true` if the encoded URL is a valid mp4 video, `false` otherwise.
 */
export const encodedVideoExtentionCheck = (encodedUrl: string): boolean => {
  // Extract the extension from the encoded URL
  const extension = encodedUrl.substring(
    "data:".length, // Start after "data:"
    encodedUrl.indexOf(";base64"), // End before ";base64"
  );

  console.log(extension); // Log the extracted extension for debugging purposes

  // Check if the extension matches "video/mp4"
  const isValidVideo = extension === "video/mp4";
  if (isValidVideo) {
    return true;
  }

  return false;
};
