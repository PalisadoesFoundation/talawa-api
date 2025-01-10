import ncp from "copy-paste";
import { IN_PRODUCTION } from "../constants";

/**
 * Copies the given text to the clipboard.
 * @remarks
 * This is a utility method and works only in development or test mode.
 * @param text - The content that needs to be copied to the clipboard.
 */
export const copyToClipboard = (text: string): void => {
  // Only copies text to the clipboard in development or test mode
  if (IN_PRODUCTION !== true) {
    ncp.copy(text, () => {});
  }
};
