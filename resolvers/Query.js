const User = require("../models/User");
const Organization = require("../models/Organization");
const Event = require("../models/Event");
const Post = require("../models/Post");
const Group = require("../models/Group");
const Comment = require("../models/Comment");

const Task = require("../models/Task");

const authCheck = require("./functions/authCheck");
const DirectChat = require("../models/DirectChat");
const DirectChatMessages = require("../models/DirectChatMessage");

const GroupChat = require("../models/GroupChat");
const GroupChatMessages = require("../models/GroupChatMessage");
const usersConnection = require("../resolvers/user_query/users_pagination")
const organizationsConnection = require("./organization_query/organizations_pagination");
// const AppError = require("../error_middleware/error_handler");


const Query = {
	groupChats: async (parent, args, context, info) => {
		return await GroupChat.find();
	},
	groupChatMessages: async (parent, args, context, info) => {
		return await GroupChatMessages.find();
	},
	directChats: async (parent, args, context, info) => {
		return await DirectChat.find();
	},
	directChatMessages: async (parent, args, context, info) => {
		return await DirectChatMessages.find();
	},
	users: async (parent, args, context, info) => {

		var sort = {}
		var isSortingExecuted = args.orderBy != null;

		if (isSortingExecuted) {
			if (args.orderBy == "id_ASC") {
				sort = {
					_id: 1
				}
			} else if (args.orderBy == "id_DESC") {
				sort = {
					_id: -1
				}
			} else if (args.orderBy == "firstName_ASC") {
				sort = {
					firstName: 1
				}
			} else if (args.orderBy == "firstName_DESC") {
				sort = {
					firstName: -1
				}
			} else if (args.orderBy == "lastName_ASC") {
				sort = {
					lastName: 1
				}
			} else if (args.orderBy == "lastName_DESC") {
				sort = {
					lastName: -1
				}
			} else if (args.orderBy == "email_ASC") {
				sort = {
					email: 1
				}
			} else {
				sort = {
					email: -1
				}
			}
		}

		try {
			if (args.id) {
				const users = await User.find({
						_id: args.id
					})
					.sort(sort)
					.populate("createdOrganizations")
					.populate("createdEvents")
					.populate("joinedOrganizations")
					.populate("registeredEvents")
					.populate("eventAdmin")
					.populate("adminFor");
				if (!users[0]) throw AppError("User not found", 404);
				else
					return users.map((user) => {
						return {
							...user._doc,
							password: null,
						};
					});
			} else {
				const users = await User.find()
					.sort(sort)
					.populate("createdOrganizations")
					.populate("createdEvents")
					.populate("joinedOrganizations")
					.populate("registeredEvents")
					.populate("eventAdmin")
					.populate("adminFor");
				return users.map((user) => {
					return {
						...user._doc,
						password: null
					};
				});
			}
		} catch (e) {
			throw AppError("Server error" + e, 500);
		}
	},
	usersConnection,
	me: async (parent, args, context, info) => {
		authCheck(context);
		try {
			//Ensure user exists
			const user = await User.findOne({
				_id: context.userId
			});
			if (!user) throw AppError("User does not exist ", 401);
			//console.log(user._doc)

			return {
				...user._doc,
				password: null,
			};
		} catch (e) {
			throw AppError("Server Error" + e, 500);
		}
	},
	organizations: async (parent, args, context, info) => {
		var sort = {}
		var isSortingExecuted = args.orderBy != null;

		//Sorting List
		if (isSortingExecuted) {
			if (args.orderBy == "id_ASC") {
				sort = {
					_id: 1
				}
			} else if (args.orderBy == "id_DESC") {
				sort = {
					_id: -1
				}
			} else if (args.orderBy == "name_ASC") {
				sort = {
					name: 1
				}
			} else if (args.orderBy == "name_DESC") {
				sort = {
					name: -1
				}
			} else if (args.orderBy == "description_ASC") {
				sort = {
					description: 1
				}
			} else if (args.orderBy == "description_DESC") {
				sort = {
					description: -1
				}
			} else if (args.orderBy == "apiUrl_ASC") {
				sort = {
					apiUrl: 1
				}
			} else {
				sort = {
					apiUrl: -1
				}
			}
		}

		try {
			if (args.id) {
				const organizationFound = await Organization.find({
					_id: args.id,
				}).sort(sort);
				if (!organizationFound[0]) {
					throw AppError("Organization not found", 401);
				}

				return organizationFound;
			} else {
				return await Organization.find().sort(sort);
			}
		} catch (e) {
			throw AppError("Server Error" + e, 500);
		}
	},
	organizationsConnection,
	event: async (parent, args, context, info) => {
		try {
			const eventFound = await Event.findOne({
					_id: args.id
				})
				// .populate("registrants")
				.populate("creator", "-password")
				.populate("tasks")
				.populate("admins", "-password");
			if (!eventFound) {
				throw AppError("Event not found", 404);
			}
			eventFound.isRegistered = false;
			if (eventFound.registrants.includes(context.userId)) {
				eventFound.isRegistered = true;
			}
			console.log(eventFound.isRegistered);
			return eventFound;
		} catch (e) {
			throw AppError("Server Error" + e, 500);
		}
	},
	registrantsByEvent: async (parent, args, context, info) => {
		try {
			const eventFound = await Event.findOne({
					_id: args.id
				})
				.populate("registrants", "-password");
			if (!eventFound) {
				throw AppError("Event not found", 404);
			}
			//return eventFound.registrants || [];
			return eventFound.registrants ? eventFound.registrants.map((registrant) => {
				return {
					...registrant._doc,
					password: null,
				};
			}) : [];
		} catch (e) {
			throw AppError("Server Error" + e, 500);
		}
	},
	events: async (parent, args, context, info) => {
		var sort = {}
		var isSortingExecuted = args.orderBy != null;

		//Sorting List
		if (isSortingExecuted) {
			if (args.orderBy == "id_ASC") {
				sort = {
					_id: 1
				}
			} else if (args.orderBy == "id_DESC") {
				sort = {
					_id: -1
				}
			} else if (args.orderBy == "title_ASC") {
				sort = {
					title: 1
				}
			} else if (args.orderBy == "title_DESC") {
				sort = {
					title: -1
				}
			} else if (args.orderBy == "description_ASC") {
				sort = {
					description: 1
				}
			} else if (args.orderBy == "description_DESC") {
				sort = {
					description: -1
				}
			} else if (args.orderBy == "startDate_ASC") {
				sort = {
					startDate: 1
				}
			} else if (args.orderBy == "startDate_DESC") {
				sort = {
					startDate: -1
				}
			} else if (args.orderBy == "endDate_ASC") {
				sort = {
					endDate: 1
				}
			} else if (args.orderBy == "endDate_DESC") {
				sort = {
					endDate: -1
				}
			} else if (args.orderBy == "allDay_ASC") {
				sort = {
					allDay: 1
				}
			} else if (args.orderBy == "allDay_DESC") {
				sort = {
					allDay: -1
				}
			} else if (args.orderBy == "startTime_ASC") {
				sort = {
					startTime: 1
				}
			} else if (args.orderBy == "startTime_DESC") {
				sort = {
					startTime: -1
				}
			} else if (args.orderBy == "endTime_ASC") {
				sort = {
					endTime: 1
				}
			} else if (args.orderBy == "endTime_DESC") {
				sort = {
					endTime: -1
				}
			} else if (args.orderBy == "recurrance_ASC") {
				sort = {
					recurrance: 1
				}
			} else if (args.orderBy == "recurrance_DESC") {
				sort = {
					recurrance: -1
				}
			} else if (args.orderBy == "location_ASC") {
				sort = {
					location: 1
				}
			} else {
				sort = {
					location: -1
				}
			}
		}

		try {
			const e = await Event.find()
				.sort(sort)
				// .populate("registrants")
				.populate("creator", "-password")
				.populate("tasks")
				.populate("admins", "-password");
			const events = e.map((event) => {
				event.isRegistered = false;
				if (event.registrants.includes(context.userId)) {
					event.isRegistered = true;
				}
				return event;
			});
			return events;
		} catch (e) {
			throw AppError("Server Error" + e, 500);
		}
	},
	eventsByOrganization: async (parent, args, context, info) => {
		var sort = {}
		var isSortingExecuted = args.orderBy != null;

		//Sorting List
		if (isSortingExecuted) {
			if (args.orderBy == "id_ASC") {
				sort = {
					_id: 1
				}
			} else if (args.orderBy == "id_DESC") {
				sort = {
					_id: -1
				}
			} else if (args.orderBy == "title_ASC") {
				sort = {
					title: 1
				}
			} else if (args.orderBy == "title_DESC") {
				sort = {
					title: -1
				}
			} else if (args.orderBy == "description_ASC") {
				sort = {
					description: 1
				}
			} else if (args.orderBy == "description_DESC") {
				sort = {
					description: -1
				}
			} else if (args.orderBy == "startDate_ASC") {
				sort = {
					startDate: 1
				}
			} else if (args.orderBy == "startDate_DESC") {
				sort = {
					startDate: -1
				}
			} else if (args.orderBy == "endDate_ASC") {
				sort = {
					endDate: 1
				}
			} else if (args.orderBy == "endDate_DESC") {
				sort = {
					endDate: -1
				}
			} else if (args.orderBy == "allDay_ASC") {
				sort = {
					allDay: 1
				}
			} else if (args.orderBy == "allDay_DESC") {
				sort = {
					allDay: -1
				}
			} else if (args.orderBy == "startTime_ASC") {
				sort = {
					startTime: 1
				}
			} else if (args.orderBy == "startTime_DESC") {
				sort = {
					startTime: -1
				}
			} else if (args.orderBy == "endTime_ASC") {
				sort = {
					endTime: 1
				}
			} else if (args.orderBy == "endTime_DESC") {
				sort = {
					endTime: -1
				}
			} else if (args.orderBy == "recurrance_ASC") {
				sort = {
					recurrance: 1
				}
			} else if (args.orderBy == "recurrance_DESC") {
				sort = {
					recurrance: -1
				}
			} else if (args.orderBy == "location_ASC") {
				sort = {
					location: 1
				}
			} else {
				sort = {
					location: -1
				}
			}
		}

		try {
			const e = await Event.find({
					organization: args.id
				})
				.sort(sort)
				// .populate("registrants")
				.populate("creator", "-password")
				.populate("tasks")
				.populate("admins", "-password");
			const events = e.map((event) => {
				event.isRegistered = false;
				if (event.registrants.includes(context.userId)) {
					event.isRegistered = true;
				}
				return event;
			});
			return events;
		} catch (e) {
			throw AppError("Server Error" + e, 500);
		}
	},
	registeredEventsByUser: async (parent, args, context, info) => {
		var sort = {}
		var isSortingExecuted = args.orderBy != null;

		//Sorting List
		if (isSortingExecuted) {
			if (args.orderBy == "id_ASC") {
				sort = {
					_id: 1
				}
			} else if (args.orderBy == "id_DESC") {
				sort = {
					_id: -1
				}
			} else if (args.orderBy == "title_ASC") {
				sort = {
					title: 1
				}
			} else if (args.orderBy == "title_DESC") {
				sort = {
					title: -1
				}
			} else if (args.orderBy == "description_ASC") {
				sort = {
					description: 1
				}
			} else if (args.orderBy == "description_DESC") {
				sort = {
					description: -1
				}
			} else if (args.orderBy == "startDate_ASC") {
				sort = {
					startDate: 1
				}
			} else if (args.orderBy == "startDate_DESC") {
				sort = {
					startDate: -1
				}
			} else if (args.orderBy == "endDate_ASC") {
				sort = {
					endDate: 1
				}
			} else if (args.orderBy == "endDate_DESC") {
				sort = {
					endDate: -1
				}
			} else if (args.orderBy == "allDay_ASC") {
				sort = {
					allDay: 1
				}
			} else if (args.orderBy == "allDay_DESC") {
				sort = {
					allDay: -1
				}
			} else if (args.orderBy == "startTime_ASC") {
				sort = {
					startTime: 1
				}
			} else if (args.orderBy == "startTime_DESC") {
				sort = {
					startTime: -1
				}
			} else if (args.orderBy == "endTime_ASC") {
				sort = {
					endTime: 1
				}
			} else if (args.orderBy == "endTime_DESC") {
				sort = {
					endTime: -1
				}
			} else if (args.orderBy == "recurrance_ASC") {
				sort = {
					recurrance: 1
				}
			} else if (args.orderBy == "recurrance_DESC") {
				sort = {
					recurrance: -1
				}
			} else if (args.orderBy == "location_ASC") {
				sort = {
					location: 1
				}
			} else {
				sort = {
					location: -1
				}
			}
		}
		try {
			return await Event.find({
					registrants: args.id
				})
				.sort(sort)
				.populate("registrants")
				.populate("creator", "-password")
				.populate("tasks")
				.populate("admins", "-password");
		} catch (e) {
			throw AppError("Server Error" + e, 500);
		}
	},
	tasksByEvent: async (parent, args, context, info) => {
		var sort = {}
		var isSortingExecuted = args.orderBy != null;

		//Sorting List
		if (isSortingExecuted) {
			if (args.orderBy == "id_ASC") {
				sort = {
					_id: 1
				}
			} else if (args.orderBy == "id_DESC") {
				sort = {
					_id: -1
				}
			} else if (args.orderBy == "title_ASC") {
				sort = {
					title: 1
				}
			} else if (args.orderBy == "title_DESC") {
				sort = {
					title: -1
				}
			} else if (args.orderBy == "description_ASC") {
				sort = {
					description: 1
				}
			} else if (args.orderBy == "description_DESC") {
				sort = {
					description: -1
				}
			} else if (args.orderBy == "createdAt_ASC") {
				sort = {
					createdAt: 1
				}
			} else if (args.orderBy == "createdAt_DESC") {
				sort = {
					createdAt: -1
				}
			} else if (args.orderBy == "deadline_ASC") {
				sort = {
					deadline: 1
				}
			} else {
				sort = {
					deadline: -1
				}
			}
		}

		try {
			return await Task.find({
					event: args.id
				})
				.sort(sort)
				.populate("event")
				.populate("creator", "-password");
		} catch (e) {
			throw AppError("Server Error" + e, 500);
		}
	},
	tasksByUser: async (parent, args, context, info) => {
		var sort = {}
		var isSortingExecuted = args.orderBy != null;

		//Sorting List
		if (isSortingExecuted) {
			if (args.orderBy == "id_ASC") {
				sort = {
					_id: 1
				}
			} else if (args.orderBy == "id_DESC") {
				sort = {
					_id: -1
				}
			} else if (args.orderBy == "title_ASC") {
				sort = {
					title: 1
				}
			} else if (args.orderBy == "title_DESC") {
				sort = {
					title: -1
				}
			} else if (args.orderBy == "description_ASC") {
				sort = {
					description: 1
				}
			} else if (args.orderBy == "description_DESC") {
				sort = {
					description: -1
				}
			} else if (args.orderBy == "createdAt_ASC") {
				sort = {
					createdAt: 1
				}
			} else if (args.orderBy == "createdAt_DESC") {
				sort = {
					createdAt: -1
				}
			} else if (args.orderBy == "deadline_ASC") {
				sort = {
					deadline: 1
				}
			} else {
				sort = {
					deadline: -1
				}
			}
		}

		try {
			return await Task.find({
					creator: args.id
				})
				.sort(sort)
				.populate("event")
				.populate("creator", "-password");
		} catch (e) {
			throw AppError("Server Error" + e, 500);
		}
	},
	comments: async (parent, args, context, info) => {
		try {
			const commentFound = await Comment.find()
				.populate("creator", "-password")
				.populate("post")
				.populate("likedBy");
			if (!commentFound) {
				throw AppError("Comment not Found", 404)
			}
			return commentFound;
		} catch (e) {
			throw AppError("Server Error" + e, 500);
		}
	},
	commentsByPost: async (parent, args, context, info) => {
		try {
			const commentFound = await Comment.find({
					post: args.id
				})
				.populate("creator", "-password")
				.populate("post")
				.populate("likedBy");
			if (!commentFound) {
				throw AppError("Comment not Found", 404)
			}
			return commentFound;
		} catch (e) {
			throw AppError("Server Error" + e, 500);
		}
	},
	post: async (parent, args, context, info) => {
		try {
			const postFound = await Post.findOne({
					_id: args.id,
				})
				.populate("organization")
				.populate({
					path: "comments",
					populate: {
						path: "creator",
					},
				})
				.populate("likedBy")
				.populate("creator", "-password");
			if (!postFound) {
				throw AppError("Post not found", 404);
			}
			postFound.likeCount = postFound.likedBy.length || 0;
			postFound.commentCount = postFound.comments.length || 0;
			return postFound;
		} catch (e) {
			throw AppError("Server Error" + e, 500);
		}
	},
	posts: async (parent, args, context, info) => {
		var sort = {}
		var isSortingExecuted = args.orderBy != null;

		//Sorting List
		if (isSortingExecuted) {
			if (args.orderBy == "id_ASC") {
				sort = {
					_id: 1
				}
			} else if (args.orderBy == "id_DESC") {
				sort = {
					_id: -1
				}
			} else if (args.orderBy == "text_ASC") {
				sort = {
					text: 1
				}
			} else if (args.orderBy == "text_DESC") {
				sort = {
					text: -1
				}
			} else if (args.orderBy == "title_ASC") {
				sort = {
					title: 1
				}
			} else if (args.orderBy == "title_DESC") {
				sort = {
					title: -1
				}
			} else if (args.orderBy == "createdAt_ASC") {
				sort = {
					createdAt: 1
				}
			} else if (args.orderBy == "createdAt_DESC") {
				sort = {
					createdAt: -1
				}
			} else if (args.orderBy == "imageUrl_ASC") {
				sort = {
					imageUrl: 1
				}
			} else if (args.orderBy == "imageUrl_DESC") {
				sort = {
					imageUrl: -1
				}
			} else if (args.orderBy == "videoUrl_ASC") {
				sort = {
					videoUrl: 1
				}
			} else if (args.orderBy == "videoUrl_DESC") {
				sort = {
					videoUrl: -1
				}
			} else if (args.orderBy == "likeCount_ASC") {
				sort = {
					likeCount: 1
				}
			} else if (args.orderBy == "likeCount_DESC") {
				sort = {
					likeCount: -1
				}
			} else if (args.orderBy == "commentCount_ASC") {
				sort = {
					commentCount: 1
				}
			} else {
				sort = {
					commentCount: -1
				}
			}
		}
		try {
			const p = await Post.find()
				.sort(sort)
				.populate("organization")
				.populate("likedBy")
				.populate({
					path: "comments",
					populate: {
						path: "creator",
					},
				})
				.populate("creator", "-password");
			const posts = p.map((post) => {
				post.likeCount = post.likedBy.length || 0;
				post.commentCount = post.comments.length || 0;
				return post;
			});
			return posts;
		} catch (error) {
			throw AppError("Server Error" + e, 500);
		}
	},
	postsByOrganization: async (parent, args, context, info) => {
		var sort = {}
		var isSortingExecuted = args.orderBy != null;

		//Sorting List
		if (isSortingExecuted) {
			if (args.orderBy == "id_ASC") {
				sort = {
					_id: 1
				}
			} else if (args.orderBy == "id_DESC") {
				sort = {
					_id: -1
				}
			} else if (args.orderBy == "text_ASC") {
				sort = {
					text: 1
				}
			} else if (args.orderBy == "text_DESC") {
				sort = {
					text: -1
				}
			} else if (args.orderBy == "title_ASC") {
				sort = {
					title: 1
				}
			} else if (args.orderBy == "title_DESC") {
				sort = {
					title: -1
				}
			} else if (args.orderBy == "createdAt_ASC") {
				sort = {
					createdAt: 1
				}
			} else if (args.orderBy == "createdAt_DESC") {
				sort = {
					createdAt: -1
				}
			} else if (args.orderBy == "imageUrl_ASC") {
				sort = {
					imageUrl: 1
				}
			} else if (args.orderBy == "imageUrl_DESC") {
				sort = {
					imageUrl: -1
				}
			} else if (args.orderBy == "videoUrl_ASC") {
				sort = {
					videoUrl: 1
				}
			} else if (args.orderBy == "videoUrl_DESC") {
				sort = {
					videoUrl: -1
				}
			} else if (args.orderBy == "likeCount_ASC") {
				sort = {
					likeCount: 1
				}
			} else if (args.orderBy == "likeCount_DESC") {
				sort = {
					likeCount: -1
				}
			} else if (args.orderBy == "commentCount_ASC") {
				sort = {
					commentCount: 1
				}
			} else {
				sort = {
					commentCount: -1
				}
			}
		}

		try {
			const p = await Post.find({
					organization: args.id
				})
				.sort(sort)
				.populate("organization")
				.populate("likedBy")
				.populate({
					path: "comments",
					populate: {
						path: "creator",
					},
				})
				.populate("creator", "-password");
			const posts = p.map((post) => {
				post.likeCount = post.likedBy.length || 0;
				post.commentCount = post.comments.length || 0;
				return post;
			});
			return posts;
		} catch (e) {
			throw AppError("Server Error" + e, 500);
		}
	},
	groups: async (parent, args, context, info) => {
		try {
			return await Group.find();
		} catch (e) {
			throw AppError("Server Error" + e, 500);
		}
	},
};

module.exports = Query;