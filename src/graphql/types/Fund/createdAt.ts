// import envConfig from "~/src/utilities/graphqLimits";
// import { Fund } from "./Fund";
// import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
// import type { Fund as FundType } from "./Fund";
// import type { GraphQLContext } from "~/src/graphql/context";

// export const createdAtResolver = async (
//   parent: FundType,
//   _args: unknown,
//   ctx: GraphQLContext,
// ) => {
//   if (!ctx.currentClient.isAuthenticated) {
//     throw new TalawaGraphQLError({
//       extensions: { code: "unauthenticated" },
//     });
//   }

//   const currentUserId = ctx.currentClient.user.id;

//   const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
//     columns: { role: true },
//     with: {
//       organizationMembershipsWhereMember: {
//         columns: { role: true },
//         where: (fields, operators) =>
//           operators.eq(fields.organizationId, parent.organizationId),
//       },
//     },
//     where: (fields, operators) => operators.eq(fields.id, currentUserId),
//   });

//   if (currentUser === undefined) {
//     throw new TalawaGraphQLError({
//       extensions: { code: "unauthenticated" },
//     });
//   }

//   const currentUserOrganizationMembership =
//     currentUser.organizationMembershipsWhereMember[0];

//   if (
//     currentUser.role !== "administrator" &&
//     (!currentUserOrganizationMembership ||
//       currentUserOrganizationMembership.role !== "administrator")
//   ) {
//     throw new TalawaGraphQLError({
//       extensions: { code: "unauthorized_action" },
//     });
//   }

//   return parent.createdAt;
// };

// export const CREATED_AT_COMPLEXITY = 


// Fund.implement({
// 	fields: (t) => ({
// 		createdAt: t.field({
// 			description: "Date time at the time the fund was created.",
// 			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
// 			resolve: createdAtResolver, 
// 			type: "DateTime",
// 		}),
// 	}),
// });








import envConfig from "~/src/utilities/graphqLimits";
import { Fund } from "./Fund";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { Fund as FundType } from "./Fund";
import type { GraphQLContext } from "~/src/graphql/context";

export const CREATED_AT_COMPLEXITY = envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST;

export const createdAtResolver = async (
  parent: FundType,
  _args: unknown,
  ctx: GraphQLContext,
) => {
  if (!ctx.currentClient.isAuthenticated) {
    throw new TalawaGraphQLError({
      extensions: { code: "unauthenticated" },
    });
  }

  const currentUserId = ctx.currentClient.user.id;

  const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
    columns: { role: true },
    with: {
      organizationMembershipsWhereMember: {
        columns: { role: true },
        where: (fields, operators) =>
          operators.eq(fields.organizationId, parent.organizationId),
      },
    },
    where: (fields, operators) => operators.eq(fields.id, currentUserId),
  });

  if (currentUser === undefined) {
    throw new TalawaGraphQLError({
      extensions: { code: "unauthenticated" },
    });
  }

  const currentUserOrganizationMembership =
    currentUser.organizationMembershipsWhereMember[0];

  if (
    currentUser.role !== "administrator" &&
    (!currentUserOrganizationMembership ||
      currentUserOrganizationMembership.role !== "administrator")
  ) {
    throw new TalawaGraphQLError({
      extensions: { code: "unauthorized_action" },
    });
  }

  return parent.createdAt;
};

Fund.implement({
  fields: (t) => ({
    createdAt: t.field({
      description: "Date time at the time the fund was created.",
      complexity: CREATED_AT_COMPLEXITY,
      resolve: createdAtResolver,
      type: "DateTime",
    }),
  }),
});
