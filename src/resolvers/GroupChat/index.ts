import type { GroupChatResolvers } from "../../types/generatedGraphQLTypes";
import { createdBy } from "./createdBy";
import { messages } from "./messages";
import { organization } from "./organization";
import { users } from "./users";

export const GroupChat: GroupChatResolvers = {
  createdBy,
  messages,
  organization,
  users,
};
