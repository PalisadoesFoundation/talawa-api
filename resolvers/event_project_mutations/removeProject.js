const User = require("../../models/User");
const EventProject = require("../../models/EventProject");
const Event = require("../../models/Event");

const authCheck = require("../functions/authCheck");

const removeEventProject = async (parent, args, context, info) => {
	authCheck(context);
	try {
		const user = await User.findOne({ _id: context.userId });
		if (!user) throw new Error("User does not exist");

		let eventProject = await EventProject.findOne({ _id: args.id });
		if (!eventProject) throw new Error("Event not found");

		if (!(eventProject.creator !== context.userId)) {
			throw new Error("User cannot delete project they didn't create");
		}

		await EventProject.deleteOne({ _id: args.id });
		return EventProject;
	} catch (e) {
		throw e;
	}
};

module.exports = removeEventProject;
