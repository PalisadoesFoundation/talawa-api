import type { InterfaceEvent, InterfacePost, InterfaceUser } from "../models";
import {
  AppUserProfile,
  Event,
  Organization,
  Plugin,
  Post,
  User,
} from "../models";

import { faker } from "@faker-js/faker";
import type mongoose from "mongoose";
import { SampleData } from "../models/SampleData";

/* eslint-disable */

export const generateUserData = async (
  organizationId: string,
  userType: string,
) => {
  const gender: "male" | "female" = faker.helpers.arrayElement([
    "male",
    "female",
  ]);

  const fname = faker.person.firstName(gender);
  const lname = faker.person.lastName(gender);

  const adminFor = [];

  if (userType === "ADMIN") {
    adminFor.push(organizationId);
  }

  const user = new User({
    firstName: fname,
    lastName: lname,
    email: `${fname.toLowerCase()}${lname.toLowerCase()}@${faker.helpers.arrayElement(
      ["xyz", "abc", "lmnop"],
    )}.com`,
    password: "$2a$12$bSYpay6TRMpTOaAmYPFXku4avwmqfFBtmgg39TabxmtFEiz4plFtW",
    joinedOrganizations: [organizationId],
  });

  const appUserProfile = new AppUserProfile({
    userId: user._id,
    adminFor,
  });
  if (userType == "SUPERADMIN") {
    appUserProfile.isSuperAdmin = true;
  }
  await appUserProfile.save();
  user.appUserProfileId = appUserProfile._id;

  await user.save();

  const sampleModel = new SampleData({
    documentId: user._id,
    collectionName: "User",
  });
  const sampleModel2 = new SampleData({
    documentId: appUserProfile._id,
    collectionName: "AppUserProfile",
  });

  await sampleModel.save();
  await sampleModel2.save();
  return {
    user,
    appUserProfile,
  };
};

const createUser = async (
  generatedUser: InterfaceUser & mongoose.Document<any, any, InterfaceUser>,
): Promise<InterfaceUser & mongoose.Document<any, any, InterfaceUser>> => {
  const savedUser = await generatedUser.save();
  const appUserProfile = await AppUserProfile.create({
    userId: savedUser._id,
  });
  const sampleModel = new SampleData({
    documentId: savedUser._id,
    collectionName: "User",
  });
  const sampleModel2 = new SampleData({
    documentId: appUserProfile._id,
    collectionName: "AppUserProfile",
  });

  await sampleModel.save();
  await sampleModel2.save();
  return savedUser;
};

export const generateEventData = async (
  users: InterfaceUser[],
  organizationId: string,
): Promise<InterfaceEvent> => {
  const today = new Date();
  const oneWeekFromNow = new Date();
  oneWeekFromNow.setDate(today.getDate() + 7);

  const startTimestamp =
    today.getTime() +
    Math.random() * (oneWeekFromNow.getTime() - today.getTime());
  const startDate = new Date(startTimestamp);

  const duration = Math.floor(Math.random() * 7) + 1; // Random duration between 1 and 7 days
  const endDate = new Date(
    startDate.getTime() + duration * 24 * 60 * 60 * 1000,
  );

  const event = new Event({
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraphs(),
    location: faker.location.country() + faker.location.city(),
    latitude: faker.location.latitude(),
    longitude: faker.location.longitude(),
    recurring: faker.datatype.boolean({ probability: 0.3 }),
    allDay: faker.datatype.boolean(),
    startDate,
    endDate,
    startTime: faker.date.future(),
    endTime: faker.date.future(),
    recurrance: faker.helpers.arrayElement([
      "ONCE",
      "DAILY",
      "WEEKLY",
      "MONTHLY",
      "YEARLY",
    ]),
    isPublic: faker.datatype.boolean({ probability: 0.9 }),
    isRegisterable: faker.datatype.boolean(),
    creatorId: faker.helpers.arrayElement(users)._id,
    admins: [faker.helpers.arrayElement(users)._id],
    organization: organizationId,
    status: "ACTIVE",
  });

  await event.save();

  const sampleModel = new SampleData({
    documentId: event._id,
    collectionName: "Event",
  });

  await sampleModel.save();

  const creatorId = event.creatorId.toString();
  await User.findByIdAndUpdate(
    creatorId,
    { $push: { eventsCreated: event._id } },
    { new: true },
  );

  return event;
};

