import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { connect, disconnect } from "../../src/db";
import {
  User,
  Organization,
  Post,
  Event,
  Venue,
  RecurrenceRule,
  AppUserProfile,
  ActionItemCategory,
  AgendaCategoryModel,
} from "../../src/models";
import { execSync } from "child_process";

describe("Sample Data Import Tests", () => {
  beforeAll(async () => {
    await connect("talawa-api");
  });

  afterAll(async () => {
    await disconnect();
  });

  it("should import sample data and verify document counts", async () => {
    try {
      execSync("npm run import:sample-data -- --format", { stdio: "pipe" });
      console.log("Sample data imported successfully.");
    } catch (error) {
      console.error("Failed to import sample data:", error);
      throw error;
    }

    const userCount = await User.countDocuments();
    const organizationCount = await Organization.countDocuments();
    const postCount = await Post.countDocuments();
    const eventCount = await Event.countDocuments();
    const venueCount = await Venue.countDocuments();
    const recurrenceRuleCount = await RecurrenceRule.countDocuments();
    const appUserProfileCount = await AppUserProfile.countDocuments();
    const actionItemCategoryCount = await ActionItemCategory.countDocuments();
    const agendaCategoryCount = await AgendaCategoryModel.countDocuments();

    expect(userCount).toBe(15);
    expect(organizationCount).toBe(4);
    expect(postCount).toBe(29);
    expect(eventCount).toBe(17280);
    expect(venueCount).toBe(4);
    expect(recurrenceRuleCount).toBe(100);
    expect(appUserProfileCount).toBe(14);
    expect(actionItemCategoryCount).toBe(4);
    expect(agendaCategoryCount).toBe(4);
  });
});
