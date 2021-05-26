const Organization = require('../../models/Organization');
const authCheck = require('../functions/authCheck');
const adminCheck = require('../functions/adminCheck');
const { NotFoundError } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

const updateOrganization = async (parent, args, context) => {
  authCheck(context);
  //checks to see if organization exists
  let org = await Organization.findOne({ _id: args.id });
  if (!org) {
    throw new NotFoundError(
      requestContext.translate('organization.notFound'),
      'organization.notFound',
      'organization'
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
