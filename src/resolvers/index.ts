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
};
