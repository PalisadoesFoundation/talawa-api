const Organization = require('../../models/Organization');
const adminCheck = require('../functions/adminCheck');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  NOT_FOUND_ORGANIZATION_MESSAGE,
  NOT_FOUND_ORGANIZATION_CODE,
  NOT_FOUND_ORGANIZATION_PARAM,
  NOT_FOUND_ORGANIZATION_TEST,
} = require('../../../constants');

const updateOrganization = async (parent, args, context) => {
  //checks to see if organization exists
  let org = await Organization.findOne({ _id: args.id });
  if (!org) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? NOT_FOUND_ORGANIZATION_TEST
        : requestContext.translate(NOT_FOUND_ORGANIZATION_MESSAGE),
      NOT_FOUND_ORGANIZATION_CODE,
      NOT_FOUND_ORGANIZATION_PARAM
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
