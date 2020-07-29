const User = require("../../models/User");
const Task = require("../../models/Task");
const EventProject = require("../../models/EventProject");

const createTask = async (parent, args, context, info) => {
	//authentication check
	if (!context.isAuth) throw new Error("User is not authenticated");

	try {
		//gets user in token - to be used later on
		let userFound = await User.findOne({ _id: context.userId });
		if (!userFound) {
			throw new Error("User does not exist");
		}

		let eventProjectFound = await EventProject.findOne({
			_id: args.projectId,
		});
		if (!eventProjectFound) {
			throw new Error("Project does not exist");
		}

		let task = new Task({
			...args.data,
			project: eventProjectFound,
			creator: userFound,
		});

		await EventProject.updateOne(
			{ id: args.projectId },
			{
				$push: {
					tasks: task
				},
			}
		);

		await task.save();

		return {
			...task._doc,
		};
	} catch (e) {
		throw e;
	}
};

module.exports = createTask;
