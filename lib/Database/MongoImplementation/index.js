const MongooseInstance = require('mongoose').Mongoose;
const { DATABASE_CONNECTION_FAIL } = require('../../../constants');
const MessageChat = require('./schema/Chat');
const Comment = require('./schema/Comment');
const DirectChat = require('./schema/DirectChat');
const DirectChatMessage = require('./schema/DirectChatMessage');
const Event = require('./schema/Event');
const EventProject = require('./schema/EventProject');
const File = require('./schema/File');
const Group = require('./schema/Group');
const GroupChat = require('./schema/GroupChat');
const GroupChatMessage = require('./schema/GroupChatMessage');
const ImageHash = require('./schema/ImageHash');
const Language = require('./schema/Language');
const MembershipRequest = require('./schema/MembershipRequest');
const Message = require('./schema/Message');
const Organization = require('./schema/Organization');
const Plugin = require('./schema/Plugin');
const PluginField = require('./schema/PluginField');
const Post = require('./schema/Post');
const Task = require('./schema/Task');
const User = require('./schema/User');

const defaultSchema = {
  MessageChat,
  Comment,
  DirectChat,
  DirectChatMessage,
  Event,
  EventProject,
  File,
  Group,
  GroupChat,
  GroupChatMessage,
  ImageHash,
  Language,
  MembershipRequest,
  Message,
  Organization,
  Plugin,
  PluginField,
  Post,
  Task,
  User,
};

function MongoDB(url, schemaObjects) {
  this.mongo = new MongooseInstance();
  //  this.schema = schemaObjects ? schemaObjects : defaultSchema;
  if (!schemaObjects) {
    let schemaObj = {};
    for (let obj of schemaObjects) {
      if (defaultSchema[obj]) {
        schemaObj[obj] = defaultSchema[obj];
      }
    }
    this.schema = schemaObj;
  } else {
    this.schema = defaultSchema;
  }

  this.type = 'Mongoose';
  this.Native = this.mongo.connection.db;
  this.connect = async () => {
    try {
      await this.mongo.connect(url, {
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useNewUrlParser: true,
      });
      this.Native = this.mongo.connection.db;
    } catch (error) {
      console.log(error);
      throw new Error(DATABASE_CONNECTION_FAIL);
    }
  };
  this.disconnect = async () => {
    await this.mongo.connection.close();
  };
  // creating the schema
  for (let key in this.schema) {
    this[key] = this.mongo.model(key, this.schema[key]);
  }
}

module.exports = MongoDB;
