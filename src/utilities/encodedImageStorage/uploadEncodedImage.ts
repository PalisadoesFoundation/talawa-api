import shortid from "shortid";
import * as fs from "fs";
import { writeFile } from "fs/promises";
import { encodedImageExtentionCheck } from "./encodedImageExtensionCheck";
import { errors, requestContext } from "../../libraries";
import { INVALID_FILE_TYPE } from "../../constants";
import { EncodedImage } from "../../models/EncodedImage";
import path from "path";
import { deletePreviousImage } from "./deletePreviousImage";

export const uploadEncodedImage = async (
  encodedImageURL: string,
  previousImagePath?: string | null
) => {
  const isURLValidImage = encodedImageExtentionCheck(encodedImageURL);

  if (!isURLValidImage) {
    throw new errors.InvalidFileTypeError(
      requestContext.translate(INVALID_FILE_TYPE.message),
      INVALID_FILE_TYPE.code,
      INVALID_FILE_TYPE.param
    );
  }

  const encodedImageAlreadyExist = await EncodedImage.findOne({
    content: encodedImageURL,
  });

  if (previousImagePath) {
    await deletePreviousImage(previousImagePath);
  }

  if (encodedImageAlreadyExist) {
    await EncodedImage.findOneAndUpdate(
      {
        content: encodedImageURL,
      },
      {
        $inc: {
          numberOfUses: 1,
        },
      }
    );
    return encodedImageAlreadyExist.fileName;
  }

  let id = shortid.generate();

  id = "images/" + id + "image.png";

  const uploadedEncodedImage = await EncodedImage.create({
    fileName: id,
    content: encodedImageURL,
  });

  const data = encodedImageURL.replace(/^data:image\/\w+;base64,/, "");

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
