const User = require("../../models/User");
const Event = require("../../models/Event");

const authCheck = require("../functions/authCheck");

const removeEvent = async (parent, args, context, info) => {
	authCheck(context);
	try {
		const user = await User.findOne({ _id: context.userId });
		if (!user) throw new Error("User does not exist");

		let event = await Event.findOne({ _id: args.id });
		if (!event) throw new Error("Event not found");

		if (!(event.creator !== context.userId)) {
			throw new Error("User cannot delete event they didn't create");
		}

		await User.updateMany(
			{ createdEvents: args.id },
			{
				$pull: {
					createdEvents: args.id,
				},
			}
		);

		await User.updateMany(
			{ eventAdmin: args.id },
			{
				$pull: {
					eventAdmin: args.id,
				},
			}
		);

		await Event.deleteOne({ _id: args.id });
		return event;
	} catch (e) {
		throw e;
	}
};

module.exports = removeEvent;
