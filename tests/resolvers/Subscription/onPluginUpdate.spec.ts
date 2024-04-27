import { it, describe, expect } from "vitest";
import {
  filterFunction,
  createPluginUpdateResponse,
} from "../../../src/resolvers/Subscription/onPluginUpdate";

describe("Subscription Resolver Tests", () => {
  it("filterFunction should return true", async () => {
    const payload = {};
    const context = {};
    const result = await filterFunction(payload, context);

    expect(result).toBe(true);
  });

  it("createPluginUpdateResponse should return payload.Plugin", () => {
    const payload = { Plugin: {} };

    const result = createPluginUpdateResponse(payload);

    expect(result).toBe(payload.Plugin);
  });
});
