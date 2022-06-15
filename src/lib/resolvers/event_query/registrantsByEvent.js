const { NotFoundError } = require('../../helper_lib/errors');
const requestContext = require('../../helper_lib/request-context');

const Event = require('../../models/Event');
const {
  EVENT_NOT_FOUND,
  EVENT_NOT_FOUND_MESSAGE,
  EVENT_NOT_FOUND_PARAM,
  EVENT_NOT_FOUND_CODE,
  IN_PRODUCTION,
} = require('../../../constants');

module.exports = async (parent, args) => {
  const eventFound = await Event.findOne({
    _id: args.id,
    status: 'ACTIVE',
  }).populate('registrants.user');

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
