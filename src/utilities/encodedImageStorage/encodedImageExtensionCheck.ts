export const encodedImageExtentionCheck = (encodedUrl: string) => {
  const extension = encodedUrl.substring(
    "data:".length,
    encodedUrl.indexOf(";base64")
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
