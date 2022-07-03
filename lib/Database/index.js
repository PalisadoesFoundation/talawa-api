function DataBase(implementation) {
  // to know that type of the database used.
  this.dbType = implementation.type;
  this.implementation = implementation;
  this.connect = implementation.connect;
  this.disconnect = implementation.disconnect;
  // gives access to raw queries of any implementation.
  this.NativeDriver = implementation.Native;

  this.Chat = implementation.Chat;
  this.Comment = implementation.Comment;
  this.DirectChat = implementation.DirectChat;
  this.DirectChatMessage = implementation.DirectChatMessage;
  this.Event = implementation.Event;
  this.EventProject = implementation.EventProject;
  this.File = implementation.File;
  this.Group = implementation.Group;
  this.GroupChat = implementation.GroupChat;
  this.GroupChatMessage = implementation.GroupChatMessage;
  this.ImageHash = implementation.ImageHash;
  this.Languange = implementation.Languange;
  this.MembershipRequest = implementation.MembershipRequest;
  this.Message = implementation.Message;
  this.Organization = implementation.Organization;
  this.Plugin = implementation.Plugin;
  this.PluginField = implementation.PluginField;
  this.Post = implementation.Post;
  this.Task = implementation.Task;
  this.User = implementation.User;
}

module.exports = DataBase;
