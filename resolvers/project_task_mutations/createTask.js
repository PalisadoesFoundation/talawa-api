const User = require("../../models/User");
const Task = require("../../models/Task");
const Event = require("../../models/Event");
const Apperror = require('../../error_middleware/error_handler');
const createTask = async (parent, args, context, info) => {
	//authentication check
	if (!context.isAuth) throw Apperror("User is not authenticated", 401);

	try {
		//gets user in token - to be used later on
		let userFound = await User.findOne({
			_id: context.userId
		});
		if (!userFound) {
			throw Apperror("User does not exist", 404);
		}

		let eventFound = await Event.findOne({
			_id: args.eventId,
		});
		if (!eventFound) {
			throw Apperror("Event does not exist", 404);
		}

		let task = new Task({
			...args.data,
			event: eventFound,
			creator: userFound,
		});
		await task.save();

		await Event.findOneAndUpdate({
			_id: args.eventId
		}, {
			$push: {
				tasks: task,
			},
		}, {
			new: true
		});
		return {
			...task._doc,
		};
	} catch (e) {
		throw Apperror("server error" + e, 500);
	}
};

module.exports = createTask;