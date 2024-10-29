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
import { ActionItemCategory } from "./ActionItemCategory";
import { AgendaItem } from "./AgendaItem";
import { AgendaSection } from "./AgendaSection";
import { AgendaCategory } from "./AgendaCategory";
import { CheckIn } from "./CheckIn";
import { Comment } from "./Comment";
import { Chat } from "./Chat";
import { ChatMessage } from "./ChatMessage";
import { Event } from "./Event";
import { EventVolunteer } from "./EventVolunteer";
import { Feedback } from "./Feedback";
import { Fund } from "./Fund";
import { MembershipRequest } from "./MembershipRequest";
import { Mutation } from "./Mutation";
import { Organization } from "./Organization";
import { Post } from "./Post";
import { RecurrenceRule } from "./RecurrenceRule";

import { Query } from "./Query";
import { Subscription } from "./Subscription";
import { User } from "./User";
import { UserFamily } from "./UserFamily";
import { UserTag } from "./UserTag";

import { Advertisement } from "./Advertisement";

import { currentUserExists } from "./middleware/currentUserExists";

const resolvers: Resolvers = {
  ActionItemCategory,
  AgendaItem,
  AgendaSection,
  AgendaCategory,
  Advertisement,
  CheckIn,
  Comment,
  Chat,
  ChatMessage,
  Event,
  EventVolunteer,
  Feedback,
  Fund,
  UserFamily,
  MembershipRequest,
  Mutation,
  Organization,
  Post,
  RecurrenceRule,
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
  "Mutation.createChat": [currentUserExists()],
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
