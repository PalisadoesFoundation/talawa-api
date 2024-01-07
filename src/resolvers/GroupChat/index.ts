import type { GroupChatResolvers } from "../../types/generatedGraphQLTypes";
import { creatorId } from "./creatorId";
import { messages } from "./messages";
import { organization } from "./organization";
import { users } from "./users";

export const GroupChat: GroupChatResolvers = {
  creatorId,
  messages,
  organization,
  users,
};
