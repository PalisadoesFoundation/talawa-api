import "dotenv/config";
import { describe, expect, it } from "vitest";
import { encodedImageExtentionCheck } from "../../../src/utilities/encodedImageStorage/encodedImageExtensionCheck";

describe("src -> utilities -> encodedImageStorage -> ", () => {
  it("should return true when image extension = image/png", () => {
    const data = "data:image/png;base64";

    const result = encodedImageExtentionCheck(data);

    expect(result).toBe(true);
  });

  it("should return true when image extension = image/jpg", () => {
    const data = "data:image/jpg;base64";

    const result = encodedImageExtentionCheck(data);

    expect(result).toBe(true);
  });

  it("should return true when image extension = image/jpeg", () => {
    const data = "data:image/jpeg;base64";

    const result = encodedImageExtentionCheck(data);

    expect(result).toBe(true);
  });

  it("should return false when image extension = image/gif", () => {
    const data = "data:image/gif;base64";

    const result = encodedImageExtentionCheck(data);

    expect(result).toBe(false);
  });
});
