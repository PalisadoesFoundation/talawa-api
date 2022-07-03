const MongooseInstance = require('mongoose').Mongoose;
const logger = require('logger');
const chatSchema = require('./schema/Chat');
const commentSchema = require('./schema/Comment');
const directChatSchema = require('./schema/DirectChat');
const directChatMessageSchema = require('./schema/DirectChatMessage');
const eventSchema = require('./schema/Event');
const eventProjectSchema = require('./schema/EventProject');
const fileSchema = require('./schema/File');
const groupSchema = require('./schema/Group');
const groupChatSchema = require('./schema/GroupChat');
const groupChatMessageSchema = require('./schema/GroupChatMessage');
const imageHashSchema = require('./schema/ImageHash');
const languageSchema = require('./schema/Language');
const membershipRequestSchema = require('./schema/MembershipRequest');
const messageSchema = require('./schema/Message');
const organizationSchema = require('./schema/Organization');
const pluginSchema = require('./schema/Plugin');
const pluginFieldSchema = require('./schema/PluginField');
const postSchema = require('./schema/Post');
const taskSchema = require('./schema/Task');
const userSchema = require('./schema/User');

function MongoDB(url) {
  this.mongo = new MongooseInstance();
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
      logger.error('Error while connecting to mongo database', error);
      process.exit(1);
    }
  };
  this.disconnect = async () => {
    await this.mongo.connection.close();
  };

  this.Chat = this.mongo.model('MessageChat', chatSchema);
  this.Comment = this.mongo.model('Comment', commentSchema);
  this.DirectChat = this.mongo.model('DirectChat', directChatSchema);
  this.DirectChatMessage = this.mongo.model(
    'DirectChatMessage',
    directChatMessageSchema
  );
  this.Event = this.mongo.model('Event', eventSchema);
  this.EventProject = this.mongo.model('EventProject', eventProjectSchema);
  this.File = this.mongo.model('File', fileSchema);
  this.Group = this.mongo.model('Group', groupSchema);
  this.GroupChat = this.mongo.model('GroupChat', groupChatSchema);
  this.GroupChatMessage = this.mongo.model(
    'GroupChatMessage',
    groupChatMessageSchema
  );
  this.ImageHash = this.mongo.model('ImageHash', imageHashSchema);
  this.Language = this.mongo.model('Language', languageSchema);
  this.MembershipRequest = this.mongo.model(
    'MembershipRequest',
    membershipRequestSchema
  );
  this.Message = this.mongo.model('Message', messageSchema);
  this.Organization = this.mongo.model('Oranization', organizationSchema);
  this.Plugin = this.mongo.model('Plugin', pluginSchema);
  this.PluginField = this.mongo.model('PluginField', pluginFieldSchema);
  this.Post = this.mongo.model('Post', postSchema);
  this.Task = this.mongo.model('Task', taskSchema);
  this.User = this.mongo.model('User', userSchema);
}

module.exports = MongoDB;
