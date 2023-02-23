import shortid from "shortid";
import * as fs from "fs";
import { encodedImageExtentionCheck } from "./encodedImageExtensionCheck";
import { errors, requestContext } from "../../libraries";
import { INVALID_FILE_TYPE } from "../../constants";
import { EncodedImage } from "../../models/EncodedImage";
import path from "path";

export const uploadEncodedImage = async (encodedImageURL: string) => {
  const isURLValidImage: boolean = encodedImageExtentionCheck(encodedImageURL);

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
  console.log(encodedImageAlreadyExist);

  if (encodedImageAlreadyExist) {
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
  fs.writeFile(path.join(__dirname, "../../../images/" + id), buf, (error) => {
    if (error) console.log(error);
  });

  return uploadedEncodedImage.fileName;
};
