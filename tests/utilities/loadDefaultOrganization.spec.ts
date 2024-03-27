import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Organization, User, Event, Post } from "../../src/models";
import { loadDefaultOrganization } from "../../src/utilities/loadDefaultOrganization";
import dotenv from "dotenv";
import { connect, disconnect } from "../helpers/db";
import type mongoose from "mongoose";

dotenv.config();
describe("loadDefaultOrganization tests", () => {
  let MONGOOSE_INSTANCE: typeof mongoose;
  beforeAll(async () => {
    MONGOOSE_INSTANCE = await connect();
  });
  afterAll(async () => {
    await disconnect(MONGOOSE_INSTANCE);
  });
  it("Data importation with formatting", async () => {
    vi.mock("yargs", () => ({
      options: vi.fn().mockReturnThis(),
      parseSync: vi.fn().mockReturnValue({ items: "", format: true }),
    }));
    const userDeleteSpy = vi.spyOn(User, "deleteMany");
    const organizationDeleteSpy = vi.spyOn(Organization, "deleteMany");
    const eventDeleteSpy = vi.spyOn(Event, "deleteMany");
    const postDeleteSpy = vi.spyOn(Post, "deleteMany");
    await loadDefaultOrganization(
      process.env.MONGO_DB_URL,
      "TALAWA_API_TEST_DATABASE",
    );
    expect(userDeleteSpy).toBeCalled();
    expect(organizationDeleteSpy).toBeCalled();
    expect(eventDeleteSpy).toBeCalled();
    expect(postDeleteSpy).toBeCalled();
  });
  it("If no mongo link is found", async () => {
    const spy = vi.spyOn(console, "log");
    await loadDefaultOrganization(undefined);
    expect(spy).toBeCalledWith("Couldn't find mongodb url");
  });
});
