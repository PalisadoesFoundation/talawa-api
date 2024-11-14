import { nanoid } from "nanoid";
import * as fs from "fs";
import { writeFile } from "fs/promises";
import { encodedVideoExtentionCheck } from "./encodedVideoExtensionCheck";
import { errors, requestContext } from "../../libraries";
import { INVALID_FILE_TYPE } from "../../constants";
import { EncodedVideo } from "../../models/EncodedVideo";
import path from "path";
import { deletePreviousVideo } from "./deletePreviousVideo";

/**
 * Uploads an encoded video to the server.
 *
 * @param encodedVideoURL - The URL or content of the encoded video to upload.
 * @param previousVideoPath - Optional. The path of the previous video to delete before uploading the new one.
 * @returns The file name of the uploaded video.
 */
export const uploadEncodedVideo = async (
  encodedVideoURL: string,
  previousVideoPath?: string | null,
): Promise<string> => {
  // Check if the uploaded video URL/content is a valid video file type
  const isURLValidVideo = encodedVideoExtentionCheck(encodedVideoURL);

  if (!isURLValidVideo) {
    throw new errors.InvalidFileTypeError(
      requestContext.translate(INVALID_FILE_TYPE.MESSAGE),
      INVALID_FILE_TYPE.CODE,
      INVALID_FILE_TYPE.PARAM,
    );
  }

  // Check if the encoded video already exists in the database
  const encodedVideoAlreadyExist = await EncodedVideo.findOne({
    content: encodedVideoURL,
  });

  if (encodedVideoAlreadyExist) {
    // If the encoded video already exists and its fileName matches previousVideoPath, return its fileName
    if (encodedVideoAlreadyExist?.fileName === previousVideoPath) {
      return encodedVideoAlreadyExist?.fileName;
    }

    // Increment numberOfUses for the existing encoded video in the database
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

    // Delete the previous video if previousVideoPath is provided
    if (previousVideoPath) {
      await deletePreviousVideo(previousVideoPath);
    }

    return encodedVideoAlreadyExist.fileName;
  }

  // Delete the previous video if previousVideoPath is provided
  if (previousVideoPath) {
    await deletePreviousVideo(previousVideoPath);
  }

  // Generate a unique ID for the new video file using nanoid
  let id = nanoid();
  id = "videos/" + id + "video.mp4";

  // Create a new entry in EncodedVideo collection for the uploaded video
  const uploadedEncodedVideo = await EncodedVideo.create({
    fileName: id,
    content: encodedVideoURL,
  });

  // Extract the video data from the URL (assuming it's base64 encoded)
  const data = encodedVideoURL.replace(/^data:video\/\w+;base64,/, "");
  const buf = Buffer.from(data, "base64");

  // Create a 'videos' directory if it doesn't exist
  if (!fs.existsSync(path.join(__dirname, "../../../videos"))) {
    fs.mkdir(path.join(__dirname, "../../../videos"), (error) => {
      if (error) {
        throw error;
      }
    });
  }

  // Write the video data to the file system
  await writeFile(path.join(__dirname, "../../../" + id), buf);

  // Return the fileName of the uploaded video
  return uploadedEncodedVideo.fileName;
};
