import * as index from "../../src/directives/index";
import { describe, it, expect } from "vitest";

describe("index", () => {
  it("should have the authDirective exported", () => {
    expect(Object.keys(index)).toContain("AuthenticationDirective");
  });
  it("should have the roleDirective exported", () => {
    expect(Object.keys(index)).toContain("RoleAuthorizationDirective");
  });
});
