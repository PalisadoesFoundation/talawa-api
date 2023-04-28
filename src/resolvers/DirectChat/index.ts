import type { DirectChatResolvers } from "../../types/generatedGraphQLTypes";
import { creator } from "./creator";
import { messages } from "./messages";
import { organization } from "./organization";
import { users } from "./users";

export const DirectChat: DirectChatResolvers = {
  creator,
  messages,
  organization,
  users,
};
