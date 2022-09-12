import ncp from 'copy-paste';
import { IN_PRODUCTION } from '../../constants';

export const copyToClipboard = (text: string) => {
  // Only copies in development or test mode
  if (IN_PRODUCTION !== true) {
    ncp.copy(text);
  }
};
