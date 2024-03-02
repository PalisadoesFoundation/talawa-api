import { nanoid } from "nanoid";
import * as fs from "fs";
import { writeFile } from "fs/promises";
import { encodedVideoExtentionCheck } from "./encodedVideoExtensionCheck";
import { errors, requestContext } from "../../libraries";
import { INVALID_FILE_TYPE } from "../../constants";
import { EncodedVideo } from "../../models/EncodedVideo";
import path from "path";
import { deletePreviousVideo } from "./deletePreviousVideo";

export const uploadEncodedVideo = async (
  encodedVideoURL: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  previousVideoPath?: string | null,
): Promise<string> => {
  const isURLValidVideo = encodedVideoExtentionCheck(encodedVideoURL);

  if (!isURLValidVideo) {
    throw new errors.InvalidFileTypeError(
      requestContext.translate(INVALID_FILE_TYPE.MESSAGE),
      INVALID_FILE_TYPE.CODE,
      INVALID_FILE_TYPE.PARAM,
    );
  }

  const encodedVideoAlreadyExist = await EncodedVideo.findOne({
    content: encodedVideoURL,
  });

  if (encodedVideoAlreadyExist) {
    if (encodedVideoAlreadyExist?.fileName === previousVideoPath) {
      return encodedVideoAlreadyExist?.fileName;
    }

    await EncodedVideo.findOneAndUpdate(
      {
        content: encodedVideoURL,
      },
      {
        $inc: {
          numberOfUses: 1,
        },
      },
    );

    if (previousVideoPath) {
      await deletePreviousVideo(previousVideoPath);
    }

    return encodedVideoAlreadyExist.fileName;
  }

  if (previousVideoPath) {
    await deletePreviousVideo(previousVideoPath);
  }

  let id = nanoid();

  id = "videos/" + id + "video.mp4";

  const uploadedEncodedVideo = await EncodedVideo.create({
    fileName: id,
    content: encodedVideoURL,
  });

  const data = encodedVideoURL.replace(/^data:video\/\w+;base64,/, "");

  const buf = Buffer.from(data, "base64");

  if (!fs.existsSync(path.join(__dirname, "../../../videos"))) {
    fs.mkdir(path.join(__dirname, "../../../videos"), (error) => {
      if (error) {
        throw error;
      }
    });
  }

  await writeFile(path.join(__dirname, "../../../" + id), buf);

  return uploadedEncodedVideo.fileName;
};
