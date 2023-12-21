import type { DirectChatResolvers } from "../../types/generatedGraphQLTypes";
import { createdBy } from "./createdBy";
import { messages } from "./messages";
import { organization } from "./organization";
import { users } from "./users";

export const DirectChat: DirectChatResolvers = {
  createdBy,
  messages,
  organization,
  users,
};
