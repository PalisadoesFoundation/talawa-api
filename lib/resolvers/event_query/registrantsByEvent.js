const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const { tenantCtx } = require('../../helper_functions');
const User = require('../../models/User');
const {
  EVENT_NOT_FOUND,
  EVENT_NOT_FOUND_MESSAGE,
  EVENT_NOT_FOUND_PARAM,
  EVENT_NOT_FOUND_CODE,
  IN_PRODUCTION,
} = require('../../../constants');

module.exports = async (parent, args) => {
  const { id, db } = await tenantCtx(args.id);
  const { Event } = db;
  const eventFound = await Event.findOne({
    _id: id,
    status: 'ACTIVE',
  }).populate('registrants.user', '', User);

  if (!eventFound) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? EVENT_NOT_FOUND
        : requestContext.translate(EVENT_NOT_FOUND_MESSAGE),
      EVENT_NOT_FOUND_CODE,
      EVENT_NOT_FOUND_PARAM
    );
  }

  // Return EventFound Registrants
  let registrants = [];
  if (eventFound.registrants.length > 0) {
    eventFound.registrants.map((registrant) => {
      if (registrant.status === 'ACTIVE') {
        registrants.push({
          ...registrant.user._doc,
          password: null,
        });
      }
    });
  }

  return registrants;
};
