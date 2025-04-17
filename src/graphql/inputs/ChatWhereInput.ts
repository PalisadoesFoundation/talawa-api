// src/graphql/inputs/ChatWhereInput.ts
import { builder } from "~/src/graphql/builder";
import { UserFilterInput } from "./UserFilterInput";

export const ChatWhereInput = builder
  .inputRef<{
    name_contains?: string;
    user?: { firstName_contains?: string; lastName_contains?: string };
  }>("ChatWhereInput")
  .implement({
    description: "Filter criteria for chats",
    fields: (t) => ({
      name_contains: t.string({
        required: false,
        description: "Only include chats whose name contains this",
      }),
      user: t.field({
        required: false,
        type: UserFilterInput,
        description: "Also filter by member’s name",
      }),
    }),
  });
