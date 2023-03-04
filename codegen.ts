import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  // Points to our schema and the additional scalar Upload which is added by Apollo-Server at runtime
  schema: ["./src/typeDefs/**/*.ts", "scalar Upload"],

  generates: {
    "./src/types/generatedGraphQLTypes.ts": {
      plugins: ["typescript", "typescript-resolvers"],

      config: {
        // Generates graphQL enums as typescript union types.
        enumsAsTypes: true,

        // Makes the info argument passed to the resolver functions optional.
        optionalInfoArgument: true,

        // Makes the resolver function callable.
        makeResolverTypeCallable: true,

        // Adds suffix "Model" to the end of generated database model types.
        mapperTypeSuffix: "Model",

        // Mappers lets us provide database model types to be used in generated typescript types instead of graphql types. This
        // functionality is useful because what we retrieve from the database and what we choose to return from a graphql server
        // could be completely different fields. Address to models here is relative to the location of generated types.
        mappers: {
          MessageChat: "../models/MessageChat#Interface_MessageChat",

          Comment: "../models/Comment#Interface_Comment",

          DirectChat: "../models/DirectChat#Interface_DirectChat",

          DirectChatMessage:
            "../models/DirectChatMessage#Interface_DirectChatMessage",

          Donation: "../models/Donation#Interface_Donation",

          Event: "../models/Event#Interface_Event",

          // EventProject: '../models/EventProject#Interface_EventProject'

          // File: '../models/File#Interface_File',

          Group: "../models/Group#Interface_Group",

          GroupChat: "../models/GroupChat#Interface_GroupChat",

          GroupChatMessage:
            "../models/GroupChatMessage#Interface_GroupChatMessage",

          // ImageHash: '../models/ImageHash#Interface_ImageHash',

          Language: "../models/Language#Interface_Language",

          MembershipRequest:
            "../models/MembershipRequest#Interface_MembershipRequest",

          Message: "../models/Message#Interface_Message",

          Organization: "../models/Organization#Interface_Organization",

          Plugin: "../models/Plugin#Interface_Plugin",

          PluginField: "../models/PluginField#Interface_PluginField",

          Post: "../models/Post#Interface_Post",

          Task: "../models/Task#Interface_Task",

          User: "../models/User#Interface_User",
        },

        useTypeImports: true,
      },
    },
  },
};

export default config;
