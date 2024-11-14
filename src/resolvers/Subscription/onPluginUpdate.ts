/* eslint-disable @typescript-eslint/no-explicit-any */
import { withFilter } from "graphql-subscriptions";
import type { SubscriptionResolvers } from "../../types/generatedGraphQLTypes";

// import { GroupChat } from "../GroupChat";

const TALAWA_PLUGIN_UPDATED = "TALAWA_PLUGIN_UPDATED";
/**
 * This property included a `subscribe` method, which is used to
 * subscribe the `current_user` to get updates for Group chats.
 *
 * @remarks To control updates on a per-client basis, the function uses the `withFilter`
 * method imported from `apollo-server-express` module.
 * You can learn about `subscription` {@link https://www.apollographql.com/docs/apollo-server/data/subscriptions/ | here }.
 */
// const subscribers: any = [];
// const messages: any = [];
// const onMessagesUpdates = (fn:any) => subscribers.push(fn);

export const filterFunction = async function (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  payload: any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  context: any,
): Promise<boolean> {
  return true;
};

/**
 * This function creates a response object for the `onPluginUpdate` subscription.
 *
 * @param payload - The payload received from the subscription.
 * @returns The response object for the subscription.
 */
export const createPluginUpdateResponse = (payload: any): any => {
  return payload.Plugin;
};

/**
 * This property included a `subscribe` method, which is used to
 * subscribe the `current_user` to get updates for Group chats.
 *
 * @remarks To control updates on a per-client basis, the function uses the `withFilter`
 * method imported from `apollo-server-express` module.
 * You can learn about `subscription` {@link https://www.apollographql.com/docs/apollo-server/data/subscriptions/ | here }.
 */
export const onPluginUpdate: SubscriptionResolvers["onPluginUpdate"] = {
  // @ts-expect-error-ts-ignore
  subscribe: withFilter(
    (_parent, _args, context) =>
      context.pubsub.asyncIterator([TALAWA_PLUGIN_UPDATED]),
    (payload, _variables, context) => filterFunction(payload, context),
  ),
  resolve: createPluginUpdateResponse,
};
