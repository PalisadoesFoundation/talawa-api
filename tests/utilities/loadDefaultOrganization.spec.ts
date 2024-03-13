import { describe, expect, it, vi } from "vitest";
import { Organization, User, Event, Post } from "../../src/models";
import { loadDefaultOrganization } from "../../src/utilities/loadDefaultOrganization";
import dotenv from "dotenv";

dotenv.config();
describe("loadDefaultOrganization tests", () => {
  it("Data importation with formatting", async () => {
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
        expect(docs[0]._id).toBe("65ecb93989225c818f784821");
      });
    const organizationAddedSpy = vi
      .spyOn(Organization, "insertMany")
      .mockImplementationOnce((docs) => {
        expect(docs.length).toBe(1);
        expect(docs[0]._id).toBe("65ecb98712e5d1c5a4504ce4");
      });
    await loadDefaultOrganization(
      process.env.MONGO_DB_URL,
      "TALAWA_API_TEST_DATABASE",
    );
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
