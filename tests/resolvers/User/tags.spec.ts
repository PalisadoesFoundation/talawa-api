// import "dotenv/config";
// import { tags as tagsResolver } from "../../../src/resolvers/User/tags";
// import { connect, disconnect } from "../../helpers/db";
// import mongoose from "mongoose";
// import { beforeAll, afterAll, describe, it, expect } from "vitest";
// import { createRootTagWithOrg, testTagType } from "../../helpers/tags";
// import { testOrganizationType } from "../../helpers/userAndOrg";
// import { Organization } from "../../../src/models";

// let MONGOOSE_INSTANCE: typeof mongoose | null;
// let testTag: testTagType;
// let testOrganization: testOrganizationType;

// beforeAll(async () => {
//   MONGOOSE_INSTANCE = await connect();
//   [, testOrganization, testTag] = await createRootTagWithOrg();
// });

// afterAll(async () => {
//   await disconnect(MONGOOSE_INSTANCE!);
// });

// describe("resolvers -> Tag -> organization", () => {
//   it(`returns the correct organization object`, async () => {
//     const parent = testTag!.toObject();

//     const payload = await organizationResolver?.(parent, {}, {});

//     const organization = await Organization.findOne({
//       _id: testOrganization!._id,
//     }).lean();

//     expect(payload).toEqual(organization);
//   });
// });
