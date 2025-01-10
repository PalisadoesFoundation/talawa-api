import mongoose from "mongoose";
import { checkReplicaSet } from "../../src/utilities/checkReplicaSet";
import { expect, describe, it, beforeAll, afterAll } from "vitest";
import { connect, disconnect } from "../helpers/db";

let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async (): Promise<void> => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async (): Promise<void> => {
  await disconnect(MONGOOSE_INSTANCE);
});

interface InterfaceAdminDbMock1 {
  command: () => Promise<{ hosts: string[]; setName: string }>;
}
interface InterfaceAdminDbMock2 {
  command: () => Promise<object>;
}

describe("checkReplicaSet", () => {
  it("should return true if replica set is configured", async () => {
    const adminDbMock: InterfaceAdminDbMock1 = {
      command: async (): Promise<{ hosts: string[]; setName: string }> => ({
        hosts: ["host1", "host2"],
        setName: "xyz",
      }),
    };
    //@ts-expect-error cant find the right type
    mongoose.connection.db.admin = (): object => adminDbMock;
    const result = await checkReplicaSet();

    expect(result).toBe(true);
  });

  it("should return false if replica set is not configured", async () => {
    const adminDbMock: InterfaceAdminDbMock2 = {
      command: async (): Promise<object> => ({}),
    };
    //@ts-expect-error cant find the right type
    mongoose.connection.db.admin = (): object => adminDbMock;
    const result = await checkReplicaSet();

    expect(result).toBe(false);
  });

  it("should return false if error occurs", async () => {
    //@ts-expect-error cant find the right type
    mongoose.connection.db.admin = (): object => {
      throw new Error("Error");
    };
    const result = await checkReplicaSet();

    expect(result).toBe(false);
  });
});
