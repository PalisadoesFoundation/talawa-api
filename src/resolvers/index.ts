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
import {
  DateResolver,
  DateTimeResolver,
  EmailAddressResolver,
  LatitudeResolver,
  LongitudeResolver,
  ObjectIDResolver,
  PhoneNumberResolver,
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

  // graphql-scalar resolver
  Date: DateResolver,
  DateTime: DateTimeResolver,
  EmailAddress: EmailAddressResolver,
  Latitude: LatitudeResolver,
  Longitude: LongitudeResolver,
  ObjectID: ObjectIDResolver,
  PhoneNumber: PhoneNumberResolver,
  Time: TimeResolver,
  URL: URLResolver,
};
