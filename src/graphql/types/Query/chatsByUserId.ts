// src/graphql/query/chatsByUserId.ts
import { and, exists, ilike, sql } from "drizzle-orm";
import { builder } from "~/src/graphql/builder";
import { chatsTable } from "~/src/drizzle/tables/chats";
import { chatMembershipsTable } from "~/src/drizzle/tables/chatMemberships";
import { usersTable } from "~/src/drizzle/tables/users";
import { ChatWhereInput } from "~/src/graphql/inputs/ChatWhereInput";
import type {
  ExplicitGraphQLContext,
  ImplicitMercuriusContext,
} from "~/src/graphql/context";
import { Chat } from "~/src/graphql/types/Chat/Chat";

type Ctx = ExplicitGraphQLContext & ImplicitMercuriusContext;

builder.queryField("chatsByUserId", (t) =>
  t.field({
    type: [Chat],
    args: {
      id: t.arg.id({ required: true }),
      where: t.arg({ type: ChatWhereInput, required: false }),
    },
    resolve: async (_parent, { id, where }, ctx: Ctx) => {
      const baseCondition = exists(
        ctx.drizzleClient
          .select({ 1: sql`1` })
          .from(chatMembershipsTable)
          .where(
            and(
              sql`${chatMembershipsTable.chatId} = ${chatsTable.id}`,
              sql`${chatMembershipsTable.memberId} = ${id}`
            )
          )
      );

      const clauses = [baseCondition] as ReturnType<typeof and>[];

      if (where?.name_contains) {
        clauses.push(ilike(chatsTable.name, `%${where.name_contains}%`));
      }

      if (where?.user) {
        const { firstName_contains, lastName_contains } = where.user;
        clauses.push(
          exists(
            ctx.drizzleClient
              .select({ 1: sql`1` })
              .from(chatMembershipsTable)
              .innerJoin(
                usersTable,
                sql`${usersTable.id} = ${chatMembershipsTable.memberId}`
              )
              .where(
                and(
                  sql`${chatMembershipsTable.chatId} = ${chatsTable.id}`,
                  firstName_contains
                    ? ilike(usersTable.name, `%${firstName_contains}%`)
                    : sql`TRUE`,
                  lastName_contains
                    ? ilike(usersTable.name, `%${lastName_contains}%`)
                    : sql`TRUE`
                )
              )
          )
        );
      }

      return ctx.drizzleClient
        .select()
        .from(chatsTable)
        .where(and(...clauses))
        .orderBy((c) => [c.createdAt])
        .execute();
    },
  })
);
