const User = require("../../models/User");
const Event = require("../../models/Event");

const authCheck = require("../functions/authCheck");

const updateEvent = async (parent, args, context, info) => {
	authCheck(context);
	try {
		const user = await User.findOne({ _id: context.userId });
		if (!user) throw Apperror("User does not exist");

		let event = await Event.findOne({ _id: args.id });
		if (!event) throw Apperror("Event not found");

		if (!event.admins.includes(context.userId)) {
			throw Apperror("User cannot delete event they didn't create");
		}

		let newEvent = await Event.findOneAndUpdate(
			{ _id: args.id },
			{ ...args.data },
			{ new: true }
		);
		return {
			...newEvent._doc
		}
	} catch (e) {
		throw Apperror("Server error" + e, 500);
	}
};

module.exports = updateEvent;
