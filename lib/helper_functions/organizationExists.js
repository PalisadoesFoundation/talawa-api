const Organization = require('../models/Organization');
const { NotFoundError } = require('errors');
const {
  NOT_FOUND_ORGANIZATION_CODE,
  NOT_FOUND_ORGANIZATION_MESSAGE,
  NOT_FOUND_ORGANIZATION_PARAM,
  NOT_FOUND_ORGANIZATION_TEST,
} = require('../../constants');
const requestContext = require('talawa-request-context');

module.exports = async (id) => {
  const organization = await Organization.findOne({
    _id: id,
  });
  if (!organization) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? NOT_FOUND_ORGANIZATION_TEST
        : requestContext.translate(NOT_FOUND_ORGANIZATION_MESSAGE),
      NOT_FOUND_ORGANIZATION_CODE,
      NOT_FOUND_ORGANIZATION_PARAM
    );
  }
  return organization;
};
