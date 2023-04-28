import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type mongoose from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import { deletePreviousImage } from "../../../src/utilities/encodedImageStorage/deletePreviousImage";
import { EncodedImage } from "../../../src/models/EncodedImage";
import { uploadEncodedImage } from "../../../src/utilities/encodedImageStorage/uploadEncodedImage";

let MONGOOSE_INSTANCE: typeof mongoose;
let testPreviousImagePath: string;
const img =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0" +
  "NAAAAKElEQVQ4jWNgYGD4Twzu6FhFFGYYNXDUwGFpIAk2E4dHDRw1cDgaCAASFOffhEIO" +
  "3gAAAABJRU5ErkJggg==";

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await EncodedImage.deleteMany({});
  testPreviousImagePath = await uploadEncodedImage(img, null);
  await uploadEncodedImage(img, null);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("src -> utilities -> encodedImageStorage -> deletePreviousImage", () => {
  it("should not delete the file from the FileSystem but descrement the number of uses", async () => {
    const encodedImageBefore = await EncodedImage.findOne({
      fileName: testPreviousImagePath,
    });

    expect(encodedImageBefore?.numberOfUses).toBe(2);

    await deletePreviousImage(testPreviousImagePath);

    const encodedImageAfter = await EncodedImage.findOne({
      fileName: testPreviousImagePath,
    });
    expect(encodedImageAfter?.numberOfUses).toBe(1);
  });

  it("should delete the image from the filesystem if the number of uses is only one at that point", async () => {
    await deletePreviousImage(testPreviousImagePath);
  });
});
