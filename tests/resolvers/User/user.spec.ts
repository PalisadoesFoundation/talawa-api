import "dotenv/config";
import { connect, disconnect } from "../../helpers/db";
import { beforeEach, describe, it, expect, beforeAll, afterAll } from "vitest";
import { User } from "../../../src/models";
import type mongoose from "mongoose";
import { createTestUserFunc } from "../../helpers/user";
import type { TestUserType } from "../../helpers/user";
let MONGOOSE_INSTANCE: typeof mongoose;
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("User Identifier Tests", () => {
  beforeEach(async () => {
    // Clear the User collection bef ore each test
    await User.deleteMany({});
  });
  it("identifier should be a numeric value", async () => {
    const user1: TestUserType = await createTestUserFunc();
    if (user1) {
      await user1.save();
      expect(typeof user1.identifier === "number").toBe(true);
    }
  });
  it("should be immutable", async () => {
    const user1: TestUserType = await createTestUserFunc();
    if (user1) {
      try {
        await User.findOneAndUpdate(
          { _id: user1._id },
          { $set: { identifier: 1 } },
          { new: true },
        );
      } catch (error) {
        expect((error as Error).name).to.equal("ValidationError");
      }
    }
  });
  it("identifier should be sequential and incremental", async () => {
    const user1: TestUserType = await createTestUserFunc();
    const user2: TestUserType = await createTestUserFunc();

    if (user1 && user2) {
      await user1.save();
      expect(typeof user1.identifier === "number").toBe(true);

      await user2.save();
      expect(typeof user2.identifier === "number").toBe(true);
      expect(user2.identifier).toBeGreaterThan(user1.identifier);
    }
  });
});
