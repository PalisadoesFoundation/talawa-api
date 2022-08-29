import ncp from 'copy-paste';

export const copyToClipboard = (text: string) => {
  // Only copies in development or test mode
  if (process.env.NODE_ENV !== 'production') {
    ncp.copy(text);
  }
};
