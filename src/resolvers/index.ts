import type { Resolvers } from "../types/generatedGraphQLTypes";
import { Comment } from "./Comment";
import { DirectChat } from "./DirectChat";
import { DirectChatMessage } from "./DirectChatMessage";
import { Event } from "./Event";
import { EventProject } from "./EventProject";
import { GroupChat } from "./GroupChat";
import { GroupChatMessage } from "./GroupChatMessage";
import { MembershipRequest } from "./MembershipRequest";
import { Mutation } from "./Mutation";
import { Organization } from "./Organization";
import { Post } from "./Post";
import { Query } from "./Query";
import { Subscription } from "./Subscription";
import { Task } from "./Task";
import { User } from "./User";
import { UserTag } from "./UserTag";
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

export const resolvers: Resolvers = {
  Comment,
  DirectChat,
  DirectChatMessage,
  Event,
  EventProject,
  GroupChat,
  GroupChatMessage,
  MembershipRequest,
  Mutation,
  Organization,
  Post,
  Query,
  Subscription,
  Task,
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
};
