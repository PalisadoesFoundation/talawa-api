import "dotenv/config";
import { admins as adminsResolver } from "../../../src/resolvers/Organization/admins";
import { connect, disconnect } from "../../../src/db";
import {
  User,
  Organization,
  Interface_Organization,
} from "../../../src/models";
import { Document } from "mongoose";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testOrganization:
  | (Interface_Organization & Document<any, any, Interface_Organization>)
  | null;

beforeAll(async () => {
  await connect();

  const testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser._id,
    admins: [testUser._id],
    members: [testUser._id],
  });

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $push: {
        createdOrganizations: testOrganization._id,
        adminFor: testOrganization._id,
        joinedOrganizations: testOrganization._id,
      },
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Organization -> admins", () => {
  it(`returns all user objects for parent.admins`, async () => {
    const parent = testOrganization!.toObject();

    const adminsPayload = await adminsResolver?.(parent, {}, {});

    const admins = await User.find({
      _id: {
        $in: testOrganization!.admins,
      },
    }).lean();

    expect(adminsPayload).toEqual(admins);
  });
});
