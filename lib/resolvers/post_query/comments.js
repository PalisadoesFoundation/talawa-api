const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const { getAllConnections } = require('../../ConnectionManager/connections');
const { addTenantId } = require('../../helper_functions');

const User = require('../../models/User');

module.exports = async () => {
  // loop through all open connections
  let commentFound = [];
  const connections = getAllConnections();
  for (let conn in connections) {
    const comments = await connections[conn].Comment.find()
      .populate('creator', '-password', User)
      .populate('post', connections[conn].Post)
      .populate('likedBy', '', User);
    for (let i = 0; i < comments.length; i++) {
      comments[i]._doc._id = addTenantId(comments[i]._id, conn);
      commentFound.push(comments[i]);
    }
  }
  if (!commentFound) {
    throw new NotFoundError(
      requestContext.translate('comment.notFound'),
      'comment.notFound',
      'comment'
    );
  }
  return commentFound;
};
