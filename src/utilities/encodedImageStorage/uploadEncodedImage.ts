import { nanoid } from "nanoid";
import * as fs from "fs";
import { writeFile } from "fs/promises";
import { encodedImageExtentionCheck } from "./encodedImageExtensionCheck";
import { errors, requestContext } from "../../libraries";
import { IMAGE_SIZE_LIMIT_KB, INVALID_FILE_TYPE } from "../../constants";
import { EncodedImage } from "../../models/EncodedImage";
import path from "path";
import { deletePreviousImage } from "./deletePreviousImage";

const checkImageSizeLimit = (size: number): boolean => {
  return size > 0 && size <= 20000;
};

const base64SizeInKb = (base64String: string): number => {
  // Count the number of Base64 characters
  const numBase64Chars = base64String.length;
  // Calculate the size in bytes
  const sizeInBytes = (numBase64Chars * 3) / 4;
  // Convert to kilobytes
  const sizeInKB = sizeInBytes / 1024;

  return sizeInKB;
};

export const uploadEncodedImage = async (
  encodedImageURL: string,
  previousImagePath?: string | null,
): Promise<string> => {
  const isURLValidImage = encodedImageExtentionCheck(encodedImageURL);

  const data = encodedImageURL.replace(/^data:image\/\w+;base64,/, "");
  const sizeInKb = base64SizeInKb(data);
  const limit = checkImageSizeLimit(Number(process.env.IMAGE_SIZE_LIMIT_KB))
    ? Number(process.env.IMAGE_SIZE_LIMIT_KB)
    : 3000;

  if (sizeInKb > limit) {
    throw new errors.ImageSizeLimitExceeded(
      IMAGE_SIZE_LIMIT_KB.MESSAGE,
      IMAGE_SIZE_LIMIT_KB.CODE,
      IMAGE_SIZE_LIMIT_KB.PARAM,
    );
  }

  if (!isURLValidImage) {
    throw new errors.InvalidFileTypeError(
      requestContext.translate(INVALID_FILE_TYPE.MESSAGE),
      INVALID_FILE_TYPE.CODE,
      INVALID_FILE_TYPE.PARAM,
    );
  }

  const encodedImageAlreadyExist = await EncodedImage.findOne({
    content: encodedImageURL,
  });

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

  if (previousImagePath) {
    await deletePreviousImage(previousImagePath);
  }

  let id = nanoid();

  id = "images/" + id + "image.png";

  const uploadedEncodedImage = await EncodedImage.create({
    fileName: id,
    content: encodedImageURL,
  });

  const buf = Buffer.from(data, "base64");

  if (!fs.existsSync(path.join(__dirname, "../../../images"))) {
    fs.mkdir(path.join(__dirname, "../../../images"), (err) => {
      if (err) {
        throw err;
      }
    });
  }

  await writeFile(path.join(__dirname, "../../../" + id), buf);

  return uploadedEncodedImage.fileName;
};
