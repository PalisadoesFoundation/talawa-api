const User = require("../../models/User");
const EventProject = require("../../models/EventProject");

const authCheck = require("../functions/authCheck");

const updateEvent = async (parent, args, context, info) => {
	authCheck(context);
	try {
		const user = await User.findOne({ _id: context.userId });
		if (!user) throw Apperror("User does not exist");

		let eventProject = await EventProject.findOne({ _id: args.id });
		if (!eventProject) throw Apperror("Event Project not found");

		console.log(eventProject.creator !== context.userId);

		if (!(eventProject.creator !== context.userId)) {
			throw Apperror("User cannot delete project they didn't create");
		}

		let newEventProject = await EventProject.findOneAndUpdate(
			{ _id: args.id },
			{ ...args.data },
			{ new: true }
		);
		return newEventProject;
	} catch (e) {
		throw Apperror("Server error" + e, 500);
	}
};

module.exports = updateEvent;
