import { isValidString } from "../../../src/libraries/validators/validateString";
import { describe, it, expect } from "vitest";

describe("Validators -> isValidString", () => {
  it("Check the max length response", () => {
    expect(isValidString("0123456789", 10).isLessThanMaxLength).toBeTruthy();
    expect(isValidString("0123456789", 11).isLessThanMaxLength).toBeTruthy();
    expect(isValidString("0123456789", 9).isLessThanMaxLength).toBeFalsy();
    expect(isValidString("", 0).isLessThanMaxLength).toBeTruthy();
  });

  it("Check the valid string response", () => {
    expect(
      isValidString("Testing data 12345", 100).isFollowingPattern
    ).toBeTruthy();
  });
  it("Check the valid string response", () => {
    expect(isValidString("", 100).isFollowingPattern).toBeFalsy();
    expect(isValidString("~`", 100).isFollowingPattern).toBeFalsy();
    expect(
      isValidString(
        `
    `,
        100
      ).isFollowingPattern
    ).toBeFalsy();
    expect(isValidString("!@#$%^&*()", 100).isFollowingPattern).toBeTruthy();
  });
});
