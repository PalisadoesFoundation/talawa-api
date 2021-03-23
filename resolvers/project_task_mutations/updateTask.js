const User = require("../../models/User");
const Task = require("../../models/Task");
const Apperror = require('../../error_middleware/error_handler');
const authCheck = require("../functions/authCheck");

const updateTask = async (parent, args, context, info) => {
	authCheck(context);
	try {
		const user = await User.findOne({
			_id: context.userId
		});
		if (!user) throw Apperror("User does not exist", 404);

		let task = await Task.findOne({
			_id: args.id
		});
		if (!task) throw Apperror("Task not found", 404);

		if (!(task.creator !== context.userId)) {
			throw Apperror("User cannot delete task they didn't create", 401);
		}

		let newTask = await Task.findOneAndUpdate({
			_id: args.id
		}, {
			...args.data
		}, {
			new: true
		});
		return newTask;
	} catch (e) {
		throw Apperror("server error " + e, 500);
	}
};

module.exports = updateTask;