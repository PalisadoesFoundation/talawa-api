const User = require("../../models/User");
const EventProject = require("../../models/EventProject");
const Event = require("../../models/Event");

const createEventProject = async (parent, args, context, info) => {
	//authentication check
	if (!context.isAuth) throw new Error("User is not authenticated");

	try {
		//gets user in token - to be used later on
		let userFound = await User.findOne({ _id: context.userId });
		if (!userFound) {
			throw new Error("User does not exist");
		}

		let eventFound = await Event.findOne({ _id: args.data.eventId });
		if (!eventFound) {
			throw new Error("Event does not exist");
		}

		if (!eventFound.admins.includes(context.userId)) {
			throw new Error("User cannot create an event project for an event they didn't create");
		}

		let newEventProject = new EventProject({
			title: args.data.title,
			description: args.data.description,
			event: eventFound,
			creator: userFound,
		});


		await newEventProject.save();

		return {
			...newEventProject._doc,
		};
	} catch (e) {
		throw e;
	}
};

module.exports = createEventProject;