export const generatePostData = async (
  users: InterfaceUser[],
  organizationId: string,
): Promise<InterfacePost & mongoose.Document<any, any, InterfacePost>> => {
  const post = new Post({
    status: "ACTIVE",
    likedBy: [],
    likeCount: 0,
    commentCount: 0,
    pinned: false,
    text: faker.lorem.sentence(),
    title: faker.lorem.words(),
    creatorId: faker.helpers.arrayElement(users),
    organization: organizationId,
    imageUrl: faker.image.url(),
    createdAt: faker.date.recent(),
  });

  await post.save();

  const sampleModel = new SampleData({
    documentId: post._id,
    collectionName: "Post",
  });

  await sampleModel.save();

  return post;
};

const createPosts = async (
  numPosts: number,
  users: InterfaceUser[],
  organizationId: string,
): Promise<(InterfacePost & mongoose.Document<any, any, InterfacePost>)[]> => {
  const posts = [];
  for (let i = 0; i < numPosts; i++) {
    const post = await generatePostData(users, organizationId);
    posts.push(post);
  }
  return posts;
};

const createEvents = async (
  numEvents: number,
  users: InterfaceUser[],
  organizationId: string,
): Promise<InterfaceEvent[]> => {
  const events = [];

  for (let i = 0; i < numEvents; i++) {
    const event = await generateEventData(users, organizationId);
    events.push(event);
  }
  return events;
};

export const generateRandomPlugins = async (
  numberOfPlugins: number,
  users: string[],
): Promise<Promise<any>[]> => {
  const pluginPromises = [];
  for (let i = 0; i < numberOfPlugins; i++) {
    const selectedUserId: string = faker.helpers.arrayElement(users);
    const selectedUser = await User.findById(selectedUserId);

    const plugin = new Plugin({
      pluginName: faker.company.name(),
      pluginCreatedBy: `${selectedUser?.firstName} ${selectedUser?.lastName}`,
      pluginDesc: faker.lorem.sentence(),
    });

    const pluginPromise = plugin.save();

    const sampleModel = new SampleData({
      documentId: plugin._id,
      collectionName: "Plugin",
    });

    await sampleModel.save();
    pluginPromises.push(pluginPromise);
  }

  await Promise.all(pluginPromises);
  return pluginPromises;
};

export const createSampleOrganization = async (): Promise<void> => {
  const _id = faker.database.mongodbObjectId();
  const userData = await generateUserData(_id, "ADMIN");
  const creator = userData.user;
  const creatorAppProfile = userData.appUserProfile;

  interface Address {
    city: string;
    countryCode: string;
    dependentLocality: string;
    line1: string;
    line2: string;
    postalCode: string;
    sortingCode: string;
    state: string;
  }

  const address: Address = {
    city: faker.location.city(),
    countryCode: faker.location.countryCode(),
    dependentLocality: faker.location.secondaryAddress(),
    line1: faker.location.streetAddress(),
    line2: faker.location.secondaryAddress(),
    postalCode: faker.location.zipCode(),
    sortingCode: faker.location.zipCode(),
    state: faker.location.state(),
  };

  const organization = new Organization({
    _id,
    name: faker.company.name(),
    description: faker.lorem.sentences(),
    address,
    userRegistrationRequired: false,
    creatorId: creator._id,
    status: "ACTIVE",
    members: [creator._id],
    admins: [creator._id],
    groupChats: [],
    posts: [],
    pinnedPosts: [],
    membershipRequests: [],
    blockedUsers: [],
    visibleInSearch: true,
    createdAt: Date.now(),
  });

  creatorAppProfile.adminFor.push(organization._id);

  // await creator.save();
  await creatorAppProfile.save();

  for (let j = 0; j < 10; j++) {
    const userType = j === 0 ? "ADMIN" : "USER";

    const newUserData = await generateUserData(_id, userType);

    const newUser = newUserData.user;
    const newUserAppProfile = newUserData.appUserProfile;

    organization.members.push(newUser._id);

    if (userType === "ADMIN") {
      organization.admins.push(newUser);
    }
  }

  await organization.save();

  const sampleModel = new SampleData({
    documentId: organization._id,
    collectionName: "Organization",
  });

  await sampleModel.save();

  await createEvents(5, organization.members, organization._id.toString());
  await createPosts(5, organization.members, organization._id.toString());

  await generateRandomPlugins(10, organization.members);
};
