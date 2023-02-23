import { afterAll, beforeAll, describe, it } from "vitest";
import mongoose from "mongoose";
import { uploadEncodedImage } from "../../../src/utilities/encodedImageStorage/uploadEncodedImage";
import { connect, disconnect } from "../../helpers/db";

let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("Name of the group", () => {
  it("should ", async () => {
    try {
      const img =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0" +
        "NAAAAKElEQVQ4jWNgYGD4Twzu6FhFFGYYNXDUwGFpIAk2E4dHDRw1cDgaCAASFOffhEIO" +
        "3gAAAABJRU5ErkJggg==";
      const fileName = await uploadEncodedImage(img);
      console.log(fileName);
    } catch (error) {
      console.log(error);
    }
  });
});
