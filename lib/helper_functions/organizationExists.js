const Organization = require('../models/Organization');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  IN_PRODUCTION,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_PARAM,
} = require('../../constants');

module.exports = async (id) => {
  const organization = await Organization.findOne({
    _id: id,
  });
  if (!organization) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? ORGANIZATION_NOT_FOUND
        : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }
  return organization;
};
