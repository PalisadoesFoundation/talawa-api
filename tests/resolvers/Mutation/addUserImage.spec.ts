import "dotenv/config";
import {
  //  Document,
  Types,
} from "mongoose";
// import {  Interface_User, User } from "../../../src/models";
import { connect, disconnect } from "../../../src/db";
import { MutationAddUserImageArgs } from "../../../src/types/generatedGraphQLTypes";
import { addUserImage as addUserImageResolver } from "../../../src/resolvers/Mutation/addUserImage";
import { USER_NOT_FOUND } from "../../../src/constants";
// import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

// let testUser:Interface_User & Document<any, any, Interface_User>

beforeAll(async () => {
  await connect();

  // testUser = await User.create({
  //   email: `email${nanoid().toLowerCase()}@gmail.com`,
  //   password: "password",
  //   firstName: "firstName",
  //   lastName: "lastName",
  //   appLanguageCode: "en",
  // });
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> addUserImage", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationAddUserImageArgs = {
        file: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await addUserImageResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  // it(`sets image field to null for organization with _id === args.organizationId
  // and returns the updated organization`, async () => {
  //   await User.updateOne(
  //     {
  //       _id: testUser._id,
  //     },
  //     {
  //       $set: {
  //         image: 'image',
  //       },
  //     }
  //   );

  //   const args: MutationAddUserImageArgs = {
  //     file: '',
  //   };

  //   const context = {
  //     userId: testUser._id,
  //   };

  //   const addUserImagePayload = await addUserImageResolver?.({}, args, context);

  //   const updatedTestUser = await User.findOne({
  //     _id: testUser._id,
  //   }).lean();

  //   expect(addUserImagePayload).toEqual(updatedTestUser);

  //   expect(addUserImagePayload?.image).toEqual(null);
  // });
});
