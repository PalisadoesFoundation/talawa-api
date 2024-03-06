import mongoose from "mongoose";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { connect, disconnect } from "../helpers/db";
import { Organization, User, Event, Post } from "../../src/models";
import { loadDefaultOrganization } from "../../src/utilities/loadDefaultOrganization";
import dotenv from "dotenv";

dotenv.config();
describe("loadDefaultOrganization tests", () => {
  let mongooseInstance: typeof mongoose;
  beforeAll(async () => {
    mongooseInstance = await connect();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });
  afterAll(async () => {
    await disconnect(mongooseInstance);
  });
  it("Data importation with formatting", async () => {
    vi.spyOn(mongoose, "connect").mockResolvedValue(mongooseInstance);
    vi.mock("yargs", () => ({
      options: vi.fn().mockReturnThis(),
      parseSync: vi.fn().mockReturnValue({ items: "", format: true }),
    }));
    const userDeleteSpy = vi.spyOn(User, "deleteMany");
    const organizationDeleteSpy = vi.spyOn(Organization, "deleteMany");
    const eventDeleteSpy = vi.spyOn(Event, "deleteMany");
    const postDeleteSpy = vi.spyOn(Post, "deleteMany");
    const userAddedSpy = vi
      .spyOn(User, "insertMany")
      .mockImplementationOnce((docs) => {
        expect(docs.length).toBe(1);
        expect(docs[0]._id).toBe("66378abd85008f171cf2990d");
      });
    const organizationAddedSpy = vi
      .spyOn(Organization, "insertMany")
      .mockImplementationOnce((docs) => {
        expect(docs.length).toBe(1);
        expect(docs[0]._id).toBe("6637904485008f171cf29924");
      });
    await loadDefaultOrganization(process.env.MONGO_DB_URL);
    expect(userDeleteSpy).toBeCalled();
    expect(organizationDeleteSpy).toBeCalled();
    expect(eventDeleteSpy).toBeCalled();
    expect(postDeleteSpy).toBeCalled();
    expect(userAddedSpy).toBeCalled();
    expect(organizationAddedSpy).toBeCalled();
  });
  it("If no mongo link is found", async () => {
    const spy = vi.spyOn(console, "log");
    await loadDefaultOrganization(undefined);
    expect(spy).toBeCalledWith("Couldn't find mongodb url");
  });
});
