const User = require('../../models/User');
const { tenantCtx } = require('../../helper_functions');
// const EventProject = require('../../models/EventProject');
const constants = require('../../../constants');
const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');

const removeEventProject = async (parent, args, context) => {
  const { id, db } = await tenantCtx(args.id);
  const { EventProject } = db;
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      !constants.IN_PRODUCTION
        ? constants.USER_NOT_FOUND
        : requestContext.translate(constants.USER_NOT_FOUND_MESSAGE),
      constants.USER_NOT_FOUND_CODE,
      constants.USER_NOT_FOUND_PARAM
    );
  }

  const eventProject = await EventProject.findOne({ _id: id });
  if (!eventProject) {
    throw new NotFoundError(
      !constants.IN_PRODUCTION
        ? constants.EVENT_PROJECT_NOT_FOUND
        : requestContext.translate(constants.EVENT_PROJECT_NOT_FOUND_MESSAGE),
      constants.EVENT_PROJECT_NOT_FOUND_CODE,
      constants.EVENT_PROJECT_NOT_FOUND_PARAM
    );
  }
  if (`${eventProject.creator}` !== `${context.userId}`) {
    throw new UnauthorizedError(
      !constants.IN_PRODUCTION
        ? constants.USER_NOT_AUTHORIZED
        : requestContext.translate(constants.USER_NOT_AUTHORIZED_MESSAGE),
      constants.USER_NOT_AUTHORIZED_CODE,
      constants.USER_NOT_AUTHORIZED_PARAM
    );
  }

  await EventProject.deleteOne({ _id: id });
  eventProject._doc._id = args.id;
  return eventProject;
};

module.exports = removeEventProject;
