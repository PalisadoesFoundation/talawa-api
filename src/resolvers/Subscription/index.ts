import type { SubscriptionResolvers } from "../../types/generatedGraphQLTypes";
import { directMessageChat } from "./directMessageChat";
import { messageSentToDirectChat } from "./messageSentToDirectChat";
import { messageSentToGroupChat } from "./messageSentToGroupChat";
import { onPluginUpdate } from "./onPluginUpdate";
export const Subscription: SubscriptionResolvers = {
  directMessageChat,
  messageSentToDirectChat,
  messageSentToGroupChat,
  onPluginUpdate,
};
