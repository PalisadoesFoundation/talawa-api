const logger = require('logger');

const User = require('../models/User');
const Organization = require('../models/Organization');
const Event = require('../models/Event');
const Post = require('../models/Post');
const Group = require('../models/Group');
const Comment = require('../models/Comment');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const Task = require('../models/Task');

const authCheck = require('./functions/authCheck');
const DirectChat = require('../models/DirectChat');
const DirectChatMessages = require('../models/DirectChatMessage');

const GroupChat = require('../models/GroupChat');
const GroupChatMessages = require('../models/GroupChatMessage');
const organizationsConnection = require('./organization_query/organizations_pagination');
const postsByOrganizationConnection = require('../resolvers/post_organization_query/organization_post_pagination');
const {
  usersConnection,
  organizationsMemberConnection,
} = require('../resolvers/user_query/users_pagination');

const Query = {
  groupChats: async () => {
    return await GroupChat.find();
  },
  groupChatMessages: async () => {
    return await GroupChatMessages.find();
  },
  directChats: async () => {
    return await DirectChat.find();
  },
  directChatMessages: async () => {
    return await DirectChatMessages.find();
  },
  users: async (parent, args) => {
    var sort = {};
    var isSortingExecuted = args.orderBy !== null;

    if (isSortingExecuted) {
      if (args.orderBy === 'id_ASC') {
        sort = { _id: 1 };
      } else if (args.orderBy === 'id_DESC') {
        sort = { _id: -1 };
      } else if (args.orderBy === 'firstName_ASC') {
        sort = { firstName: 1 };
      } else if (args.orderBy === 'firstName_DESC') {
        sort = { firstName: -1 };
      } else if (args.orderBy === 'lastName_ASC') {
        sort = { lastName: 1 };
      } else if (args.orderBy === 'lastName_DESC') {
        sort = { lastName: -1 };
      } else if (args.orderBy === 'email_ASC') {
        sort = { email: 1 };
      } else {
        sort = { email: -1 };
      }
    }
    if (args.id) {
      const users = await User.find({ _id: args.id })
        .sort(sort)
        .populate('createdOrganizations')
        .populate('createdEvents')
        .populate('joinedOrganizations')
        .populate('registeredEvents')
        .populate('eventAdmin')
        .populate('adminFor');
      if (!users[0]) {
        throw new NotFoundError(
          requestContext.translate('user.notFound'),
          'user.notFound',
          'user'
        );
      } else
        return users.map((user) => {
          return {
            ...user._doc,
            password: null,
          };
        });
    } else {
      const users = await User.find()
        .sort(sort)
        .populate('createdOrganizations')
        .populate('createdEvents')
        .populate('joinedOrganizations')
        .populate('registeredEvents')
        .populate('eventAdmin')
        .populate('adminFor');
      return users.map((user) => {
        return { ...user._doc, password: null };
      });
    }
  },
  usersConnection,
  me: async (parent, args, context) => {
    authCheck(context);
    //Ensure user exists
    const user = await User.findOne({ _id: context.userId });
    if (!user) {
      throw new NotFoundError(
        requestContext.translate('user.notFound'),
        'user.notFound',
        'user'
      );
    }
    //console.log(user._doc)

    return {
      ...user._doc,
      password: null,
    };
  },
  organizations: async (parent, args) => {
    var sort = {};
    var isSortingExecuted = args.orderBy !== null;

    //Sorting List
    if (isSortingExecuted) {
      if (args.orderBy === 'id_ASC') {
        sort = { _id: 1 };
      } else if (args.orderBy === 'id_DESC') {
        sort = { _id: -1 };
      } else if (args.orderBy === 'name_ASC') {
        sort = { name: 1 };
      } else if (args.orderBy === 'name_DESC') {
        sort = { name: -1 };
      } else if (args.orderBy === 'description_ASC') {
        sort = { description: 1 };
      } else if (args.orderBy === 'description_DESC') {
        sort = { description: -1 };
      } else if (args.orderBy === 'apiUrl_ASC') {
        sort = { apiUrl: 1 };
      } else {
        sort = { apiUrl: -1 };
      }
    }

    if (args.id) {
      const organizationFound = await Organization.find({
        _id: args.id,
      }).sort(sort);
      if (!organizationFound[0]) {
        throw new NotFoundError(
          requestContext.translate('organization.notFound'),
          'organization.notFound',
          'organization'
        );
      }

      return organizationFound;
    } else {
      return await Organization.find().sort(sort);
    }
  },
  organizationsConnection,
  event: async (parent, args, context) => {
    const eventFound = await Event.findOne({ _id: args.id })
      // .populate("registrants")
      .populate('creator', '-password')
      .populate('tasks')
      .populate('admins', '-password');
    if (!eventFound) {
      throw new NotFoundError(
        requestContext.translate('event.notFound'),
        'event.notFound',
        'event'
      );
    }
    eventFound.isRegistered = false;
    if (eventFound.registrants.includes(context.userId)) {
      eventFound.isRegistered = true;
    }
    logger.info(eventFound.isRegistered);
    return eventFound;
  },
  registrantsByEvent: async (parent, args) => {
    const eventFound = await Event.findOne({ _id: args.id }).populate(
      'registrants',
      '-password'
    );
    if (!eventFound) {
      throw new NotFoundError(
        requestContext.translate('event.notFound'),
        'event.notFound',
        'event'
      );
    }
    //return eventFound.registrants || [];
    if (eventFound.registrants) {
      return eventFound.registrants.map((registrant) => {
        return {
          ...registrant._doc,
          password: null,
        };
      });
    } else {
      return [];
    }
  },
  events: async (parent, args, context) => {
    var sort = {};
    var isSortingExecuted = args.orderBy !== null;

    //Sorting List
    if (isSortingExecuted) {
      if (args.orderBy === 'id_ASC') {
        sort = { _id: 1 };
      } else if (args.orderBy === 'id_DESC') {
        sort = { _id: -1 };
      } else if (args.orderBy === 'title_ASC') {
        sort = { title: 1 };
      } else if (args.orderBy === 'title_DESC') {
        sort = { title: -1 };
      } else if (args.orderBy === 'description_ASC') {
        sort = { description: 1 };
      } else if (args.orderBy === 'description_DESC') {
        sort = { description: -1 };
      } else if (args.orderBy === 'startDate_ASC') {
        sort = { startDate: 1 };
      } else if (args.orderBy === 'startDate_DESC') {
        sort = { startDate: -1 };
      } else if (args.orderBy === 'endDate_ASC') {
        sort = { endDate: 1 };
      } else if (args.orderBy === 'endDate_DESC') {
        sort = { endDate: -1 };
      } else if (args.orderBy === 'allDay_ASC') {
        sort = { allDay: 1 };
      } else if (args.orderBy === 'allDay_DESC') {
        sort = { allDay: -1 };
      } else if (args.orderBy === 'startTime_ASC') {
        sort = { startTime: 1 };
      } else if (args.orderBy === 'startTime_DESC') {
        sort = { startTime: -1 };
      } else if (args.orderBy === 'endTime_ASC') {
        sort = { endTime: 1 };
      } else if (args.orderBy === 'endTime_DESC') {
        sort = { endTime: -1 };
      } else if (args.orderBy === 'recurrance_ASC') {
        sort = { recurrance: 1 };
      } else if (args.orderBy === 'recurrance_DESC') {
        sort = { recurrance: -1 };
      } else if (args.orderBy === 'location_ASC') {
        sort = { location: 1 };
      } else {
        sort = { location: -1 };
      }
    }

    const e = await Event.find()
      .sort(sort)
      // .populate("registrants")
      .populate('creator', '-password')
      .populate('tasks')
      .populate('admins', '-password');
    const events = e.map((event) => {
      event.isRegistered = false;
      if (event.registrants.includes(context.userId)) {
        event.isRegistered = true;
      }
      return event;
    });
    return events;
  },
  eventsByOrganization: async (parent, args, context) => {
    var sort = {};
    var isSortingExecuted = args.orderBy !== null;

    //Sorting List
    if (isSortingExecuted) {
      if (args.orderBy === 'id_ASC') {
        sort = { _id: 1 };
      } else if (args.orderBy === 'id_DESC') {
        sort = { _id: -1 };
      } else if (args.orderBy === 'title_ASC') {
        sort = { title: 1 };
      } else if (args.orderBy === 'title_DESC') {
        sort = { title: -1 };
      } else if (args.orderBy === 'description_ASC') {
        sort = { description: 1 };
      } else if (args.orderBy === 'description_DESC') {
        sort = { description: -1 };
      } else if (args.orderBy === 'startDate_ASC') {
        sort = { startDate: 1 };
      } else if (args.orderBy === 'startDate_DESC') {
        sort = { startDate: -1 };
      } else if (args.orderBy === 'endDate_ASC') {
        sort = { endDate: 1 };
      } else if (args.orderBy === 'endDate_DESC') {
        sort = { endDate: -1 };
      } else if (args.orderBy === 'allDay_ASC') {
        sort = { allDay: 1 };
      } else if (args.orderBy === 'allDay_DESC') {
        sort = { allDay: -1 };
      } else if (args.orderBy === 'startTime_ASC') {
        sort = { startTime: 1 };
      } else if (args.orderBy === 'startTime_DESC') {
        sort = { startTime: -1 };
      } else if (args.orderBy === 'endTime_ASC') {
        sort = { endTime: 1 };
      } else if (args.orderBy === 'endTime_DESC') {
        sort = { endTime: -1 };
      } else if (args.orderBy === 'recurrance_ASC') {
        sort = { recurrance: 1 };
      } else if (args.orderBy === 'recurrance_DESC') {
        sort = { recurrance: -1 };
      } else if (args.orderBy === 'location_ASC') {
        sort = { location: 1 };
      } else {
        sort = { location: -1 };
      }
    }

    const e = await Event.find({ organization: args.id })
      .sort(sort)
      // .populate("registrants")
      .populate('creator', '-password')
      .populate('tasks')
      .populate('admins', '-password');
    const events = e.map((event) => {
      event.isRegistered = false;
      if (event.registrants.includes(context.userId)) {
        event.isRegistered = true;
      }
      return event;
    });
    return events;
  },
  registeredEventsByUser: async (parent, args) => {
    var sort = {};
    var isSortingExecuted = args.orderBy !== null;

    //Sorting List
    if (isSortingExecuted) {
      if (args.orderBy === 'id_ASC') {
        sort = { _id: 1 };
      } else if (args.orderBy === 'id_DESC') {
        sort = { _id: -1 };
      } else if (args.orderBy === 'title_ASC') {
        sort = { title: 1 };
      } else if (args.orderBy === 'title_DESC') {
        sort = { title: -1 };
      } else if (args.orderBy === 'description_ASC') {
        sort = { description: 1 };
      } else if (args.orderBy === 'description_DESC') {
        sort = { description: -1 };
      } else if (args.orderBy === 'startDate_ASC') {
        sort = { startDate: 1 };
      } else if (args.orderBy === 'startDate_DESC') {
        sort = { startDate: -1 };
      } else if (args.orderBy === 'endDate_ASC') {
        sort = { endDate: 1 };
      } else if (args.orderBy === 'endDate_DESC') {
        sort = { endDate: -1 };
      } else if (args.orderBy === 'allDay_ASC') {
        sort = { allDay: 1 };
      } else if (args.orderBy === 'allDay_DESC') {
        sort = { allDay: -1 };
      } else if (args.orderBy === 'startTime_ASC') {
        sort = { startTime: 1 };
      } else if (args.orderBy === 'startTime_DESC') {
        sort = { startTime: -1 };
      } else if (args.orderBy === 'endTime_ASC') {
        sort = { endTime: 1 };
      } else if (args.orderBy === 'endTime_DESC') {
        sort = { endTime: -1 };
      } else if (args.orderBy === 'recurrance_ASC') {
        sort = { recurrance: 1 };
      } else if (args.orderBy === 'recurrance_DESC') {
        sort = { recurrance: -1 };
      } else if (args.orderBy === 'location_ASC') {
        sort = { location: 1 };
      } else {
        sort = { location: -1 };
      }
    }
    return await Event.find({ registrants: args.id })
      .sort(sort)
      .populate('registrants')
      .populate('creator', '-password')
      .populate('tasks')
      .populate('admins', '-password');
  },
  tasksByEvent: async (parent, args) => {
    var sort = {};
    var isSortingExecuted = args.orderBy !== null;

    //Sorting List
    if (isSortingExecuted) {
      if (args.orderBy === 'id_ASC') {
        sort = { _id: 1 };
      } else if (args.orderBy === 'id_DESC') {
        sort = { _id: -1 };
      } else if (args.orderBy === 'title_ASC') {
        sort = { title: 1 };
      } else if (args.orderBy === 'title_DESC') {
        sort = { title: -1 };
      } else if (args.orderBy === 'description_ASC') {
        sort = { description: 1 };
      } else if (args.orderBy === 'description_DESC') {
        sort = { description: -1 };
      } else if (args.orderBy === 'createdAt_ASC') {
        sort = { createdAt: 1 };
      } else if (args.orderBy === 'createdAt_DESC') {
        sort = { createdAt: -1 };
      } else if (args.orderBy === 'deadline_ASC') {
        sort = { deadline: 1 };
      } else {
        sort = { deadline: -1 };
      }
    }

    return await Task.find({ event: args.id })
      .sort(sort)
      .populate('event')
      .populate('creator', '-password');
  },
  tasksByUser: async (parent, args) => {
    var sort = {};
    var isSortingExecuted = args.orderBy !== null;

    //Sorting List
    if (isSortingExecuted) {
      if (args.orderBy === 'id_ASC') {
        sort = { _id: 1 };
      } else if (args.orderBy === 'id_DESC') {
        sort = { _id: -1 };
      } else if (args.orderBy === 'title_ASC') {
        sort = { title: 1 };
      } else if (args.orderBy === 'title_DESC') {
        sort = { title: -1 };
      } else if (args.orderBy === 'description_ASC') {
        sort = { description: 1 };
      } else if (args.orderBy === 'description_DESC') {
        sort = { description: -1 };
      } else if (args.orderBy === 'createdAt_ASC') {
        sort = { createdAt: 1 };
      } else if (args.orderBy === 'createdAt_DESC') {
        sort = { createdAt: -1 };
      } else if (args.orderBy === 'deadline_ASC') {
        sort = { deadline: 1 };
      } else {
        sort = { deadline: -1 };
      }
    }

    return await Task.find({ creator: args.id })
      .sort(sort)
      .populate('event')
      .populate('creator', '-password');
  },
  comments: async () => {
    const commentFound = await Comment.find()
      .populate('creator', '-password')
      .populate('post')
      .populate('likedBy');
    if (!commentFound) {
      throw new NotFoundError(
        requestContext.translate('comment.notFound'),
        'comment.notFound',
        'comment'
      );
    }
    return commentFound;
  },
  commentsByPost: async (parent, args) => {
    const commentFound = await Comment.find({ post: args.id })
      .populate('creator', '-password')
      .populate('post')
      .populate('likedBy');
    if (!commentFound) {
      throw new NotFoundError(
        requestContext.translate('comment.notFound'),
        'comment.notFound',
        'comment'
      );
    }
    return commentFound;
  },
  post: async (parent, args) => {
    const postFound = await Post.findOne({
      _id: args.id,
    })
      .populate('organization')
      .populate({
        path: 'comments',
        populate: {
          path: 'creator',
        },
      })
      .populate('likedBy')
      .populate('creator', '-password');
    if (!postFound) {
      throw new NotFoundError(
        requestContext.translate('post.notFound'),
        'post.notFound',
        'post'
      );
    }
    postFound.likeCount = postFound.likedBy.length || 0;
    postFound.commentCount = postFound.comments.length || 0;
    return postFound;
  },
  posts: async (parent, args) => {
    var sort = {};
    var isSortingExecuted = args.orderBy !== null;

    //Sorting List
    if (isSortingExecuted) {
      if (args.orderBy === 'id_ASC') {
        sort = { _id: 1 };
      } else if (args.orderBy === 'id_DESC') {
        sort = { _id: -1 };
      } else if (args.orderBy === 'text_ASC') {
        sort = { text: 1 };
      } else if (args.orderBy === 'text_DESC') {
        sort = { text: -1 };
      } else if (args.orderBy === 'title_ASC') {
        sort = { title: 1 };
      } else if (args.orderBy === 'title_DESC') {
        sort = { title: -1 };
      } else if (args.orderBy === 'createdAt_ASC') {
        sort = { createdAt: 1 };
      } else if (args.orderBy === 'createdAt_DESC') {
        sort = { createdAt: -1 };
      } else if (args.orderBy === 'imageUrl_ASC') {
        sort = { imageUrl: 1 };
      } else if (args.orderBy === 'imageUrl_DESC') {
        sort = { imageUrl: -1 };
      } else if (args.orderBy === 'videoUrl_ASC') {
        sort = { videoUrl: 1 };
      } else if (args.orderBy === 'videoUrl_DESC') {
        sort = { videoUrl: -1 };
      } else if (args.orderBy === 'likeCount_ASC') {
        sort = { likeCount: 1 };
      } else if (args.orderBy === 'likeCount_DESC') {
        sort = { likeCount: -1 };
      } else if (args.orderBy === 'commentCount_ASC') {
        sort = { commentCount: 1 };
      } else {
        sort = { commentCount: -1 };
      }
    }
    const p = await Post.find()
      .sort(sort)
      .populate('organization')
      .populate('likedBy')
      .populate({
        path: 'comments',
        populate: {
          path: 'creator',
        },
      })
      .populate('creator', '-password');
    const posts = p.map((post) => {
      post.likeCount = post.likedBy.length || 0;
      post.commentCount = post.comments.length || 0;
      return post;
    });
    return posts;
  },
  postsByOrganization: async (parent, args) => {
    var sort = {};
    var isSortingExecuted = args.orderBy !== null;

    //Sorting List
    if (isSortingExecuted) {
      if (args.orderBy === 'id_ASC') {
        sort = { _id: 1 };
      } else if (args.orderBy === 'id_DESC') {
        sort = { _id: -1 };
      } else if (args.orderBy === 'text_ASC') {
        sort = { text: 1 };
      } else if (args.orderBy === 'text_DESC') {
        sort = { text: -1 };
      } else if (args.orderBy === 'title_ASC') {
        sort = { title: 1 };
      } else if (args.orderBy === 'title_DESC') {
        sort = { title: -1 };
      } else if (args.orderBy === 'createdAt_ASC') {
        sort = { createdAt: 1 };
      } else if (args.orderBy === 'createdAt_DESC') {
        sort = { createdAt: -1 };
      } else if (args.orderBy === 'imageUrl_ASC') {
        sort = { imageUrl: 1 };
      } else if (args.orderBy === 'imageUrl_DESC') {
        sort = { imageUrl: -1 };
      } else if (args.orderBy === 'videoUrl_ASC') {
        sort = { videoUrl: 1 };
      } else if (args.orderBy === 'videoUrl_DESC') {
        sort = { videoUrl: -1 };
      } else if (args.orderBy === 'likeCount_ASC') {
        sort = { likeCount: 1 };
      } else if (args.orderBy === 'likeCount_DESC') {
        sort = { likeCount: -1 };
      } else if (args.orderBy === 'commentCount_ASC') {
        sort = { commentCount: 1 };
      } else {
        sort = { commentCount: -1 };
      }
    }

    const p = await Post.find({ organization: args.id })
      .sort(sort)
      .populate('organization')
      .populate('likedBy')
      .populate({
        path: 'comments',
        populate: {
          path: 'creator',
        },
      })
      .populate('creator', '-password');
    const posts = p.map((post) => {
      post.likeCount = post.likedBy.length || 0;
      post.commentCount = post.comments.length || 0;
      return post;
    });
    return posts;
  },
  postsByOrganizationConnection,
  organizationsMemberConnection,
  groups: async () => {
    return await Group.find();
  },
};

module.exports = Query;
