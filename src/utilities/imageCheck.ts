import sharp from "sharp";

const defaultMaxFileSize = parseInt(process.env.MAX_IMAGE_SIZE || "5242880"); // Default to 5 MB if not specified in .env
const defaultMaxWidth = parseInt(process.env.MAX_IMAGE_WIDTH || "800");
const defaultMaxHeight = parseInt(process.env.MAX_IMAGE_HEIGHT || "600");
const defaultSupportedFormats = (
  process.env.SUPPORTED_IMAGE_FORMATS || "jpg,jpeg,png"
).split(",");

export async function validateImage(
  file: string,
  resizeConfirmation = false, // Default to false
  maxFileSize = defaultMaxFileSize,
  maxWidth = defaultMaxWidth,
  maxHeight = defaultMaxHeight,
  supportedFormats = defaultSupportedFormats
): Promise<string> {
  if (!file) {
    throw new Error("Please upload images");
  }

  try {
    const imageDataURL = file;

    if (
      imageDataURL &&
      supportedFormats.some((format) => imageDataURL.includes(format))
    ) {
      if (!resizeConfirmation) {
        // If resizeConfirmation is false, return the original image without resizing
        return imageDataURL;
      }

      // Convert base64 image to buffer
      const imageBuffer = Buffer.from(imageDataURL.split(",")[1], "base64");
      const prefixImageBuffer = Buffer.from(
        imageDataURL.split(",")[0],
        "utf-8"
      );
      const prefixString: string = prefixImageBuffer.toString("utf-8");

      // Check image size
      if (imageBuffer.length > maxFileSize) {
        throw new Error("Image size exceeds the allowed limit ");
      }

      const resizedImageBuffer = await sharp(imageBuffer)
        .resize({
          width: maxWidth,
          height: maxHeight,
          fit: sharp.fit.inside,
        })
        .toBuffer();

      const finalResizedImageBuffer = prefixString.concat(
        ",",
        resizedImageBuffer.toString("base64")
      );

      return finalResizedImageBuffer;
    } else {
      throw new Error("Unsupported file type.");
    }
  } catch (error) {
    console.error("Error validating image:", error);
    throw error;
  }
}
