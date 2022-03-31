const Post = require('../../models/Post');

module.exports = async (parent, args) => {
  var sort = {};
  var isSortingExecuted = args.orderBy !== null;

  //Sorting List
    if (isSortingExecuted) {
      switch (args.orderBy) {
        case 'id_ASC':
          sort = { _id: 1 };
          break;
        case 'id_DESC':
          sort = { _id: -1 };
          break;
        case 'text_ASC':
          sort = { text: 1 };
          break;
        case 'text_DESC':
          sort = { text: -1 };
          break;
        case 'title_ASC':
          sort = { title: 1 };
          break;
        case 'title_DESC':
          sort = { title: -1 };
          break;
        case 'createdAt_ASC':
          sort = { createdAt: 1 };
          break;
        case 'createdAt_DESC':
          sort = { createdAt: -1 };
          break;
        case 'imageUrl_ASC':
          sort = { imageUrl: 1 };
          break;
        case 'imageUrl_DESC':
          sort = { imageUrl: -1 };
          break;
        case 'videoUrl_ASC':
          sort = { videoUrl: 1 };
          break;
        case 'videoUrl_DESC':
          sort = { videoUrl: -1 };
          break;
        case 'likeCount_ASC':
          sort = { likeCount: 1 };
          break;
        case 'likeCount_DESC':
          sort = { likeCount: -1 };
          break;
        case 'commentCount_ASC':
          sort = { commentCount: -1 };
          break;
        default:
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
};
