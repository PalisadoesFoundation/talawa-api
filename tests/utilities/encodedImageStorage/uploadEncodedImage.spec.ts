import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type mongoose from "mongoose";
import * as fs from "fs";
import { uploadEncodedImage } from "../../../src/utilities/encodedImageStorage/uploadEncodedImage";
import { EncodedImage } from "../../../src/models/EncodedImage";
import { connect, disconnect } from "../../helpers/db";
import path from "path";
import { INVALID_FILE_TYPE } from "../../../src/constants";

vi.mock("fs");

let MONGOOSE_INSTANCE: typeof mongoose;
let testPreviousImagePath: string;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("src -> utilities -> encodedImageStorage -> uploadEncodedImage", () => {
  it("should not create new image when the file extension is invalid", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const img =
        "data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0" +
        "NAAAAKElEQVQ4jWNgYGD4Twzu6FhFFGYYNXDUwGFpIAk2E4dHDRw1cDgaCAASFOffhEIO" +
        "3gAAAABJRU5ErkJggg==";
      await uploadEncodedImage(img, null);
    } catch (error: any) {
      expect(error.message).toEqual(`Translated ${INVALID_FILE_TYPE.MESSAGE}`);

      expect(spy).toBeCalledWith(INVALID_FILE_TYPE.MESSAGE);
    }
  });

  it("should create new image", async () => {
    try {
      const img =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0" +
        "NAAAAKElEQVQ4jWNgYGD4Twzu6FhFFGYYNXDUwGFpIAk2E4dHDRw1cDgaCAASFOffhEIO" +
        "3gAAAABJRU5ErkJggg==";
      const fileName = await uploadEncodedImage(img, null);
      expect(fileName).not.toBe(null);
    } catch (error: any) {
      console.log(error);
    }
  });

  it("should not create new image but return the pointer to that binary data", async () => {
    try {
      const img =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0" +
        "NAAAAKElEQVQ4jWNgYGD4Twzu6FhFFGYYNXDUwGFpIAk2E4dHDRw1cDgaCAASFOffhEIO" +
        "3gAAAABJRU5ErkJggg==";
      const fileName = await uploadEncodedImage(img, null);
      expect(fileName).not.toBe(null);
      testPreviousImagePath = fileName;
    } catch (error: any) {
      console.log(error);
    }
  });

  it("should not create new image but return the pointer to that binary data and not change numberOfUses", async () => {
    const img =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0" +
      "NAAAAKElEQVQ4jWNgYGD4Twzu6FhFFGYYNXDUwGFpIAk2E4dHDRw1cDgaCAASFOffhEIO" +
      "3gAAAABJRU5ErkJggg==";

    const encodedImageBefore = await EncodedImage.findOne({
      fileName: testPreviousImagePath,
    });
    expect(encodedImageBefore?.numberOfUses).toBe(2);

    const filePath = await uploadEncodedImage(img, testPreviousImagePath);
    expect(filePath).equals(testPreviousImagePath);

    const encodedImageAfter = await EncodedImage.findOne({
      fileName: filePath,
    });
    expect(encodedImageAfter?.numberOfUses).toBe(2);
    const fs: any = await vi.importActual("fs");
    fs.unlink(
      path.join(__dirname, "../../../".concat(filePath)),
      (err: any) => {
        if (err) throw err;
      }
    );
  });

  it("should not create new image but return the pointer to that binary data and increase numberOfUses by 1", async () => {
    const img =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0" +
      "NAAAAKElEQVQ4jWNgYGD4Twzu6FhFFGYYNXDUwGFpIAk2E4dHDRw1cDgaCAASFOffhEIO" +
      "3gAAAABJRU5ErkJggg==";

    const tempImg = "data:image/png;base64,TEMP_IMAGE";

    const previousImagePath = await uploadEncodedImage(tempImg, null);

    const encodedImageBefore = await EncodedImage.findOne({
      fileName: testPreviousImagePath,
    });
    expect(encodedImageBefore?.numberOfUses).toBe(2);

    const filePath = await uploadEncodedImage(img, previousImagePath);

    const encodedImageAfter = await EncodedImage.findOne({
      fileName: filePath,
    });
    expect(encodedImageAfter?.numberOfUses).toBe(3);
  });

  it("should not create new image but return the pointer to that binary data and not delete the previous image", async () => {
    const img =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJA" +
      "AAADUlEQVR42mN858n7HwAFtgJFXAJi7wAAAABJRU5ErkJggg==";

    const previousImagePath = await uploadEncodedImage(img, null);

    const fileName = await uploadEncodedImage(img, previousImagePath);
    expect(fileName).equals(previousImagePath);

    const fs: any = await vi.importActual("fs");

    let prevImageExists;
    if (fs.existsSync(path.join(__dirname, "../../../".concat(fileName)))) {
      prevImageExists = true;
      fs.unlink(
        path.join(__dirname, "../../../".concat(fileName)),
        (err: any) => {
          if (err) throw err;
        }
      );
    }
    expect(prevImageExists).toBe(true);
  });

  it("should create new image and return the pointer to that binary data and decrease the previous image count", async () => {
    try {
      const img =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAA" +
        "AAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAWSURB" +
        "VBhXY2Rg+PefAQiYQAQDAwMDAB0KAgGZq0EVAAAAAElFTkSuQmCC";

      const encodedImageBefore = await EncodedImage.findOne({
        fileName: testPreviousImagePath,
      });
      expect(encodedImageBefore?.numberOfUses).toBe(3);

      const fileName = await uploadEncodedImage(img, testPreviousImagePath);
      expect(fileName).not.equals(testPreviousImagePath);

      const encodedImageAfter = await EncodedImage.findOne({
        fileName: testPreviousImagePath,
      });
      expect(encodedImageAfter?.numberOfUses).toBe(2);
      const fs: any = await vi.importActual("fs");
      fs.unlink(
        path.join(__dirname, "../../../".concat(fileName)),
        (err: any) => {
          if (err) throw err;
        }
      );
    } catch (error: any) {
      console.log(error);
    }
  });

  it("should create the directory if it does not exist", async () => {
    const img = "data:image/png;base64,IMAGE_TEMP_DATA_IAAAACCAYAAABytg0kAAA";

    const fsActual: any = await vi.importActual("fs");

    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    vi.spyOn(fs, "mkdir").mockImplementation((dirPath, callback: any) => {
      expect(dirPath).toBe(path.join(__dirname, "../../../images"));
      callback(null); // Simulate a successful directory creation
    });

    const fileName = await uploadEncodedImage(img, null);

    expect(fs.existsSync).toHaveBeenCalledWith(
      path.join(__dirname, "../../../images")
    );
    expect(fs.mkdir).toHaveBeenCalledWith(
      path.join(__dirname, "../../../images"),
      expect.any(Function)
    );

    fsActual.unlink(
      path.join(__dirname, "../../../".concat(fileName)),
      (err: any) => {
        if (err) throw err;
      }
    );
  });

  it("should throw error if failed to make directory", async () => {
    const img = "data:image/png;base64,IMAGE_TEMP_DATA_IAAAAytg0kgBytg0kAAA";

    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    vi.spyOn(fs, "mkdir").mockImplementation((dirPath, callback: any) => {
      expect(dirPath).toBe(path.join(__dirname, "../../../images"));
      callback(new Error("Failed to create directory"));
    });

    await expect(uploadEncodedImage(img, null)).rejects.toThrow("Failed");
  });
});
