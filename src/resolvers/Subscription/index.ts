import type { SubscriptionResolvers } from "../../types/generatedGraphQLTypes";
import { messageSentToChat } from "./messageSentToChat";
import { onPluginUpdate } from "./onPluginUpdate";
export const Subscription: SubscriptionResolvers = {
  messageSentToChat,
  onPluginUpdate,
};
