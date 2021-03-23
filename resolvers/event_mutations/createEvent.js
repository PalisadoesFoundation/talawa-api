const User = require("../../models/User");
const Event = require("../../models/Event");
const Organization = require("../../models/Organization");

const createEvent = async (parent, args, context, info) => {
  //authentication check
  if (!context.isAuth) throw Apperror("User is not authenticated");

  try {
    //gets user in token - to be used later on
    let userFound = await User.findOne({ _id: context.userId });
    if (!userFound) {
      throw Apperror("User does not exist");
    }

    //ensure organization exists
    let org = await Organization.findOne({ _id: args.data.organizationId });
	if (!org) throw Apperror("Organization not found");
	

    let newEvent = new Event({
      ...args.data,
      creator: context.userId,
      registrants: [context.userId],
      admins: [context.userId],
      organization: args.data.organizationId,
    });
    await newEvent.save();

    //add event to the user record
    await User.updateOne(
      { _id: userFound.id },
      {
        $push: {
          eventAdmin: newEvent,
          createdEvents: newEvent,
          registeredEvents: newEvent,
        },
      }
    );

    return {
      ...newEvent._doc,
    };
  } catch (e) {
    throw Apperror("Server error" + e, 500);
  }
};

module.exports = createEvent;
