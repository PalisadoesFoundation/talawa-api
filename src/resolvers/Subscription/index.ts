import type { SubscriptionResolvers } from "../../types/generatedGraphQLTypes";
import { directMessageChat } from "./directMessageChat";
import { messageSentToChat } from "./messageSentToChat";
import { onPluginUpdate } from "./onPluginUpdate";
export const Subscription: SubscriptionResolvers = {
  directMessageChat,
  messageSentToChat,
  onPluginUpdate,
};
