const User = require('../models/User');
const Organization = require('../models/Organization');
const Event = require('../models/Event');
const Post = require('../models/Post');
const Group = require('../models/Group');
const Comment = require('../models/Comment');

const Task = require('../models/Task');

const authCheck = require('./functions/authCheck');
const DirectChat = require('../models/DirectChat');
const DirectChatMessages = require('../models/DirectChatMessage');

const GroupChat = require('../models/GroupChat');
const GroupChatMessages = require('../models/GroupChatMessage');

const Query = {
  groupChats: async () => await GroupChat.find(),
  groupChatMessages: async () => await GroupChatMessages.find(),
  directChats: async () => await DirectChat.find(),
  directChatMessages: async () => await DirectChatMessages.find(),
  users: async (parent, args) => {
    if (args.id) {
      const users = await User.find({ _id: args.id })
        .populate('createdOrganizations')
        .populate('createdEvents')
        .populate('joinedOrganizations')
        .populate('registeredEvents')
        .populate('eventAdmin')
        .populate('adminFor');
      if (!users[0]) throw new Error('User not found');
      else {
        return users.map((user) => ({
          ...user._doc,
          password: null,
        }));
      }
    } else {
      const users = await User.find()
        .populate('createdOrganizations')
        .populate('createdEvents')
        .populate('joinedOrganizations')
        .populate('registeredEvents')
        .populate('eventAdmin')
        .populate('adminFor');
      return users.map((user) => ({ ...user._doc, password: null }));
    }
  },
  me: async (parent, args, context) => {
    authCheck(context);
    // Ensure user exists
    const user = await User.findOne({ _id: context.userId });
    if (!user) throw new Error('User does not exist');
    // console.log(user._doc)

    return {
      ...user._doc,
      password: null,
    };
  },
  organizations: async (parent, args) => {
    if (args.id) {
      const organizationFound = await Organization.find({
        _id: args.id,
      });
      if (!organizationFound[0]) {
        throw new Error('Organization not found');
      }
      return organizationFound;
    }
    return await Organization.find();
  },
  event: async (parent, args, context) => {
    const eventFound = await Event.findOne({ _id: args.id })
      // .populate("registrants")
      .populate('creator', '-password')
      .populate('tasks')
      .populate('admins', '-password');
    if (!eventFound) {
      throw new Error('Event not found');
    }
    eventFound.isRegistered = false;
    if (eventFound.registrants.includes(context.userId)) {
      eventFound.isRegistered = true;
    }
    console.log(eventFound.isRegistered);
    return eventFound;
  },
  registrantsByEvent: async (parent, args) => {
    const eventFound = await Event.findOne({ _id: args.id }).populate(
      'registrants',
      '-password'
    );
    if (!eventFound) {
      throw new Error('Event not found');
    }
    // return eventFound.registrants || [];
    return eventFound.registrants
      ? eventFound.registrants.map((registrant) => ({
        ...registrant._doc,
        password: null,
      }))
      : [];
  },
  events: async (parent, args, context) => {
    const e = await Event.find()
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
    const e = await Event.find({ organization: args.id })
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
    return await Event.find({ registrants: args.id })
      .populate('registrants')
      .populate('creator', '-password')
      .populate('tasks')
      .populate('admins', '-password');
  },
  tasksByEvent: async (parent, args) => {
    return await Task.find({ event: args.id })
      .populate('event')
      .populate('creator', '-password');
  },
  tasksByUser: async (parent, args) => {
    return await Task.find({ creator: args.id })
      .populate('event')
      .populate('creator', '-password');
  },
  comments: async () => {
    return await Comment.find()
      .populate('creator', '-password')
      .populate('post');
  },
  commentsByPost: async (parent, args) => {
    return await Comment.find({ post: args.id })
      .populate('creator', '-password')
      .populate('post');
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
      throw new Error('Post not found');
    }
    postFound.likeCount = postFound.likedBy.length || 0;
    postFound.commentCount = postFound.comments.length || 0;
    return postFound;
  },
  posts: async () => {
    const p = await Post.find()
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
    const p = await Post.find({ organization: args.id })
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
  groups: async () => {
    return await Group.find();
  },
};

module.exports = Query;
