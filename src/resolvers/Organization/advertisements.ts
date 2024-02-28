import type { InterfaceAdvertisement } from "../../models";
import { Advertisement } from "../../models";
import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";
import type { Types } from "mongoose";
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

/**
 * Resolver function to fetch and return advertisements created in an organization from the database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @param args - Arguments passed to the resolver.
 * @returns An object containing an array of advertisements,totalCount of advertisements and pagination information.
 */
export const advertisements: OrganizationResolvers["advertisements"] = async (
  parent,
  args,
) => {
  const parseGraphQLConnectionArgumentsResult =
    await parseGraphQLConnectionArguments({
      args,
      parseCursor: (args) =>
        parseCursor({
          ...args,
          organizationId: parent._id,
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

  //get the sorting object

  const sort = getCommonGraphQLConnectionSort({
    direction: parsedArgs.direction,
  });

  const [objectList, totalCount] = await Promise.all([
    Advertisement.find({
      ...filter,
      organizationId: parent._id,
    })
      .sort(sort)
      .limit(parsedArgs.limit)
      .lean()
      .exec(),

    Advertisement.find({
      organizationId: parent._id,
    })
      .countDocuments()
      .exec(),
  ]);

  return transformToDefaultGraphQLConnection<
    ParsedCursor,
    InterfaceAdvertisement,
    InterfaceAdvertisement
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
  organizationId,
}: ParseGraphQLConnectionCursorArguments & {
  organizationId: string | Types.ObjectId;
}): ParseGraphQLConnectionCursorResult<ParsedCursor> => {
  const errors: DefaultGraphQLArgumentError[] = [];
  const advertisement = await Advertisement.findOne({
    _id: cursorValue,
    organizationId,
  });
  if (!advertisement) {
    errors.push({
      message: `Argument ${cursorName} is an invalid cursor.`,
      path: cursorPath,
    });
    if (errors.length !== 0) {
      return {
        errors,
        isSuccessful: false,
      };
    }
  }

  return {
    isSuccessful: true,
    parsedCursor: cursorValue,
  };
};
