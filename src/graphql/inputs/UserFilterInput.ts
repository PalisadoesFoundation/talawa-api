// src/graphql/inputs/UserFilterInput.ts
import { builder } from "~/src/graphql/builder";

export const UserFilterInput = builder
  .inputRef<{
    firstName_contains?: string;
    lastName_contains?: string;
  }>("UserFilterInput")
  .implement({
    description: "Filter criteria on user fields",
    fields: (t) => ({
      firstName_contains: t.string({
        required: false,
        description: "Only include chats where a member’s firstName contains this",
      }),
      lastName_contains: t.string({
        required: false,
        description: "Only include chats where a member’s lastName contains this",
      }),
    }),
  });
