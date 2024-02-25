import type { UserTagResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceOrganizationTagUser } from "../../models";
import { OrganizationTagUser } from "../../models";
import {
  getCommonGraphQLConnectionFilter,
  getCommonGraphQLConnectionSort,
  parseGraphQLConnectionArguments,
  transformToDefaultGraphQLConnection,
  type DefaultGraphQLArgumentError,
  type ParseGraphQLConnectionCursorArguments,
  type ParseGraphQLConnectionCursorResult,
} from "../../utilities/graphQLConnection";
import { GraphQLError } from "graphql";
import { MAXIMUM_FETCH_LIMIT } from "../../constants";
import type { Types } from "mongoose";

export const childTags: UserTagResolvers["childTags"] = async (
  parent,
  args,
  args,
) => {
  const parseGraphQLConnectionArgumentsResult =
    await parseGraphQLConnectionArguments({
      args,
      parseCursor: (args) =>
        parseCursor({
          ...args,
          parentTagId: parent._id,
        }),
      maximumLimit: MAXIMUM_FETCH_LIMIT,
    });

  if (!parseGraphQLConnectionArgumentsResult.isSuccessful) {
    throw new GraphQLError("Invalid arguments provided.", {
      extensions: {
        code: "INVALID_ARGUMENTS",
        errors: parseGraphQLConnectionArgumentsResult.errors,
      },
    });
  }

  const { parsedArgs } = parseGraphQLConnectionArgumentsResult;

  const filter = getCommonGraphQLConnectionFilter({
    cursor: parsedArgs.cursor,
    direction: parsedArgs.direction,
  });

  const sort = getCommonGraphQLConnectionSort({
    direction: parsedArgs.direction,
  });

  const [objectList, totalCount] = await Promise.all([
    OrganizationTagUser.find({
      ...filter,
      parentTagId: parent._id,
    })
      .sort(sort)
      .limit(parsedArgs.limit)
      .lean()
      .exec(),
    OrganizationTagUser.find({
      parentTagId: parent._id,
    })
      .countDocuments()
      .exec(),
  ]);

  return transformToDefaultGraphQLConnection<
    ParsedCursor,
    InterfaceOrganizationTagUser,
    InterfaceOrganizationTagUser
  >({
    objectList,
    parsedArgs,
    totalCount,
  });
};

/*
This is typescript type of the parsed cursor for this connection resolver.
*/
type ParsedCursor = string;

/*
This function is used to validate and transform the cursor passed to this connnection
resolver.
*/
export const parseCursor = async ({
  cursorValue,
  cursorName,
  cursorPath,
  parentTagId,
}: ParseGraphQLConnectionCursorArguments & {
  parentTagId: string | Types.ObjectId;
}): ParseGraphQLConnectionCursorResult<ParsedCursor> => {
  const errors: DefaultGraphQLArgumentError[] = [];
  const tag = await OrganizationTagUser.findOne({
    _id: cursorValue,
    parentTagId,
  });

  if (!tag) {
    errors.push({
      message: `Argument ${cursorName} is an invalid cursor.`,
      path: cursorPath,
    });
  }

  if (errors.length !== 0) {
    return {
      errors,
      isSuccessful: false,
    };
  }

  if (args.input.cursor) {
    const cursorExists = await OrganizationTagUser.exists({
      _id: args.input.cursor,
    });

    if (!cursorExists)
      return {
        data: null,
        errors: [
          {
            __typename: "InvalidCursor",
            message: "The provided cursor does not exist in the database.",
            path: ["input", "cursor"],
          },
        ],
      };
  }

  const allChildTagObjects = await OrganizationTagUser.find({
    ...getFilterObject(args.input),
    parentTagId: parent._id,
  })
    .sort(
      getSortingObject(args.input.direction, {
        // The default sorting logic of ascending order by MongoID should always be provided
        _id: 1,
        name: 1,
      }),
    )
    .limit(getLimit(args.input.limit))
    .lean();

  return generateConnectionObject<
    InterfaceOrganizationTagUser,
    InterfaceOrganizationTagUser
  >(args.input, allChildTagObjects, (tag) => tag);
};
