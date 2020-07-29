const User = require("../../models/User");
const Task = require("../../models/EventProject");

const authCheck = require("../functions/authCheck");

const updateTask = async (parent, args, context, info) => {
	authCheck(context);
	try {
		const user = await User.findOne({ _id: context.userId });
		if (!user) throw new Error("User does not exist");

		let task = await Task.findOne({ _id: args.id });
		if (!task) throw new Error("Task not found");

		if (!(task.creator !== context.userId)) {
			throw new Error("User cannot delete task they didn't create");
		}

		let newTask = await Task.findOneAndUpdate(
			{ _id: args.id },
			{ ...args.data },
			{ new: true }
		);
		return newTask;
	} catch (e) {
		throw e;
	}
};

module.exports = updateTask;
