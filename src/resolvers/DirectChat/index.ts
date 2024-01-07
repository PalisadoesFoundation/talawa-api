import type { DirectChatResolvers } from "../../types/generatedGraphQLTypes";
import { creatorId } from "./creatorId";
import { messages } from "./messages";
import { organization } from "./organization";
import { users } from "./users";

export const DirectChat: DirectChatResolvers = {
  creatorId,
  messages,
  organization,
  users,
};
