const User = require("../../models/User");
const Organization = require("../../models/Organization");
const authCheck = require("../functions/authCheck");
const creatorCheck = require("../functions/creatorCheck");
const adminCheck = require("../functions/adminCheck");
const Event = require("../../models/Event");

module.exports = async (parent, args, context, info) => {
  authCheck(context);
  try {
    //ensure organization exists
    let org = await Organization.findOne({ _id: args.data.organizationId });
    if (!org) throw new Error("Organization not found");

    //ensure user is an admin
    adminCheck(context, org);

    //find event
    let event = await Event.findOne({ _id: args.eventId });
    if (!event) throw new Error("Event does not exist");

    //remove event from organization
    org.overwrite({
      ...org._doc,
      events: org._doc.posts.filter((event) => event != args.eventId),
    });
    await org.save();

    //remove post from user
    user.overwrite({
      ...user._doc,
      events: user._doc.posts.filter((event) => event != args.eventId),
    });
    await user.save();

    //delete post
    await Event.deleteOne({ _id: args.postId });

    //return user
    return {
      ...event._doc,
    };
  } catch (e) {
    throw e;
  }
};
