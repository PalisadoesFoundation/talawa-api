import { SubscriptionResolvers } from "../../types/generatedGraphQLTypes";
import { directMessageChat } from "./directMessageChat";
import { messageSentToDirectChat } from "./messageSentToDirectChat";
import { messageSentToGroupChat } from "./messageSentToGroupChat";

export const Subscription: SubscriptionResolvers = {
  directMessageChat,
  messageSentToDirectChat,
  messageSentToGroupChat,
};
