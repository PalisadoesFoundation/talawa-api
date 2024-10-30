import { faker } from "@faker-js/faker";
import type mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Plugin } from "../../src/models";
import {
  generateEventData as generateEventDataFn,
  generatePostData,
  generateRandomPlugins,
  generateUserData,
} from "../../src/utilities/createSampleOrganizationUtil";

import { connect, disconnect } from "../helpers/db";

let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("generateUserData function", () => {
  it("should return correct properties given ADMIN userType and organization Id", async () => {
    const organizationId = faker.database.mongodbObjectId();

    const userData = await generateUserData(organizationId, "ADMIN");
    const user = userData.user;
    const appUserProfile = userData.appUserProfile;

    expect(typeof user._id.toString()).toBe("string");
    expect(typeof user.firstName).toBe("string");
    expect(typeof user.lastName).toBe("string");
    expect(typeof user.email).toBe("string");

    expect(Array.isArray(user.joinedOrganizations)).toBe(true);
    expect(user.joinedOrganizations.length).toBe(1);
    expect(typeof user.joinedOrganizations[0].toString()).toBe("string");

    expect(Array.isArray(appUserProfile.adminFor)).toBe(true);
    expect(appUserProfile.adminFor?.length).toBe(1);
    expect(typeof appUserProfile.adminFor?.[0]?.toString()).toBe("string");
  });

  it("should return User with correct properties", async () => {
    const organizationId = faker.database.mongodbObjectId();

    const userData = await generateUserData(organizationId, "SUPERADMIN");
    const user = userData.user;
    const appUserProfile = userData.appUserProfile;

    expect(typeof user._id.toString()).toBe("string");
    expect(typeof user.firstName).toBe("string");
    expect(typeof user.lastName).toBe("string");
    expect(typeof user.email).toBe("string");

    expect(Array.isArray(user.joinedOrganizations)).toBe(true);
    expect(user.joinedOrganizations.length).toBe(1);
    expect(typeof user.joinedOrganizations[0].toString()).toBe("string");

    expect(appUserProfile.isSuperAdmin).toBe(true);

    expect(Array.isArray(appUserProfile.adminFor)).toBe(true);
    expect(appUserProfile.adminFor.length).toBe(0);
  });

  it("should return Event with correct properties", async () => {
    const userData = [
      await generateUserData(faker.database.mongodbObjectId(), "USER"),
    ];
    const users = userData.map((user) => user.user);
    const organizationId = faker.database.mongodbObjectId();
    const event = await generateEventDataFn(users, organizationId);
    expect(event._id).toEqual(expect.any(Object));
    expect(event.title).toEqual(expect.any(String));
    expect(event.description).toEqual(expect.any(String));
    expect(event.location).toEqual(expect.any(String));
    expect(event.latitude).toEqual(expect.any(Number));
    expect(event.longitude).toEqual(expect.any(Number));
    expect(event.recurring).toEqual(expect.any(Boolean));
    expect(event.allDay).toEqual(expect.any(Boolean));
    expect(event.startDate).toEqual(expect.any(Date));
    expect(event.endDate).toEqual(expect.any(Date));
    expect(event.startTime).toEqual(expect.any(Date));
    expect(event.endTime).toEqual(expect.any(Date));
    expect(event.isPublic).toEqual(expect.any(Boolean));
    expect(event.isRegisterable).toEqual(expect.any(Boolean));
    expect(event.creatorId.toString()).toEqual(expect.any(String));
    expect(event.admins).toEqual(expect.any(Array));
    expect(event.organization.toString()).toEqual(expect.any(String));
  });
});

describe("generatePostData function", () => {
  it("should return Post with the correct properties", async () => {
    const usersData = [
      await generateUserData(faker.database.mongodbObjectId(), "USER"),
    ];
    const users = usersData.map((user) => user.user);
    const organizationId = faker.database.mongodbObjectId(); // Fake ObjectID for the organization

    const post = await generatePostData(users, organizationId);

    expect(post._id).toEqual(expect.any(Object));
    expect(post.status).toEqual("ACTIVE");
    expect(post.likedBy).toEqual(expect.any(Array));
    expect(post.likeCount).toEqual(0);
    expect(post.commentCount).toEqual(0);
    expect(post.pinned).toEqual(false);
    expect(post.text).toEqual(expect.any(String));
    expect(post.title).toEqual(expect.any(String));
    expect(post.creatorId).toEqual(expect.any(Object));
    expect(post.organization).toEqual(expect.any(Object));
    expect(post.imageUrl).toEqual(expect.any(String));
    expect(post.createdAt).toEqual(expect.any(Date));
  });

  describe("generateRandomPlugins function", () => {
    beforeEach(async () => {
      // Clear the plugins collection before each test
      await Plugin.deleteMany({});
    });
    it("should generate and save the specified number of plugins with correct properties", async () => {
      const numberOfPlugins = 5;
      const usersData = [
        await generateUserData(faker.database.mongodbObjectId(), "USER"),
      ];
      const users = usersData.map((user) => user.user);

      const pluginPromises = await generateRandomPlugins(
        numberOfPlugins,
        users.map((user) => user._id.toString()),
      );

      expect(Array.isArray(pluginPromises)).toBe(true);
      expect(pluginPromises.length).toBe(numberOfPlugins);

      await Promise.all(pluginPromises);

      const plugins = await Plugin.find();
      expect(plugins.length).toBe(numberOfPlugins);

      plugins.forEach((plugin) => {
        expect(plugin.pluginName).toEqual(expect.any(String));
        expect(plugin.pluginCreatedBy).toEqual(expect.any(String));
        expect(plugin.pluginDesc).toEqual(expect.any(String));
      });
    });
  });
});
