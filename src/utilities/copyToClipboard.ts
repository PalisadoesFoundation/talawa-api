import ncp from "copy-paste";
import { IN_PRODUCTION } from "../constants";
/**
 * This utility function copy the text into the clipboard (test change).
 * @remarks
 * This is a utility method. This works only in development or test mode.
 * @param text - The content that need to be copied.
 */
export const copyToClipboard = (text: string): void => {
  // Only copies in development or test mode
  if (IN_PRODUCTION !== true) {
    ncp.copy(text, () => {});
  }
};
