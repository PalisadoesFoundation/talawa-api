import type { FileMimeType } from "../REST/types";

/**
 * Checks if the provided mimetype is valid.
 * @param mimetype - The mimetype to check.
 * @returns True if the mimetype is valid, false otherwise.
 */
export const isValidMimeType = (mimetype: string): mimetype is FileMimeType => {
  const allowedMimeTypes: FileMimeType[] = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
  ];
  return allowedMimeTypes.includes(mimetype as FileMimeType);
};
