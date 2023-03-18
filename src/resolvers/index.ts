import { Resolvers } from "../types/generatedGraphQLTypes";
import { DirectChat } from "./DirectChat";
import { DirectChatMessage } from "./DirectChatMessage";
import { GroupChat } from "./GroupChat";
import { GroupChatMessage } from "./GroupChatMessage";
import { MembershipRequest } from "./MembershipRequest";
import { Mutation } from "./Mutation";
import { Organization } from "./Organization";
import { Query } from "./Query";
import { Subscription } from "./Subscription";
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
  DirectChat,
  DirectChatMessage,
  GroupChat,
  GroupChatMessage,
  MembershipRequest,
  Mutation,
  Organization,
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
};
