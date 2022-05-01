const Organization = require('../../models/Organization');
const adminCheck = require('../functions/adminCheck');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  IN_PRODUCTION,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_PARAM,
} = require('../../../constants');

const updateOrganization = async (parent, args, context) => {
  //checks to see if organization exists
  let org = await Organization.findOne({ _id: args.id });
  if (!org) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? ORGANIZATION_NOT_FOUND
        : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }

  //check if the user is an admin
  adminCheck(context, org);

  //UPDATE ORGANIZATION
  org.overwrite({
    ...org._doc,
    ...args.data,
  });
  await org.save();

  return org;
};

module.exports = updateOrganization;
