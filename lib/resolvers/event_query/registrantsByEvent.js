const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const Event = require('../../models/Event');
const {
  NOT_FOUND_EVENT_MESSAGE,
  NOT_FOUND_EVENT_CODE,
  NOT_FOUND_EVENT_PARAM,
} = require('../../../constants');

module.exports = async (parent, args) => {
  const eventFound = await Event.findOne({
    _id: args.id,
    status: 'ACTIVE',
  }).populate('registrants.user');

  if (!eventFound) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_EVENT_MESSAGE),
      NOT_FOUND_EVENT_CODE,
      NOT_FOUND_EVENT_PARAM
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
