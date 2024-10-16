import type { ChatResolvers } from "../../types/generatedGraphQLTypes";
import { creator } from "./creator";
import { messages } from "./messages";
import { organization } from "./organization";
import { users } from "./users";
import { admins } from "./admins";

export const Chat: ChatResolvers = {
  creator,
  messages,
  organization,
  users,
  admins,
};
