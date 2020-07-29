const User = require("../../models/User");
const EventProject = require("../../models/EventProject");
const Task = require("../../models/Task");

const authCheck = require("../functions/authCheck");

const removeTask = async (parent, args, context, info) => {
	authCheck(context);
	try {
		const user = await User.findOne({ _id: context.userId });
		if (!user) throw new Error("User does not exist");

		let foundTask = await Task.findOne({ _id: args.id });
		if (!foundTask) throw new Error("Task not found");

		if (!(foundTask.creator !== context.userId)) {
			throw new Error("User cannot delete task they didn't create");
		}

		await EventProject.updateMany(
			{ id: foundTask.project },
			{
				$pull: {
					tasks: args.id,
				},
			}
		);


		await Task.deleteOne({ _id: args.id });
		return foundTask;
	} catch (e) {
		throw e;
	}
};

module.exports = removeTask;
