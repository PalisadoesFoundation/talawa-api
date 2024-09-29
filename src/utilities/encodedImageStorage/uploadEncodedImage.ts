import { nanoid } from "nanoid";
import * as fs from "fs";
import { writeFile } from "fs/promises";
import { encodedImageExtentionCheck } from "./encodedImageExtensionCheck";
import { errors, requestContext } from "../../libraries";
import { IMAGE_SIZE_LIMIT_KB, INVALID_FILE_TYPE } from "../../constants";
import { EncodedImage } from "../../models/EncodedImage";
import path from "path";
import { deletePreviousImage } from "./deletePreviousImage";

/**
 * Checks if the size of the base64 encoded image data is within the allowable limit.
 *
 * @param size - The size of the image data in kilobytes.
 * @returns `true` if the size is within the limit, otherwise `false`.
 */
const checkImageSizeLimit = (size: number): boolean => {
  return size > 0 && size <= 20000;
};

/**
 * Calculates the size of the base64 encoded string in kilobytes.
 *
 * @param base64String - The base64 encoded string representing the image data.
 * @returns The size of the image data in kilobytes.
 */
const base64SizeInKb = (base64String: string): number => {
  // Count the number of Base64 characters
  const numBase64Chars = base64String.length;
  // Calculate the size in bytes
  const sizeInBytes = (numBase64Chars * 3) / 4;
  // Convert to kilobytes
  const sizeInKB = sizeInBytes / 1024;

  return sizeInKB;
};

/**
 * Uploads an encoded image to the server.
 *
 * @param encodedImageURL - The URL or content of the encoded image to upload.
 * @param previousImagePath - Optional. The path of the previous image to delete before uploading the new one.
 * @returns The file name of the uploaded image.
 */
export const uploadEncodedImage = async (
  encodedImageURL: string,
  previousImagePath?: string | null,
): Promise<string> => {
  // Check if the uploaded image URL/content is a valid image file type
  const isURLValidImage = encodedImageExtentionCheck(encodedImageURL);

  // Extract the base64 data from the image URL
  const data = encodedImageURL.replace(/^data:image\/\w+;base64,/, "");

  // Calculate the size of the base64 encoded image data in kilobytes
  const sizeInKb = base64SizeInKb(data);

  // Retrieve the size limit from environment variables or set a default limit
  const limit = checkImageSizeLimit(Number(process.env.IMAGE_SIZE_LIMIT_KB))
    ? Number(process.env.IMAGE_SIZE_LIMIT_KB)
    : 3000; // Default limit in kilobytes

  // Throw an error if the image size exceeds the allowable limit
  if (sizeInKb > limit) {
    throw new errors.ImageSizeLimitExceeded(
      IMAGE_SIZE_LIMIT_KB.MESSAGE,
      IMAGE_SIZE_LIMIT_KB.CODE,
      IMAGE_SIZE_LIMIT_KB.PARAM,
    );
  }

  // Throw an error if the uploaded image is not a valid file type
  if (!isURLValidImage) {
    throw new errors.InvalidFileTypeError(
      requestContext.translate(INVALID_FILE_TYPE.MESSAGE),
      INVALID_FILE_TYPE.CODE,
      INVALID_FILE_TYPE.PARAM,
    );
  }

  // Check if the encoded image already exists in the database
  const encodedImageAlreadyExist = await EncodedImage.findOne({
    content: encodedImageURL,
  });

  // If the image already exists, increment its numberOfUses and handle previousImagePath
  if (encodedImageAlreadyExist) {
    if (encodedImageAlreadyExist?.fileName === previousImagePath) {
      return encodedImageAlreadyExist?.fileName;
    }

    await EncodedImage.findOneAndUpdate(
      {
        content: encodedImageURL,
      },
      {
        $inc: {
          numberOfUses: 1,
        },
      },
    );

    if (previousImagePath) {
      await deletePreviousImage(previousImagePath);
    }

    return encodedImageAlreadyExist.fileName;
  }

  // Handle deletion of previous image if previousImagePath is provided
  if (previousImagePath) {
    await deletePreviousImage(previousImagePath);
  }

  // Generate a unique ID for the new image file using nanoid
  let id = nanoid();

  id = "images/" + id + "image.png";

  const uploadedEncodedImage = await EncodedImage.create({
    fileName: id,
    content: encodedImageURL,
  });

  // Convert the base64 data into a buffer
  const buf = Buffer.from(data, "base64");

  // Create an 'images' directory if it doesn't exist
  if (!fs.existsSync(path.join(__dirname, "../../../images"))) {
    fs.mkdir(path.join(__dirname, "../../../images"), (err) => {
      if (err) {
        throw err;
      }
    });
  }

  // Write the image data to the file system
  await writeFile(path.join(__dirname, "../../../" + id), buf);

  // Return the fileName of the uploaded image
  return uploadedEncodedImage.fileName;
};
