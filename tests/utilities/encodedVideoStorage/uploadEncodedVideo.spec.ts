import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type mongoose from "mongoose";
import * as fs from "fs";
import { uploadEncodedVideo } from "../../../src/utilities/encodedVideoStorage/uploadEncodedVideo"; // Import the video upload function
import { EncodedVideo } from "../../../src/models/EncodedVideo";
import { connect, disconnect } from "../../helpers/db";
import path from "path";
import { INVALID_FILE_TYPE } from "../../../src/constants";

let MONGOOSE_INSTANCE: typeof mongoose;
let testPreviousVideoPath: string; // Update variable name for video

vi.mock("fs", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    existsSync: vi.fn(),
    mkdir: vi.fn(),
  };
});

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
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${INVALID_FILE_TYPE.MESSAGE}`,
      );
      expect(spy).toBeCalledWith(INVALID_FILE_TYPE.MESSAGE);
    }
  });

  it("should create new video", async () => {
    try {
      const vid = "data:video/mp4;base64,VIDEO_BASE64_DATA_HERE"; // Replace with valid video data
      const fileName = await uploadEncodedVideo(vid, null);
      expect(fileName).not.toBe(null);
    } catch (error: unknown) {
      console.log(error);
    }
  });

  it("should not create new video but return the pointer to that binary data", async () => {
    try {
      const vid = "data:video/mp4;base64,VIDEO_BASE64_DATA_HERE"; // Replace with valid video data
      const fileName = await uploadEncodedVideo(vid, null);
      expect(fileName).not.toBe(null);
      testPreviousVideoPath = fileName; // Update variable name
    } catch (error: unknown) {
      console.log(error);
    }
  });

  it("should not create new video but return the pointer to that binary data and and not change numberOfUses", async () => {
    const vid = "data:video/mp4;base64,VIDEO_BASE64_DATA_HERE"; // Replace with valid video data

    const encodedVideoBefore = await EncodedVideo.findOne({
      fileName: testPreviousVideoPath,
    });
    expect(encodedVideoBefore?.numberOfUses).toBe(2);

    const fileName = await uploadEncodedVideo(vid, testPreviousVideoPath); // Update variable name
    expect(fileName).equals(testPreviousVideoPath);

    const encodedVideoAfter = await EncodedVideo.findOne({
      fileName: testPreviousVideoPath,
    });
    expect(encodedVideoAfter?.numberOfUses).toBe(2);

    fs.unlink(path.join(__dirname, "../../../".concat(fileName)), (err) => {
      if (err) throw err;
    });
  });

  it("should not create new video but return the pointer to that binary data and increase numberOfUses by 1", async () => {
    const vid = "data:video/mp4;base64,VIDEO_BASE64_DATA_HERE"; // Replace with valid video data

    const tempImg = "data:video/mp4;base64,TEMP_VIDEO";

    const previousVideoPath = await uploadEncodedVideo(tempImg, null);

    const encodedVideoBefore = await EncodedVideo.findOne({
      fileName: testPreviousVideoPath,
    });
    expect(encodedVideoBefore?.numberOfUses).toBe(2);

    const filePath = await uploadEncodedVideo(vid, previousVideoPath);

    const encodedVideoAfter = await EncodedVideo.findOne({
      fileName: filePath,
    });
    expect(encodedVideoAfter?.numberOfUses).toBe(3);
  });

  it("should not create new video but return the pointer to that binary data and not delete the previous video", async () => {
    const existsSyncMock = vi.fn();
    const vid = "data:video/mp4;base64,NEW_VIDEO_BASE64_DATA_HERE"; // Replace with new valid video data

    const previousVideoPath = await uploadEncodedVideo(vid, null);

    const fileName = await uploadEncodedVideo(vid, previousVideoPath);
    expect(fileName).equals(previousVideoPath);
    existsSyncMock.mockReturnValue(true);
    const prevVideoExists = existsSyncMock(
      path.join(__dirname, "../../../".concat(fileName)),
    );

    expect(prevVideoExists).toBe(true);
    if (prevVideoExists) {
      fs.unlink(path.join(__dirname, "../../../".concat(fileName)), (err) => {
        if (err) throw err;
      });
    }
  });

  it("should create new video and return the pointer to that binary data and decrease the previous video count", async () => {
    try {
      const vid = "data:video/mp4;base64,NEW2_VIDEO_BASE64_DATA_HERE"; // Replace with new valid video data

      const encodedVideoBefore = await EncodedVideo.findOne({
        fileName: testPreviousVideoPath,
      });
      expect(encodedVideoBefore?.numberOfUses).toBe(3);

      const fileName = await uploadEncodedVideo(vid, testPreviousVideoPath);
      expect(fileName).not.equals(testPreviousVideoPath);

      const encodedVideoAfter = await EncodedVideo.findOne({
        fileName: testPreviousVideoPath,
      });
      expect(encodedVideoAfter?.numberOfUses).toBe(2);

      fs.unlink(path.join(__dirname, "../../../".concat(fileName)), (err) => {
        if (err) throw err;
      });
    } catch (error: unknown) {
      console.log(error);
    }
  });

  it("should create the 'videos' directory if it doesn't exist", async () => {
    const existsSyncMock = vi.mocked(fs.existsSync);
    const mkdirMock = vi.mocked(fs.mkdir);
    const vid = "data:video/mp4;base64,VIDEO_BASE64_DATA_HERE";

    await uploadEncodedVideo(vid, null);

    expect(existsSyncMock).toHaveBeenCalledWith(
      path.join(__dirname, "../../../videos"),
    );
    expect(mkdirMock).toHaveBeenCalledWith(
      path.join(__dirname, "../../../videos"),
      expect.any(Function),
    );

    existsSyncMock.mockRestore();
    mkdirMock.mockRestore();
  });
});
