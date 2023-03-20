// import "dotenv/config";
// import { usersAssignedTo as usersAssignedToResolver } from "../../../src/resolvers/UserTag/usersAssignedTo";
// import { connect, disconnect } from "../../helpers/db";
// import mongoose from "mongoose";
// import { beforeAll, afterAll, describe, it, expect } from "vitest";
// import {
//   createAndAssignUsersToTag,
//   createRootTagWithOrg,
//   TestUserTagType,
// } from "../../helpers/tags";
// import { TagUser, Interface_TagUser } from "../../../src/models";
// import { testUserType } from "../../helpers/userAndOrg";

// let MONGOOSE_INSTANCE: typeof mongoose | null;

// let usersAssignedTo: any;
// let userIds: string[];

// let testUsers: testUserType[];
// let testTag: TestUserTagType;
// let randomTag: TestUserTagType;

// beforeAll(async () => {
//   MONGOOSE_INSTANCE = await connect();

//   [, , testTag] = await createRootTagWithOrg();
//   [, , randomTag] = await createRootTagWithOrg();
//   testUsers = await createAndAssignUsersToTag(testTag, 5);

//   userIds = testUsers.map((user) => user!._id);

//   usersAssignedTo = await TagUser.find({
//     tagId: testTag!._id,
//   })
//     .sort({ userId: 1 })
//     .populate("userId")
//     .lean();

//   usersAssignedTo = usersAssignedTo.map(
//     (tagAssign: Interface_TagUser) => tagAssign!.userId
//   );
// });

// afterAll(async () => {
//   await disconnect(MONGOOSE_INSTANCE!);
// });

// describe("resolvers -> UserTag -> usersAssignedTo", () => {
//   it(`returns all the users which have been assigned the tag if no arguments are provided`, async () => {
//     const parent = testTag!;
//     const args = {};

//     const payload = await usersAssignedToResolver?.(parent, args, {});

//     // Testing the pageInfo object
//     expect(payload!.pageInfo.hasNextPage).toEqual(false);
//     expect(payload!.pageInfo.hasPreviousPage).toEqual(false);
//     expect(payload!.pageInfo.startCursor).toEqual(userIds[0]);
//     expect(payload!.pageInfo.endCursor).toEqual(userIds[4]);

//     // Testing the edges object
//     expect(payload!.edges!.length).toEqual(5);
//     // @ts-ignore
//     expect(payload!.edges!.map((edge) => edge.node)).toEqual(usersAssignedTo);
//     // @ts-ignore
//     expect(payload!.edges!.map((edge) => edge!.cursor)).toEqual(userIds);
//   });

//   it(`returns the users with _id > args.after when the after argument is provided`, async () => {
//     const parent = testTag!;
//     const args = {
//       after: userIds[2],
//     };

//     const payload = await usersAssignedToResolver?.(parent, args, {});

//     // Testing the pageInfo object
//     expect(payload!.pageInfo.hasNextPage).toEqual(false);
//     expect(payload!.pageInfo.hasPreviousPage).toEqual(true);
//     expect(payload!.pageInfo.startCursor).toEqual(userIds[3]);
//     expect(payload!.pageInfo.endCursor).toEqual(userIds[4]);

//     // Testing the edges object
//     expect(payload!.edges!.length).toEqual(2);
//     // @ts-ignore
//     expect(payload!.edges!.map((edge) => edge!.node)).toEqual(
//       usersAssignedTo.slice(-2)
//     );
//     // @ts-ignore
//     expect(payload!.edges!.map((edge) => edge!.cursor)).toEqual(
//       userIds.slice(-2)
//     );
//   });

//   it(`returns the users with _id < args.before when the before argument is provided`, async () => {
//     const parent = testTag!;
//     const args = {
//       before: userIds[2],
//     };

//     const payload = await usersAssignedToResolver?.(parent, args, {});

//     // Testing the pageInfo object
//     expect(payload!.pageInfo.hasNextPage).toEqual(true);
//     expect(payload!.pageInfo.hasPreviousPage).toEqual(false);
//     expect(payload!.pageInfo.startCursor).toEqual(userIds[0]);
//     expect(payload!.pageInfo.endCursor).toEqual(userIds[1]);

