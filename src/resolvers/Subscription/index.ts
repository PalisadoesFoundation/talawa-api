import type { SubscriptionResolvers } from "../../types/generatedGraphQLTypes";
import { messageSentToChat } from "./messageSentToChat";
export const Subscription: SubscriptionResolvers = {
  messageSentToChat,
};
