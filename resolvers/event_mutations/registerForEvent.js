const User = require("../../models/User");
const Event = require("../../models/Event");

const registerForEvent = async (parent, args, context, info) => {
  //authentication check
  if (!context.isAuth) throw new Error("User is not authenticated");

  try {
    //gets user in token - to be used later on
    let userFound = await User.findOne({ _id: context.userId });
    if (!userFound) {
      throw new Error("User does not exist");
    }

    let eventFound = await Event.findOne({ _id: args.id });
    if (!eventFound) {
      throw new Error("Event does not exist");
    }

    //add event to the user record
    await User.findOneAndUpdate(
      { _id: userFound.id },
      {
        $push: {
          registeredEvents: eventFound,
        },
      }
    );

    let newEvent = await Event.findOneAndUpdate(
      { _id: args.id },
      {
        $push: {
          registrants: userFound,
        },
      },
      { new: true }
    );


    return newEvent;
  } catch (e) {
    throw e;
  }
};

module.exports = registerForEvent;
