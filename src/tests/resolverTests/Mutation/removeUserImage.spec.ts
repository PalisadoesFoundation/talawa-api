import 'dotenv/config';
import { Document, Types } from 'mongoose';
import { Interface_User, User } from '../../../lib/models';
import { connect, disconnect } from '../../../db';
import { removeUserImage as removeUserImageResolver } from '../../../lib/resolvers/Mutation/removeUserImage';
import { USER_NOT_FOUND } from '../../../constants';
import { nanoid } from 'nanoid';

let testUser: Interface_User & Document<any, any, Interface_User>;

beforeAll(async () => {
  await connect();

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: 'password',
    firstName: 'firstName',
    lastName: 'lastName',
    appLanguageCode: 'en',
  });
});

afterAll(async () => {
  await disconnect();
});

describe('resolvers -> Mutation -> removeUserImage', () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const context = {
        userId: Types.ObjectId().toString(),
      };

      await removeUserImageResolver?.({}, {}, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no user.image exists for currentUser
  with _id === context.userId`, async () => {
    try {
      const context = {
        userId: testUser.id,
      };

      await removeUserImageResolver?.({}, {}, context);
    } catch (error: any) {
      expect(error.message).toEqual('User profile image not found');
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

  //   const context = {
  //     userId: testUser._id,
  //   };

  //   const removeUserImagePayload = await removeUserImageResolver?.(
  //     {},
  //     {},
  //     context
  //   );

  //   const updatedTestUser = await User.findOne({
  //     _id: testUser._id,
  //   }).lean();

  //   expect(removeUserImagePayload).toEqual(updatedTestUser);

  //   expect(removeUserImagePayload?.image).toEqual(null);
  // });
});
