import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import * as fs from "fs";
import { uploadEncodedImage } from "../../../src/utilities/encodedImageStorage/uploadEncodedImage";
import { connect, disconnect } from "../../helpers/db";
import path from "path";
import { INVALID_FILE_TYPE } from "../../../src/constants";

let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
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
      await uploadEncodedImage(img);
    } catch (error: any) {
      expect(error.message).toEqual(`Translated ${INVALID_FILE_TYPE.message}`);

      expect(spy).toBeCalledWith(INVALID_FILE_TYPE.message);
    }
  });

  it("should create new image", async () => {
    try {
      const img =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0" +
        "NAAAAKElEQVQ4jWNgYGD4Twzu6FhFFGYYNXDUwGFpIAk2E4dHDRw1cDgaCAASFOffhEIO" +
        "3gAAAABJRU5ErkJggg==";
      const fileName = await uploadEncodedImage(img);
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

  it("should not create new image but return the pointer to that binary data", async () => {
    try {
      const img =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0" +
        "NAAAAKElEQVQ4jWNgYGD4Twzu6FhFFGYYNXDUwGFpIAk2E4dHDRw1cDgaCAASFOffhEIO" +
        "3gAAAABJRU5ErkJggg==";
      const fileName = await uploadEncodedImage(img);
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
