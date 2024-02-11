export const encodedVideoExtentionCheck = (encodedUrl: string): boolean => {
  const extension = encodedUrl.substring(
    "data:".length,
    encodedUrl.indexOf(";base64")
  );

  console.log(extension);

  const isValidVideo = extension === "video/mp4";
  if (isValidVideo) {
    return true;
  }

  return false;
};
