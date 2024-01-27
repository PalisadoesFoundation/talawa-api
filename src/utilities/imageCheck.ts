import sharp from "sharp";

const defaultMaxFileSize = parseInt(process.env.MAX_IMAGE_SIZE || "5242880"); // Default to 5 MB if not specified in .env
const defaultMaxWidth = parseInt(process.env.MAX_IMAGE_WIDTH || "800");
const defaultMaxHeight = parseInt(process.env.MAX_IMAGE_HEIGHT || "600");
const defaultSupportedFormats = (
  process.env.SUPPORTED_IMAGE_FORMATS || "jpg,jpeg,png"
).split(",");

export async function validateImage(
  file: any,
  maxFileSize = defaultMaxFileSize,
  maxWidth = defaultMaxWidth,
  maxHeight = defaultMaxHeight,
  supportedFormats = defaultSupportedFormats
) {
  const dataUrlPrefix = "data:";

  if (!file) {
    throw new Error("Please upload images");
  }

  try {
    const imageDataURL = file;

    if (
      imageDataURL &&
      imageDataURL.startsWith(dataUrlPrefix) &&
      supportedFormats.some((format) => imageDataURL.includes(format))
    ) {
      // Convert base64 image to buffer
      const imageBuffer = Buffer.from(imageDataURL.split(",")[1], "base64");

      // Check image size
      if (imageBuffer.length > maxFileSize) {
        throw new Error("Image size exceeds the allowed limit ");
      }

      // Resize the image if needed
      const resizedImageBuffer = await sharp(imageBuffer)
        .resize({
          width: maxWidth,
          height: maxHeight,
          fit: sharp.fit.inside,
        })
        .toBuffer();

      return resizedImageBuffer.toString("base64");
    } else {
      throw new Error("Unsupported file type.");
    }
  } catch (error) {
    console.error("Error validating image:", error);
    throw error;
  }
}
