const User = require('../models/User');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
} = require('../../constants');

/**
 * This utility method returns the user if it exists.
 * @param {int} id The user id that has to be searched.
 * @returns {object} User(if exists)
 */
 module.exports = async (id) => {
  // query to check if the user with `id` exists.
  const user = await User.findOne({ _id: id });
  // if user is not exist.
  if (!user) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }
  return user;
};
