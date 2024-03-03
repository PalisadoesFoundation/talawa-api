import { composeResolvers } from "@graphql-tools/resolvers-composition";
import {
  DateResolver,
  DateTimeResolver,
  EmailAddressResolver,
  LatitudeResolver,
  LongitudeResolver,
  PhoneNumberResolver,
  PositiveIntResolver,
  TimeResolver,
  URLResolver,
} from "graphql-scalars";
import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";
import type { Resolvers } from "../types/generatedGraphQLTypes";
import { ActionItem } from "./ActionItem";
import { ActionItemCategory } from "./ActionItemCategory";
import { CheckIn } from "./CheckIn";
import { Comment } from "./Comment";
import { DirectChat } from "./DirectChat";
import { DirectChatMessage } from "./DirectChatMessage";
import { Event } from "./Event";
import { EventVolunteer } from "./EventVolunteer";
import { Feedback } from "./Feedback";
import { Fund } from "./Fund";
import { FundraisingCampaign } from "./FundraisingCampagin";
import { GroupChat } from "./GroupChat";
import { GroupChatMessage } from "./GroupChatMessage";
import { MembershipRequest } from "./MembershipRequest";
import { Mutation } from "./Mutation";
import { Organization } from "./Organization";
import { Post } from "./Post";

import { Query } from "./Query";
import { Subscription } from "./Subscription";
import { User } from "./User";
import { UserFamily } from "./UserFamily";
import { UserTag } from "./UserTag";

import { Advertisement } from "./Advertisement";

import { currentUserExists } from "./middleware/currentUserExists";

const resolvers: Resolvers = {
  ActionItem,
  ActionItemCategory,
  Advertisement,
  CheckIn,
  Comment,
  DirectChat,
  DirectChatMessage,
  Event,
  EventVolunteer,
  Feedback,
  Fund,
  FundraisingCampaign,
  GroupChat,
  UserFamily,
  GroupChatMessage,
  MembershipRequest,
  Mutation,
  Organization,
  Post,
  Query,
  Subscription,
  User,
  UserTag,

  // graphql-scalar resolver
  Date: DateResolver,
  DateTime: DateTimeResolver,
  EmailAddress: EmailAddressResolver,
  Latitude: LatitudeResolver,
  Longitude: LongitudeResolver,
  PhoneNumber: PhoneNumberResolver,
  PositiveInt: PositiveIntResolver,
  Time: TimeResolver,
  URL: URLResolver,

  // Graphql Upload
  Upload: GraphQLUpload,
};

const resolversComposition = {
  "Mutation.addFeedback": [currentUserExists()],
  "Mutation.addOrganizationImage": [currentUserExists()],
  "Mutation.blockPluginCreationBySuperadmin": [currentUserExists()],
  "Mutation.createComment": [currentUserExists()],
  "Mutation.createDirectChat": [currentUserExists()],
  "Mutation.createGroupChat": [currentUserExists()],
  "Mutation.createOrganization": [currentUserExists()],
  "Mutation.createVenue": [currentUserExists()],
  "Mutation.deleteVenue": [currentUserExists()],
  "Mutation.editVenue": [currentUserExists()],
  "Mutation.likeComment": [currentUserExists()],
  "Mutation.likePost": [currentUserExists()],
  "Mutation.logout": [currentUserExists()],
  "Mutation.registerForEvent": [currentUserExists()],
  "Mutation.removeOrganizationImage": [currentUserExists()],
  "Mutation.saveFcmToken": [currentUserExists()],
  "Mutation.sendMembershipRequest": [currentUserExists()],
  "Mutation.unlikeComment": [currentUserExists()],
  "Mutation.unlikePost": [currentUserExists()],
  "Mutation.unregisterForEventByUser": [currentUserExists()],
  "Mutation.updateLanguage": [currentUserExists()],
  "Mutation.updatePost": [currentUserExists()],
  "Mutation.createAdvertisement": [currentUserExists()],
};

export const composedResolvers: Resolvers = composeResolvers(
  resolvers,
  resolversComposition,
);
