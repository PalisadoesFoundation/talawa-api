const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const Event = require('../../models/Event');

module.exports = async (parent, args) => {
  const eventFound = await Event.findOne({ _id: args.id }).populate(
    'registrants',
    '-password'
  );
  if (!eventFound) {
    throw new NotFoundError(
      requestContext.translate('event.notFound'),
      'event.notFound',
      'event'
    );
  }
  //return eventFound.registrants || [];
  if (eventFound.registrants) {
    return eventFound.registrants.map((registrant) => {
      return {
        ...registrant._doc,
        password: null,
      };
    });
  } else {
    return [];
  }
};
