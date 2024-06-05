import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";
import { MAXIMUM_FETCH_LIMIT } from "../../constants";
import {
  type DefaultGraphQLArgumentError,
  type ParseGraphQLConnectionCursorArguments,
  type ParseGraphQLConnectionCursorResult,
  getCommonGraphQLConnectionFilter,
  getCommonGraphQLConnectionSort,
  parseGraphQLConnectionArguments,
  transformToDefaultGraphQLConnection,
} from "../../utilities/graphQLConnection";
import { GraphQLError } from "graphql";
import type { InterfaceEvent } from "../../models";
import { Event } from "../../models";
import type { Types } from "mongoose";

/**
 * This is a non-root field connection resolver for fetching events created wihtin an
 * organization using relay specification compliant cursor pagination. More info here:-
 * {@link https://relay.dev/graphql/connections.htm.}
 */
export const events: OrganizationResolvers["events"] = async (parent, args) => {
  const parseArgsResult = await parseGraphQLConnectionArguments({
    args,
    parseCursor: (args) =>
      parseCursor({
        ...args,
        organizationId: parent._id,
      }),
    maximumLimit: MAXIMUM_FETCH_LIMIT,
  });

  if (parseArgsResult.isSuccessful === false) {
    throw new GraphQLError("Invalid arguments provided.", {
      extensions: {
        code: "INVALID_ARGUMENTS",
        errors: parseArgsResult.errors,
      },
    });
  }

  const { parsedArgs } = parseArgsResult;

  const filter = getCommonGraphQLConnectionFilter({
    cursor: parsedArgs.cursor,
    direction: parsedArgs.direction,
  });

  const sort = getCommonGraphQLConnectionSort({
    direction: parsedArgs.direction,
  });

  const [objectList, totalCount] = await Promise.all([
    Event.find({
      ...filter,
      organization: parent._id,
    })
      .sort(sort)
      .limit(parsedArgs.limit)
      .lean()
      .exec(),

    Event.find({
      organization: parent._id,
    })
      .countDocuments()
      .exec(),
  ]);

  return transformToDefaultGraphQLConnection<
    ParsedCursor,
    InterfaceEvent,
    InterfaceEvent
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
  const event = await Event.findOne({
    _id: cursorValue,
    organization: organizationId,
  });

  if (!event) {
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

  return {
    isSuccessful: true,
    parsedCursor: cursorValue,
  };
};
