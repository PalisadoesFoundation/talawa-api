import { expect, it, describe } from "vitest";
import { checkExistingMongoDB } from "../../src/setup/MongoDB";

describe("Setup -> checkExistingMongoDB", () => {
  it("should return the first valid URL when a connection is found", async () => {
    const result = await checkExistingMongoDB();
    expect(result).toBe(process.env.MONGO_DB_URL);
  });
});
