const User = require("../../models/User");
const Event = require("../../models/Event");
const Task = require("../../models/Task");
const Apperror = require('../../error_middleware/error_handler');
const authCheck = require("../functions/authCheck");

const removeTask = async (parent, args, context, info) => {
	authCheck(context);
	try {
		const user = await User.findOne({
			_id: context.userId
		});
		if (!user) throw Apperror("User does not exist", 404);

		let foundTask = await Task.findOne({
			_id: args.id
		});
		if (!foundTask) throw Apperror("Task not found", 404);

		if (!(foundTask.creator !== context.userId)) {
			throw Apperror("User cannot delete task they didn't create", 401);
		}

		await Event.updateMany({
			id: foundTask.event
		}, {
			$pull: {
				tasks: args.id,
			},
		});


		await Task.deleteOne({
			_id: args.id
		});
		return foundTask;
	} catch (e) {
		throw Apperror("server error" + e, 500);
	}
};

module.exports = removeTask;