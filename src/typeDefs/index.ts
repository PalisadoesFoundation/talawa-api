import { gql } from "apollo-server-core";
import { chat, message } from "./chats";
import { donation } from "./donation";
import { event } from "./event";
import { language } from "./language";
import { mutation } from "./mutation";
import { newsfeed } from "./newsfeed";
import { organization } from "./organization";
import { plugin, pluginField } from "./plugin";
import { query } from "./query";
import { user, auth } from "./user";
import { utils } from "./utils";

/*
Named this additionalTypeDefs because they haven't yet been extracted into their own files.
*/
const additionalTypeDefs = gql`
  directive @auth on FIELD_DEFINITION
  directive @role(requires: UserType) on FIELD_DEFINITION

  type Message {
    _id: ID!
    text: String
    createdAt: String
    imageUrl: String
    videoUrl: String
    creator: User
  }

  input GroupInput {
    title: String
    description: String
    organizationId: ID!
  }

  type Group {
    _id: ID
    title: String
    description: String
    createdAt: String
    organization: Organization!
    admins: [User]
  }

  type Subscription {
    messageSentToDirectChat: DirectChatMessage
    messageSentToGroupChat: GroupChatMessage
    directMessageChat: MessageChat
  }

  type DeletePayload {
    success: Boolean!
  }
`;

/*
'gql' tag creates a value of type DocumentNode. Here typeDefs is an array of those DocumentNode type variables
that can be directly consumed by apollo-server. This is done to have our type-defintions defined inside
typescript files rather than .graphql files. Therefore, saving us the trouble of manually copying over those
.graphql files to the build directory during build time and also providing the benefits of dynamically altering
type-defintions using typescript.
*/
export const typeDefs = [
  additionalTypeDefs,
  auth,
  chat,
  donation,
  event,
  language,
  mutation,
  message,
  newsfeed,
  organization,
  plugin,
  pluginField,
  query,
  user,
  utils,
];
