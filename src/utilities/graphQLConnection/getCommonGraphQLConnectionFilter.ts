import type { GraphQLConnectionTraversalDirection } from "./index";

/**
 * This is typescript type of the object returned from function `getCommonGraphQLConnectionFilter`.
 */
type CommonGraphQLConnectionFilter =
  | {
      _id: {
        $lt: string;
      };
    }
  | {
      _id: {
        $gt: string;
      };
    }
  | Record<string, never>;

/**
 * This function is used to get an object containing common mongoose filtering logic.
 *
 * @remarks
 *
 * Here are a few assumptions this function makes which are common to most of the
 * graphQL connections.
 *
 * The entity that has the latest creation datetime must appear at the top of the connection. This
 * means the default filtering logic would be to filter in descending order by the time of creation of
 * an entity, and if two or more entities have the same time of creation filtering in descending order
 * by the primary key of the entity. MongoDB object ids are lexographically sortable all on their own
 * because they contain information about both the creation time and primary key for the document.
 *
 * Therefore, this function only returns filtering logic for filtering by the object id of a mongoDB
 * document.
 *
 * @example
 *
 * const filter = getCommonGraphQLConnectionFilter(\{
 *  cursor: "65da3f8df35eb5bfd52c5368",
 *  direction: "BACKWARD"
 * \});
 * const objectList = await User.find(filter).limit(10);
 */
export function getCommonGraphQLConnectionFilter({
  cursor,
  direction,
}: {
  cursor: string | null;
  direction: GraphQLConnectionTraversalDirection;
}): CommonGraphQLConnectionFilter {
  if (cursor !== null) {
    if (direction === "BACKWARD") {
      return {
        _id: {
          $gt: cursor,
        },
      };
    } else {
      return {
        _id: {
          $lt: cursor,
        },
      };
    }
  } else {
    return {};
  }
}
