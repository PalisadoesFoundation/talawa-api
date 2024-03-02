import type { GraphQLConnectionTraversalDirection } from "./index";

/**
 *This is typescript type of the object returned from `getCommonGraphQLConnectionSort` function.
 */
type CommmonGraphQLConnectionSort =
  | {
      _id: 1;
    }
  | {
      _id: -1;
    };

/**
 * This function is used to get an object containing common mongoose sorting logic.
 * @remarks
 * Here are a few assumptions this function makes which are common to most of the
 * graphQL connections.
 *
 * The entity that has the latest creation datetime must appear at the top of the connection. This
 * means the default sorting logic would be sorting in descending order by the time of creation of
 * an entity, and if two or more entities have the same time of creation sorting in descending order
 * by the primary key of the entity. MongoDB object ids are lexographically sortable all on their own
 * because they contain information about both the creation time and primary key for the document.
 *
 * Therefore, this function only returns sorting logic for sorting by the object id of a mongoDB
 * document.
 * @example
 * const sort = getCommonGraphQLConnectionSort(\{
 *   direction: "BACKWARD"
 *  \});
 * const objectList = await User.find().sort(sort).limit(10);
 */
export function getCommonGraphQLConnectionSort({
  direction,
}: {
  direction: GraphQLConnectionTraversalDirection;
}): CommmonGraphQLConnectionSort {
  if (direction === "BACKWARD") {
    return {
      _id: 1,
    };
  } else {
    return {
      _id: -1,
    };
  }
}
