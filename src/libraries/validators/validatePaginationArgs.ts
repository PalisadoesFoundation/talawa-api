import { errors, requestContext } from "..";
import {
  PAGINATION_EITHER_FIRST_OR_LAST_MUST_BE_PROVIDED_ERROR,
  PAGINATION_BOTH_FIRST_AND_LAST_MUST_NOT_BE_PROVIDED_ERROR,
  PAGINATION_BEFORE_AND_LAST_MUST_NOT_BE_PROVIDED_WITH_FIRST_ERROR,
  PAGINATION_AFTER_AND_FIRST_MUST_NOT_BE_PROVIDED_WITH_LAST_ERROR,
  MAXIMUM_FETCH_LIMIT,
  PAGINATION_MAXIMUM_FETCH_LIMIT_CROSSED,
} from "../../constants";
import { InputMaybe, Scalars } from "../../types/generatedGraphQLTypes";

export type CursorPaginationArgsType = {
  after?: InputMaybe<Scalars["String"]>;
  before?: InputMaybe<Scalars["String"]>;
  first?: InputMaybe<Scalars["PositiveInt"]>;
  last?: InputMaybe<Scalars["PositiveInt"]>;
};

export const validatePaginationArgs = (args: CursorPaginationArgsType) => {
  // Check that one of first of last must be provided
  if (!args.first && !args.last) {
    throw new errors.InputValidationError(
      requestContext.translate(
        PAGINATION_EITHER_FIRST_OR_LAST_MUST_BE_PROVIDED_ERROR.MESSAGE
      ),
      PAGINATION_EITHER_FIRST_OR_LAST_MUST_BE_PROVIDED_ERROR.CODE,
      PAGINATION_EITHER_FIRST_OR_LAST_MUST_BE_PROVIDED_ERROR.PARAM
    );
  }

  // Check that both first and last must not be provided together
  if (args.first && args.last) {
    throw new errors.InputValidationError(
      requestContext.translate(
        PAGINATION_BOTH_FIRST_AND_LAST_MUST_NOT_BE_PROVIDED_ERROR.MESSAGE
      ),
      PAGINATION_BOTH_FIRST_AND_LAST_MUST_NOT_BE_PROVIDED_ERROR.CODE,
      PAGINATION_BOTH_FIRST_AND_LAST_MUST_NOT_BE_PROVIDED_ERROR.PARAM
    );
  }

  // Positive integer GraphQL Scalar ensures that the first and last are greater than zero
  // Ensure that these arguments are less than the maximum allowed fetch limit
  if (
    (args.first && args.first > MAXIMUM_FETCH_LIMIT) ||
    (args.last && args.last > MAXIMUM_FETCH_LIMIT)
  ) {
    throw new errors.InputValidationError(
      requestContext.translate(PAGINATION_MAXIMUM_FETCH_LIMIT_CROSSED.MESSAGE),
      PAGINATION_MAXIMUM_FETCH_LIMIT_CROSSED.CODE,
      PAGINATION_MAXIMUM_FETCH_LIMIT_CROSSED.PARAM
    );
  }

  // Check that only after can be provided with first
  if (args.first && (args.last || args.before)) {
    throw new errors.InputValidationError(
      requestContext.translate(
        PAGINATION_BEFORE_AND_LAST_MUST_NOT_BE_PROVIDED_WITH_FIRST_ERROR.MESSAGE
      ),
      PAGINATION_BEFORE_AND_LAST_MUST_NOT_BE_PROVIDED_WITH_FIRST_ERROR.CODE,
      PAGINATION_BEFORE_AND_LAST_MUST_NOT_BE_PROVIDED_WITH_FIRST_ERROR.PARAM
    );
  }

  // Check that only before can be provided with last
  if (args.last && (args.first || args.after)) {
    throw new errors.InputValidationError(
      requestContext.translate(
        PAGINATION_AFTER_AND_FIRST_MUST_NOT_BE_PROVIDED_WITH_LAST_ERROR.MESSAGE
      ),
      PAGINATION_AFTER_AND_FIRST_MUST_NOT_BE_PROVIDED_WITH_LAST_ERROR.CODE,
      PAGINATION_AFTER_AND_FIRST_MUST_NOT_BE_PROVIDED_WITH_LAST_ERROR.PARAM
    );
  }
};
