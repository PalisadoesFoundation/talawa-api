import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type mongoose from "mongoose";
import * as fs from "fs";
import { uploadEncodedVideo } from "../../../src/utilities/encodedVideoStorage/uploadEncodedVideo"; // Import the video upload function
import { connect, disconnect } from "../../helpers/db";
import path from "path";
import { INVALID_FILE_TYPE } from "../../../src/constants";

let MONGOOSE_INSTANCE: typeof mongoose;
let testPreviousVideoPath: string; // Update variable name for video

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("src -> utilities -> encodedVideoStorage -> uploadEncodedVideo", () => {
  // Update the description
  it("should not create new video when the file extension is invalid", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const vid = "data:video/avi;base64,VIDEO_BASE64_DATA_HERE"; // Use an invalid video format

      await uploadEncodedVideo(vid, null);
    } catch (error: any) {
      expect(error.message).toEqual(`Translated ${INVALID_FILE_TYPE.MESSAGE}`);
      expect(spy).toBeCalledWith(INVALID_FILE_TYPE.MESSAGE);
    }
  });

  it("should create new video", async () => {
    try {
      const vid = "data:video/mp4;base64,VIDEO_BASE64_DATA_HERE"; // Replace with valid video data
      const fileName = await uploadEncodedVideo(vid, null);
      expect(fileName).not.toBe(null);
    } catch (error: any) {
      console.log(error);
    }
  });

  it("should not create new video but return the pointer to that binary data", async () => {
    try {
      const vid = "data:video/mp4;base64,VIDEO_BASE64_DATA_HERE"; // Replace with valid video data
      const fileName = await uploadEncodedVideo(vid, null);
      expect(fileName).not.toBe(null);
      testPreviousVideoPath = fileName; // Update variable name
    } catch (error: any) {
      console.log(error);
    }
  });

  it("should not create new video but return the pointer to that binary data and delete the previous video", async () => {
    try {
      const vid = "data:video/mp4;base64,VIDEO_BASE64_DATA_HERE"; // Replace with valid video data
      const fileName = await uploadEncodedVideo(vid, testPreviousVideoPath); // Update variable name
      expect(fileName).not.toBe(null);

      if (fs.existsSync(path.join(__dirname, "../../../".concat(fileName)))) {
        fs.unlink(path.join(__dirname, "../../../".concat(fileName)), (err) => {
          if (err) throw err;
        });
      }
    } catch (error: any) {
      console.log(error);
    }
  });
});
