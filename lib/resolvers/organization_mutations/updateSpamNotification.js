const Organization = require('../../models/Organization');
const adminCheck = require('../functions/adminCheck');
const {
  IN_PRODUCTION,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_FOUND_CODE,
  USER_NOT_AUTHORIZED,
} = require('../../../constants');
const { NotFoundError } = require('errors');

module.exports = async (parent, args, context) => {
  const { orgId, spamId, isReaded } = args.data;

  //checks to see if organization exists
  let org = await Organization.findOne({ _id: orgId });
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

  let targetSpam;

  for (let spam of org.spamCount) {
    if (spam._id == spamId) {
      targetSpam = spam;
      break;
    }
  }

  if (!targetSpam) {
    throw new Error(USER_NOT_AUTHORIZED);
  }

  targetSpam.isReaded = isReaded;

  const updatedOrg = await Organization.findByIdAndUpdate(orgId, {
    spamCount: [...org.spamCount],
  });

  return updatedOrg;
};