//     // Testing the edges object
//     expect(payload!.edges!.length).toEqual(2);
//     // @ts-ignore
//     expect(payload!.edges!.map((edge) => edge!.node)).toEqual(
//       usersAssignedTo.slice(0, 2)
//     );
//     // @ts-ignore
//     expect(payload!.edges!.map((edge) => edge!.cursor)).toEqual(
//       userIds.slice(0, 2)
//     );
//   });

//   it(`returns the users with args.after < _id < args.before when both before and after arguments are provided`, async () => {
//     const parent = testTag!;
//     const args = {
//       after: userIds[1],
//       before: userIds[4],
//     };

//     const payload = await usersAssignedToResolver?.(parent, args, {});

//     // Testing the pageInfo object
//     expect(payload!.pageInfo.hasNextPage).toEqual(true);
//     expect(payload!.pageInfo.hasPreviousPage).toEqual(true);
//     expect(payload!.pageInfo.startCursor).toEqual(userIds[2]);
//     expect(payload!.pageInfo.endCursor).toEqual(userIds[3]);

//     // Testing the edges object
//     expect(payload!.edges!.length).toEqual(2);
//     // @ts-ignore
//     expect(payload!.edges!.map((edge) => edge!.node)).toEqual(
//       usersAssignedTo.slice(2, 4)
//     );
//     // @ts-ignore
//     expect(payload!.edges!.map((edge) => edge!.cursor)).toEqual(
//       userIds.slice(2, 4)
//     );
//   });

//   it(`returns only "args.first" number of users with the least _id's when the first argument is provided`, async () => {
//     const parent = testTag!;
//     const args = {
//       first: 3,
//     };

//     const payload = await usersAssignedToResolver?.(parent, args, {});

//     // Testing the pageInfo object
//     expect(payload!.pageInfo.hasNextPage).toEqual(true);
//     expect(payload!.pageInfo.hasPreviousPage).toEqual(false);
//     expect(payload!.pageInfo.startCursor).toEqual(userIds[0]);
//     expect(payload!.pageInfo.endCursor).toEqual(userIds[2]);

//     // Testing the edges object
//     expect(payload!.edges!.length).toEqual(3);
//     // @ts-ignore
//     expect(payload!.edges!.map((edge) => edge!.node)).toEqual(
//       usersAssignedTo.slice(0, 3)
//     );
//     // @ts-ignore
//     expect(payload!.edges!.map((edge) => edge!.cursor)).toEqual(
//       userIds.slice(0, 3)
//     );
//   });

//   it(`returns only "args.last" number of users with the greatest _id's when the last argument is provided`, async () => {
//     const parent = testTag!;
//     const args = {
//       last: 3,
//     };

//     const payload = await usersAssignedToResolver?.(parent, args, {});

//     // Testing the pageInfo object
//     expect(payload!.pageInfo.hasNextPage).toEqual(false);
//     expect(payload!.pageInfo.hasPreviousPage).toEqual(true);
//     expect(payload!.pageInfo.startCursor).toEqual(userIds[2]);
//     expect(payload!.pageInfo.endCursor).toEqual(userIds[4]);

//     // Testing the edges object
//     expect(payload!.edges!.length).toEqual(3);
//     // @ts-ignore
//     expect(payload!.edges!.map((edge) => edge!.node)).toEqual(
//       usersAssignedTo.slice(-3)
//     );
//     // @ts-ignore
//     expect(payload!.edges!.map((edge) => edge!.cursor)).toEqual(
//       userIds.slice(-3)
//     );
//   });

//   it(`returns edges = [], hasNextPage = hasPreviousPage = false and startCursor = endCursor = null when there are no users who have been assigned the tag`, async () => {
//     const parent = randomTag!;
//     const args = {};

//     const payload = await usersAssignedToResolver?.(parent, args, {});

//     // Testing the pageInfo object
//     expect(payload!.pageInfo.hasNextPage).toEqual(false);
//     expect(payload!.pageInfo.hasPreviousPage).toEqual(false);
//     expect(payload!.pageInfo.startCursor).toEqual(null);
//     expect(payload!.pageInfo.endCursor).toEqual(null);

//     // Testing the edges object
//     expect(payload!.edges!.length).toEqual(0);
//     expect(payload!.edges!).toEqual([]);
//   });
// });
