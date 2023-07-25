import { withFilter } from "graphql-subscriptions";
import type { SubscriptionResolvers } from "../../types/generatedGraphQLTypes";
import { Plugin } from "../../models";
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
  payload: any,
  context: any
): Promise<boolean> {
  // const { currentUserId } = context.context;
  // const groupChatId = payload.messageSentToGroupChat.groupChatMessageBelongsTo;

  // const groupChat = await GroupChat.findOne({
  //   _id: groupChatId,
  // }).lean();

  // if (groupChat) {
  //   const currentUserIsGroupChatMember = groupChat.users.some((user) =>
  //     user.equals(currentUserId)
  //   );
  //   return currentUserIsGroupChatMember;
  // } else {
  //   return false;
  // }
  console.log("=====>  PAYLOAD", payload);
  console.log("=====>  context", context);
  return true;
};
//   const getPlugins = async() => await Plugin.find().lean();
export const onPluginUpdate: SubscriptionResolvers["onPluginUpdate"] = {
  // @ts-ignorep
  subscribe: withFilter(
    (_parent, _args, context) =>
      context.pubsub.asyncIterator([TALAWA_PLUGIN_UPDATED]),

    (payload, _variables, context) => filterFunction(payload, context)
  ),
  resolve: (payload: any) => {
    console.log("============OG PAYLOAD", payload);
    return payload.Plugin;
  },
};
//    const res = getPlugins();
//     console.log("datais ", _parent, _args, context,res);
//     context.pubsub.publish(TALAWA_PLUGIN_UPDATED , {res})
