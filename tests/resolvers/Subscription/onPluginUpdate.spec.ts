import { withFilter } from "graphql-subscriptions";
import {
  filterFunction,
  onPluginUpdate,
} from "../../../src/resolvers/Subscription/onPluginUpdate";
import { vi, expect, describe, it } from "vitest";

describe("onPluginUpdate", () => {
  it("subscribes to TALAWA_PLUGIN_UPDATED event", () => {
    const mockAsyncIterator = vi.fn();
    const mockContext = {
      pubsub: {
        asyncIterator: mockAsyncIterator,
      },
    };
    const mockPayload = { exampleVariable: "value" };
    const mockVariables = { examplePayload: "data" };
    // eslint-disable-next-line
    const result = (onPluginUpdate as any)?.subscribe(
      {},
      mockVariables,
      mockContext,
    );
    expect(result).toEqual(
      withFilter(expect.any(Function), expect.any(Function)),
    );
    result?.filter(mockPayload, mockVariables, mockContext);
    expect(filterFunction).toHaveBeenCalledWith(mockPayload, mockContext);
  });

  it("resolves the payload", () => {
    const mockPayload = { exampleVariable: "value" };
    // eslint-disable-next-line
    const result = (onPluginUpdate as any)?.resolve(mockPayload);
    expect(result).toEqual(mockPayload);
  });

  it("calls filterFunction with the payload and context", () => {
    const mockPayload = { exampleVariable: "value" };
    const mockContext = { examplePayload: "data" };
    filterFunction(mockPayload, mockContext);
    expect(filterFunction).toHaveBeenCalledWith(mockPayload, mockContext);
  });

  it("returns true from filterFunction", async () => {
    const mockPayload = { exampleVariable: "value" };
    const mockContext = { examplePayload: "data" };
    const result = await filterFunction(mockPayload, mockContext);
    expect(result).toBe(true);
  });
});
